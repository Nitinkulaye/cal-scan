// Mifflin-St Jeor formula and medically safe nutrition targets

export interface MacroTargetResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  cappedWeeklyRateKg: number;
}

/**
 * Activity multipliers based on standard clinical guidelines
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // Little or no exercise
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  active: 1.725, // Hard exercise 6-7 days/week
  very_active: 1.9, // Very hard exercise & physical job
} as const;

/**
 * Calculates Mifflin-St Jeor BMR:
 * For Men:   BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
 * For Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
 */
export function calculateMifflinStJeorBMR(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Medically safe rate capping:
 * Safe weight loss: maximum 1.0 kg/week (~2.2 lbs/week) or ~1000 kcal deficit,
 * and minimum floor of 1200 kcal/day (female) or 1500 kcal/day (male) unless medically supervised.
 * Safe weight gain: maximum 0.5 kg/week (~1.1 lbs/week) or ~500 kcal surplus to avoid unhealthy fat accumulation.
 */
export function calculateDietTargets(params: {
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: 'lose' | 'maintain' | 'gain';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryPreference: 'anything' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  requestedWeeklyRateKg?: number; // target change in kg/week
}): MacroTargetResult {
  const {
    sex,
    age,
    heightCm,
    currentWeightKg,
    goal,
    activityLevel,
    dietaryPreference,
    requestedWeeklyRateKg = 0.5,
  } = params;

  const bmr = calculateMifflinStJeorBMR(sex, currentWeightKg, heightCm, age);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  // Safe medical caps
  let cappedWeeklyRateKg = Math.abs(requestedWeeklyRateKg);
  let dailyCalorieAdjustment = 0;

  if (goal === 'lose') {
    // Cap at 1.0 kg/week maximum safe limit
    cappedWeeklyRateKg = Math.min(1.0, Math.max(0.1, cappedWeeklyRateKg));
    // 1 kg fat ≈ 7700 kcal -> 7700 / 7 = 1100 kcal deficit/day max
    dailyCalorieAdjustment = -Math.round((cappedWeeklyRateKg * 7700) / 7);
  } else if (goal === 'gain') {
    // Cap at 0.5 kg/week maximum safe limit
    cappedWeeklyRateKg = Math.min(0.5, Math.max(0.1, cappedWeeklyRateKg));
    dailyCalorieAdjustment = Math.round((cappedWeeklyRateKg * 7700) / 7);
  } else {
    cappedWeeklyRateKg = 0;
    dailyCalorieAdjustment = 0;
  }

  // Absolute safety floors
  const minimumCalorieFloor = sex === 'male' ? 1500 : 1200;
  let targetCalories = Math.max(minimumCalorieFloor, tdee + dailyCalorieAdjustment);
  // Upper sane bound
  targetCalories = Math.min(6000, targetCalories);

  // Macro splits based on dietary preference and body weight
  // 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
  let proteinRatio = 0.28;
  let carbRatio = 0.45;
  let fatRatio = 0.27;

  if (dietaryPreference === 'keto') {
    proteinRatio = 0.25;
    carbRatio = 0.05;
    fatRatio = 0.70;
  } else if (dietaryPreference === 'paleo') {
    proteinRatio = 0.35;
    carbRatio = 0.30;
    fatRatio = 0.35;
  } else if (dietaryPreference === 'vegan' || dietaryPreference === 'vegetarian') {
    proteinRatio = 0.22;
    carbRatio = 0.53;
    fatRatio = 0.25;
  }

  // Protein anchor: minimum 1.6g per kg of bodyweight for muscle retention if in deficit
  const targetProteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const targetCarbsGrams = Math.round((targetCalories * carbRatio) / 4);
  const targetFatGrams = Math.round((targetCalories * fatRatio) / 9);

  return {
    bmr,
    tdee,
    targetCalories,
    targetProteinGrams,
    targetCarbsGrams,
    targetFatGrams,
    cappedWeeklyRateKg,
  };
}

// Unit conversion helpers
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
