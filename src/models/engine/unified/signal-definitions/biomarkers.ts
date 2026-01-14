import type { UnifiedSignalDefinition } from '@/types/unified';
import type { PhysiologicalUnit } from '@/types/units';

/**
 * Very slow moving biomarkers
 */

const createBiomarker = (key: any, label: string, unit: PhysiologicalUnit, initial: number, color: string): UnifiedSignalDefinition => ({
  key,
  label,
  unit,
  dynamics: {
    setpoint: () => initial,
    tau: 10080, // 1 week dynamics
    production: [],
    clearance: [],
    couplings: []
  },
  initialValue: initial,
  display: { color }
});

export const ferritin = createBiomarker('ferritin', 'Ferritin', 'ng/mL', 50, '#991b1b');
export const shbg = createBiomarker('shbg', 'SHBG', 'nmol/L', 40, '#3730a3');
export const dheas = createBiomarker('dheas', 'DHEA-S', 'µg/dL', 200, '#86198f');
export const alt = createBiomarker('alt', 'ALT', 'U/L', 25, '#065f46');
export const ast = createBiomarker('ast', 'AST', 'U/L', 22, '#064e3b');
export const egfr = createBiomarker('egfr', 'eGFR', 'mL/min/1.73m²', 100, '#1e3a8a');
export const vitaminD3 = createBiomarker('vitaminD3', 'Vitamin D3', 'ng/mL', 35, '#92400e');
