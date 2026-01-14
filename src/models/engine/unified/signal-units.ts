import type { Signal } from '@/types/neurostate';
import type { PhysiologicalUnit } from '@/types/units';

export interface SignalUnitDefinition {
  unit: PhysiologicalUnit;
  referenceRange: { low: number; high: number };
  min: number;
  max: number;
  description: string;
}

/**
 * Master registry of physiological units and their expected ranges.
 * These values are used for scaling internal engine values to real-world units.
 */
export const SIGNAL_UNITS: Record<Signal, SignalUnitDefinition> = {
  // === NEUROTRANSMITTERS (Synaptic/Extracellular) ===
  dopamine: {
    unit: 'nM',
    referenceRange: { low: 5, high: 20 },
    min: 0,
    max: 100,
    description: 'Extracellular dopamine concentration in the striatum.'
  },
  serotonin: {
    unit: 'nM',
    referenceRange: { low: 1, high: 10 },
    min: 0,
    max: 50,
    description: 'Extracellular serotonin concentration.'
  },
  norepi: {
    unit: 'pg/mL',
    referenceRange: { low: 100, high: 450 },
    min: 0,
    max: 2000,
    description: 'Plasma norepinephrine (proxy for sympathetic tone).'
  },
  gaba: {
    unit: 'nM',
    referenceRange: { low: 100, high: 500 },
    min: 0,
    max: 2000,
    description: 'Extracellular GABA concentration.'
  },
  glutamate: {
    unit: 'µM',
    referenceRange: { low: 1, high: 10 },
    min: 0,
    max: 100,
    description: 'Extracellular glutamate concentration.'
  },
  acetylcholine: {
    unit: 'nM',
    referenceRange: { low: 1, high: 20 },
    min: 0,
    max: 100,
    description: 'Extracellular acetylcholine concentration.'
  },
  histamine: {
    unit: 'nM',
    referenceRange: { low: 5, high: 50 },
    min: 0,
    max: 500,
    description: 'Extracellular histamine concentration.'
  },
  endocannabinoid: {
    unit: 'nM',
    referenceRange: { low: 1, high: 10 },
    min: 0,
    max: 100,
    description: 'Anandamide/2-AG tone.'
  },

  // === HORMONES ===
  cortisol: {
    unit: 'µg/dL',
    referenceRange: { low: 5, high: 25 },
    min: 0,
    max: 100,
    description: 'Serum cortisol concentration.'
  },
  adrenaline: {
    unit: 'pg/mL',
    referenceRange: { low: 10, high: 100 },
    min: 0,
    max: 1000,
    description: 'Plasma epinephrine concentration.'
  },
  insulin: {
    unit: 'µIU/mL',
    referenceRange: { low: 2, high: 25 },
    min: 0,
    max: 200,
    description: 'Serum insulin concentration.'
  },
  glucagon: {
    unit: 'pg/mL',
    referenceRange: { low: 50, high: 150 },
    min: 0,
    max: 1000,
    description: 'Plasma glucagon concentration.'
  },
  melatonin: {
    unit: 'pg/mL',
    referenceRange: { low: 0, high: 100 },
    min: 0,
    max: 500,
    description: 'Plasma melatonin concentration.'
  },
  orexin: {
    unit: 'pg/mL',
    referenceRange: { low: 200, high: 600 },
    min: 0,
    max: 1000,
    description: 'CSF orexin-A concentration proxy.'
  },
  testosterone: {
    unit: 'ng/dL',
    referenceRange: { low: 300, high: 1000 }, // Male-default, adjusted in UI
    min: 0,
    max: 3000,
    description: 'Total serum testosterone.'
  },
  estrogen: {
    unit: 'pg/mL',
    referenceRange: { low: 50, high: 400 },
    min: 0,
    max: 1000,
    description: 'Serum estradiol.'
  },
  progesterone: {
    unit: 'ng/mL',
    referenceRange: { low: 0.1, high: 20 },
    min: 0,
    max: 50,
    description: 'Serum progesterone.'
  },
  lh: {
    unit: 'IU/L',
    referenceRange: { low: 2, high: 15 },
    min: 0,
    max: 100,
    description: 'Luteinizing hormone.'
  },
  fsh: {
    unit: 'IU/L',
    referenceRange: { low: 1, high: 10 },
    min: 0,
    max: 100,
    description: 'Follicle-stimulating hormone.'
  },
  growthHormone: {
    unit: 'ng/mL',
    referenceRange: { low: 0.1, high: 10 },
    min: 0,
    max: 50,
    description: 'Serum growth hormone.'
  },
  thyroid: {
    unit: 'pmol/L',
    referenceRange: { low: 10, high: 25 },
    min: 0,
    max: 100,
    description: 'Free T4 proxy.'
  },
  leptin: {
    unit: 'ng/mL',
    referenceRange: { low: 2, high: 15 },
    min: 0,
    max: 100,
    description: 'Serum leptin.'
  },
  ghrelin: {
    unit: 'pg/mL',
    referenceRange: { low: 500, high: 1500 },
    min: 0,
    max: 5000,
    description: 'Active ghrelin.'
  },
  glp1: {
    unit: 'pmol/L',
    referenceRange: { low: 5, high: 50 },
    min: 0,
    max: 200,
    description: 'Active GLP-1.'
  },
  oxytocin: {
    unit: 'pg/mL',
    referenceRange: { low: 1, high: 10 },
    min: 0,
    max: 100,
    description: 'Plasma oxytocin.'
  },
  prolactin: {
    unit: 'ng/mL',
    referenceRange: { low: 5, high: 20 },
    min: 0,
    max: 200,
    description: 'Serum prolactin.'
  },
  vasopressin: {
    unit: 'pg/mL',
    referenceRange: { low: 1, high: 5 },
    min: 0,
    max: 50,
    description: 'Plasma vasopressin.'
  },
  vip: {
    unit: 'pg/mL',
    referenceRange: { low: 0, high: 100 },
    min: 0,
    max: 500,
    description: 'Vasoactive intestinal peptide.'
  },

  // === METABOLIC / BIOMARKERS ===
  glucose: {
    unit: 'mg/dL',
    referenceRange: { low: 70, high: 140 },
    min: 0,
    max: 600,
    description: 'Blood glucose concentration.'
  },
  ketone: {
    unit: 'mmol/L',
    referenceRange: { low: 0.1, high: 0.5 },
    min: 0,
    max: 10,
    description: 'Blood beta-hydroxybutyrate.'
  },
  ethanol: {
    unit: 'mg/dL',
    referenceRange: { low: 0, high: 0 },
    min: 0,
    max: 400,
    description: 'Blood alcohol concentration.'
  },
  acetaldehyde: {
    unit: 'µM',
    referenceRange: { low: 0, high: 2 },
    min: 0,
    max: 50,
    description: 'Blood acetaldehyde concentration.'
  },
  magnesium: {
    unit: 'mg/dL',
    referenceRange: { low: 1.7, high: 2.3 },
    min: 0,
    max: 5,
    description: 'Serum magnesium.'
  },
  ferritin: {
    unit: 'ng/mL',
    referenceRange: { low: 30, high: 300 },
    min: 0,
    max: 1000,
    description: 'Serum ferritin (iron stores).'
  },
  shbg: {
    unit: 'nmol/L',
    referenceRange: { low: 20, high: 100 },
    min: 0,
    max: 300,
    description: 'Sex hormone binding globulin.'
  },
  dheas: {
    unit: 'µg/dL',
    referenceRange: { low: 100, high: 500 },
    min: 0,
    max: 1500,
    description: 'DHEA-sulfate.'
  },
  alt: {
    unit: 'IU/L',
    referenceRange: { low: 0, high: 40 },
    min: 0,
    max: 1000,
    description: 'Alanine aminotransferase.'
  },
  ast: {
    unit: 'IU/L',
    referenceRange: { low: 0, high: 40 },
    min: 0,
    max: 1000,
    description: 'Aspartate aminotransferase.'
  },
  egfr: {
    unit: 'IU/L', // Placeholder unit for ml/min/1.73m2
    referenceRange: { low: 90, high: 120 },
    min: 0,
    max: 200,
    description: 'Estimated glomerular filtration rate.'
  },
  vitaminD3: {
    unit: 'ng/mL',
    referenceRange: { low: 30, high: 80 },
    min: 0,
    max: 150,
    description: '25-hydroxy vitamin D.'
  },

  // === DERIVED / COMPOSITE (Index units) ===
  energy: {
    unit: 'index',
    referenceRange: { low: 40, high: 80 },
    min: 0,
    max: 100,
    description: 'Subjective energy index.'
  },
  vagal: {
    unit: 'index',
    referenceRange: { low: 0.3, high: 0.7 },
    min: 0,
    max: 1,
    description: 'Vagal tone (HRV proxy).'
  },
  hrv: {
    unit: 'ms',
    referenceRange: { low: 20, high: 100 },
    min: 0,
    max: 300,
    description: 'Heart rate variability (RMSSD).'
  },
  bloodPressure: {
    unit: 'mmHg',
    referenceRange: { low: 90, high: 120 },
    min: 0,
    max: 220,
    description: 'Systolic blood pressure proxy.'
  },
  inflammation: {
    unit: 'index',
    referenceRange: { low: 0, high: 2 },
    min: 0,
    max: 10,
    description: 'Composite inflammatory index.'
  },
  bdnf: {
    unit: 'ng/mL',
    referenceRange: { low: 10, high: 30 },
    min: 0,
    max: 100,
    description: 'Brain-derived neurotrophic factor.'
  },
  sensoryLoad: {
    unit: 'index',
    referenceRange: { low: 0, high: 50 },
    min: 0,
    max: 100,
    description: 'Accumulated sensory/cognitive load.'
  },
  oxygen: {
    unit: '%',
    referenceRange: { low: 95, high: 100 },
    min: 0,
    max: 100,
    description: 'Peripheral oxygen saturation.'
  },
  mtor: {
    unit: 'index',
    referenceRange: { low: 0.2, high: 0.8 },
    min: 0,
    max: 2,
    description: 'mTOR signaling activity.'
  },
  ampk: {
    unit: 'index',
    referenceRange: { low: 0.2, high: 0.8 },
    min: 0,
    max: 2,
    description: 'AMPK signaling activity.'
  }
};

