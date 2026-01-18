/**
 * Pharmacokinetics & Pharmacodynamics Library
 *
 * Provides standardized mathematical models for drug absorption, elimination,
 * and receptor-effector coupling.
 */

// --- Basic Math Helpers ---

export const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));

export const exp = Math.exp;

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

// --- Pharmacokinetics (PK) ---

/**
 * Calculates elimination rate constant (k_e) from half-life.
 * @param t_half Half-life in minutes
 */
export function halfLife(t_half: number): number {
  return Math.LN2 / Math.max(1e-9, t_half);
}

/**
 * Generic 1st-order PK “tablet” model (one-compartment, first-order absorption/elimination),
 * returned as a concentration-like effect scaler in [0..1].
 * k_a: absorption rate (1/min), k_e: elimination rate (1/min), tlag: absorption lag (min)
 * Area is normalized so that max steady peak ~ 1 for typical k_a/k_e combos.
 */
export function pk1(t: number, k_a: number, k_e: number, tlag = 0) {
  if (t <= tlag) return 0;
  const tau = t - tlag;

  // Handle k_a ~= k_e (te^-kt case)
  if (Math.abs(k_a - k_e) < 1e-6) {
    const k = k_e;
    const val = k * tau * Math.exp(-k * tau);
    return val * Math.E;
  }

  const t_max = Math.log(k_a / k_e) / (k_a - k_e);
  const peak =
    (k_a / (k_a - k_e)) * (Math.exp(-k_e * t_max) - Math.exp(-k_a * t_max));
  const norm = 1 / Math.max(1e-9, peak);

  const val =
    (k_a / (k_a - k_e)) * (Math.exp(-k_e * tau) - Math.exp(-k_a * tau));
  return Math.max(0, val * norm);
}

/**
 * PHYSICALLY ACCURATE Pharmacokinetic Model (One-Compartment).
 * Returns Concentration in [Mass_Unit / Volume_Unit].
 *
 * @param t Time in minutes
 * @param k_a Absorption rate (1/min)
 * @param k_e Elimination rate (1/min) = CL / Vd
 * @param Vd Volume of Distribution (L/kg or L) - If passed as L, ensure weight is 1.
 * @param weight Body weight (kg) - Used if Vd is L/kg
 * @param dose Dose in mg (or other mass unit)
 * @param tlag Lag time (min)
 * @param F Bioavailability (0..1), default 1.0
 */
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
  // Batavia-Equation for 1-compartment extravascular dosing:
  // C(t) = (F * Dose * k_a) / (Vd * weight * (k_a - k_e)) * (e^-ket - e^-kat)

  // Safety: Avoid divide by zero if k_a == k_e
  const den = k_a - k_e;
  if (Math.abs(den) < 1e-9) return 0; // simplistic fallback

  // Note: if Vd is absolute (L), weight should be 1.0.
  // If Vd is specific (L/kg), weight is needed.
  // We assume here the caller handles the unit consistency or passes weight=1 if Vd is total.

  const scaler = (F * dose * k_a) / (Vd * weight * den);
  const curve = exp(-k_e * tau) - exp(-k_a * tau);

  return Math.max(0, scaler * curve);
}

