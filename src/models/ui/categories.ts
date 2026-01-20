export interface InterventionCategory {
  id: string;
  label: string;
  icon: string;
}

export const INTERVENTION_CATEGORIES: InterventionCategory[] = [
  { id: "food", label: "Food", icon: "🍎" },
  { id: "exercise", label: "Exercise", icon: "🏃" },
  { id: "medications", label: "Medications", icon: "💊" },
  { id: "supplements", label: "Supplements", icon: "🍃" },
  { id: "wellness", label: "Wellness", icon: "🧘" },
  { id: "environment", label: "Environment", icon: "☀️" },
  { id: "social", label: "Social", icon: "🗣️" },
];
