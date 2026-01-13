import { Minute } from '@/types/neurostate';

const MINUTES_IN_DAY = 24 * 60;
const TWO_PI = 2 * Math.PI;

/**
 * Convert minute to phase angle (0 to 2π for one day)
 */
export const minuteToPhase = (minute: number): number => {
  return (minute / MINUTES_IN_DAY) * TWO_PI;
};

/**
 * Convert hour-of-day to phase angle
 */
export const hourToPhase = (hour: number): number => {
  return (hour / 24) * TWO_PI;
};

/**
 * Convert duration in minutes to phase width
 */
export const minutesToPhaseWidth = (mins: number): number => {
  return (mins / MINUTES_IN_DAY) * TWO_PI;
};

/**
 * Convert width in minutes to von Mises concentration parameter
 */
export const widthToConcentration = (widthMinutes: number): number => {
  const widthPhase = minutesToPhaseWidth(widthMinutes);
  return 2 / (widthPhase * widthPhase);
};

/**
 * Von Mises-like gaussian on circular domain
 */
export const gaussianPhase = (phase: number, centerPhase: number, concentration: number): number => {
  const diff = phase - centerPhase;
  return Math.exp(concentration * (Math.cos(diff) - 1));
};

/**
 * Smooth window function using cosine blend
 */
export const windowPhase = (
  phase: number,
  startPhase: number,
  endPhase: number,
  transitionWidth: number = minutesToPhaseWidth(30)
): number => {
  let p = phase % TWO_PI;
  if (p < 0) p += TWO_PI;

  let s = startPhase % TWO_PI;
  if (s < 0) s += TWO_PI;
  let e = endPhase % TWO_PI;
  if (e < 0) e += TWO_PI;

  const wraps = e < s;
  const inWindow = wraps ? (p >= s || p <= e) : (p >= s && p <= e);

  if (!inWindow) return 0;

  let distToStart: number;
  if (wraps && p < s) {
    distToStart = p + (TWO_PI - s);
  } else {
    distToStart = p - s;
  }

  let distToEnd: number;
  if (wraps && p > e) {
    distToEnd = (TWO_PI - p) + e;
  } else {
    distToEnd = e - p;
  }

  const fadeIn = distToStart < transitionWidth
    ? 0.5 * (1 - Math.cos(Math.PI * distToStart / transitionWidth))
    : 1;
  const fadeOut = distToEnd < transitionWidth
    ? 0.5 * (1 - Math.cos(Math.PI * distToEnd / transitionWidth))
    : 1;

  return fadeIn * fadeOut;
};

/**
 * Smooth sigmoid-like transition using cosine
 */
export const sigmoidPhase = (
  phase: number,
  transitionPhase: number,
  transitionWidth: number = minutesToPhaseWidth(45)
): number => {
  let diff = phase - transitionPhase;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff < -Math.PI) diff += TWO_PI;

  if (diff < -transitionWidth / 2) return 0;
  if (diff > transitionWidth / 2) return 1;

  return 0.5 * (1 + Math.sin(Math.PI * diff / transitionWidth));
};

/**
 * Hill function for saturable dynamics
 */
export const hill = (x: number, ec50: number, n: number = 2): number => {
  if (x <= 0) return 0;
  if (x > ec50 * 100) return 1.0; // Prevent overflow
  const xn = Math.pow(x, n);
  const kn = Math.pow(ec50, n);
  return xn / (kn + xn);
};

export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};

/**
 * Converts an analytical offset to an ODE rate contribution.
 * r = offset / tau
 */
export function offsetToRate(offset: number, tau: number): number {
  return offset / Math.max(0.1, tau);
}

/**
 * Receptor adaptation dR/dt = k_rec * (R0 - R) - k_down * Activity * R
 */
export function receptorAdaptation(
  R: number,
  occupancy: number,
  k_up: number = 0.001,
  k_down: number = 0.005,
  R0: number = 1.0
): number {
  const synthesis = k_up * (R0 - R);
  const downregulation = k_down * occupancy * R;
  return synthesis - downregulation;
}