/**
 * Two-compartment PK model with first-order absorption.
 *
 * Models drugs with tissue distribution (central + peripheral compartments).
 * Uses analytical biexponential solution.
 *
 * @param t Time in minutes
 * @param k_a Absorption rate constant (1/min)
 * @param k_10 Elimination rate from central compartment (1/min)
 * @param k_12 Central → peripheral transfer rate (1/min)
 * @param k_21 Peripheral → central transfer rate (1/min)
 * @param tlag Absorption lag time (min)
 * @returns Normalized concentration-like effect scaler [0..1]
 */
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

  // Two-compartment model eigenvalues (distribution and elimination phases)
  // λ² - (k_10 + k_12 + k_21)λ + k_10·k_21 = 0
  const sum = k_10 + k_12 + k_21;
  const product = k_10 * k_21;
  const discriminant = sum * sum - 4 * product;

  if (discriminant < 0) {
    // Fallback to 1-compartment if eigenvalues are complex
    return pk1(t, k_a, k_10, tlag);
  }

  const sqrtD = Math.sqrt(discriminant);
  const alpha = (sum + sqrtD) / 2; // Fast (distribution) phase
  const beta = (sum - sqrtD) / 2; // Slow (elimination) phase

  // Coefficients for biexponential curve
  // C(t) = A·e^(-αt) + B·e^(-βt) - (A+B)·e^(-k_a·t)
  const A = (k_a * k_21 - k_a * alpha) / ((k_a - alpha) * (beta - alpha));
  const B = (k_a * k_21 - k_a * beta) / ((k_a - beta) * (alpha - beta));

  // Compute concentration curve
  const termA = A * Math.exp(-alpha * tau);
  const termB = B * Math.exp(-beta * tau);
  const termAbs = (A + B) * Math.exp(-k_a * tau);

  const curve = termA + termB - termAbs;

  // Normalize to [0..1] by finding approximate peak
  // For normalization, use a simple heuristic based on the slower phase
  const tPeakApprox = Math.log(k_a / beta) / (k_a - beta);
  const peakApprox =
    A * Math.exp(-alpha * tPeakApprox) +
    B * Math.exp(-beta * tPeakApprox) -
    (A + B) * Math.exp(-k_a * tPeakApprox);

  const normalized = curve / Math.max(1e-9, Math.abs(peakApprox));
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Two-compartment PK model returning actual concentration.
 *
 * @param t Time in minutes
 * @param k_a Absorption rate constant (1/min)
 * @param k_10 Elimination rate from central (1/min) = CL / V_central
 * @param k_12 Central → peripheral rate (1/min)
 * @param k_21 Peripheral → central rate (1/min)
 * @param V_central Central compartment volume (L)
 * @param dose Dose in mg
 * @param F Bioavailability (0..1)
 * @param tlag Absorption lag time (min)
 * @returns Concentration in central compartment (mass/volume units)
 */
export function pk2_conc(
  t: number,
  k_a: number,
  k_10: number,
  k_12: number,
  k_21: number,
  V_central: number,
  dose: number,
  F: number = 1.0,
  tlag: number = 0,
): number {
  if (t <= tlag) return 0;
  const tau = t - tlag;

  // Eigenvalues
  const sum = k_10 + k_12 + k_21;
  const product = k_10 * k_21;
  const discriminant = sum * sum - 4 * product;

  if (discriminant < 0) {
    // Fallback
    return pk_conc(t, k_a, k_10, V_central, 1, dose, tlag, F);
  }

  const sqrtD = Math.sqrt(discriminant);
  const alpha = (sum + sqrtD) / 2;
  const beta = (sum - sqrtD) / 2;

  // Coefficients for the dose
  const denom_alpha = (k_a - alpha) * (beta - alpha);
  const denom_beta = (k_a - beta) * (alpha - beta);

  const A = (F * dose * k_a * (k_21 - alpha)) / (V_central * denom_alpha);
  const B = (F * dose * k_a * (k_21 - beta)) / (V_central * denom_beta);
  const C_abs = ((A + B) * (V_central * denom_alpha)) / (F * dose * k_a);

  // Concentration
  const conc =
    A * Math.exp(-alpha * tau) +
    B * Math.exp(-beta * tau) -
    (A + B) * Math.exp(-k_a * tau);

  return Math.max(0, conc);
}

/**
 * Dual-absorption helper: convex mix of two pk1 pulses (e.g., XR products).
 */
export function pk_dual(
  t: number,
  a1: number,
  a2: number,
  e: number,
  lag1 = 0,
  lag2 = 0,
  w = 0.6,
) {
  return clamp(w * pk1(t, a1, e, lag1) + (1 - w) * pk1(t, a2, e, lag2), 0, 1);
}

// --- Pharmacodynamics (PD) ---

/**
 * Hill equation for saturating effects: H = x^n / (x50^n + x^n)
 * Returns fractional effect 0..1
 */
export function hill(x: number, x50: number, n = 1.4) {
  const xn = Math.pow(Math.max(0, x), n);
  const d = Math.pow(Math.max(1e-6, x50), n) + xn;
  return xn / d;
}

// --- Receptor Pharmacology ---

/**
 * Receptor Occupancy: ρ = [L] / ([L] + Kd)
 *
 * @param concentration Ligand concentration (nM)
 * @param Kd Dissociation constant (nM) - lower = higher affinity
 * @returns Fractional occupancy 0..1
 */
export function receptorOccupancy(concentration: number, Kd: number): number {
  const L = Math.max(0, concentration);
  const kd = Math.max(1e-9, Kd);
  return L / (L + kd);
}

