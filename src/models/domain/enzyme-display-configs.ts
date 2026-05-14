/**
 * Per-enzyme display config for the UI factor breakdown — mirrors core's
 * _builder.ts configs at summary level so we can decompose Dynamic factors
 * into Diurnal / Inflammation / Hepatic-injury / Induction / MBI rows.
 *
 * Authoritative values live in core (signals/enzymes/*.ts). This file is the
 * UI-side replica used only for educational decomposition; the Result row of
 * the breakdown is always the engine's live aux value.
 */

import type { DrugMetabolizingEnzymeKey } from '@kyneticbio/core';

export interface InflammationProfile {
  threshold1: number;
  threshold2: number;
  slope1: number;
  slope2: number;
  floor: number;
}

export interface EnzymeDisplayConfig {
  diurnalAmplitude: number;
  diurnalPeakHour: number;
  inflammation: InflammationProfile;
  tau: number;
}

export const ENZYME_DISPLAY_CONFIGS: Record<DrugMetabolizingEnzymeKey, EnzymeDisplayConfig> = {
  CYP3A4: {
    diurnalAmplitude: 0.15,
    diurnalPeakHour: 6,
    inflammation: { threshold1: 1.0, threshold2: 3.0, slope1: 0.05, slope2: 0.04, floor: 0.4 },
    tau: 4320,
  },
  CYP3A5: {
    diurnalAmplitude: 0.1,
    diurnalPeakHour: 6,
    inflammation: { threshold1: 1.0, threshold2: 3.0, slope1: 0.04, slope2: 0.03, floor: 0.4 },
    tau: 4320,
  },
  CYP1A2: {
    diurnalAmplitude: 0.1,
    diurnalPeakHour: 12,
    inflammation: { threshold1: 1.0, threshold2: 3.0, slope1: 0.03, slope2: 0.02, floor: 0.5 },
    tau: 4320,
  },
  CYP2B6: {
    diurnalAmplitude: 0.08,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 1.0, threshold2: 3.0, slope1: 0.03, slope2: 0.02, floor: 0.5 },
    tau: 4320,
  },
  CYP2C9: {
    diurnalAmplitude: 0.05,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 1.0, threshold2: 5.0, slope1: 0.02, slope2: 0.01, floor: 0.7 },
    tau: 4320,
  },
  CYP2C19: {
    diurnalAmplitude: 0.06,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 1.0, threshold2: 3.0, slope1: 0.04, slope2: 0.03, floor: 0.5 },
    tau: 4320,
  },
  CYP2D6: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 1.0, threshold2: 5.0, slope1: 0.015, slope2: 0.005, floor: 0.75 },
    tau: 4320,
  },
  CYP2E1: {
    diurnalAmplitude: 0.05,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 3.0, threshold2: 10.0, slope1: 0.015, slope2: 0.01, floor: 0.7 },
    tau: 2880,
  },
  CES1: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 3.0, threshold2: 10.0, slope1: 0.01, slope2: 0.005, floor: 0.85 },
    tau: 4320,
  },
  UGT1A1: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 5.0, threshold2: 15.0, slope1: 0.01, slope2: 0.005, floor: 0.8 },
    tau: 4320,
  },
  UGT2B7: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 5.0, threshold2: 15.0, slope1: 0.01, slope2: 0.005, floor: 0.8 },
    tau: 4320,
  },
  TPMT: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 10, threshold2: 20, slope1: 0.005, slope2: 0.002, floor: 0.9 },
    tau: 10080,
  },
  DPYD: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 5, threshold2: 15, slope1: 0.01, slope2: 0.005, floor: 0.8 },
    tau: 720,
  },
  NAT2: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 5, threshold2: 15, slope1: 0.01, slope2: 0.005, floor: 0.85 },
    tau: 2880,
  },
  COMT: {
    diurnalAmplitude: 0,
    diurnalPeakHour: 8,
    inflammation: { threshold1: 5, threshold2: 15, slope1: 0.01, slope2: 0.005, floor: 0.85 },
    tau: 4320,
  },
};

/** Diurnal multiplier: 1 + (amplitude/2) * cos((min/1440)·2π − (peakHour/24)·2π). */
export function computeDiurnalFactor(
  enzyme: DrugMetabolizingEnzymeKey,
  minuteOfDay: number,
): number {
  const cfg = ENZYME_DISPLAY_CONFIGS[enzyme];
  if (cfg.diurnalAmplitude === 0) return 1.0;
  const TWO_PI = 2 * Math.PI;
  const phase = (minuteOfDay / 1440) * TWO_PI;
  const peakPhase = (cfg.diurnalPeakHour / 24) * TWO_PI;
  return 1.0 + (cfg.diurnalAmplitude / 2) * Math.cos(phase - peakPhase);
}

/** Piecewise inflammation suppression as in core/_builder.ts. */
export function computeInflammationFactor(
  enzyme: DrugMetabolizingEnzymeKey,
  hsCRP: number,
): number {
  const p = ENZYME_DISPLAY_CONFIGS[enzyme].inflammation;
  if (hsCRP <= p.threshold1) return 1.0;
  if (hsCRP <= p.threshold2) {
    return 1.0 - (hsCRP - p.threshold1) * p.slope1;
  }
  const midpoint = 1.0 - (p.threshold2 - p.threshold1) * p.slope1;
  return Math.max(p.floor, midpoint - (hsCRP - p.threshold2) * p.slope2);
}

/**
 * Non-specific hepatic injury factor — replicates the engine's
 * hepaticInjuryFactor (ALT and bilirubin).
 */
export function computeHepaticInjuryFactor(alt: number, bilirubin: number): number {
  let factor = 1.0;
  if (alt > 40) {
    factor *= Math.max(0.3, 1.0 - (alt - 40) / 230);
  }
  if (bilirubin > 2) {
    factor *= Math.max(0.7, 1.0 - (bilirubin - 2) * 0.06);
  }
  return factor;
}

export function enzymeTau(enzyme: DrugMetabolizingEnzymeKey): number {
  return ENZYME_DISPLAY_CONFIGS[enzyme].tau;
}
