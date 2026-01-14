/**
 * Nutrient/Food Kernel Constants
 *
 * These constants define the physiological parameters for food-related signal responses.
 * All values are derived from published literature and clinical data.
 */

// === Macronutrient Energy Densities (kcal/g) ===
export const KCAL_PER_GRAM_CARB = 4;
export const KCAL_PER_GRAM_PROTEIN = 4;
export const KCAL_PER_GRAM_FAT = 9;

// === Insulin Response ===
export const INSULIN = {
  /** Scaling factor to normalize carbAppearance to unitless 0-1 range */
  CARB_APPEARANCE_SCALING: 50.0,
  /** Peak insulin amplitude scaling (µIU/mL per normalized unit) */
  AMPLITUDE_SCALING: 15.0,
  /** First-phase secretion onset time constant (min) */
  FAST_PHASE_ONSET_MIN: 5,
  /** First-phase secretion decay time constant (min) */
  FAST_PHASE_CLEARANCE_MIN: 35,
  /** Second-phase secretion onset time constant (min) */
  SLOW_PHASE_ONSET_MIN: 18,
  /** Second-phase secretion decay time constant (min) */
  SLOW_PHASE_CLEARANCE_MIN: 160,
  /** First-phase contribution to total response */
  FAST_PHASE_WEIGHT: 0.6,
  /** Second-phase contribution to total response */
  SLOW_PHASE_WEIGHT: 0.4,
  /** Hill equation EC50 for carb-driven secretion */
  SECRETION_EC50: 150,
  /** Hill equation coefficient for secretion curve */
  SECRETION_HILL_N: 1.4,
} as const;

// === Glucose Response ===
export const GLUCOSE = {
  /** Amplitude scaling for glucose rise per carb appearance unit (mg/dL) */
  APPEARANCE_AMPLITUDE: 2.0,
  /** Fast GI absorption time constant (min) */
  FAST_ABSORPTION_TAU_MIN: 12,
  /** Slow GI absorption time constant (min) */
  SLOW_ABSORPTION_TAU_MIN: 40,
  /** Fast rise phase duration (min) */
  FAST_RISE_DURATION_MIN: 60,
  /** Slow rise phase duration (min) */
  SLOW_RISE_DURATION_MIN: 180,
  /** Fast phase contribution to rise */
  FAST_PHASE_WEIGHT: 0.6,
  /** Slow phase contribution to rise */
  SLOW_PHASE_WEIGHT: 0.4,
  /** Reactive hypoglycemia magnitude (fraction of rise) */
  CRASH_FRACTION: 0.25,
  /** Crash absorption rate constant (1/min) */
  CRASH_K_ABSORPTION: 1 / 40,
  /** Crash elimination rate constant (1/min) */
  CRASH_K_ELIMINATION: 1 / 180,
  /** Delay to crash peak from meal start (min) */
  CRASH_DELAY_MIN: 90,
  /** Glucose volume of distribution (L/kg) */
  VD_L_KG: 0.2,
  /** Deciliters per liter conversion */
  DL_PER_LITER: 10,
  /** Empirical absorption scaling factor */
  ABSORPTION_SCALER: 2.5,
} as const;

// === Ghrelin Response ===
export const GHRELIN = {
  /** Maximum suppression amplitude (pg/mL) */
  SUPPRESSION_MAX: 150.0,
  /** kcal for half-maximum suppression */
  SATURATION_KCAL: 400,
  /** Hill coefficient for suppression curve */
  HILL_N: 1.2,
  /** Suppression onset time constant (min) */
  ONSET_TAU_MIN: 18,
  /** Time when tail phase begins (min after meal) */
  TAIL_ONSET_MIN: 120,
  /** Base clearance time constant for tail phase (min) */
  TAIL_BASE_TAU_MIN: 100,
  /** kcal-dependent extension of tail duration (min/kcal) */
  KCAL_TAIL_SCALING: 0.1,
} as const;

// === Leptin Response ===
export const LEPTIN = {
  /** Acute post-prandial amplitude (ng/mL) */
  ACUTE_AMPLITUDE: 3.0,
  /** kcal for half-maximum response */
  SATURATION_KCAL: 600,
  /** Hill coefficient */
  HILL_N: 1.3,
  /** Slow onset time constant (min) - leptin is slow */
  ONSET_TAU_MIN: 180,
} as const;