/**
 * Operational Model of Agonism (Black & Leff, 1983)
 *
 * E = (Emax * τ * [L]) / ((τ + 1) * [L] + Kd)
 *
 * This model captures:
 * - Full agonists (high τ): approach Emax
 * - Partial agonists (low τ): plateau below Emax
 * - Spare receptors: effect at low occupancy
 *
 * @param concentration Ligand concentration (nM)
 * @param Kd Dissociation constant (nM)
 * @param tau Efficacy parameter (dimensionless) - higher = more efficacious
 * @param Emax Maximum system response
 * @returns Effect magnitude
 */
export function operationalAgonism(
  concentration: number,
  Kd: number,
  tau: number,
  Emax: number = 1.0,
): number {
  const L = Math.max(0, concentration);
  const kd = Math.max(1e-9, Kd);
  const t = Math.max(0, tau);

  const numerator = Emax * t * L;
  const denominator = (t + 1) * L + kd;

  return numerator / Math.max(1e-9, denominator);
}

/**
 * Competitive Antagonism
 *
 * Shifts the agonist dose-response curve rightward.
 * Apparent Kd' = Kd * (1 + [Antagonist] / Ki)
 *
 * @param agonistConc Agonist concentration (nM)
 * @param agonistKd Agonist Kd (nM)
 * @param antagonistConc Antagonist concentration (nM)
 * @param antagonistKi Antagonist Ki (nM)
 * @returns Adjusted occupancy accounting for competition
 */
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

/**
 * Non-competitive / Allosteric Antagonism
 *
 * Reduces Emax rather than shifting EC50.
 * Apparent Emax' = Emax / (1 + [Antagonist] / Ki)
 *
 * @param antagonistConc Antagonist concentration (nM)
 * @param Ki Antagonist binding constant (nM)
 * @param baseEmax Original maximum effect
 * @returns Reduced Emax
 */
export function nonCompetitiveAntagonism(
  antagonistConc: number,
  Ki: number,
  baseEmax: number = 1.0,
): number {
  return baseEmax / (1 + antagonistConc / Math.max(1e-9, Ki));
}

/**
 * Positive Allosteric Modulator (PAM) Effect
 *
 * Increases agonist affinity and/or efficacy.
 *
 * @param agonistConc Agonist concentration
 * @param agonistKd Agonist Kd
 * @param pamConc PAM concentration (nM)
 * @param pamEC50 PAM EC50 (nM)
 * @param alphaFactor Cooperativity factor (>1 = positive)
 * @returns Modified occupancy
 */
export function positiveAllostericModulation(
  agonistConc: number,
  agonistKd: number,
  pamConc: number,
  pamEC50: number,
  alphaFactor: number = 3.0,
): number {
  // PAM occupancy determines the degree of modulation
  const pamOccupancy = receptorOccupancy(pamConc, pamEC50);
  // Effective Kd is reduced (higher affinity) by alpha factor
  const effectiveKd = agonistKd / (1 + (alphaFactor - 1) * pamOccupancy);
  return receptorOccupancy(agonistConc, effectiveKd);
}

/**
 * Convert dose (mg) to plasma concentration (nM) for PD calculations
 *
 * Uses: C (nM) = (dose_mg * 1e6 * F) / (Vd_L * MW)
 *
 * @param doseMg Dose in milligrams
 * @param molarMass Molecular weight (g/mol)
 * @param Vd Volume of distribution (L)
 * @param bioavailability Oral bioavailability 0..1
 * @param pkCurve Normalized PK curve value 0..1 (from pk1)
 * @returns Plasma concentration in nM
 */
export function doseToConcentration(
  doseMg: number,
  molarMass: number,
  Vd: number,
  bioavailability: number,
  pkCurve: number,
): number {
  // Convert mg to nmol: (mg * 1e6 ng/mg) / (MW g/mol * 1000 ng/nmol) = mg * 1e3 / MW
  const nmol = (doseMg * 1e6) / molarMass;
  // Concentration = nmol / L * bioavailability * curve
  const concentration = (nmol / Math.max(0.1, Vd)) * bioavailability * pkCurve;
  return Math.max(0, concentration);
}

// --- Michaelis-Menten (Saturable) Kinetics ---

