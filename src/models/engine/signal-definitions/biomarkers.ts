import type { UnifiedSignalDefinition, IdealTendency } from "@/types/unified";
import type { PhysiologicalUnit } from "@/types/units";

/**
 * Very slow moving biomarkers
 */

const createBiomarker = (
  key: any,
  label: string,
  unit: PhysiologicalUnit,
  initial: number,
  description: string,
  range: { min: number; max: number },
  idealTendency: IdealTendency,
): UnifiedSignalDefinition => ({
  key,
  label,
  unit,
  description,
  idealTendency,
  dynamics: {
    setpoint: () => initial,
    tau: 10080, // 1 week dynamics
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: initial,
  display: {
    referenceRange: range,
  },
});

export const ferritin = createBiomarker(
  "ferritin",
  "Ferritin",
  "ng/mL",
  50,
  "A measure of your body's stored iron. Adequate ferritin is essential for producing healthy red blood cells and ensuring your brain and muscles have enough oxygen to function properly.",
  { min: 30, max: 300 },
  "mid",
);
export const shbg = createBiomarker(
  "shbg",
  "SHBG",
  "nmol/L",
  40,
  "Sex Hormone Binding Globulin. This protein acts as a carrier for hormones like testosterone and estrogen, regulating how much of them is 'free' and active in your system.",
  { min: 20, max: 100 },
  "mid",
);
export const dheas = createBiomarker(
  "dheas",
  "DHEA-S",
  "µg/dL",
  200,
  "A precursor to both male and female sex hormones. Produced by the adrenal glands, it supports mood, energy, and immune function, naturally declining as we age.",
  { min: 100, max: 500 },
  "mid",
);
export const alt = createBiomarker(
  "alt",
  "ALT",
  "U/L",
  25,
  "Alanine Aminotransferase. An enzyme primarily found in the liver. High levels in the blood can be a marker of liver stress or damage, reflecting your metabolic health.",
  { min: 0, max: 40 },
  "lower",
);
export const ast = createBiomarker(
  "ast",
  "AST",
  "U/L",
  22,
  "Aspartate Aminotransferase. Like ALT, this enzyme is a marker of liver and muscle health. Low levels are generally a sign of good organ function.",
  { min: 0, max: 40 },
  "lower",
);
export const egfr = createBiomarker(
  "egfr",
  "eGFR",
  "mL/min/1.73m²",
  100,
  "Estimated Glomerular Filtration Rate. This is the primary measure of how well your kidneys are filtering waste from your blood—the higher the number, the better the function.",
  { min: 90, max: 120 },
  "higher",
);
export const vitaminD3 = createBiomarker(
  "vitaminD3",
  "Vitamin D3",
  "ng/mL",
  35,
  "More of a hormone than a vitamin, D3 is vital for everything from bone density and immune function to mood regulation and protecting your brain.",
  { min: 30, max: 80 },
  "mid",
);

export const zinc = createBiomarker(
  "zinc",
  "Zinc",
  "µg/dL",
  90,
  "An essential mineral for your immune system, testosterone production, and the health of your brain's communication channels. It's a key player in physical and mental performance.",
  { min: 70, max: 120 },
  "mid",
);

export const b12 = createBiomarker(
  "b12",
  "Vitamin B12",
  "pg/mL",
  500,
  "Vital for maintaining healthy nerves and producing red blood cells. B12 is essential for your 'mental energy' and preventing fatigue and brain fog.",
  { min: 200, max: 900 },
  "mid",
);

export const folate = createBiomarker(
  "folate",
  "Folate",
  "ng/mL",
  12,
  "A B-vitamin essential for cell division and building new proteins. It supports brain health and is a critical part of the 'methylation' cycle that keeps your cells running.",
  { min: 4, max: 20 },
  "mid",
);

export const iron = createBiomarker(
  "iron",
  "Serum Iron",
  "µg/dL",
  100,
  "The amount of iron currently in your blood. It's the core component of hemoglobin, which carries life-sustaining oxygen from your lungs to your entire body.",
  { min: 60, max: 170 },
  "mid",
);

export const selenium = createBiomarker(
  "selenium",
  "Selenium",
  "µg/L",
  120,
  "A trace mineral that acts as a powerful antioxidant, protecting your cells from damage and supporting healthy thyroid function and metabolism.",
  { min: 70, max: 150 },
  "mid",
);

export const copper = createBiomarker(
  "copper",
  "Copper",
  "µg/dL",
  110,
  "An essential mineral that helps your body build connective tissue, maintain a healthy nervous system, and supports energy production within your cells.",
  { min: 70, max: 150 },
  "mid",
);

export const chromium = createBiomarker(
  "chromium",
  "Chromium",
  "index",
  1.0,
  "A trace mineral that helps your body manage blood sugar by improving your cells' sensitivity to insulin, supporting steady energy levels.",
  { min: 0.5, max: 1.5 },
  "mid",
);

export const choline = createBiomarker(
  "choline",
  "Choline",
  "µmol/L",
  10,
  "The raw material for your brain's primary messaging chemical, acetylcholine. It's essential for memory, focus, and keeping your liver and cells healthy.",
  { min: 7, max: 20 },
  "mid",
);