/**
 * Gastric Delay and Nutrient Appearance Constants
 *
 * These constants model the rate at which nutrients appear in blood
 * after ingestion, accounting for gastric emptying and intestinal absorption.
 */

// === Gastric Emptying Delay ===
export const GASTRIC_DELAY = {
  /** Baseline emptying time for liquid/simple meal (min) */
  BASE_MIN: 15,
  /** Additional delay per gram of fat (min/g) */
  FAT_SLOWING_PER_G: 0.9,
  /** Additional delay per gram of soluble fiber (min/g) */
  FIBER_SOL_SLOWING_PER_G: 2.0,
  /** Additional delay per gram of insoluble fiber (min/g) */
  FIBER_INSOL_SLOWING_PER_G: 0.5,
  /** Delay reduction per mL of water (speeds emptying) (min/mL) */
  HYDRATION_EFFECT_PER_ML: -0.01,
  /** Minimum physiological emptying delay (min) */
  MIN_DELAY_MIN: 5,
  /** Maximum physiological emptying delay (min) */
  MAX_DELAY_MIN: 150,
} as const;

// === Carbohydrate Appearance ===
export const CARB_APPEARANCE = {
  /** Default glycemic index when not specified */
  DEFAULT_GI: 60,
  /** Minimum GI factor (slowest starch absorption) */
  MIN_GI_FACTOR: 0.25,
  /** Maximum GI factor (fastest starch absorption - refined carbs) */
  MAX_GI_FACTOR: 1.0,
  /** Blunting effect per gram of soluble fiber */
  FIBER_SOL_BLUNTING_PER_G: 0.02,
  /** Blunting effect per gram of fat */
  FAT_BLUNTING_PER_G: 0.004,
  /** Minimum appearance rate despite fiber/fat (fraction) */
  MIN_BLUNTING_FACTOR: 0.6,
  /** Maximum appearance rate (no blunting) */
  MAX_BLUNTING_FACTOR: 1.0,
  /** Sugar appearance onset time constant (min) */
  SUGAR_ONSET_MIN: 6,
  /** Sugar appearance tail time constant (min) */
  SUGAR_TAIL_MIN: 60,
  /** Starch appearance onset base (scaled by 1/GI factor) (min) */
  STARCH_ONSET_BASE_MIN: 14,
  /** Starch appearance tail base (scaled by 1/GI factor) (min) */
  STARCH_TAIL_BASE_MIN: 110,
} as const;

// === Protein Appearance (Amino Acids) ===
export const PROTEIN_APPEARANCE = {
  /** Onset time constant for amino acid appearance (min) */
  ONSET_TAU_MIN: 25,
  /** Peak time for amino acid absorption (min) */
  PEAK_TIME_MIN: 90,
  /** Tail decay time constant (min) */
  TAIL_TAU_MIN: 180,
  /** Leucine-specific faster fraction for mTOR signaling */
  LEUCINE_FAST_FRACTION: 0.3,
  /** Fast leucine onset (min) */
  LEUCINE_ONSET_MIN: 15,
  /** Conversion from g protein to mmol amino acids (approx) */
  G_TO_MMOL: 8.0,
  /** Blunting from fat (slows protein digestion) */
  FAT_BLUNTING_PER_G: 0.003,
  /** Blunting from fiber */
  FIBER_BLUNTING_PER_G: 0.01,
} as const;

// === Fat Appearance (Lipids/Triglycerides) ===
export const FAT_APPEARANCE = {
  /** Onset time constant (fat is slow) (min) */
  ONSET_TAU_MIN: 45,
  /** Peak time for lipid absorption (min) */
  PEAK_TIME_MIN: 180,
  /** Tail decay time constant (very slow clearance) (min) */
  TAIL_TAU_MIN: 360,
  /** Chylomicron formation delay (min) */
  CHYLOMICRON_DELAY_MIN: 30,
  /** Fraction appearing via lymphatic (slow) vs portal (fast) */
  LYMPHATIC_FRACTION: 0.8,
  /** Portal (fast) onset time constant (min) */
  PORTAL_ONSET_MIN: 20,
  /** Conversion from g fat to plasma triglyceride increase (mg/dL per g) */
  G_TO_TG_MGDL: 5.0,
} as const;