/**
 * Michaelis-Menten elimination for saturable metabolism (e.g., alcohol).
 *
 * Uses numerical integration because MM kinetics don't have a closed-form solution.
 *
 * dC/dt = -Vmax * C / (Km + C)
 *
 * When C >> Km: Zero-order elimination (~constant rate)
 * When C << Km: First-order elimination
 *
 * @param t Time in minutes
 * @param Vmax Maximum elimination rate (mg/dL per minute)
 * @param Km Michaelis constant (mg/dL) - concentration at half Vmax
 * @param C0 Initial concentration (mg/dL) after absorption
 * @param absorptionHalfLife Absorption half-life (minutes)
 * @param tlag Absorption lag time (minutes)
 * @returns Concentration at time t (mg/dL)
 *
 * Alcohol-specific defaults:
 * - Vmax: ~0.15-0.25 mg/dL/min (7-10 g/hr for 70kg, 42L TBW)
 * - Km: ~10 mg/dL (saturation occurs very quickly)
 */
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

  // Absorption phase: C_absorbed(t) = C0 * (1 - e^(-k_a * t))
  const absorbed = C0 * (1 - exp(-k_a * tau));

  // For elimination, we need to numerically integrate.
  // Use simple Euler method with small time steps.
  const dt = 1; // 1 minute steps
  let C = 0;

  for (let step = 0; step < tau; step += dt) {
    // Add absorption contribution
    const absorbedNow = C0 * (1 - exp(-k_a * step));
    const absorbedPrev = step > 0 ? C0 * (1 - exp(-k_a * (step - dt))) : 0;
    const dAbsorbed = absorbedNow - absorbedPrev;

    // Michaelis-Menten elimination
    const elimination = (Vmax * C) / (Km + C + 1e-9);

    C = Math.max(0, C + dAbsorbed - elimination * dt);
  }

  return C;
}

/**
 * Blood Alcohol Concentration (BAC) model using Michaelis-Menten kinetics.
 *
 * Implements the Widmark equation for initial distribution, then MM elimination.
 *
 * @param t Time in minutes
 * @param gramsEthanol Total ethanol consumed (grams)
 * @param weightKg Body weight (kg)
 * @param sex 'male' or 'female' (affects distribution volume)
 * @param metabolicRate Relative liver function (1.0 = normal)
 * @returns BAC in mg/dL (legal limit ~80 mg/dL in most places)
 */
export function alcoholBAC(
  t: number,
  gramsEthanol: number,
  weightKg: number = 70,
  sex: "male" | "female" = "male",
  metabolicRate: number = 1.0,
): number {
  // Widmark r factor (volume of distribution coefficient)
  // Males: 0.68 L/kg, Females: 0.55 L/kg
  const r = sex === "male" ? 0.68 : 0.55;

  // Calculate peak BAC (Widmark formula)
  // BAC = (grams / (weight_kg * r)) * 100 (to get mg/dL from g/L)
  const Vd = weightKg * r; // Liters
  const C0 = (gramsEthanol / Vd) * 100; // mg/dL (peak after absorption)

  // Michaelis-Menten parameters for alcohol
  // Vmax: ~7-10 g/hr = ~0.15-0.20 mg/dL/min (scaled by liver function)
  // Typical elimination: 15-20 mg/dL per hour = 0.25-0.33 mg/dL/min at saturation
  const Vmax = 0.2 * metabolicRate; // mg/dL per minute
  const Km = 10; // mg/dL - very low, so mostly zero-order

  return michaelisMentenPK(t, Vmax, Km, C0, 15, 10);
}

/**
 * Simple gamma-like appearance curve for nutrients (meal → blood).
 * k_rise controls onset, k_fall the tail. Shift with tlag to mimic gastric emptying.
 */
export function gammaPulse(
  t: number,
  k_rise: number,
  k_fall: number,
  tlag = 0,
) {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  // (1 - e^{-tau/k_rise}) * e^{-tau/k_fall}
  return (1 - exp(-tau / k_rise)) * exp(-tau / k_fall);
}

// --- Specific Physiology Helpers (Gastric) ---

/**
 * Nutrient parameters for gastric and absorption calculations
 */
export interface NutrientParams {
  carbSugar?: number; // grams of sugar
  carbStarch?: number; // grams of starch
  protein?: number; // grams of protein
  fat?: number; // grams of fat
  fiberSol?: number; // grams of soluble fiber
  fiberInsol?: number; // grams of insoluble fiber
  hydration?: number; // ml of water
  gi?: number; // glycemic index (20-100)
  weight?: number; // body weight in kg
  proteinType?: "whey" | "casein" | "mixed";
  fatType?: "mct" | "lct" | "mixed";
}

/**
 * Estimated gastric emptying delay (tlag, minutes) from fat & fiber with small hydration effect.
 * Anchored to human data that fat & soluble fiber slow emptying.
 */
