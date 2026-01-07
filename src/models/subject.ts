import { gaussian, sigmoid } from '@/utils/math';

export type BiologicalSex = 'male' | 'female';

export interface Subject {
  age: number;      // years
  weight: number;   // kg
  height: number;   // cm
  sex: BiologicalSex;
  
  // Female specific configuration
  cycleLength: number; // days, default 28
  lutealPhaseLength: number; // days, default 14 (ovulation = cycleLength - lutealPhaseLength)
  cycleDay: number; // Current day of cycle (0 to cycleLength-1)
}

export const DEFAULT_SUBJECT: Subject = {
  age: 30,
  weight: 70,
  height: 175,
  sex: 'male',
  cycleLength: 28,
  lutealPhaseLength: 14,
  cycleDay: 0,
};

export interface Physiology {
  bmr: number;       // Basal Metabolic Rate (kcal/day)
  tbw: number;       // Total Body Water (L)
  bmi: number;       // Body Mass Index
  bsa: number;       // Body Surface Area (m^2)
  
  // Scoping factors (0.0 - 2.0 typically) relative to "standard" 70kg male
  metabolicCapacity: number; 
  drugClearance: number;

  // Advanced Physiology for PBPK
  leanBodyMass: number; // kg
  liverBloodFlow: number; // L/min
  estimatedGFR: number; // mL/min
}

/**
 * Mifflin-St Jeor Equation for BMR
 */
export function calculateBMR(subject: Subject): number {
  const s = subject.sex === 'male' ? 5 : -161;
  return (10 * subject.weight) + (6.25 * subject.height) - (5 * subject.age) + s;
}

/**
 * Watson Formula for Total Body Water (TBW) in Liters
 */
export function calculateTBW(subject: Subject): number {
  if (subject.sex === 'male') {
    return 2.447 - (0.09156 * subject.age) + (0.1074 * subject.height) + (0.3362 * subject.weight);
  } else {
    return -2.097 + (0.1069 * subject.height) + (0.2466 * subject.weight);
  }
}

/**
 * Boer Formula for Lean Body Mass (LBM)
 */
export function calculateLBM(subject: Subject): number {
  if (subject.sex === 'male') {
    return 0.407 * subject.weight + 0.267 * subject.height - 19.2;
  } else {
    return 0.252 * subject.weight + 0.473 * subject.height - 48.3;
  }
}

export function derivePhysiology(subject: Subject): Physiology {
  const bmr = calculateBMR(subject);
  const tbw = calculateTBW(subject);
  const lbm = calculateLBM(subject);
  const bmi = subject.weight / Math.pow(subject.height / 100, 2);
  const bsa = Math.sqrt((subject.height * subject.weight) / 3600); // Mosteller formula

  // Standard reference: 30yo Male, 70kg, 175cm -> BMR ~1660, TBW ~42L
  const REF_BMR = 1660;
  const REF_TBW = 42;

  // Liver Blood Flow (L/min) - Approx 1.5 L/min scaled by BSA
  // Standard BSA ~1.9 m^2? 70kg/175cm -> 1.84 m^2
  const liverBloodFlow = 1.5 * (bsa / 1.85);

  // GFR (Cockcroft-Gault)
  // ((140 - age) * weight) / (72 * Cr)
  // Assume Cr = 1.0 (normal)
  let gfr = ((140 - subject.age) * subject.weight) / 72.0;
  if (subject.sex === 'female') gfr *= 0.85;

  return {
    bmr,
    tbw,
    bmi,
    bsa,
    metabolicCapacity: bmr / REF_BMR,
    drugClearance: tbw / REF_TBW, // Simplified assumption: clearance scales with fluid volume/liver size
    leanBodyMass: lbm,
    liverBloodFlow,
    estimatedGFR: gfr,
  };
}

// --- Menstrual Cycle Modeling ---

export interface MenstrualHormones {
  estrogen: number;     // Normalized 0-1
  progesterone: number; // Normalized 0-1
  lh: number;           // Normalized 0-1 (Luteinizing Hormone)
  fsh: number;          // Normalized 0-1 (Follicle-Stimulating Hormone)
}

/**
 * Calculates hormone levels for a specific day in the cycle.
 * @param day Day of cycle (0 to cycleLength)
 * @param length Total cycle length in days
 */
export function getMenstrualHormones(day: number, length: number = 28): MenstrualHormones {
  // Normalize day to a standard 28-day model for curve calculation, then map back?
  // Easier: Normalize input day to 0-1 phase, then map to standard 28-day keypoints.
  
  // Key events on standard 28d cycle:
  // Day 1: Menses start
  // Day 14: Ovulation
  
  const phase = day / length; // 0.0 to 1.0
  const d = phase * 28; // Mapped to standard 28-day timeline for the math below
  
  // 1. Estrogen (Estradiol)
  // - Low during menses
  // - Rises to peak just before ovulation (Day ~12-13)
  // - Drops, then secondary lower peak in luteal phase (Day ~21)
  // - Drops before menses
  const estFollicular = gaussian(d, 12.5, 3); // Pre-ovulation peak
  const estLuteal = 0.5 * gaussian(d, 21, 5); // Luteal plateau
  const estrogen = 0.1 + 0.8 * estFollicular + 0.4 * estLuteal;

  // 2. Progesterone
  // - Very low during follicular phase
  // - Rises sharply after ovulation (corpus luteum)
  // - Peaks mid-luteal (Day ~21)
  // - Drops before menses
  const progLuteal = gaussian(d, 22, 6);
  const progesterone = 0.05 + 0.9 * progLuteal;

  // 3. LH (Luteinizing Hormone)
  // - Flat baseline
  // - Massive spike just before ovulation (Day 13-14) to trigger egg release
  const lhSpike = gaussian(d, 13.5, 1.2);
  const lh = 0.1 + 0.9 * lhSpike;

  // 4. FSH (Follicle Stimulating Hormone)
  // - Small rise at start (recruit follicles)
  // - Spike with LH at ovulation
  // - Low in luteal
  const fshStart = 0.3 * gaussian(d, 2, 4);
  const fshOvulation = 0.5 * gaussian(d, 13.5, 1.5);
  const fsh = 0.1 + fshStart + fshOvulation;

  return {
    estrogen: Math.min(1, Math.max(0, estrogen)),
    progesterone: Math.min(1, Math.max(0, progesterone)),
    lh: Math.min(1, Math.max(0, lh)),
    fsh: Math.min(1, Math.max(0, fsh)),
  };
}
