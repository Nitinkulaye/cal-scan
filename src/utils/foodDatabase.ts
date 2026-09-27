import { FoodLogEntry } from '../types';

export const COMMON_FOOD_DATABASE = [
  { name: 'Rolled Oats (Dry)', servingSize: '40g (1/2 cup)', calories: 150, protein: 5, carbs: 27, fat: 3, mealType: 'breakfast' as const },
  { name: 'Greek Yogurt 0% Plain', servingSize: '170g (3/4 cup)', calories: 100, protein: 18, carbs: 6, fat: 0, mealType: 'breakfast' as const },
  { name: 'Eggs (Whole, Large)', servingSize: '2 eggs (100g)', calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6, mealType: 'breakfast' as const },
  { name: 'Whey Protein Powder', servingSize: '1 scoop (30g)', calories: 120, protein: 24, carbs: 2, fat: 1.5, mealType: 'snack' as const },
  { name: 'Chicken Breast (Cooked, Skinless)', servingSize: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4, mealType: 'lunch' as const },
  { name: 'White Rice (Cooked)', servingSize: '150g (1 cup)', calories: 195, protein: 4, carbs: 43, fat: 0.4, mealType: 'lunch' as const },
  { name: 'Brown Rice (Cooked)', servingSize: '150g (1 cup)', calories: 168, protein: 3.5, carbs: 36, fat: 1.4, mealType: 'lunch' as const },
  { name: 'Atlantic Salmon (Grilled)', servingSize: '150g fillet', calories: 312, protein: 34, carbs: 0, fat: 18, mealType: 'dinner' as const },
  { name: 'Avocado (Fresh)', servingSize: '1/2 medium (100g)', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, mealType: 'lunch' as const },
  { name: 'Banana (Medium)', servingSize: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, mealType: 'snack' as const },
  { name: 'Apple (Honeycrisp)', servingSize: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, mealType: 'snack' as const },
  { name: 'Almonds (Raw)', servingSize: '28g (approx 23 nuts)', calories: 164, protein: 6, carbs: 6.1, fat: 14.2, mealType: 'snack' as const },
  { name: 'Peanut Butter (Natural)', servingSize: '2 tbsp (32g)', calories: 190, protein: 8, carbs: 7, fat: 16, mealType: 'snack' as const },
  { name: 'Olive Oil (Extra Virgin)', servingSize: '1 tbsp (14ml)', calories: 119, protein: 0, carbs: 0, fat: 13.5, mealType: 'dinner' as const },
  { name: 'Sweet Potato (Baked)', servingSize: '150g medium', calories: 135, protein: 3, carbs: 31, fat: 0.2, mealType: 'dinner' as const },
  { name: 'Broccoli (Steamed)', servingSize: '150g (1.5 cups)', calories: 52, protein: 3.6, carbs: 10.5, fat: 0.6, mealType: 'dinner' as const },
  { name: 'Lean Ground Beef 93/7', servingSize: '150g cooked', calories: 258, protein: 39, carbs: 0, fat: 10.5, mealType: 'dinner' as const },
  { name: 'Tofu (Extra Firm)', servingSize: '100g', calories: 83, protein: 10, carbs: 2, fat: 5, mealType: 'lunch' as const },
  { name: 'Whole Wheat Sourdough', servingSize: '1 thick slice (50g)', calories: 120, protein: 5, carbs: 23, fat: 1, mealType: 'breakfast' as const },
  { name: 'Cottage Cheese 2% Low Fat', servingSize: '150g', calories: 120, protein: 18, carbs: 6, fat: 3, mealType: 'snack' as const },
];