export function gastricDelay(p: NutrientParams): number {
  const base = 15; // min
  const fat = 0.9 * (p.fat || 0);
  const fSol = 2.0 * (p.fiberSol || 0);
  const fInsol = 0.5 * (p.fiberInsol || 0);
  const hydr = -0.01 * (p.hydration || 0);
  return clamp(base + fat + fSol + fInsol + hydr, 5, 150);
}

/**
 * Carbohydrate appearance split: rapid sugars vs starch (GI-weighted),
 * both blunted by fat & soluble fiber (slower emptying + lower appearance rate).
 */
export function carbAppearance(t: number, p: NutrientParams): number {
  const tlag = gastricDelay(p);
  // Convert GI into relative starch appearance speed factor:
  const giFac = clamp((p.gi ?? 60) / 100, 0.25, 1.0);
  // Blunting from soluble fiber & fat (incretins, viscosity effects)
  const blunt = clamp(
    1 - 0.02 * (p.fiberSol || 0) - 0.004 * (p.fat || 0),
    0.6,
    1,
  );

  // Absolute Units Logic:
  // p.carbSugar/Starch is in grams.
  // We want mg/dL.
  // Vd_glucose ~ 0.2 L/kg.
  // Weight ~ p.weight || 70.
  // Vol (dL) = 0.2 * weight * 10.
  // Conc (mg/dL) = (grams * 1000) / Vol.
  const weight = p.weight || 70;
  const volDl = 0.2 * weight * 10;
  const scaler = (1000 / volDl) * 2.5;

  // Sugar: faster rise/shorter tail; Starch: slower and GI-scaled
  const sugar = gammaPulse(t, 6, 60, tlag) * (p.carbSugar || 0);
  const starch =
    gammaPulse(t, 14 / giFac, 110 / giFac, tlag) * (p.carbStarch || 0);

  return blunt * scaler * (sugar + starch);
}

/**
 * Protein appearance: amino acid absorption kinetics
 *
 * Protein digestion is slower than carbohydrates:
 * - Gastric phase: pepsin begins proteolysis
 * - Small intestine: pancreatic proteases complete digestion
 * - Amino acid absorption: gradual over 3-5 hours
 *
 * Different protein sources have varying digestion rates:
 * - Whey: Fast (peak ~60-90 min)
 * - Casein: Slow (sustained over 4-6 hours)
 * - Mixed meal: Intermediate
 *
 * Effects:
 * - mTOR activation (muscle protein synthesis)
 * - Glucagon stimulation
 * - Satiety signaling (CCK, PYY)
 * - Amino acid-induced insulin secretion (especially leucine)
 */
export function proteinAppearance(t: number, p: NutrientParams): number {
  const tlag = gastricDelay(p);
  const proteinGrams = p.protein || 0;
  if (proteinGrams <= 0) return 0;

  // Protein type affects digestion rate (default: mixed)
  const proteinType = p.proteinType || "mixed";
  let fastRate: number, slowRate: number, fastFraction: number;

  switch (proteinType) {
    case "whey":
      // Fast-digesting: peaks around 60-90 min
      fastRate = 0.03; // 1/k_a in minutes
      slowRate = 0.01;
      fastFraction = 0.8;
      break;
    case "casein":
      // Slow-digesting: sustained release over 4-6 hours
      fastRate = 0.015;
      slowRate = 0.004;
      fastFraction = 0.3;
      break;
    case "mixed":
    default:
      // Typical mixed meal protein
      fastRate = 0.02;
      slowRate = 0.008;
      fastFraction = 0.5;
  }

  // Fiber and fat slow protein digestion too
  const slowingFactor = clamp(
    1 - 0.01 * (p.fiberSol || 0) - 0.003 * (p.fat || 0),
    0.6,
    1,
  );

  // Protein digestion efficiency (~90-95% of dietary protein)
  const bioavailability = 0.92;

  // Amino acid pool volume (approximately 0.25 L/kg)
  const weight = p.weight || 70;
  const volDl = 0.25 * weight * 10;
  const scaler = (1000 / volDl) * bioavailability;

  // Biphasic absorption: fast (easily digested) + slow (complex proteins)
  const tAdj = t - tlag;
  if (tAdj <= 0) return 0;

  const fastPhase = gammaPulse(t, 20 / (fastRate * 100), 90, tlag);
  const slowPhase = gammaPulse(t, 40 / (slowRate * 100), 240, tlag);

  const appearance =
    proteinGrams *
    scaler *
    slowingFactor *
    (fastFraction * fastPhase + (1 - fastFraction) * slowPhase);

  return appearance;
}

