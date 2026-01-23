// --- Subject Types ---
export type BiologicalSex = "male" | "female";

export interface Subject {
  age: number;
  weight: number;
  height: number;
  sex: BiologicalSex;
  cycleLength: number;
  lutealPhaseLength: number;
  cycleDay: number;
}

export interface Physiology {
  bmr: number;
  tbw: number;
  bmi: number;
  bsa: number;
  metabolicCapacity: number;
  drugClearance: number;
  leanBodyMass: number;
  liverBloodFlow: number;
  estimatedGFR: number;
}

export interface NutritionTargets {
  calories: number;
  macrosEnabled: boolean;
  macros: {
    carbs: { min: number; max: number };
    fat: { min: number; max: number };
    protein: { min: number; max: number };
  };
}
