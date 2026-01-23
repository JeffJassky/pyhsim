import { gaussian } from "../engine";
import type { Minute } from "../engine";
import type { MenstrualHormones } from "./types";

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
export const gaussianPhase = (
  phase: number,
  centerPhase: number,
  concentration: number,
): number => {
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
  transitionWidth: number = minutesToPhaseWidth(30),
): number => {
  let p = phase % TWO_PI;
  if (p < 0) p += TWO_PI;

  let s = startPhase % TWO_PI;
  if (s < 0) s += TWO_PI;
  let e = endPhase % TWO_PI;
  if (e < 0) e += TWO_PI;

  const wraps = e < s;
  const inWindow = wraps ? p >= s || p <= e : p >= s && p <= e;

  if (!inWindow) return 0;

  let distToStart: number;
  if (wraps && p < s) {
    distToStart = p + (TWO_PI - s);
  } else {
    distToStart = p - s;
  }

  let distToEnd: number;
  if (wraps && p > e) {
    distToEnd = TWO_PI - p + e;
  } else {
    distToEnd = e - p;
  }

  const fadeIn =
    distToStart < transitionWidth
      ? 0.5 * (1 - Math.cos((Math.PI * distToStart) / transitionWidth))
      : 1;
  const fadeOut =
    distToEnd < transitionWidth
      ? 0.5 * (1 - Math.cos((Math.PI * distToEnd) / transitionWidth))
      : 1;

  return fadeIn * fadeOut;
};

/**
 * Smooth sigmoid-like transition using cosine
 */
export const sigmoidPhase = (
  phase: number,
  transitionPhase: number,
  transitionWidth: number = minutesToPhaseWidth(45),
): number => {
  let diff = phase - transitionPhase;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff < -Math.PI) diff += TWO_PI;

  if (diff < -transitionWidth / 2) return 0;
  if (diff > transitionWidth / 2) return 1;

  return 0.5 * (1 + Math.sin((Math.PI * diff) / transitionWidth));
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

import { RECEPTOR_ADAPTATION_DEFAULTS } from "./targets/defaults";

/**
 * Receptor adaptation dR/dt = k_rec * (R0 - R) - k_down * Activity * R
 */
export function receptorAdaptation(
  R: number,
  occupancy: number,
  k_up: number = RECEPTOR_ADAPTATION_DEFAULTS.K_UP,
  k_down: number = RECEPTOR_ADAPTATION_DEFAULTS.K_DOWN,
  R0: number = RECEPTOR_ADAPTATION_DEFAULTS.BASELINE_DENSITY,
): number {
  const synthesis = k_up * (R0 - R);
  const downregulation = k_down * occupancy * R;
  return synthesis - downregulation;
}

// --- Added Kinetics Helpers for Tests ---

export const exp = Math.exp;

/**
 * Calculates elimination rate constant (k_e) from half-life.
 */
export function halfLife(t_half: number): number {
  return Math.LN2 / Math.max(1e-9, t_half);
}

/**
 * Generic 1st-order PK
 */
export function pk1(t: number, k_a: number, k_e: number, tlag = 0) {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  if (Math.abs(k_a - k_e) < 1e-6) {
    const k = k_e;
    return k * tau * Math.exp(-k * tau) * Math.E;
  }
  const t_max = Math.log(k_a / k_e) / (k_a - k_e);
  const peak =
    (k_a / (k_a - k_e)) * (Math.exp(-k_e * t_max) - Math.exp(-k_a * t_max));
  const norm = 1 / Math.max(1e-9, peak);
  return Math.max(
    0,
    (k_a / (k_a - k_e)) * (Math.exp(-k_e * tau) - Math.exp(-k_a * tau)) * norm,
  );
}

export function pk_conc(
  t: number,
  k_a: number,
  k_e: number,
  Vd: number,
  weight: number,
  dose: number,
  tlag = 0,
  F = 1.0,
) {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  const den = k_a - k_e;
  if (Math.abs(den) < 1e-9) return 0;
  const scaler = (F * dose * k_a) / (Vd * weight * den);
  return Math.max(0, scaler * (exp(-k_e * tau) - exp(-k_a * tau)));
}

export function pk2(
  t: number,
  k_a: number,
  k_10: number,
  k_12: number,
  k_21: number,
  tlag: number = 0,
): number {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  const sum = k_10 + k_12 + k_21;
  const product = k_10 * k_21;
  const discriminant = sum * sum - 4 * product;
  if (discriminant < 0) return pk1(t, k_a, k_10, tlag);
  const sqrtD = Math.sqrt(discriminant);
  const alpha = (sum + sqrtD) / 2;
  const beta = (sum - sqrtD) / 2;
  const A = (k_a * k_21 - k_a * alpha) / ((k_a - alpha) * (beta - alpha));
  const B = (k_a * k_21 - k_a * beta) / ((k_a - beta) * (alpha - beta));
  const curve =
    A * Math.exp(-alpha * tau) +
    B * Math.exp(-beta * tau) -
    (A + B) * Math.exp(-k_a * tau);
  const tPeakApprox = Math.log(k_a / beta) / (k_a - beta);
  const peakApprox =
    A * Math.exp(-alpha * tPeakApprox) +
    B * Math.exp(-beta * tPeakApprox) -
    (A + B) * Math.exp(-k_a * tPeakApprox);
  return Math.max(0, Math.min(1, curve / Math.max(1e-9, Math.abs(peakApprox))));
}