/**
 * Fat appearance: lipid absorption kinetics
 *
 * Fat digestion is the slowest macronutrient:
 * - Requires bile salt emulsification
 * - Pancreatic lipase breaks triglycerides into fatty acids + monoglycerides
 * - Absorption via micelles into enterocytes
 * - Chylomicron formation and lymphatic transport
 *
 * Peak absorption: 3-6 hours post-meal
 * Complete absorption: 6-12 hours
 *
 * Effects:
 * - CCK release (satiety)
 * - GLP-1 enhancement
 * - Ketone precursor (beta-oxidation)
 * - Slows gastric emptying of co-ingested carbs
 */
export function fatAppearance(t: number, p: NutrientParams): number {
  const tlag = gastricDelay(p);
  const fatGrams = p.fat || 0;
  if (fatGrams <= 0) return 0;

  // Fat type affects digestion (MCT vs LCT)
  const fatType = p.fatType || "mixed";
  let absorptionRate: number, peakTime: number;

  switch (fatType) {
    case "mct":
      // Medium-chain triglycerides: faster, direct portal absorption
      absorptionRate = 0.02;
      peakTime = 90;
      break;
    case "lct":
      // Long-chain triglycerides: slower, lymphatic route
      absorptionRate = 0.006;
      peakTime = 240;
      break;
    case "mixed":
    default:
      // Typical dietary fat mix
      absorptionRate = 0.01;
      peakTime = 180;
  }

  // Very high fiber significantly slows fat absorption
  const fiberSlowing = clamp(
    1 - 0.02 * (p.fiberSol || 0) - 0.01 * (p.fiberInsol || 0),
    0.5,
    1,
  );

  // Fat absorption efficiency (~95% in healthy individuals)
  const bioavailability = 0.95;

  // Lipid pool approximation (plasma triglycerides)
  const weight = p.weight || 70;
  const volDl = 0.045 * weight * 10; // ~45 mL/kg plasma volume
  const scaler = (1000 / volDl) * bioavailability * 0.3; // Only ~30% as circulating lipid

  const tAdj = t - tlag;
  if (tAdj <= 0) return 0;

  // Fat has a very slow onset with long tail
  // Using double exponential for realistic chylomicron appearance
  const onset = 1 - Math.exp(-tAdj / (peakTime * 0.5));
  const decay = Math.exp(-tAdj / (peakTime * 3));
  const envelope = onset * decay;

  // Pulsatile chylomicron release (mimics wave-like absorption)
  const pulsatile = 1 + 0.15 * Math.sin((tAdj * Math.PI) / 120);

  return fatGrams * scaler * fiberSlowing * envelope * pulsatile;
}

/**
 * Combined macronutrient appearance for total nutrient signaling
 * Useful for satiety hormones that respond to overall nutrient flux
 */
export function totalNutrientAppearance(t: number, p: NutrientParams): number {
  const carbs = carbAppearance(t, p);
  const protein = proteinAppearance(t, p);
  const fat = fatAppearance(t, p);

  // Weight by caloric density to get "energy appearance"
  // Carbs: 4 kcal/g, Protein: 4 kcal/g, Fat: 9 kcal/g
  // But we're in mg/dL-like units, so normalize
  return carbs + protein * 0.8 + fat * 1.5;
}

// --- Generators ---

import type { PharmacologyDef } from "@/types";
import type { Physiology, Subject } from "../domain/subject";

/**
 * Default Volume of Distribution estimates by drug class (L/kg)
 */
export const DEFAULT_VD: Record<string, number> = {
  Caffeine: 0.6,
  Methylphenidate: 2.0,
  Amphetamine: 3.5,
  Ethanol: 0.6,
  Melatonin: 1.0,
  "L-Theanine": 0.7,
  Magnesium: 0.5,
  default: 1.0,
};

/**
 * Reference constants for physiology-based scaling
 */
const REF_LIVER_BLOOD_FLOW = 1.5; // L/min for 70kg male
const REF_GFR = 90; // mL/min normal adult

/**
 * Calculate elimination rate constant (k_e) from physiology-dependent clearance.
 *
 * Uses the relationship: k_e = CL / Vd
 *
 * @param pharma PharmacologyDef with optional clearance specs
 * @param phys Physiology object with liver blood flow and eGFR
 * @param subject Subject with demographic data
 * @returns k_e in 1/min
 */
