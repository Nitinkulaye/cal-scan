import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Barcode, 
  Search, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle, 
  Check, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { NutritionEstimateDraft, FoodLogEntry } from '../types';
import { COMMON_FOOD_DATABASE } from '../utils/foodDatabase';

interface LogFoodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (entry: Omit<FoodLogEntry, 'id' | 'userId' | 'timestamp' | 'dateString'>) => Promise<void>;
  keepFoodPhotosOptIn: boolean;
}

export const LogFoodSheet: React.FC<LogFoodSheetProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  keepFoodPhotosOptIn,
}) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'barcode' | 'manual'>('photo');

  // Photo tab states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Barcode tab states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  // Manual / Search tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [customServing, setCustomServing] = useState('1 serving');

  // Draft editing state (Always editable, never auto-saves)
  const [draft, setDraft] = useState<NutritionEstimateDraft | null>(null);
  const [savingLog, setSavingLog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Photo Selection
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setPhotoPreview(base64Data);
      setAnalyzingPhoto(true);
      setValidationError(null);

      try {
        const response = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'AI analysis encountered an issue. You can adjust the estimated values below.');
        }

        const data = await response.json();
        setDraft({
          name: data.name || 'Identified Food',
          calories: data.calories ?? 250,
          protein: data.protein ?? 15,
          carbs: data.carbs ?? 25,
          fat: data.fat ?? 8,
          servingSize: data.servingSize || '1 portion',
          mealType: 'lunch',
          confidence: data.confidence || 'medium',
          source: 'photo',
          photoThumbnail: keepFoodPhotosOptIn ? base64Data : undefined,
          breakdown: data.breakdown || [],
        });
      } catch (err: any) {
        console.error(err);
        setValidationError(err.message || 'Could not analyze photo. You can enter details manually.');
        // Provide editable fallback
        setDraft({
          name: 'Food from photo',
          calories: 300,
          protein: 15,
          carbs: 35,
          fat: 10,
          servingSize: '1 serving',
          mealType: 'lunch',
          confidence: 'low',
          source: 'photo',
        });
      } finally {
        setAnalyzingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Barcode Lookup
  const handleBarcodeLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setBarcodeLoading(true);
    setBarcodeError(null);
    setValidationError(null);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error('Barcode not found in Open Food Facts database. Please log manually.');
      }
      const data = await res.json();
      setDraft({
        name: data.brand ? `${data.brand} - ${data.name}` : data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        servingSize: data.servingSize || '1 serving',
        mealType: 'snack',
        confidence: 'high',
        source: 'barcode',
      });
    } catch (err: any) {
      setBarcodeError(err.message || 'Lookup failed');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Search filter
  const filteredFoods = searchQuery.trim()
    ? COMMON_FOOD_DATABASE.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_FOOD_DATABASE.slice(0, 8);

  const selectPredefinedFood = (f: typeof COMMON_FOOD_DATABASE[0]) => {
    setDraft({
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      servingSize: f.servingSize,
      mealType: f.mealType,
      confidence: 'high',
      source: 'search',
    });
  };

  const handleStartCustomManual = () => {
    setDraft({
      name: searchQuery.trim() || 'Custom Meal',
      calories: 250,
      protein: 15,
      carbs: 25,
      fat: 8,
      servingSize: '1 serving',
      mealType: 'lunch',
      source: 'manual',
    });
  };

  // Server-side validation and saving
  const handleConfirmAndSave = async () => {
    if (!draft) return;

    // Client preliminary checks
    if (!draft.name.trim()) {
      setValidationError('Please enter a valid food name.');
      return;
    }

    try {
      setSavingLog(true);
      setValidationError(null);

      // Verify with server validation endpoint proxy
      const valRes = await fetch('/api/validate-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          calories: draft.calories,
          protein: draft.protein,
          carbs: draft.carbs,
          fat: draft.fat,
        }),
      });

      if (!valRes.ok) {
        const errorData = await valRes.json();
        throw new Error(errorData.error || 'Server rejected nutrition values.');
      }

      const valData = await valRes.json();
      const sanitized = valData.sanitized;

      const payload: Omit<FoodLogEntry, 'id' | 'userId' | 'timestamp' | 'dateString'> = {
        name: draft.name.trim(),
        calories: sanitized.calories,
        protein: sanitized.protein,
        carbs: sanitized.carbs,
        fat: sanitized.fat,
        servingSize: draft.servingSize || '1 serving',
        mealType: draft.mealType,
        source: draft.source,
      };

      if (draft.confidence) {
        payload.confidence = draft.confidence;
      }
      if (keepFoodPhotosOptIn && draft.photoThumbnail) {
        payload.photoThumbnail = draft.photoThumbnail;
      }

      await onSaveLog(payload);

      // Reset
      setDraft(null);
      setPhotoPreview(null);
      setBarcodeInput('');
      setSearchQuery('');
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save log entry');
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="w-full max-w-lg bg-[#FAFAFA] dark:bg-[#111111] rounded-t-[28px] sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-neutral-200/60 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium tracking-tight text-neutral-900 dark:text-white">
              {draft ? 'Review Entry' : 'Log Food'}
            </h2>
          </div>
          <button
            onClick={() => {
              if (draft) {
                setDraft(null);
              } else {
                onClose();
              }
            }}
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* VIEW A: DRAFT REVIEW & CONFIRMATION (Visible Tap-to-edit) */}
          {draft ? (
            <div className="space-y-5">
              {/* AI Disclaimer or source indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B5B]" />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {draft.source === 'photo' ? 'AI estimate — tap to edit' : 'Confirm & adjust values'}
                  </span>
                </div>
                {draft.confidence && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                      draft.confidence === 'high'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : draft.confidence === 'medium'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {draft.confidence} confidence
                  </span>
                )}
              </div>

              {/* Photo preview if available */}
              {draft.photoThumbnail && (
                <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <img
                    src={draft.photoThumbnail}
                    alt="Food draft"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-[10px] text-white rounded">
                    {keepFoodPhotosOptIn ? 'Retained in Diary' : 'Ephemeral (not saved)'}
                  </div>
                </div>
              )}

              {/* Meal item name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                  Food Name
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Salad"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-[#FF6B5B]"
                />
              </div>

              {/* Meal Type selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                  Meal
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDraft({ ...draft, mealType: m })}
                      className={`py-2 rounded-xl text-xs font-medium capitalize transition ${
                        draft.mealType === m
                          ? 'bg-[#FF6B5B] text-white shadow-xs'
                          : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Calories editor */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={draft.calories}
                  onChange={(e) => setDraft({ ...draft, calories: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-4 py-3 text-2xl font-light rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF6B5B]"
                />
              </div>

              {/* 3 Macro grams editors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-medium mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={draft.protein}
                    onChange={(e) => setDraft({ ...draft, protein: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF6B5B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-medium mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={draft.carbs}
                    onChange={(e) => setDraft({ ...draft, carbs: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF6B5B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-medium mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={draft.fat}
                    onChange={(e) => setDraft({ ...draft, fat: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF6B5B]"
                  />
                </div>
              </div>

              {/* Serving size note */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                  Portion / Serving Size
                </label>
                <input
                  type="text"
                  value={draft.servingSize}
                  onChange={(e) => setDraft({ ...draft, servingSize: e.target.value })}
                  placeholder="e.g. 1 bowl (300g)"
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none"
                />
              </div>

              {/* Breakdown list if provided by AI */}
              {draft.breakdown && draft.breakdown.length > 0 && (
                <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block mb-1">
                    Detected Components
                  </span>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                    {draft.breakdown.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B5B]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  disabled={savingLog}
                  className="flex-1 py-3.5 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-sm transition hover:bg-neutral-300 dark:hover:bg-neutral-700"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  disabled={savingLog}
                  className="flex-1 py-3.5 rounded-2xl bg-[#FF6B5B] text-white font-medium text-sm transition hover:opacity-90 flex items-center justify-center gap-2 shadow-sm"
                >
                  {savingLog ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Log Entry
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* VIEW B: 3 LOG TABS */
            <div>
              {/* Tab Selector */}
              <div className="flex p-1 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition ${
                    activeTab === 'photo'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Photo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('barcode')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition ${
                    activeTab === 'barcode'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Barcode className="w-4 h-4" />
                  Barcode
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition ${
                    activeTab === 'manual'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Search / Custom
                </button>
              </div>

              {/* TAB 1: PHOTO */}
              {activeTab === 'photo' && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => !analyzingPhoto && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition hover:border-[#FF6B5B] bg-neutral-50/50 dark:bg-neutral-900/30 overflow-hidden ${
                      analyzingPhoto ? 'opacity-70 pointer-events-none' : ''
                    }`}
                  >
                    {/* Visual Reticles in corners inspired by Cal Scan logo */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#FF6B5B] rounded-tl-lg pointer-events-none" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#FF6B5B] rounded-tr-lg pointer-events-none" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#FF6B5B] rounded-bl-lg pointer-events-none" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#FF6B5B] rounded-br-lg pointer-events-none" />

                    {analyzingPhoto ? (
                      <div className="flex flex-col items-center space-y-3 py-4">
                        <div className="relative">
                          <Loader2 className="w-10 h-10 text-[#FF6B5B] animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-[#FF6B5B]" />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          Optical Cal Scan in Progress...
                        </div>
                        <p className="text-xs text-neutral-500">Multimodal AI analyzing meal components & macros</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center text-[#FF6B5B] mb-3 shadow-md border border-neutral-700/50">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          Scan Meal with Cal Scan
                        </span>
                        <span className="text-xs text-neutral-400 mt-1">
                          Snap photo or upload from camera roll for instant optical estimation
                        </span>
                        <div className="mt-4 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition shadow-sm">
                          Open Camera / Select Image
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 leading-relaxed">
                    Always shown as an editable draft before saving. Photos are discarded unless visual diary is enabled in Settings.
                  </p>
                </div>
              )}

              {/* TAB 2: BARCODE */}
              {activeTab === 'barcode' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium">
                      Enter Barcode (UPC / EAN)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        placeholder="e.g. 737628064502"
                        className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-mono text-sm focus:outline-none focus:border-[#FF6B5B]"
                      />
                      <button
                        type="button"
                        onClick={() => handleBarcodeLookup()}
                        disabled={barcodeLoading || !barcodeInput.trim()}
                        className="px-5 py-3 rounded-xl bg-[#FF6B5B] text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition"
                      >
                        {barcodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
                      </button>
                    </div>
                  </div>

                  {/* Sample test barcodes for quick demo convenience */}
                  <div className="pt-2">
                    <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block mb-2">
                      Quick Samples (Open Food Facts verified)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { code: '3017620422003', label: 'Nutella' },
                        { code: '5449000000996', label: 'Coca-Cola Zero' },
                        { code: '7622210449283', label: 'Oreo Cookies' },
                      ].map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setBarcodeInput(item.code);
                            handleBarcodeLookup(item.code);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 hover:border-[#FF6B5B] border border-transparent transition"
                        >
                          {item.label} ({item.code.slice(0, 5)}...)
                        </button>
                      ))}
                    </div>
                  </div>

                  {barcodeError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{barcodeError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MANUAL / SEARCH */}
              {activeTab === 'manual' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search food database or type custom meal..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF6B5B]"
                    />
                  </div>

                  {/* Custom create button */}
                  <button
                    type="button"
                    onClick={handleStartCustomManual}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#FF6B5B] bg-white/40 dark:bg-neutral-900/40 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus className="w-4 h-4 text-[#FF6B5B]" />
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                        {searchQuery.trim() ? `Add "${searchQuery}" as custom food` : 'Create custom food from scratch'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  {/* Search results list */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {filteredFoods.map((f, i) => (
                      <div
                        key={i}
                        onClick={() => selectPredefinedFood(f)}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition"
                      >
                        <div>
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {f.name}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {f.servingSize} • P: {f.protein}g C: {f.carbs}g F: {f.fat}g
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {f.calories}
                          </span>
                          <span className="text-[10px] text-neutral-400 ml-0.5">kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
