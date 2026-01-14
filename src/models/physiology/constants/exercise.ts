/**
 * Exercise Physiology Constants
 *
 * These constants define the physiological responses to exercise,
 * including sympathetic activation, endorphin release, and metabolic effects.
 */

// === General Exercise Kinetics ===
export const EXERCISE_KINETICS = {
  /** Default exercise duration (min) */
  DEFAULT_DURATION_MIN: 45,
  /** Default intensity (fraction of VO2max) */
  DEFAULT_INTENSITY: 0.7,
  /** Activation rate constant (1/min) */
  K_ON: 1 / 8,
  /** Deactivation rate constant (1/min) */
  K_OFF: 1 / 20,
} as const;

// === Dopamine Response ===
export const EXERCISE_DOPAMINE = {
  /** Sympathetic-driven DA amplitude */
  SYMPATHETIC_AMPLITUDE: 20.0,
  /** Sympathetic onset time constant (min) */
  SYMPATHETIC_ONSET_MIN: 10,
  /** Endorphin-mediated DA amplitude (cardio) */
  ENDORPHIN_AMPLITUDE_CARDIO: 15.0,
  /** Endorphin-mediated DA amplitude (resistance) */
  ENDORPHIN_AMPLITUDE_RESISTANCE: 8.0,
  /** Endorphin onset time constant (min) */
  ENDORPHIN_ONSET_MIN: 25,
  /** Completion bonus amplitude */
  COMPLETION_BONUS: 10.0,
  /** Completion bonus decay time constant (min) */
  COMPLETION_DECAY_MIN: 30,
  /** Post-exercise afterglow retention (fraction) */
  AFTERGLOW_FRACTION: 0.4,
  /** Afterglow decay time constant (min) */
  AFTERGLOW_DECAY_MIN: 120,
} as const;

// === Norepinephrine Response ===
export const EXERCISE_NOREPI = {
  /** Peak amplitude (% baseline) */
  AMPLITUDE: 45.0,
  /** Activation rate constant (1/min) */
  K_ON: 1 / 8,
  /** Deactivation rate constant (1/min) */
  K_OFF: 1 / 20,
} as const;

// === Adrenaline Response ===
export const EXERCISE_ADRENALINE = {
  /** Peak amplitude (pg/mL) */
  AMPLITUDE: 200.0,
  /** Intensity threshold for activation (fraction VO2max) */
  INTENSITY_THRESHOLD: 0.5,
  /** Base release rate constant (1/min) */
  K_RELEASE_BASE: 1 / 6,
  /** Clearance rate constant (1/min) */
  K_CLEARANCE: 1 / 15,
  /** HIIT multiplier */
  HIIT_MULTIPLIER: 1.8,
  /** Resistance multiplier */
  RESISTANCE_MULTIPLIER: 1.3,
} as const;

// === Cortisol / HPA Response ===
export const EXERCISE_CORTISOL = {
  /** Peak amplitude (µg/dL) */
  AMPLITUDE: 10.0,
  /** Intensity threshold for HPA activation */
  INTENSITY_THRESHOLD: 0.65,
  /** Duration threshold for HPA activation (min) */
  DURATION_THRESHOLD_MIN: 45,
  /** ACTH-to-adrenal delay (min) */
  ACTH_DELAY_MIN: 15,
  /** Response onset time constant (min) */
  RESPONSE_ONSET_MIN: 30,
  /** Post-exercise recovery time constant (min) */
  RECOVERY_TAU_MIN: 90,
} as const;

// === BDNF Response ===
export const EXERCISE_BDNF = {
  /** Peak amplitude (% baseline) */
  AMPLITUDE: 25.0,
  /** Expression delay (gene transcription) (min) */
  EXPRESSION_DELAY_MIN: 30,
  /** Lactate proxy onset time constant (min) */
  LACTATE_PROXY_ONSET_MIN: 15,
  /** Rise phase time constant (min) */
  K_RISE_TAU_MIN: 45,
  /** Decay half-life (min) - BDNF persists for hours */
  DECAY_HALFLIFE_MIN: 480,
  /** Cardio multiplier (aerobic exercise boosts BDNF more) */
  CARDIO_MULTIPLIER: 1.4,
} as const;

// === Growth Hormone Response ===
export const EXERCISE_GH = {
  /** Peak amplitude (µg/L) */
  AMPLITUDE: 8.0,
  /** Intensity threshold */
  INTENSITY_THRESHOLD: 0.5,
  /** Response onset time constant (min) */
  RESPONSE_ONSET_MIN: 20,
  /** Post-exercise decay time constant (min) */
  DECAY_TAU_MIN: 60,
  /** Resistance training multiplier */
  RESISTANCE_MULTIPLIER: 1.8,
  /** HIIT multiplier */
  HIIT_MULTIPLIER: 1.5,
} as const;

// === Endocannabinoid Response (Runner's High) ===
export const EXERCISE_ENDOCANNABINOID = {
  /** Peak amplitude (% baseline) */
  AMPLITUDE: 35.0,
  /** Optimal intensity for inverted-U response */
  OPTIMAL_INTENSITY: 0.7,
  /** Width of intensity response curve (sigma) */
  INTENSITY_SIGMA: 0.2,
  /** Minimum duration for effect (min) */
  DURATION_THRESHOLD_MIN: 20,
  /** Duration effect onset time constant (min) */
  DURATION_EFFECT_ONSET_MIN: 30,
  /** Post-exercise clearance time constant (min) */
  CLEARANCE_TAU_MIN: 180,
  /** Cardio multiplier */
  CARDIO_MULTIPLIER: 1.5,
} as const;

// === Serotonin Response ===
export const EXERCISE_SEROTONIN = {
  /** Peak amplitude (% baseline) */
  AMPLITUDE: 18.0,
  /** Onset time constant (min) */
  ONSET_TAU_MIN: 25,
  /** Post-exercise sustained fraction */
  SUSTAINED_FRACTION: 0.6,
  /** Post-exercise decay time constant (min) */
  DECAY_TAU_MIN: 240,
  /** Cardio multiplier */
  CARDIO_MULTIPLIER: 1.3,
} as const;

// === Glucose Response ===
export const EXERCISE_GLUCOSE = {
  /** Early catecholamine-driven rise (mg/dL) */
  EARLY_RISE_AMPLITUDE: 5.0,
  /** Early rise onset (min) */
  EARLY_RISE_ONSET_MIN: 10,
  /** Early rise decay (min) */
  EARLY_RISE_DECAY_MIN: 30,
  /** Active phase uptake amplitude (mg/dL) - negative */
  UPTAKE_AMPLITUDE: -15.0,
  /** Uptake onset time constant (min) */
  UPTAKE_ONSET_MIN: 40,
  /** Post-exercise insulin sensitivity effect (mg/dL) */
  POST_SENSITIVITY_AMPLITUDE: -10.0,
  /** Post-exercise effect decay (min) */
  POST_SENSITIVITY_DECAY_MIN: 240,
} as const;
