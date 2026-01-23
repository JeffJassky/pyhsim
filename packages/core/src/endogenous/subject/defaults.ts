import type { Subject, NutritionTargets } from "./types";

export const DEFAULT_SUBJECT: Subject = {
  age: 30,
  weight: 70,
  height: 175,
  sex: 'male',
  cycleLength: 28,
  lutealPhaseLength: 14,
  cycleDay: 0,
};

export const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  calories: 2000,
  macrosEnabled: false,
  macros: {
    carbs: { min: 200, max: 300 },
    fat: { min: 50, max: 90 },
    protein: { min: 100, max: 150 },
  },
};
