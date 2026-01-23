import type { Subject, Physiology } from "./types";

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

  const REF_BMR = 1660;
  const REF_TBW = 42;

  const liverBloodFlow = 1.5 * (bsa / 1.85);

  let gfr = ((140 - subject.age) * subject.weight) / 72.0;
  if (subject.sex === 'female') gfr *= 0.85;

  return {
    bmr,
    tbw,
    bmi,
    bsa,
    metabolicCapacity: bmr / REF_BMR,
    drugClearance: tbw / REF_TBW,
    leanBodyMass: lbm,
    liverBloodFlow,
    estimatedGFR: gfr,
  };
}
