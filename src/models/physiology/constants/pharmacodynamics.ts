/**
 * Pharmacodynamics Constants
 *
 * These constants define receptor occupancy, efficacy parameters,
 * and receptor adaptation kinetics.
 */

// === Efficacy (Tau) Defaults by Mechanism ===
export const EFFICACY_TAU = {
  /** Full agonist (most drugs) */
  FULL_AGONIST: 10,
  /** Partial agonist (e.g., buprenorphine, aripiprazole) */
  PARTIAL_AGONIST: 1,
  /** Super agonist (rare) */
  SUPER_AGONIST: 50,
  /** Inverse agonist */
  INVERSE_AGONIST: -1,
  /** Default when not specified */
  DEFAULT: 10,
} as const;

// === Receptor Adaptation Kinetics ===
export const RECEPTOR_ADAPTATION = {
  /** Upregulation rate constant (per minute) - slow process */
  K_UP: 0.001,
  /** Downregulation rate constant (per minute) */
  K_DOWN: 0.002,
  /** Fast phase rate (for biphasic model) */
  K_FAST: 0.005,
  /** Slow phase rate (for biphasic model) */
  K_SLOW: 0.0005,
  /** Fast phase contribution (fraction) */
  FAST_PHASE_FRACTION: 0.6,
  /** Slow phase contribution (fraction) */
  SLOW_PHASE_FRACTION: 0.4,
  /** Occupancy threshold for adaptation (fraction) */
  OCCUPANCY_THRESHOLD: 0.3,
  /** Baseline receptor density (normalized to 1) */
  BASELINE_DENSITY: 1.0,
  /** Minimum receptor density (fraction of baseline) */
  MIN_DENSITY: 0.3,
  /** Maximum receptor density (fraction of baseline) */
  MAX_DENSITY: 2.0,
} as const;

// === Receptor Type-Specific Adaptation Rates ===
export const RECEPTOR_RATES = {
  /** Dopamine D2 - moderate adaptation */
  D2: { k_up: 0.001, k_down: 0.002 },
  /** Dopamine D1 - slower adaptation */
  D1: { k_up: 0.0008, k_down: 0.0015 },
  /** Serotonin 5-HT2A - fast downregulation */
  '5HT2A': { k_up: 0.0012, k_down: 0.003 },
  /** GABA-A - very slow adaptation */
  GABAA: { k_up: 0.0005, k_down: 0.001 },
  /** Adenosine A2A - moderate */
  A2A: { k_up: 0.001, k_down: 0.002 },
  /** Mu opioid - fast downregulation (tolerance) */
  MU_OPIOID: { k_up: 0.0015, k_down: 0.004 },
  /** Beta adrenergic - fast adaptation */
  BETA_ADRENERGIC: { k_up: 0.002, k_down: 0.003 },
  /** NMDA - very slow */
  NMDA: { k_up: 0.0003, k_down: 0.0008 },
} as const;

// === PAM/NAM Cooperativity Factors ===
export const ALLOSTERIC_MODULATION = {
  /** Default PAM cooperativity factor */
  PAM_ALPHA_DEFAULT: 3.0,
  /** Strong PAM (e.g., benzodiazepines on GABA-A) */
  PAM_ALPHA_STRONG: 5.0,
  /** Weak PAM (e.g., L-theanine) */
  PAM_ALPHA_WEAK: 1.5,
  /** NAM reduction factor */
  NAM_ALPHA_DEFAULT: 0.3,
} as const;

// === Reference Binding Constants (nM) ===
export const REFERENCE_KI = {
  // Caffeine
  CAFFEINE_A2A: 2400,
  CAFFEINE_A1: 12000,
  CAFFEINE_PDE: 480000,
  // Methylphenidate
  METHYLPHENIDATE_DAT: 34,
  METHYLPHENIDATE_NET: 339,
  // Melatonin
  MELATONIN_MT1: 0.08,
  MELATONIN_MT2: 0.23,
  // L-Theanine
  THEANINE_GLUTAMATE: 50000,
  THEANINE_GABA: 20000,
  // Magnesium
  MAGNESIUM_NMDA: 1000000,
  MAGNESIUM_GABA: 500000,
} as const;

// === Transporter Adaptation ===
export const TRANSPORTER_ADAPTATION = {
  /** DAT (dopamine transporter) adaptation rate */
  DAT: { k_up: 0.001, k_down: 0.002 },
  /** NET (norepinephrine transporter) */
  NET: { k_up: 0.001, k_down: 0.002 },
  /** SERT (serotonin transporter) */
  SERT: { k_up: 0.0008, k_down: 0.0015 },
} as const;

// === Vesicle Dynamics ===
export const VESICLE_DYNAMICS = {
  /** Dopamine vesicle synthesis rate (per minute) */
  DA_SYNTHESIS_RATE: 0.002,
  /** Dopamine vesicle release rate at max stimulation */
  DA_RELEASE_RATE: 0.01,
  /** Serotonin precursor synthesis rate */
  SEROTONIN_SYNTHESIS_RATE: 0.0015,
  /** Serotonin release rate */
  SEROTONIN_RELEASE_RATE: 0.008,
  /** Norepinephrine synthesis rate */
  NE_SYNTHESIS_RATE: 0.002,
  /** Norepinephrine release rate */
  NE_RELEASE_RATE: 0.01,
  /** Baseline vesicle pool (fraction of max) */
  BASELINE_POOL: 0.8,
  /** Minimum pool (depleted state) */
  MIN_POOL: 0.1,
  /** Maximum pool (fully loaded) */
  MAX_POOL: 1.0,
} as const;

// === Half-life Reference Values (minutes) ===
export const REFERENCE_HALFLIFE = {
  CAFFEINE: 300,
  METHYLPHENIDATE: 180,
  MELATONIN: 45,
  L_THEANINE: 75,
  MAGNESIUM: 720,
  ETHANOL: null, // Michaelis-Menten, not first-order
} as const;
