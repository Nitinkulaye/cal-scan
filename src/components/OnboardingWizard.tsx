import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  calculateDietTargets, 
  kgToLbs, 
  lbsToKg, 
  cmToFeetInches, 
  feetInchesToCm 
} from '../utils/nutritionCalculations';
import { UserProfile } from '../types';
import { CalScanLogo } from './CalScanLogo';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Activity,
  Flame,
  Info
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (profileData: Partial<UserProfile>) => Promise<void>;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  // Step index: 0 = Health Consent, 1 = Goal, 2 = Sex, 3 = Age, 4 = Height, 5 = Current Weight, 6 = Target Weight, 7 = Activity Level, 8 = Dietary Preference, 9 = Safe Rate of Change, 10 = Target Summary Screen
  const [step, setStep] = useState<number>(0);
  const totalQuestions = 10; // Steps 1 to 9 are questions, step 0 is consent, step 10 is review

  // Form State
  const [healthConsent, setHealthConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('lose');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(28);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(9);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [weightLbs, setWeightLbs] = useState<number>(165);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(70);
  const [targetWeightLbs, setTargetWeightLbs] = useState<number>(154);
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [dietaryPreference, setDietaryPreference] = useState<'anything' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean'>('anything');
  // Safe rate: kg per week
  const [weeklyRateKg, setWeeklyRateKg] = useState<number>(0.5);
  const [saving, setSaving] = useState(false);

  // Sync imperial / metric height & weights
  const handleUnitToggle = (newUnit: 'metric' | 'imperial') => {
    setUnitSystem(newUnit);
    if (newUnit === 'imperial') {
      const { feet, inches } = cmToFeetInches(heightCm);
      setHeightFeet(feet);
      setHeightInches(inches);
      setWeightLbs(kgToLbs(weightKg));
      setTargetWeightLbs(kgToLbs(targetWeightKg));
    } else {
      setHeightCm(feetInchesToCm(heightFeet, heightInches));
      setWeightKg(lbsToKg(weightLbs));
      setTargetWeightKg(lbsToKg(targetWeightLbs));
    }
  };

  const handleNext = () => {
    if (step === 0 && !healthConsent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    if (step < 10) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  // Safe calculation using Mifflin-St Jeor
  const targets = calculateDietTargets({
    sex,
    age,
    heightCm: unitSystem === 'metric' ? heightCm : feetInchesToCm(heightFeet, heightInches),
    currentWeightKg: unitSystem === 'metric' ? weightKg : lbsToKg(weightLbs),
    targetWeightKg: unitSystem === 'metric' ? targetWeightKg : lbsToKg(targetWeightLbs),
    goal,
    activityLevel,
    dietaryPreference,
    requestedWeeklyRateKg: weeklyRateKg,
  });

  const handleFinish = async () => {
    try {
      setSaving(true);
      const finalHeightCm = unitSystem === 'metric' ? heightCm : feetInchesToCm(heightFeet, heightInches);
      const finalWeightKg = unitSystem === 'metric' ? weightKg : lbsToKg(weightLbs);
      const finalTargetWeightKg = unitSystem === 'metric' ? targetWeightKg : lbsToKg(targetWeightLbs);

      await onComplete({
        healthConsentGiven: true,
        healthConsentDate: Date.now(),
        unitSystem,
        goal,
        sex,
        age,
        heightCm: finalHeightCm,
        currentWeightKg: finalWeightKg,
        targetWeightKg: finalTargetWeightKg,
        activityLevel,
        dietaryPreference,
        weeklyRateKg: targets.cappedWeeklyRateKg,
        bmr: targets.bmr,
        tdee: targets.tdee,
        targetCalories: targets.targetCalories,
        targetProteinGrams: targets.targetProteinGrams,
        targetCarbsGrams: targets.targetCarbsGrams,
        targetFatGrams: targets.targetFatGrams,
        onboardingCompleted: true,
      });
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = step === 0 ? 5 : Math.min(100, Math.round((step / 10) * 100));

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-[#FF6B5B]/20">
      {/* Top Header */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-2xl bg-neutral-900 shadow-xs ring-1 ring-black/10 dark:ring-white/10 shrink-0">
              <CalScanLogo size={36} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-neutral-900 dark:text-white leading-tight">
                Cal Scan
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider block">
                NUTRITION CALIBRATION
              </span>
            </div>
          </div>
          {step > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
              Step {step} of 10
            </div>
          )}
        </div>

        {/* Minimal progress bar */}
        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden mb-8">
          <motion.div
            className="bg-[#FF6B5B] h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 0: EXPLICIT HEALTH DATA CONSENT */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B5B]" />
                Health Data Privacy
              </div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-900 dark:text-white">
                Your health data belongs only to you.
              </h1>
              <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80">
                <p>
                  Before calibrating your nutrition targets, we require your explicit permission to store personal biometric metrics (age, biological sex, height, current weight, and logged food entries).
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <li>Data is used solely to compute Mifflin-St Jeor metabolic estimates.</li>
                  <li>Your records are isolated by database security rules and never sold.</li>
                  <li>Uploaded food photos are processed in memory and discarded by default.</li>
                  <li>You can export or permanently delete your account and data anytime.</li>
                </ul>
              </div>

              {/* Explicit Opt-in Checkbox (Not pre-checked) */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition">
                <input
                  type="checkbox"
                  checked={healthConsent}
                  onChange={(e) => {
                    setHealthConsent(e.target.checked);
                    if (e.target.checked) setConsentError(false);
                  }}
                  className="mt-1 w-4 h-4 text-[#FF6B5B] rounded border-neutral-300 focus:ring-[#FF6B5B]"
                />
                <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  I explicitly consent to Cal Scan collecting and storing my health and dietary data for metabolic tracking and optical estimation purposes.
                </span>
              </label>

              {consentError && (
                <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Please provide your explicit consent to proceed with calorie calibration.
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: GOAL */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">What is your primary goal?</h2>
              <p className="text-sm text-neutral-500">We will tailor your daily caloric balance accordingly.</p>
              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { id: 'lose', title: 'Lose weight', desc: 'Sustained, medically capped caloric deficit' },
                  { id: 'maintain', title: 'Maintain weight', desc: 'Balance intake with daily expenditure (TDEE)' },
                  { id: 'gain', title: 'Gain weight / muscle', desc: 'Controlled lean caloric surplus' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoal(opt.id as any)}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                      goal === opt.id
                        ? 'border-[#FF6B5B] bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-[#FF6B5B]'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 hover:border-neutral-300'
                    }`}
                  >
                    <span className="font-medium text-base text-neutral-900 dark:text-white">{opt.title}</span>
                    <span className="text-xs text-neutral-500 mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: BIOLOGICAL SEX */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Biological sex</h2>
              <p className="text-sm text-neutral-500">Mifflin-St Jeor formula requires biological sex for basal metabolic rate (BMR).</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSex(item.id as any)}
                    className={`p-6 rounded-2xl border text-center font-medium text-lg transition-all ${
                      sex === item.id
                        ? 'border-[#FF6B5B] bg-white dark:bg-neutral-900 ring-1 ring-[#FF6B5B]'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 hover:border-neutral-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: AGE */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">How old are you?</h2>
              <p className="text-sm text-neutral-500">Metabolic burn rate naturally shifts with age.</p>
              <div className="flex flex-col items-center justify-center pt-8">
                <div className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
                  {age} <span className="text-2xl font-normal text-neutral-400">yrs</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="95"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-full max-w-sm mt-8 accent-[#FF6B5B] cursor-pointer"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 4: HEIGHT */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Your height</h2>
                <div className="inline-flex rounded-xl bg-neutral-200 dark:bg-neutral-800 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('metric')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      unitSystem === 'metric' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('imperial')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      unitSystem === 'imperial' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'
                    }`}
                  >
                    ft/in
                  </button>
                </div>
              </div>

              {unitSystem === 'metric' ? (
                <div className="flex flex-col items-center pt-8">
                  <div className="text-6xl font-light tracking-tight">
                    {heightCm} <span className="text-2xl font-normal text-neutral-400">cm</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="220"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value))}
                    className="w-full max-w-sm mt-8 accent-[#FF6B5B] cursor-pointer"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-6 pt-8">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-light">{heightFeet}</span>
                    <span className="text-xs text-neutral-400 mt-1 uppercase">Feet</span>
                    <input
                      type="range"
                      min="4"
                      max="7"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(parseInt(e.target.value))}
                      className="w-28 mt-4 accent-[#FF6B5B]"
                    />
                  </div>
                  <span className="text-3xl text-neutral-300 font-light">/</span>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-light">{heightInches}</span>
                    <span className="text-xs text-neutral-400 mt-1 uppercase">Inches</span>
                    <input
                      type="range"
                      min="0"
                      max="11"
                      value={heightInches}
                      onChange={(e) => setHeightInches(parseInt(e.target.value))}
                      className="w-28 mt-4 accent-[#FF6B5B]"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 5: CURRENT WEIGHT */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Current weight</h2>
                <span className="text-xs text-neutral-400 uppercase font-mono">{unitSystem}</span>
              </div>
              <p className="text-sm text-neutral-500">Used as your starting baseline for calorie targets.</p>
              <div className="flex flex-col items-center pt-8">
                <div className="text-6xl font-light tracking-tight">
                  {unitSystem === 'metric' ? weightKg : weightLbs}{' '}
                  <span className="text-2xl font-normal text-neutral-400">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
                </div>
                {unitSystem === 'metric' ? (
                  <input
                    type="range"
                    min="35"
                    max="200"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                    className="w-full max-w-sm mt-8 accent-[#FF6B5B] cursor-pointer"
                  />
                ) : (
                  <input
                    type="range"
                    min="80"
                    max="450"
                    step="1"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(parseFloat(e.target.value))}
                    className="w-full max-w-sm mt-8 accent-[#FF6B5B] cursor-pointer"
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 6: TARGET WEIGHT */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Target weight</h2>
              <p className="text-sm text-neutral-500">Where you want to be.</p>
              <div className="flex flex-col items-center pt-8">
                <div className="text-6xl font-light tracking-tight">
                  {unitSystem === 'metric' ? targetWeightKg : targetWeightLbs}{' '}
                  <span className="text-2xl font-normal text-neutral-400">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
                </div>
                {unitSystem === 'metric' ? (
                  <input
                    type="range"
                    min="35"
                    max="200"
                    step="0.5"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(parseFloat(e.target.value))}
                    className="w-full max-w-sm mt-8 accent-[#FF6B5B] cursor-pointer"
                  />
                ) : (
                  <input
                    type="range"
                    min="80"
                    max="450"
                    step="1"
                    value={targetWeightLbs}
                    onChange={(e) => setTargetWeightLbs(parseFloat(e.target.value))}
                    className="w-full max-w-sm mt-8 accent-[#FF6B5B] cursor-pointer"
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 7: ACTIVITY LEVEL */}
          {step === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Activity level</h2>
              <p className="text-sm text-neutral-500">Excluding intentional workouts.</p>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: 'sedentary', title: 'Sedentary', desc: 'Desk job, mostly sitting, minimal daily steps' },
                  { id: 'light', title: 'Lightly Active', desc: 'Light exercise / walking 1–3 days per week' },
                  { id: 'moderate', title: 'Moderately Active', desc: 'Moderate exercise 3–5 days per week' },
                  { id: 'active', title: 'Very Active', desc: 'Hard exercise or sports 6–7 days per week' },
                  { id: 'very_active', title: 'Extremely Active', desc: 'Physical labor job + high intensity training' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActivityLevel(act.id as any)}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                      activityLevel === act.id
                        ? 'border-[#FF6B5B] bg-white dark:bg-neutral-900 ring-1 ring-[#FF6B5B]'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 hover:border-neutral-300'
                    }`}
                  >
                    <span className="font-medium text-sm text-neutral-900 dark:text-white">{act.title}</span>
                    <span className="text-xs text-neutral-500">{act.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 8: DIETARY PREFERENCE */}
          {step === 8 && (
            <motion.div
              key="step-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Dietary style</h2>
              <p className="text-sm text-neutral-500">Cal Scan adjusts your macro distribution accordingly.</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'anything', label: 'Balanced (Standard)' },
                  { id: 'mediterranean', label: 'Mediterranean' },
                  { id: 'vegetarian', label: 'Vegetarian' },
                  { id: 'vegan', label: 'Plant-Based (Vegan)' },
                  { id: 'keto', label: 'Ketogenic (Low Carb)' },
                  { id: 'paleo', label: 'Paleo / High Protein' },
                ].map((diet) => (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => setDietaryPreference(diet.id as any)}
                    className={`p-4 rounded-xl border text-left text-sm font-medium transition ${
                      dietaryPreference === diet.id
                        ? 'border-[#FF6B5B] bg-white dark:bg-neutral-900 ring-1 ring-[#FF6B5B]'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 hover:border-neutral-300'
                    }`}
                  >
                    {diet.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 9: RATE OF CHANGE (Capped at safe medical limit) */}
          {step === 9 && (
            <motion.div
              key="step-9"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
                {goal === 'maintain' ? 'Maintenance Pace' : 'Target Weekly Rate'}
              </h2>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-xs text-neutral-600 dark:text-neutral-300">
                <Info className="w-4 h-4 text-[#FF6B5B] shrink-0" />
                <span>
                  Medically capped: maximum safe loss is 1.0 kg (2.2 lbs) / week to prevent muscle wasting and metabolic crash.
                </span>
              </div>

              {goal === 'maintain' ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                  <p className="text-base text-neutral-700 dark:text-neutral-300 font-medium">
                    You have selected Weight Maintenance.
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Your daily calories will match your Total Daily Energy Expenditure (TDEE).
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center pt-4">
                  <div className="text-5xl font-light tracking-tight">
                    {weeklyRateKg} <span className="text-xl font-normal text-neutral-400">kg/week</span>
                    <span className="block text-sm text-neutral-500 mt-1">
                      (~{(weeklyRateKg * 2.2).toFixed(1)} lbs/week)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max={goal === 'gain' ? '0.5' : '1.0'}
                    step="0.1"
                    value={weeklyRateKg}
                    onChange={(e) => setWeeklyRateKg(parseFloat(e.target.value))}
                    className="w-full max-w-sm mt-8 accent-[#FF6B5B] cursor-pointer"
                  />
                  <div className="flex justify-between w-full max-w-sm text-[11px] text-neutral-400 mt-2">
                    <span>Gentle (0.2 kg)</span>
                    <span>Safe Ceiling ({goal === 'gain' ? '0.5 kg' : '1.0 kg'})</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 10: CALIBRATED TARGETS & DISCLAIMER */}
          {step === 10 && (
            <motion.div
              key="step-10"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-xs uppercase tracking-widest text-[#FF6B5B] font-semibold">
                  Calibration Complete
                </span>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Your Daily Targets</h2>
              </div>

              {/* Main Calories Hero Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center shadow-sm">
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Daily Calorie Target</span>
                <div className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white mt-1 text-[#FF6B5B]">
                  {targets.targetCalories}
                  <span className="text-lg text-neutral-400 ml-1 font-normal">kcal</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span>BMR: {targets.bmr} kcal</span>
                  <span>•</span>
                  <span>TDEE: {targets.tdee} kcal</span>
                </div>
              </div>

              {/* 3 Macro Target Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Protein</span>
                  <div className="text-xl font-medium mt-0.5 text-neutral-900 dark:text-neutral-100">
                    {targets.targetProteinGrams}g
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {Math.round((targets.targetProteinGrams * 4 / targets.targetCalories) * 100)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Carbs</span>
                  <div className="text-xl font-medium mt-0.5 text-neutral-900 dark:text-neutral-100">
                    {targets.targetCarbsGrams}g
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {Math.round((targets.targetCarbsGrams * 4 / targets.targetCalories) * 100)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Fat</span>
                  <div className="text-xl font-medium mt-0.5 text-neutral-900 dark:text-neutral-100">
                    {targets.targetFatGrams}g
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {Math.round((targets.targetFatGrams * 9 / targets.targetCalories) * 100)}%
                  </span>
                </div>
              </div>

              {/* Visible required medical disclaimer */}
              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Estimate based on standard formulas. Not medical advice.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="w-full max-w-xl mx-auto pt-6 flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={handlePrev}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 10 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF6B5B] text-white font-medium text-sm hover:opacity-90 active:scale-[0.98] transition shadow-sm"
          >
            {step === 0 ? 'Accept & Continue' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={handleFinish}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#FF6B5B] text-white font-medium text-sm hover:opacity-90 active:scale-[0.98] transition shadow-sm"
          >
            {saving ? 'Calibrating...' : 'Start Tracking'}
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
