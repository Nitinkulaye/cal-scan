export interface UserProfile {
  uid: string;
  email?: string;
  isAnonymous?: boolean;
  name?: string;
  createdAt: number;
  healthConsentGiven: boolean;
  healthConsentDate?: number;
  keepFoodPhotos: boolean;
  unitSystem: 'metric' | 'imperial';
  // Onboarding parameters
  goal: 'lose' | 'maintain' | 'gain';
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryPreference: 'anything' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  weeklyRateKg: number; // e.g., -0.5 kg/week or +0.25 kg/week, medically capped
  // Calculated targets
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  onboardingCompleted: boolean;
  streakCount: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface FoodLogEntry {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  source: 'photo' | 'barcode' | 'search' | 'manual';
  confidence?: 'high' | 'medium' | 'low';
  photoThumbnail?: string; // Retained ONLY if user explicitly opted in
  notes?: string;
  timestamp: number; // ms timestamp
  dateString: string; // YYYY-MM-DD
}

export interface WeightRecord {
  id: string;
  userId: string;
  weightKg: number;
  timestamp: number;
  dateString: string; // YYYY-MM-DD
}

export interface NutritionEstimateDraft {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence?: 'high' | 'medium' | 'low';
  source: 'photo' | 'barcode' | 'search' | 'manual';
  photoThumbnail?: string;
  breakdown?: string[];
}
