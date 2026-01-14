/**
 * Alcohol (Ethanol) Metabolism Constants
 *
 * These constants define the pharmacokinetics and pharmacodynamics
 * of ethanol, including Michaelis-Menten saturable elimination.
 */

// === Standard Drink Definitions ===
export const ETHANOL_DOSE = {
  /** Grams of ethanol per US standard drink */
  GRAMS_PER_US_DRINK: 14,
  /** Grams of ethanol per UK standard drink */
  GRAMS_PER_UK_DRINK: 10,
  /** Grams of ethanol per Australian standard drink */
  GRAMS_PER_AU_DRINK: 10,
  /** International average (used in simulations) */
  GRAMS_PER_STANDARD_UNIT: 12,
} as const;

// === Widmark Distribution ===
export const ETHANOL_DISTRIBUTION = {
  /** Volume of distribution coefficient for males (L/kg) */
  WIDMARK_R_MALE: 0.68,
  /** Volume of distribution coefficient for females (L/kg) */
  WIDMARK_R_FEMALE: 0.55,
  /** Default weight for calculations (kg) */
  DEFAULT_WEIGHT_KG: 70,
} as const;

// === Michaelis-Menten Elimination ===
export const ETHANOL_KINETICS = {
  /** Maximum elimination rate (mg/dL per minute) */
  VMAX_DEFAULT: 0.20,
  /** Michaelis constant (mg/dL) - very low = mostly zero-order */
  KM_MGDL: 10,
  /** Absorption half-life (min) */
  ABSORPTION_HALFLIFE_MIN: 15,
  /** Absorption lag time (min) */
  ABSORPTION_LAG_MIN: 10,
} as const;

// === GABA-A Potentiation ===
export const ETHANOL_GABA = {
  /** Peak GABA amplitude (% baseline) */
  AMPLITUDE: 25.0,
  /** BAC for half-maximum effect (mg/dL) */
  EC50_MGDL: 30,
  /** Hill coefficient for GABA-A binding */
  HILL_N: 1.5,
} as const;

// === Glutamate Suppression & Rebound ===
export const ETHANOL_GLUTAMATE = {
  /** Acute suppression amplitude (% baseline) */
  SUPPRESSION_AMPLITUDE: 15.0,
  /** BAC for half-maximum suppression (mg/dL) */
  SUPPRESSION_EC50_MGDL: 30,
  /** Rebound hyperexcitability amplitude (% baseline per unit) */
  REBOUND_AMPLITUDE_PER_UNIT: 10.0,
  /** Time to peak rebound (min after drinking starts) */
  REBOUND_PEAK_TIME_MIN: 300,
  /** Rebound peak width (variance for gaussian) */
  REBOUND_VARIANCE: 30000,
  /** BAC threshold below which rebound occurs (mg/dL) */
  REBOUND_BAC_THRESHOLD: 10,
  /** Minimum time before rebound starts (min) */
  REBOUND_MIN_TIME_MIN: 120,
} as const;

// === Withdrawal / Hangover ===
export const ETHANOL_WITHDRAWAL = {
  /** GABA rebound amplitude (% baseline per unit) */
  GABA_REBOUND_PER_UNIT: 8.0,
  /** GABA rebound delay (min) */
  GABA_REBOUND_DELAY_MIN: 240,
  /** GABA rebound peak width (variance) */
  GABA_REBOUND_VARIANCE: 20000,
  /** BAC threshold for withdrawal symptoms (mg/dL) */
  BAC_THRESHOLD_MGDL: 5,
} as const;

// === Vagal Tone ===
export const ETHANOL_VAGAL = {
  /** Vagal suppression per mg/dL BAC */
  SUPPRESSION_PER_BAC: 0.008,
} as const;

// === HPA Axis / Cortisol ===
export const ETHANOL_CORTISOL = {
  /** Clearance stress amplitude (µg/dL per unit) */
  CLEARANCE_STRESS_PER_UNIT: 3.0,
  /** BAC threshold for stress response (mg/dL) */
  STRESS_BAC_THRESHOLD: 20,
  /** Minimum time for stress response (min) */
  STRESS_MIN_TIME_MIN: 180,
  /** Peak time for hangover cortisol (min) */
  STRESS_PEAK_TIME_MIN: 360,
  /** Peak width (variance) */
  STRESS_VARIANCE: 40000,
} as const;

// === Inflammation ===
export const ETHANOL_INFLAMMATION = {
  /** Inflammatory response amplitude per unit */
  AMPLITUDE_PER_UNIT: 0.5,
  /** Onset delay (min) */
  ONSET_DELAY_MIN: 180,
  /** Peak onset time constant (min) */
  PEAK_ONSET_MIN: 120,
  /** Peak duration (min) */
  PEAK_DURATION_MIN: 600,
} as const;

// === Melatonin Suppression ===
export const ETHANOL_MELATONIN = {
  /** Suppression per mg/dL BAC */
  SUPPRESSION_PER_BAC: 0.4,
} as const;

// === Legal Limits ===
export const LEGAL_BAC_LIMITS = {
  /** US driving limit (mg/dL) */
  US_DRIVING_LIMIT: 80,
  /** Many European countries (mg/dL) */
  EU_DRIVING_LIMIT: 50,
  /** Zero tolerance (mg/dL) */
  ZERO_TOLERANCE: 20,
} as const;