export function receptorOccupancy(concentration: number, Kd: number): number {
  const L = Math.max(0, concentration);
  const kd = Math.max(1e-9, Kd);
  return L / (L + kd);
}

export function operationalAgonism(
  concentration: number,
  Kd: number,
  tau: number,
  Emax: number = 1.0,
): number {
  const L = Math.max(0, concentration);
  const kd = Math.max(1e-9, Kd);
  const t = Math.max(0, tau);
  return (Emax * t * L) / Math.max(1e-9, (t + 1) * L + kd);
}

export function competitiveAntagonism(
  agonistConc: number,
  agonistKd: number,
  antagonistConc: number,
  antagonistKi: number,
): number {
  const apparentKd =
    agonistKd * (1 + antagonistConc / Math.max(1e-9, antagonistKi));
  return receptorOccupancy(agonistConc, apparentKd);
}

export function nonCompetitiveAntagonism(
  antagonistConc: number,
  Ki: number,
  baseEmax: number = 1.0,
): number {
  return baseEmax / (1 + antagonistConc / Math.max(1e-9, Ki));
}

export function gammaPulse(
  t: number,
  k_rise: number,
  k_fall: number,
  tlag = 0,
) {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  return (1 - exp(-tau / k_rise)) * exp(-tau / k_fall);
}

export function michaelisMentenPK(
  t: number,
  Vmax: number,
  Km: number,
  C0: number,
  absorptionHalfLife: number = 15,
  tlag: number = 10,
): number {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  const k_a = Math.LN2 / Math.max(1, absorptionHalfLife);
  const dt = 1;
  let C = 0;
  for (let step = 0; step < tau; step += dt) {
    const absorbedNow = C0 * (1 - exp(-k_a * step));
    const absorbedPrev = step > 0 ? C0 * (1 - exp(-k_a * (step - dt))) : 0;
    const dAbsorbed = absorbedNow - absorbedPrev;
    const elimination = (Vmax * C) / (Km + C + 1e-9);
    C = Math.max(0, C + dAbsorbed - elimination * dt);
  }
  return C;
}

export function alcoholBAC(
  t: number,
  gramsEthanol: number,
  weightKg: number = 70,
  sex: "male" | "female" = "male",
  metabolicRate: number = 1.0,
): number {
  const r = sex === "male" ? 0.68 : 0.55;
  const Vd = weightKg * r;
  const C0 = (gramsEthanol / Vd) * 100;
  const Vmax = 0.2 * metabolicRate;
  const Km = 10;
  return michaelisMentenPK(t, Vmax, Km, C0, 15, 10);
}

/**

 * Estimated gastric emptying delay (tlag, minutes) from fat & fiber with small hydration effect.

 */

export function gastricDelay(p: any): number {
  const base = 15; // min

  const fat = 0.9 * (p.fat || 0);

  const fSol = 2.0 * (p.fiberSol || 0);

  const fInsol = 0.5 * (p.fiberInsol || 0);

  const hydr = -0.01 * (p.hydration || 0);

  return Math.max(5, Math.min(150, base + fat + fSol + fInsol + hydr));
}

/**

 * Carbohydrate appearance split: rapid sugars vs starch (GI-weighted),

 * both blunted by fat & soluble fiber.

 */

export function carbAppearance(t: number, p: any): number {
  const tlag = gastricDelay(p);

  const giFac = Math.max(0.25, Math.min(1.0, (p.gi ?? 60) / 100));

  const blunt = Math.max(
    0.6,
    Math.min(1.0, 1 - 0.02 * (p.fiberSol || 0) - 0.004 * (p.fat || 0)),
  );

  const weight = p.weight || 70;

  const volDl = 0.2 * weight * 10;

  const scaler = (1000 / volDl) * 2.5;

  const sugar = gammaPulse(t, 6, 60, tlag) * (p.carbSugar || 0);

  const starch =
    gammaPulse(t, 14 / giFac, 110 / giFac, tlag) * (p.carbStarch || 0);

  return blunt * scaler * (sugar + starch);
}

/**



   * Calculates hormone levels for a specific day in the cycle.



   */

export function getMenstrualHormones(
  day: number,
  length: number = 28,
): MenstrualHormones {
  const phase = day / length;

  const d = phase * 28;

  const estFollicular = gaussian(d, 12.5, 3);

  const estLuteal = 0.5 * gaussian(d, 21, 5);

  const estrogen = 0.1 + 0.8 * estFollicular + 0.4 * estLuteal;

  const progLuteal = gaussian(d, 22, 6);

  const progesterone = 0.05 + 0.9 * progLuteal;

  const lhSpike = gaussian(d, 13.5, 1.2);

  const lh = 0.1 + 0.9 * lhSpike;

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