// === Serotonin Response (Tryptophan-mediated) ===
export const SEROTONIN_FOOD = {
  /** Grams of carbs for half-maximum effect */
  CARB_THRESHOLD_G: 60,
  /** Hill coefficient for carb effect */
  HILL_N: 1.4,
  /** Peak amplitude (% baseline) */
  AMPLITUDE: 30.0,
  /** Onset time constant after gastric delay (min) */
  ONSET_TAU_MIN: 25,
  /** Time to peak from dose (min) */
  PEAK_TIME_MIN: 150,
  /** Decay time constant (min) */
  DECAY_TAU_MIN: 120,
  /** Pre-gastric delay offset (min) */
  PRE_GASTRIC_OFFSET_MIN: 5,
} as const;

// === Dopamine Reward Response ===
export const DOPAMINE_FOOD = {
  /** Sugar contribution to palatability score */
  SUGAR_WEIGHT: 0.004,
  /** Fat contribution to palatability score */
  FAT_WEIGHT: 0.003,
  /** Palatability EC50 (unitless) */
  PALATABILITY_EC50: 0.5,
  /** Hill coefficient for palatability */
  HILL_N: 1.2,
  /** Reward amplitude (% baseline) */
  REWARD_AMPLITUDE: 20.0,
  /** Reward decay time constant (min) */
  REWARD_DECAY_MIN: 45,
} as const;

// === GABA Satiety Response ===
export const GABA_FOOD = {
  /** Peak amplitude (% baseline) */
  AMPLITUDE: 25.0,
  /** Carb contribution weight to satiety */
  CARB_WEIGHT: 0.01,
  /** Soluble fiber contribution weight */
  FIBER_SOL_WEIGHT: 0.05,
  /** Satiety EC50 (unitless) */
  SATIETY_EC50: 0.5,
  /** Hill coefficient */
  HILL_N: 1.2,
  /** Onset time constant (min) */
  ONSET_TAU_MIN: 30,
} as const;

// === mTOR (Protein Anabolic Signaling) ===
export const MTOR = {
  /** Maximum fold-change amplitude */
  AMPLITUDE: 50.0,
  /** Grams of protein for half-max activation */
  PROTEIN_THRESHOLD_G: 30,
  /** Hill coefficient */
  HILL_N: 1.5,
  /** Onset delay (min) */
  ONSET_MIN: 30,
  /** Peak width at half-max (min) */
  PEAK_WIDTH_MIN: 180,
  /** Initial response delay (min) */
  RESPONSE_DELAY_MIN: 45,
} as const;

// === GLP-1 (Incretin Response) ===
export const GLP1 = {
  /** Grams of carbs for half-max stimulation */
  CARB_THRESHOLD_G: 40,
  /** Hill coefficient for carb effect */
  CARB_HILL_N: 1.3,
  /** Grams of protein for half-max stimulation */
  PROTEIN_THRESHOLD_G: 25,
  /** Hill coefficient for protein effect */
  PROTEIN_HILL_N: 1.2,
  /** Maximum fiber enhancement (fold-change) */
  FIBER_MAX_BOOST: 0.3,
  /** Grams of fiber for max boost */
  FIBER_SATURATION_G: 15,
  /** Carb contribution to total stimulus */
  CARB_WEIGHT: 0.6,
  /** Protein contribution to total stimulus */
  PROTEIN_WEIGHT: 0.4,
  /** Fast-phase onset (min) */
  FAST_PHASE_ONSET_MIN: 8,
  /** Fast-phase clearance (min) */
  FAST_PHASE_CLEARANCE_MIN: 35,
  /** Slow-phase onset (min) */
  SLOW_PHASE_ONSET_MIN: 25,
  /** Slow-phase clearance (min) */
  SLOW_PHASE_CLEARANCE_MIN: 120,
  /** Peak amplitude (pmol/L) */
  AMPLITUDE: 18.0,
  /** Fast phase contribution */
  FAST_WEIGHT: 0.5,
  /** Slow phase contribution */
  SLOW_WEIGHT: 0.5,
} as const;
