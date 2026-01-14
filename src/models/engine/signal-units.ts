import type { Signal } from '@/types/neurostate';
import type { PhysiologicalUnit } from '@/types/units';
import {
  dopamine, serotonin, norepi, gaba, glutamate, acetylcholine, endocannabinoid
} from './signal-definitions/neurotransmitters';
import {
  cortisol, adrenaline, testosterone, estrogen,
  progesterone, lh, fsh, growthHormone, thyroid, leptin, ghrelin, glp1, oxytocin,
  prolactin, vasopressin, vip
} from './signal-definitions/hormones';
import {
  melatonin, orexin, histamine
} from './signal-definitions/circadian';
import {
  glucose, insulin, glucagon
} from './signal-definitions/metabolic';
import {
  energy, vagal, hrv, bloodPressure, inflammation, bdnf, sensoryLoad, oxygen, mtor, ampk,
  ethanol, acetaldehyde, magnesium, ketone
} from './signal-definitions/derived';
import {
  ferritin, shbg, dheas, alt, ast, egfr, vitaminD3
} from './signal-definitions/biomarkers';

export interface SignalUnitDefinition {
  unit: PhysiologicalUnit;
  referenceRange: { low: number; high: number };
  min: number;
  max: number;
  description: string;
}

const ALL_SIGNALS = [
  dopamine, serotonin, norepi, gaba, glutamate, acetylcholine, histamine, endocannabinoid,
  cortisol, adrenaline, insulin, glucagon, melatonin, orexin, testosterone, estrogen,
  progesterone, lh, fsh, growthHormone, thyroid, leptin, ghrelin, glp1, oxytocin,
  prolactin, vasopressin, vip,
  glucose, ketone,
  energy, vagal, hrv, bloodPressure, inflammation, bdnf, sensoryLoad, oxygen, mtor, ampk,
  ethanol, acetaldehyde, magnesium,
  ferritin, shbg, dheas, alt, ast, egfr, vitaminD3
];

/**
 * Master registry of physiological units and their expected ranges.
 * These values are used for scaling internal engine values to real-world units.
 * 
 * NOW DERIVED FROM SIGNAL DEFINITIONS.
 */
export const SIGNAL_UNITS: Record<Signal, SignalUnitDefinition> = ALL_SIGNALS.reduce((acc, def) => {
  acc[def.key as Signal] = {
    unit: def.unit,
    referenceRange: { 
      low: def.display.referenceRange?.min ?? 0, 
      high: def.display.referenceRange?.max ?? 100 
    },
    min: def.min ?? 0,
    max: def.max ?? 1000,
    description: def.description ?? ''
  };
  return acc;
}, {} as Record<Signal, SignalUnitDefinition>);

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