export function calculateClearance(
  pharma: PharmacologyDef,
  phys: Physiology,
  subject: Subject,
): number {
  const pk = pharma.pk;

  // If no dynamic clearance spec, fall back to half-life
  if (!pk?.clearance) {
    const thalf = pk?.halfLifeMin ?? 60;
    return Math.LN2 / Math.max(1, thalf);
  }

  let totalCL_L_min = 0;

  // Hepatic clearance scaled by liver blood flow
  if (pk.clearance.hepatic) {
    const baseCL = pk.clearance.hepatic.baseCL_mL_min;
    const liverScale = phys.liverBloodFlow / REF_LIVER_BLOOD_FLOW;
    totalCL_L_min += (baseCL / 1000) * liverScale; // mL/min -> L/min
  }

  // Renal clearance scaled by eGFR
  if (pk.clearance.renal) {
    const baseCL = pk.clearance.renal.baseCL_mL_min;
    const renalScale = phys.estimatedGFR / REF_GFR;
    totalCL_L_min += (baseCL / 1000) * renalScale;
  }

  // Calculate Vd for k_e = CL / Vd
  const Vd_L = calculateVd(pharma, phys, subject);

  // k_e = CL (L/min) / Vd (L)
  return totalCL_L_min / Math.max(0.1, Vd_L);
}

/**
 * Calculate Volume of Distribution from physiology.
 *
 * Supports multiple distribution models:
 * - weight: Vd = base_L_kg * weight
 * - tbw: Vd = TBW * fraction (for hydrophilic drugs)
 * - lbm: Vd = LBM * base_L_kg (for drugs distributing to lean tissue)
 * - sex-adjusted: Different Vd for males vs females
 *
 * @param pharma PharmacologyDef with optional volume specs
 * @param phys Physiology object
 * @param subject Subject with demographic data
 * @returns Vd in Liters (absolute, not L/kg)
 */
export function calculateVd(
  pharma: PharmacologyDef,
  phys: Physiology,
  subject: Subject,
): number {
  const vol = pharma.pk?.volume;
  const moleculeName = pharma.molecule?.name ?? "default";

  // Fallback to DEFAULT_VD lookup if no volume spec
  if (!vol) {
    const vd_kg = DEFAULT_VD[moleculeName] ?? DEFAULT_VD["default"];
    return vd_kg * subject.weight;
  }

  switch (vol.kind) {
    case "weight":
      return (vol.base_L_kg ?? 1.0) * subject.weight;

    case "tbw":
      // Total body water distribution (hydrophilic drugs)
      return phys.tbw * (vol.fraction ?? 0.6);

    case "lbm":
      // Lean body mass distribution (muscle-binding drugs)
      return phys.leanBodyMass * (vol.base_L_kg ?? 1.0);

    case "sex-adjusted":
      // Sex-specific Vd (e.g., alcohol: males 0.68, females 0.55 L/kg)
      const vd_kg =
        subject.sex === "male"
          ? (vol.male_L_kg ?? 0.7)
          : (vol.female_L_kg ?? 0.6);
      return vd_kg * subject.weight;

    default:
      return subject.weight; // Fallback: 1 L/kg
  }
}

/**
 * Generates a kernel string function body that implements the PBPK model
 * defined in the PharmacologyDef.
 *
 * Uses helper functions (receptorOccupancy, operationalAgonism, doseToConcentration)
 * for DRY code and consistent pharmacology calculations.
 *
 * @param pharma PharmacologyDef with PK/PD specifications
 * @param targetSignal Optional target signal name for PD lookup
 * @param subject Optional subject for physiology-dependent parameters
 * @param physiology Optional physiology for dynamic clearance/volume
 */
