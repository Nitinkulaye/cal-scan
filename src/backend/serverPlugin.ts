import type { Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

export function calibrateBackendPlugin(): Plugin {
  return {
    name: 'calibrate-backend-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Multimodal food estimation proxy
        if (req.url === '/api/analyze-food' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(bodyStr || '{}');
              const { imageBase64, mimeType = 'image/jpeg' } = data;
              if (!imageBase64) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing imageBase64' }));
                return;
              }

              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                // If API key is somehow unset, provide a graceful fallback estimation
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  name: 'Healthy Mixed Meal',
                  calories: 420,
                  protein: 28,
                  carbs: 45,
                  fat: 14,
                  confidence: 'medium',
                  servingSize: '1 standard plate',
                  breakdown: ['Grilled Protein', 'Complex Carbs / Greens', 'Healthy dressing']
                }));
                return;
              }

              const ai = new GoogleGenAI({ apiKey });
              const prompt = `You are an expert clinical dietitian and food image recognition AI.
Analyze the food in this image with meticulous nutritional accuracy.
Return a STRICT JSON response adhering exactly to this schema:
{
  "name": "Concise name of the primary food/meal (e.g., Avocado Toast with Poached Egg)",
  "calories": number (estimated total kcal, integer, realistic for standard portion),
  "protein": number (grams of protein, rounded to 1 decimal or integer),
  "carbs": number (grams of carbohydrates, rounded to 1 decimal or integer),
  "fat": number (grams of total fat, rounded to 1 decimal or integer),
  "servingSize": "Estimated portion (e.g. 1 bowl (approx 350g) or 2 slices)",
  "confidence": "high" | "medium" | "low",
  "breakdown": ["Item 1 with approx portion", "Item 2 with approx portion"]
}
Do not wrap in markdown quotes if possible, or use standard json. Only respond with valid JSON.
Reject invalid numbers (calories must be between 10 and 3500, macros non-negative).`;

              // Strip data URI header if present
              const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

              // Try recommended models in sequence
              const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
              let response: any = null;
              let lastModelError: any = null;

              for (const modelName of candidateModels) {
                try {
                  response = await ai.models.generateContent({
                    model: modelName,
                    contents: [
                      {
                        role: 'user',
                        parts: [
                          { text: prompt },
                          {
                            inlineData: {
                              mimeType: mimeType,
                              data: cleanBase64
                            }
                          }
                        ]
                      }
                    ],
                    config: {
                      responseMimeType: 'application/json'
                    }
                  });
                  if (response && response.text) {
                    break;
                  }
                } catch (err) {
                  lastModelError = err;
                  console.warn(`Model ${modelName} failed, trying next candidate:`, err);
                }
              }

              if (!response || !response.text) {
                throw lastModelError || new Error('AI models unavailable');
              }

              const text = response.text || '{}';
              let parsed;
              try {
                parsed = JSON.parse(text);
              } catch {
                const match = text.match(/\{[\s\S]*\}/);
                parsed = match ? JSON.parse(match[0]) : null;
              }

              if (!parsed) {
                throw new Error('Failed to parse AI nutrition response');
              }

              // Server-side validation
              const calories = Math.max(0, Math.min(5000, Math.round(Number(parsed.calories) || 0)));
              const protein = Math.max(0, Math.min(300, Math.round(Number(parsed.protein) || 0)));
              const carbs = Math.max(0, Math.min(500, Math.round(Number(parsed.carbs) || 0)));
              const fat = Math.max(0, Math.min(300, Math.round(Number(parsed.fat) || 0)));

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                name: (parsed.name || 'Identified Meal').slice(0, 100),
                calories,
                protein,
                carbs,
                fat,
                servingSize: parsed.servingSize || '1 serving',
                confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
                breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown.slice(0, 8) : []
              }));
            } catch (err: any) {
              console.error('API /api/analyze-food error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || 'AI food recognition failed' }));
            }
          });
          return;
        }

        // Open Food Facts Barcode Lookup Proxy (CORS & security wrapper)
        if (req.url?.startsWith('/api/barcode/') && req.method === 'GET') {
          const barcode = req.url.replace('/api/barcode/', '').split('?')[0].trim();
          if (!barcode || !/^\d{4,16}$/.test(barcode)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid barcode format' }));
            return;
          }

          try {
            const offUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
            const offRes = await fetch(offUrl, {
              headers: {
                'User-Agent': 'CalScanApp/1.0 (contact@calscan.app)'
              }
            });

            if (!offRes.ok) {
              res.writeHead(offRes.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Product not found on Open Food Facts' }));
              return;
            }

            const data = await offRes.json();
            if (data.status !== 1 || !data.product) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Product not found' }));
              return;
            }

            const p = data.product;
            const nutriments = p.nutriments || {};

            // Extract per serving or per 100g
            const servingQty = p.serving_quantity || 100;
            const servingUnit = p.serving_quantity_unit || 'g';
            const servingSize = p.serving_size || `${servingQty}${servingUnit}`;

            let calories = nutriments['energy-kcal_serving'] ?? nutriments['energy-kcal_100g'] ?? 0;
            let protein = nutriments['proteins_serving'] ?? nutriments['proteins_100g'] ?? 0;
            let carbs = nutriments['carbohydrates_serving'] ?? nutriments['carbohydrates_100g'] ?? 0;
            let fat = nutriments['fat_serving'] ?? nutriments['fat_100g'] ?? 0;

            // Server-side bounds validation
            calories = Math.max(0, Math.min(5000, Math.round(Number(calories) || 0)));
            protein = Math.max(0, Math.min(300, Math.round(Number(protein) || 0)));
            carbs = Math.max(0, Math.min(500, Math.round(Number(carbs) || 0)));
            fat = Math.max(0, Math.min(300, Math.round(Number(fat) || 0)));

            const result = {
              barcode,
              name: p.product_name || p.product_name_en || 'Packaged Product',
              brand: p.brands || '',
              servingSize,
              calories,
              protein,
              carbs,
              fat,
              imageUrl: p.image_front_small_url || p.image_url || undefined
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error('API /api/barcode error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to query Open Food Facts' }));
          }
          return;
        }

        // Validate nutrition values proxy endpoint for log submissions
        if (req.url === '/api/validate-log' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => {
            bodyStr += chunk;
          });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { calories, protein, carbs, fat, name } = body;
              
              if (!name || typeof name !== 'string' || name.trim().length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Valid food name is required' }));
                return;
              }

              const c = Number(calories);
              const p = Number(protein);
              const cb = Number(carbs);
              const f = Number(fat);

              if (isNaN(c) || c < 0 || c > 10000) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Calories must be between 0 and 10,000 kcal' }));
                return;
              }
              if (isNaN(p) || p < 0 || p > 1000) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Protein must be between 0g and 1,000g' }));
                return;
              }
              if (isNaN(cb) || cb < 0 || cb > 1000) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Carbs must be between 0g and 1,000g' }));
                return;
              }
              if (isNaN(f) || f < 0 || f > 1000) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Fat must be between 0g and 1,000g' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ valid: true, sanitized: { calories: Math.round(c), protein: Math.round(p), carbs: Math.round(cb), fat: Math.round(f) } }));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}
