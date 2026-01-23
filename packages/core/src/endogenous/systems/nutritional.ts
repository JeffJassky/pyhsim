import type { BioSystemDef } from "./types";

export const nutritional: BioSystemDef = {
  id: "nutritional",
  label: "Nutritional Status",
  icon: "🥗",
  signals: [
    "magnesium",
    "ferritin",
    "vitaminD3",
    "zinc",
    "b12",
    "folate",
    "iron",
    "selenium",
    "copper",
    "chromium",
    "choline",
  ],
  description:
    "The levels of essential micronutrients and minerals required for enzymatic function and physiological health.",
  applicationDescription:
    "Ensure cofactor availability for optimal biological function.",
};
