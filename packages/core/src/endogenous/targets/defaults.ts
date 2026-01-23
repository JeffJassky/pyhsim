/**
 * Standard Human Biological Defaults
 *
 * These values represent the average "baseline" hardware kinetics
 * for receptors, transporters, and other biological machinery.
 */

export const RECEPTOR_ADAPTATION_DEFAULTS = {
  /** Upregulation rate constant (per minute) - slow process */
  K_UP: 0.001,
  /** Downregulation rate constant (per minute) */
  K_DOWN: 0.002,
  
  /** Occupancy threshold for adaptation (fraction) */
  OCCUPANCY_THRESHOLD: 0.3,
  
  /** Baseline receptor density (normalized to 1) */
  BASELINE_DENSITY: 1.0,
  /** Minimum receptor density (fraction of baseline) */
  MIN_DENSITY: 0.3,
  /** Maximum receptor density (fraction of baseline) */
  MAX_DENSITY: 2.0,
} as const;

export const TRANSPORTER_ADAPTATION_DEFAULTS = {
  K_UP: 0.001,
  K_DOWN: 0.002,
} as const;