export function generatePKKernel(
  pharma: PharmacologyDef,
  targetSignal?: string,
  subject?: Subject,
  physiology?: Physiology,
): string {
  const pk = pharma.pk;
  if (!pk) return "function(){ return 0; }";

  const bioavailability = pk.bioavailability ?? 1.0;
  const molarMass = pharma.molecule?.molarMass ?? 200;
  const moleculeName = pharma.molecule?.name ?? "default";

  // Compute k_e and Vd from physiology if available, otherwise use static values
  let k_e_base: number;
  let Vd: number;
  let Vd_is_absolute = false;

  if (subject && physiology && (pk.clearance || pk.volume)) {
    k_e_base = calculateClearance(pharma, physiology, subject);
    Vd = calculateVd(pharma, physiology, subject);
    Vd_is_absolute = true;
  } else {
    const thalf = pk.halfLifeMin ?? 60;
    k_e_base = Math.LN2 / Math.max(1, thalf);
    Vd = DEFAULT_VD[moleculeName] ?? DEFAULT_VD["default"];
  }

  const k_a_base = pk.absorptionRate ?? k_e_base * 4;

  // 2-compartment parameters
  const isTwoCompartment = pk.model === "2-compartment" && pk.k_12 && pk.k_21;
  const k_12 = pk.k_12 ?? 0;
  const k_21 = pk.k_21 ?? 0;

  // Look up PD target
  const pd =
    pharma.pd?.find((t) => t.target === targetSignal) ?? pharma.pd?.[0];
  const mechanism = pd?.mechanism ?? "agonist";
  const Ki = pd?.Ki ?? null;
  const EC50 = pd?.EC50 ?? null;
  const intrinsicEfficacy = pd?.intrinsicEfficacy ?? 0.1;
  const tauValue = pd?.tau ?? 10;
  const alphaValue =
    pd?.alpha ?? (mechanism === "PAM" ? 3.0 : mechanism === "NAM" ? 0.3 : 1.0);

  const hasReceptorData = Ki !== null || EC50 !== null;
  const bindingConstant = Ki ?? EC50 ?? 100;

  // --- Shared code fragments ---
  const pkCurveCalc = isTwoCompartment
    ? `const curve = pk2(t, k_a, k_e, ${k_12}, ${k_21}, 0);`
    : `const curve = pk1(t, k_a, k_e, 0);`;

  const vdCalc = Vd_is_absolute
    ? `const Vd_L = ${Vd};`
    : `const Vd_L = ${Vd} * weight;`;

  // Common preamble for all mechanisms
  const preamble = `
    if(t<0) return 0;
    const clScale = p.clearanceScalar || 1.0;
    const weight = p.weight || 70;
    const k_e = ${k_e_base} * clScale;
    const k_a = ${k_a_base};

    // Dose extraction
    let dose = 100;
    if (p.mg !== undefined) dose = Number(p.mg);
    else if (p.dose !== undefined) dose = Number(p.dose);
    else if (p.amount !== undefined) dose = Number(p.amount);
    else if (p.units !== undefined) dose = Number(p.units) * 10;
    else if (p.mcg !== undefined) dose = Number(p.mcg) / 1000;
    else if (p.iu !== undefined) dose = Number(p.iu) * 0.025;

    // PK curve (${isTwoCompartment ? "2-compartment" : "1-compartment"})
    ${pkCurveCalc}

    // Plasma concentration (nM) using helper
    ${vdCalc}
    const conc = doseToConcentration(dose, ${molarMass}, Vd_L, ${bioavailability}, curve);
  `;

  if (hasReceptorData) {
    if (mechanism === "agonist") {
      // Use operationalAgonism helper
      return `function(t,p){${preamble}
        // Operational agonism model via helper
        return operationalAgonism(conc, ${bindingConstant}, ${tauValue}, ${
          intrinsicEfficacy * 100
        });
      }`;
    } else if (mechanism === "antagonist") {
      // Use receptorOccupancy helper
      return `function(t,p){${preamble}
        // Receptor occupancy via helper
        const occupancy = receptorOccupancy(conc, ${bindingConstant});
        return ${intrinsicEfficacy * 100} * occupancy;
      }`;
    } else if (mechanism === "PAM") {
      // PAM enhances endogenous signaling
      return `function(t,p){${preamble}
        // PAM occupancy via helper
        const pamOccupancy = receptorOccupancy(conc, ${bindingConstant});
        const enhancement = 1 + (${alphaValue} - 1) * pamOccupancy;
        return ${intrinsicEfficacy * 100} * (enhancement - 1);
      }`;
    } else if (mechanism === "NAM") {
      // NAM reduces signaling
      return `function(t,p){${preamble}
        // NAM occupancy via helper
        const namOccupancy = receptorOccupancy(conc, ${bindingConstant});
        const reduction = 1 - (1 - ${alphaValue}) * namOccupancy;
        return -${Math.abs(intrinsicEfficacy) * 100} * (1 - reduction);
      }`;
    }
  }

  // Fallback: Simple linear PD (legacy behavior)
  return `function(t,p){${preamble}
    return ${intrinsicEfficacy} * dose * curve;
  }`;
}