/**
 * Conversion factors to map current internal values (Old Units) to Physical Units (New Units).
 * Formula: PhysicalValue = InternalValue * scaleFactor
 */
export const UNIT_CONVERSIONS: Partial<Record<Signal, { scaleFactor: number }>> = {
  // Migrated to Physical Units (1.0 scale)
  dopamine: { scaleFactor: 1.0 },
  serotonin: { scaleFactor: 1.0 },
  norepi: { scaleFactor: 1.0 },
  gaba: { scaleFactor: 1.0 },
  glutamate: { scaleFactor: 1.0 },
  acetylcholine: { scaleFactor: 1.0 },
  histamine: { scaleFactor: 1.0 },
  endocannabinoid: { scaleFactor: 1.0 },

  // Remaining (Transitioning or already correct)
  cortisol: { scaleFactor: 1.0 },
  adrenaline: { scaleFactor: 1.0 },
  insulin: { scaleFactor: 1.0 },
  glucagon: { scaleFactor: 1.0 },
  melatonin: { scaleFactor: 1.0 },      
  orexin: { scaleFactor: 1.0 },        
  
  // Testosterone is sex-dependent
  testosterone: { scaleFactor: 1.0 },  
  
  // Others
  inflammation: { scaleFactor: 0.1 },   // 10 -> 1.0 index
  vagal: { scaleFactor: 0.01 },         // 50 -> 0.5 index
  vip: { scaleFactor: 1.0 },
};

/**
 * Utility to convert an internal engine value to a display value with its unit.
 */
export function getDisplayValue(signal: Signal, internalValue: number): { value: number; unit: PhysiologicalUnit } {
  const def = SIGNAL_UNITS[signal];
  const conversion = UNIT_CONVERSIONS[signal];
  
  const value = conversion 
    ? internalValue * conversion.scaleFactor 
    : internalValue;

  return {
    value,
    unit: def?.unit ?? 'index'
  };
}
