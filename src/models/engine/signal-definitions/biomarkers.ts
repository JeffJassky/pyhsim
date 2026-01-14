import type { UnifiedSignalDefinition } from '@/types/unified';
import type { PhysiologicalUnit } from '@/types/units';

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
  range: { min: number; max: number }
): UnifiedSignalDefinition => ({
  key,
  label,
  unit,
  description,
  dynamics: {
    setpoint: () => initial,
    tau: 10080, // 1 week dynamics
    production: [],
    clearance: [],
    couplings: []
  },
  initialValue: initial,
  display: { 
    color,
    referenceRange: range
  }
});

export const ferritin = createBiomarker('ferritin', 'Ferritin', 'ng/mL', 50, '#991b1b', 'Serum ferritin (iron stores).', { min: 30, max: 300 });
export const shbg = createBiomarker('shbg', 'SHBG', 'nmol/L', 40, '#3730a3', 'Sex hormone binding globulin.', { min: 20, max: 100 });
export const dheas = createBiomarker('dheas', 'DHEA-S', 'µg/dL', 200, '#86198f', 'DHEA-sulfate.', { min: 100, max: 500 });
export const alt = createBiomarker('alt', 'ALT', 'U/L', 25, '#065f46', 'Alanine aminotransferase.', { min: 0, max: 40 });
export const ast = createBiomarker('ast', 'AST', 'U/L', 22, '#064e3b', 'Aspartate aminotransferase.', { min: 0, max: 40 });
export const egfr = createBiomarker('egfr', 'eGFR', 'mL/min/1.73m²', 100, '#1e3a8a', 'Estimated glomerular filtration rate.', { min: 90, max: 120 });
export const vitaminD3 = createBiomarker('vitaminD3', 'Vitamin D3', 'ng/mL', 35, '#92400e', '25-hydroxy vitamin D.', { min: 30, max: 80 });
