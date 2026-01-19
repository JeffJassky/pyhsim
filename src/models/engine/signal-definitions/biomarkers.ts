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
  color: string,
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
  "#991b1b",
  "Serum ferritin (iron stores).",
  { min: 30, max: 300 },
  "mid",
);
export const shbg = createBiomarker(
  "shbg",
  "SHBG",
  "nmol/L",
  40,
  "#3730a3",
  "Sex hormone binding globulin.",
  { min: 20, max: 100 },
  "mid",
);
export const dheas = createBiomarker(
  "dheas",
  "DHEA-S",
  "µg/dL",
  200,
  "#86198f",
  "DHEA-sulfate.",
  { min: 100, max: 500 },
  "mid",
);
export const alt = createBiomarker(
  "alt",
  "ALT",
  "U/L",
  25,
  "#065f46",
  "Alanine aminotransferase.",
  { min: 0, max: 40 },
  "lower",
);
export const ast = createBiomarker(
  "ast",
  "AST",
  "U/L",
  22,
  "#064e3b",
  "Aspartate aminotransferase.",
  { min: 0, max: 40 },
  "lower",
);
export const egfr = createBiomarker(
  "egfr",
  "eGFR",
  "mL/min/1.73m²",
  100,
  "#1e3a8a",
  "Estimated glomerular filtration rate.",
  { min: 90, max: 120 },
  "higher",
);
export const vitaminD3 = createBiomarker(
  "vitaminD3",
  "Vitamin D3",
  "ng/mL",
  35,
  "#92400e",
  "25-hydroxy vitamin D.",
  { min: 30, max: 80 },
  "mid",
);

export const zinc = createBiomarker(
  "zinc",
  "Zinc",
  "µg/dL",
  90,
  "#a1a1aa",
  "Serum zinc - essential for immune function and testosterone.",
  { min: 70, max: 120 },
  "mid",
);

export const b12 = createBiomarker(
  "b12",
  "Vitamin B12",
  "pg/mL",
  500,
  "#dc2626",
  "Serum B12 - methylation and neurological function.",
  { min: 200, max: 900 },
  "mid",
);

export const folate = createBiomarker(
  "folate",
  "Folate",
  "ng/mL",
  12,
  "#16a34a",
  "Serum folate - one-carbon metabolism.",
  { min: 4, max: 20 },
  "mid",
);

export const iron = createBiomarker(
  "iron",
  "Serum Iron",
  "µg/dL",
  100,
  "#b91c1c",
  "Serum iron - oxygen transport capacity.",
  { min: 60, max: 170 },
  "mid",
);

export const selenium = createBiomarker(
  "selenium",
  "Selenium",
  "µg/L",
  120,
  "#ca8a04",
  "Serum selenium - antioxidant and thyroid function.",
  { min: 70, max: 150 },
  "mid",
);

export const copper = createBiomarker(
  "copper",
  "Copper",
  "µg/dL",
  110,
  "#ea580c",
  "Serum copper - enzyme cofactor.",
  { min: 70, max: 150 },
  "mid",
);

export const chromium = createBiomarker(
  "chromium",
  "Chromium",
  "index",
  1.0,
  "#6b7280",
  "Chromium status - insulin sensitivity support.",
  { min: 0.5, max: 1.5 },
  "mid",
);

export const choline = createBiomarker(
  "choline",
  "Choline",
  "µmol/L",
  10,
  "#7c3aed",
  "Plasma choline - acetylcholine precursor pool.",
  { min: 7, max: 20 },
  "mid",
);
