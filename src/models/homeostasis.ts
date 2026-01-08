/**
 * Homeostatic Control Systems Module
 *
 * Implements ODE-based feedback loops for physiological regulation.
 * This module provides "true" homeostasis where the system actively
 * corrects deviations from setpoints, rather than passive superposition.
 *
 * Key Concepts:
 * - Setpoints: Target values the system regulates toward
 * - Error Signals: Difference between current state and setpoint
 * - Control Signals: Corrective outputs to reduce error
 * - State Variables: Quantities that persist across time steps
 */

import { clamp } from './pharmacokinetics';
import { RECEPTOR_ADAPTATION, RECEPTOR_RATES } from './constants/pharmacodynamics';
import type { HomeostasisStateSnapshot } from '@/types/neurostate';

// --- Types ---

export interface HomeostasisState {
  // Glucose-Insulin Axis
  glucosePool: number;      // mg/dL - circulating glucose
  insulinPool: number;      // µIU/mL - circulating insulin
  insulinAction: number;    // "X" compartment in Minimal Model
  hepaticGlycogen: number;  // Relative glycogen stores 0..1

  // Sleep Pressure (Process S)
  adenosinePressure: number; // Sleep homeostasis pressure 0..1

  // HPA Axis State
  crhPool: number;          // Hypothalamic CRH tone
  cortisolPool: number;     // Circulating cortisol pool (µg/dL)
  cortisolIntegral: number; // Integrated cortisol exposure (allostatic load)
  adrenalineReserve: number; // Adrenal medulla reserve 0..1

  // Neurotransmitter Pools
  dopamineVesicles: number; // Presynaptic DA vesicle stores 0..1
  norepinephrineVesicles: number; // Presynaptic NE vesicle stores 0..1
  serotoninPrecursor: number; // Tryptophan availability 0..1
  acetylcholineTone: number; // Cholinergic tone 0..1
  gabaPool: number; // GABAergic interneuron pool 0..1
  glutamatePool: number; // Glutamatergic pool 0..1

  // Growth Factors
  bdnfExpression: number; // BDNF expression level 0..1
  ghReserve: number; // Pituitary GH reserve 0..1

  // Tolerance / Sensitization
  receptorStates: Record<string, number>; // Receptor density changes
}

export interface HomeostasisParams {
  // Glucose-Insulin
  glucoseSetpoint: number;      // mg/dL, typically 85-100
  insulinSensitivity: number;   // 0..2, relative to normal
  hepaticGlucoseOutput: number; // Basal hepatic glucose production rate

  // Sleep
  sleepPressureDecay: number;   // Rate of adenosine clearance during sleep
  sleepPressureBuild: number;   // Rate of adenosine accumulation during wake

  // HPA
  cortisolSetpoint: number;     // µg/dL
  hpaGain: number;              // Feedback sensitivity

  // General
  metabolicRate: number;        // Scaling factor from physiology
}

export const DEFAULT_HOMEOSTASIS_STATE: HomeostasisState = {
  glucosePool: 90,
  insulinPool: 8,
  insulinAction: 0,
  hepaticGlycogen: 0.7,
  adenosinePressure: 0.2,
  crhPool: 1.0,
  cortisolPool: 12,
  cortisolIntegral: 0,
  adrenalineReserve: 0.9,
  dopamineVesicles: 0.8,
  norepinephrineVesicles: 0.8,
  serotoninPrecursor: 0.7,
  acetylcholineTone: 0.6,
  gabaPool: 0.7,
  glutamatePool: 0.7,
  bdnfExpression: 0.6,
  ghReserve: 0.8,
  receptorStates: {},
};

export const DEFAULT_HOMEOSTASIS_PARAMS: HomeostasisParams = {
  glucoseSetpoint: 90,
  insulinSensitivity: 1.0,
  hepaticGlucoseOutput: 2.0, // mg/dL per minute at baseline
  sleepPressureDecay: 0.008,
  sleepPressureBuild: 0.003,
  cortisolSetpoint: 12,
  hpaGain: 1.0,
  metabolicRate: 1.0,
};

// --- ODE Solver (4th Order Runge-Kutta) ---

type DerivativeFn = (state: number[], t: number, inputs: Record<string, number>) => number[];

/**
 * Single RK4 step
 */
function rk4Step(
  state: number[],
  t: number,
  dt: number,
  derivFn: DerivativeFn,
  inputs: Record<string, number>
): number[] {
  const k1 = derivFn(state, t, inputs);
  const k2 = derivFn(
    state.map((s, i) => s + 0.5 * dt * k1[i]),
    t + 0.5 * dt,
    inputs
  );
  const k3 = derivFn(
    state.map((s, i) => s + 0.5 * dt * k2[i]),
    t + 0.5 * dt,
    inputs
  );
  const k4 = derivFn(
    state.map((s, i) => s + dt * k3[i]),
    t + dt,
    inputs
  );

  return state.map((s, i) =>
    s + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
  );
}

// --- Glucose-Insulin Minimal Model ---

/**
 * Bergman Minimal Model variant for glucose-insulin dynamics
 *
 * dG/dt = -p1 * (G - Gb) - X * G + Ra(t)
 * dX/dt = -p2 * X + p3 * (I - Ib)
 * dI/dt = -n * I + γ * (G - h)+ * t
 *
 * Where:
 * - G = glucose, I = insulin, X = insulin action (remote compartment)
 * - Gb, Ib = basal glucose/insulin
 * - Ra(t) = rate of glucose appearance (from food)
 * - p1, p2, p3 = rate constants
 * - n = insulin clearance
 * - γ = pancreatic responsiveness
 * - h = glucose threshold for insulin secretion
 */
export interface GlucoseInsulinInputs {
  glucoseAppearance: number;  // mg/dL/min from meal absorption
  exerciseUptake: number;     // Additional glucose uptake from exercise
  stressHormones: number;     // Cortisol/adrenaline effect on glucose
  exogenousInsulin: number;   // Injected insulin (for T1D modeling)
}

const GLUCOSE_INSULIN_PARAMS = {
  p1: 0.028,      // Glucose effectiveness (1/min)
  p2: 0.025,      // Insulin action decay (1/min)
  p3: 0.000013,   // Insulin action gain
  n: 0.23,        // Insulin clearance (1/min)
  gamma: 0.004,   // Pancreatic responsivity
  h: 80,          // Glucose threshold for secretion (mg/dL)
  Gb: 90,         // Basal glucose (mg/dL)
  Ib: 8,          // Basal insulin (µIU/mL)
};

function glucoseInsulinDerivatives(
  state: number[],  // [G, X, I, glycogen]
  _t: number,
  inputs: Record<string, number>,
  params: HomeostasisParams
): number[] {
  const [G, X, I, glycogen] = state;
  const { p1, p2, p3, n, gamma, h, Gb, Ib } = GLUCOSE_INSULIN_PARAMS;

  const Ra = inputs.glucoseAppearance || 0;
  const exercise = inputs.exerciseUptake || 0;
  const stress = inputs.stressHormones || 0;

  // Insulin sensitivity modulation
  const Si = params.insulinSensitivity;

  // Hepatic glucose output (counter-regulatory)
  const glucagonEffect = Math.max(0, (Gb - G) / Gb) * params.hepaticGlucoseOutput;
  const stressGlucose = stress * 0.5; // Stress hormones raise glucose

  // Glycogen dynamics
  const glycogenRelease = G < 70 ? 0.5 * (70 - G) / 70 * glycogen : 0;
  const glycogenStorage = I > Ib && G > 100 ? 0.001 * (G - 100) * (1 - glycogen) : 0;

  // dG/dt: glucose dynamics
  const dG = -p1 * (G - Gb) - X * G * Si + Ra + glucagonEffect + stressGlucose + glycogenRelease - exercise;

  // dX/dt: remote insulin action
  const dX = -p2 * X + p3 * Si * Math.max(0, I - Ib);

  // dI/dt: insulin secretion and clearance
  const secretion = gamma * Math.max(0, G - h);
  const dI = -n * I + secretion + (inputs.exogenousInsulin || 0);

  // dGlycogen/dt
  const dGlycogen = glycogenStorage - glycogenRelease * 0.01;

  return [dG, dX, dI, dGlycogen];
}

// --- Sleep Homeostasis (Two-Process Model) ---

/**
 * Process S: Sleep homeostasis (adenosine accumulation)
 *
 * During wake: dS/dt = (1 - S) * k_build
 * During sleep: dS/dt = -S * k_decay
 *
 * Sleep propensity = S + C(t) where C(t) is circadian drive
 */
export interface SleepInputs {
  isAsleep: boolean;
  caffeineLevel: number;  // Adenosine receptor blockade
  lightExposure: number;  // Circadian entrainment
}

function sleepPressureDerivative(
  S: number,
  inputs: SleepInputs,
  params: HomeostasisParams
): number {
  const { sleepPressureDecay, sleepPressureBuild } = params;

  // Caffeine blocks adenosine receptors, slowing perceived pressure buildup
  const caffeineBlock = 1 - 0.7 * Math.min(1, inputs.caffeineLevel / 100);

  if (inputs.isAsleep) {
    // Sleep clears adenosine
    return -S * sleepPressureDecay;
  } else {
    // Wake accumulates adenosine
    return (1 - S) * sleepPressureBuild * caffeineBlock;
  }
}

// --- HPA Axis Feedback ---

/**
 * Simplified HPA axis with negative feedback
 *
 * dCRH/dt = stress_input - k1 * cortisol_feedback
 * dCortisol/dt = k2 * CRH - k3 * cortisol
 *
 * Allostatic load accumulates with chronic elevation
 */
export interface HPAInputs {
  stressInput: number;      // 0..1 perceived stress
  circadianDrive: number;   // Diurnal cortisol rhythm
  inflammatorySignal: number;
}

function hpaDerivatives(
  state: number[], // [CRH, cortisol, allostaticLoad]
  inputs: HPAInputs,
  params: HomeostasisParams
): number[] {
  const [CRH, cortisol, load] = state;
  const { cortisolSetpoint, hpaGain } = params;

  const k1 = 0.1;  // Feedback gain
  const k2 = 0.5;  // CRH -> cortisol
  const k3 = 0.05; // Cortisol clearance

  // Negative feedback from cortisol
  const feedback = k1 * hpaGain * Math.max(0, cortisol - cortisolSetpoint);

  // Stress and circadian inputs
  const drive = inputs.stressInput + inputs.circadianDrive + 0.3 * inputs.inflammatorySignal;

  const dCRH = drive - feedback - 0.1 * CRH;
  const dCortisol = k2 * CRH - k3 * cortisol;

  // Allostatic load accumulates when cortisol is chronically elevated
  const dLoad = cortisol > cortisolSetpoint * 1.5 ? 0.0001 * (cortisol - cortisolSetpoint) : -0.00005 * load;

  return [dCRH, dCortisol, dLoad];
}

// --- Neurotransmitter Pool Dynamics ---

/**
 * Vesicle depletion and replenishment model
 *
 * dV/dt = k_synthesis * (1 - V) - k_release * activity * V
 *
 * This captures tolerance (vesicle depletion) and recovery
 */
export interface NeurotransmitterInputs {
  firingRate: number;       // 0..1 relative neuronal activity
  precursorAvailability: number;
  drugEffect: number;       // Reuptake inhibition, etc.
}

function vesiclePoolDerivative(
  V: number,  // Vesicle fullness 0..1
  inputs: NeurotransmitterInputs
): number {
  const k_synthesis = 0.01;  // Replenishment rate
  const k_release = 0.05;    // Release rate per unit activity

  const synthesis = k_synthesis * inputs.precursorAvailability * (1 - V);
  const release = k_release * inputs.firingRate * V;

  return synthesis - release;
}

// --- Receptor Adaptation ---

/**
 * Receptor adaptation mechanism type
 */
export type AdaptationMechanism =
  | 'full_agonist'      // Full agonist - maximal downregulation
  | 'partial_agonist'   // Partial agonist - moderate, stabilizing
  | 'antagonist'        // Antagonist - upregulation
  | 'inverse_agonist'   // Inverse agonist - upregulation (stronger)
  | 'pam'               // Positive allosteric modulator
  | 'nam';              // Negative allosteric modulator

/**
 * Receptor adaptation state for biphasic model
 * Tracks both fast (trafficking) and slow (gene expression) phases
 */
export interface ReceptorAdaptationState {
  fastPhase: number;    // Rapid internalization/externalization (0..1 of total change)
  slowPhase: number;    // Slow transcriptional changes (0..1 of total change)
  totalDensity: number; // Actual receptor density
}

/**
 * Advanced receptor up/down regulation with biphasic kinetics
 *
 * Biphasic model:
 *   Fast phase: Receptor internalization/externalization (minutes to hours)
 *   Slow phase: Transcriptional regulation (hours to days)
 *
 * dR/dt = k_fast * (R_target_fast - R_fast) + k_slow * (R_target_slow - R_slow)
 *
 * Features:
 * - Occupancy threshold (no adaptation below 30% occupancy)
 * - Mechanism-specific adaptation rates
 * - Receptor type-specific kinetics
 * - Efficacy (tau) influences adaptation magnitude
 *
 * @param R Current receptor density (1 = baseline)
 * @param occupancy Ligand occupancy 0..1
 * @param mechanism Ligand mechanism type
 * @param receptorType Receptor type for specific rates (e.g., 'D2', 'GABAA')
 * @param tau Efficacy parameter (higher = more adaptation)
 * @returns Rate of change in receptor density (dR/dt)
 */
export function receptorAdaptation(
  R: number,
  occupancy: number,
  mechanism: AdaptationMechanism | boolean,  // boolean for backwards compatibility
  receptorType?: keyof typeof RECEPTOR_RATES,
  tau?: number
): number {
  // Handle backwards-compatible boolean form
  let effectiveMechanism: AdaptationMechanism;
  if (typeof mechanism === 'boolean') {
    effectiveMechanism = mechanism ? 'full_agonist' : 'antagonist';
  } else {
    effectiveMechanism = mechanism;
  }

  // Apply occupancy threshold - minimal adaptation below threshold
  const threshold = RECEPTOR_ADAPTATION.OCCUPANCY_THRESHOLD;
  const effectiveOccupancy = occupancy > threshold
    ? (occupancy - threshold) / (1 - threshold)  // Rescale to 0..1 above threshold
    : occupancy * 0.1;  // Only 10% effect below threshold

  // Get receptor-specific rates or use defaults
  const rates = receptorType && RECEPTOR_RATES[receptorType]
    ? RECEPTOR_RATES[receptorType]
    : { k_up: RECEPTOR_ADAPTATION.K_UP, k_down: RECEPTOR_ADAPTATION.K_DOWN };

  // Biphasic kinetics
  const k_fast = RECEPTOR_ADAPTATION.K_FAST;
  const k_slow = RECEPTOR_ADAPTATION.K_SLOW;
  const fastFraction = RECEPTOR_ADAPTATION.FAST_PHASE_FRACTION;
  const slowFraction = RECEPTOR_ADAPTATION.SLOW_PHASE_FRACTION;

  const R0 = RECEPTOR_ADAPTATION.BASELINE_DENSITY;

  // Efficacy modulates adaptation magnitude (higher tau = more activity = more adaptation)
  const efficacyFactor = tau !== undefined ? Math.min(tau / 10, 2) : 1.0;

  let dR: number;

  switch (effectiveMechanism) {
    case 'full_agonist': {
      // Full agonists cause maximal downregulation
      // Fast phase: receptor internalization
      const fastDown = k_fast * effectiveOccupancy * R * efficacyFactor;
      // Slow phase: reduced transcription
      const slowDown = k_slow * effectiveOccupancy * R * efficacyFactor;
      // Recovery toward baseline
      const recovery = rates.k_up * (R0 - R);
      dR = recovery - (fastFraction * fastDown + slowFraction * slowDown);
      break;
    }

    case 'partial_agonist': {
      // Partial agonists cause moderate adaptation, may stabilize receptor density
      const partialFactor = efficacyFactor * 0.5;  // Reduced compared to full agonist
      const adaptation = (rates.k_down * effectiveOccupancy * R * partialFactor) -
                        (rates.k_up * (R0 - R) * (1 + effectiveOccupancy * 0.2));
      // Partial agonists can "buffer" receptor density toward baseline
      const stabilization = 0.0005 * (R0 - R);
      dR = stabilization - adaptation;
      break;
    }

    case 'antagonist': {
      // Antagonists cause upregulation (more receptors to "overcome" block)
      // Fast phase: receptor externalization from intracellular pools
      const fastUp = k_fast * effectiveOccupancy * (R0 - R) * 0.5;
      // Slow phase: increased transcription
      const slowUp = k_slow * effectiveOccupancy * (RECEPTOR_ADAPTATION.MAX_DENSITY - R) * 0.3;
      // Recovery toward baseline when drug is removed
      const recovery = rates.k_down * (R - R0) * Math.max(0, 1 - effectiveOccupancy);
      dR = (fastFraction * fastUp + slowFraction * slowUp) - recovery;
      break;
    }

    case 'inverse_agonist': {
      // Inverse agonists cause stronger upregulation than neutral antagonists
      const upregulation = (rates.k_up * 1.5) * effectiveOccupancy * (RECEPTOR_ADAPTATION.MAX_DENSITY - R);
      const recovery = rates.k_down * 0.5 * (R - R0) * Math.max(0, 1 - effectiveOccupancy);
      dR = upregulation - recovery;
      break;
    }

    case 'pam': {
      // PAMs don't typically cause classical adaptation, but can cause some
      // through enhanced signaling leading to desensitization
      const pamEffect = effectiveOccupancy * efficacyFactor * 0.3;  // Reduced magnitude
      dR = rates.k_up * (R0 - R) - rates.k_down * pamEffect * R;
      break;
    }

    case 'nam': {
      // NAMs may cause mild upregulation (similar to antagonist but weaker)
      const namEffect = effectiveOccupancy * 0.4;  // Reduced magnitude
      dR = rates.k_up * (R0 - R) * (1 + namEffect) - rates.k_down * (R - R0) * 0.5;
      break;
    }

    default:
      // Fallback to simple model
      dR = rates.k_up * (R0 - R) - rates.k_down * effectiveOccupancy * R;
  }

  return dR;
}

/**
 * Advanced receptor adaptation with explicit state tracking
 * For use when biphasic phases need to be tracked separately
 */
export function receptorAdaptationBiphasic(
  state: ReceptorAdaptationState,
  occupancy: number,
  mechanism: AdaptationMechanism,
  receptorType?: keyof typeof RECEPTOR_RATES,
  tau?: number,
  dt: number = 1
): ReceptorAdaptationState {
  const k_fast = RECEPTOR_ADAPTATION.K_FAST;
  const k_slow = RECEPTOR_ADAPTATION.K_SLOW;
  const R0 = RECEPTOR_ADAPTATION.BASELINE_DENSITY;
  const threshold = RECEPTOR_ADAPTATION.OCCUPANCY_THRESHOLD;

  const effectiveOccupancy = occupancy > threshold
    ? (occupancy - threshold) / (1 - threshold)
    : occupancy * 0.1;

  const efficacyFactor = tau !== undefined ? Math.min(tau / 10, 2) : 1.0;

  const isDownregulating = mechanism === 'full_agonist' || mechanism === 'partial_agonist' || mechanism === 'pam';
  const targetDirection = isDownregulating ? -1 : 1;

  // Fast phase tracks rapid changes
  const fastTarget = targetDirection * effectiveOccupancy * efficacyFactor * 0.3;
  const dFast = k_fast * (fastTarget - state.fastPhase);
  const newFast = state.fastPhase + dFast * dt;

  // Slow phase tracks transcriptional changes (lags behind)
  const slowTarget = targetDirection * effectiveOccupancy * efficacyFactor * 0.2;
  const dSlow = k_slow * (slowTarget - state.slowPhase);
  const newSlow = state.slowPhase + dSlow * dt;

  // Total density is baseline + fast + slow contributions
  const newDensity = clamp(
    R0 + newFast + newSlow,
    RECEPTOR_ADAPTATION.MIN_DENSITY,
    RECEPTOR_ADAPTATION.MAX_DENSITY
  );

  return {
    fastPhase: newFast,
    slowPhase: newSlow,
    totalDensity: newDensity,
  };
}

// --- Main Homeostasis Stepper ---

export interface HomeostasisInputs {
  // From analytical baselines
  baselineCortisol: number;
  baselineGlucose: number;
  baselineDopamine: number;
  baselineSerotonin: number;
  baselineNorepi: number;
  baselineGaba: number;
  baselineGlutamate: number;
  baselineAcetylcholine: number;
  baselineEnergy: number;
  baselineMelatonin: number;
  baselineBdnf: number;
  baselineGrowthHormone: number;
  baselineAdrenaline: number;

  // From interventions
  glucoseAppearance: number;
  caffeineLevel: number;
  exerciseIntensity: number;
  stressLevel: number;
  alcoholLevel: number;
  meditationEffect: number;

  // Neurotransmitter inputs
  dopamineFiringRate: number;   // 0..1 relative neuronal activity
  serotoninFiringRate: number;  // 0..1 relative neuronal activity
  norepiFiringRate: number;     // 0..1 NE neuronal activity
  stimulantEffect: number;      // DAT/NET blockade from stimulants
  tryptophanAvailability: number; // Precursor for serotonin (from diet)
  gabaBoost: number;            // GABA modulation from benzos, alcohol, etc.
  glutamateBlock: number;       // NMDA/AMPA blockade

  // State
  isAsleep: boolean;
  minuteOfDay: number;
}

/**
 * Main homeostasis step function
 *
 * Advances the homeostatic state by dt minutes using ODE integration.
 * Returns the updated state and the "corrections" to apply to signals.
 */
export function stepHomeostasis(
  state: HomeostasisState,
  inputs: HomeostasisInputs,
  params: HomeostasisParams,
  dt: number  // Time step in minutes
): {
  newState: HomeostasisState;
  corrections: Record<string, number>;
} {
  // Use a smaller internal time step for numerical stability (e.g. 1 minute)
  const internalDt = 1.0;
  const numSteps = Math.max(1, Math.round(dt / internalDt));
  const actualInternalDt = dt / numSteps;

  let currentState = { ...state };

  for (let i = 0; i < numSteps; i++) {
    const giState = [
      currentState.glucosePool,
      currentState.insulinAction,
      currentState.insulinPool,
      currentState.hepaticGlycogen,
    ];

    const giInputs = {
      glucoseAppearance: inputs.glucoseAppearance ?? 0,
      exerciseUptake: (inputs.exerciseIntensity ?? 0) * 0.5,
      stressHormones: inputs.stressLevel ?? 0,
      exogenousInsulin: 0,
    };

    const newGI = rk4Step(
      giState,
      0,
      actualInternalDt,
      (s, t, inp) => glucoseInsulinDerivatives(s, t, inp, params),
      giInputs
    );

    // Sleep pressure
    const sleepInputs: SleepInputs = {
      isAsleep: inputs.isAsleep ?? false,
      caffeineLevel: inputs.caffeineLevel ?? 0,
      lightExposure: 0,
    };
    const dS = sleepPressureDerivative(currentState.adenosinePressure, sleepInputs, params);
    const newAdenosine = clamp(currentState.adenosinePressure + dS * actualInternalDt, 0, 1);

    // HPA
    const hour = (inputs.minuteOfDay + i * actualInternalDt) / 60;
    const circadianDrive = 0.5 + 0.5 * Math.cos((hour - 8) * Math.PI / 12);
    const hpaInputs: HPAInputs = {
      stressInput: inputs.stressLevel ?? 0,
      circadianDrive,
      inflammatorySignal: 0,
    };
    const hpaState = [currentState.crhPool, currentState.cortisolPool, currentState.cortisolIntegral];
    const newHPA = rk4Step(
      hpaState,
      0,
      actualInternalDt,
      (s, _t, _inp) => hpaDerivatives(s, hpaInputs, params),
      {}
    );

    // Adrenaline Reserve
    const adrenalineStress = (inputs.stressLevel ?? 0) + (inputs.exerciseIntensity ?? 0) * 0.5;
    const adrenalineRecovery = 0.002 * (1 - currentState.adrenalineReserve);
    const adrenalineDepletion = 0.005 * adrenalineStress * currentState.adrenalineReserve;
    const newAdrenalineReserve = clamp(
      currentState.adrenalineReserve + (adrenalineRecovery - adrenalineDepletion) * actualInternalDt,
      0.2, 1.0
    );

    // Update intermediate state
    currentState = {
      ...currentState,
      glucosePool: clamp(newGI[0], 40, 400),
      insulinAction: newGI[1],
      insulinPool: clamp(newGI[2], 0, 200),
      hepaticGlycogen: clamp(newGI[3], 0, 1),
      adenosinePressure: newAdenosine,
      crhPool: clamp(newHPA[0], 0, 5),
      cortisolPool: newHPA[1],
      cortisolIntegral: newHPA[2],
      adrenalineReserve: newAdrenalineReserve,
    };
  }

  // Final derivative-based updates for neurotransmitters (simpler models)
  const daFiringRate = clamp(
    (inputs.dopamineFiringRate ?? 0.5) + (inputs.stimulantEffect ?? 0) * 0.3,
    0, 1
  );
  const daDopamine = vesiclePoolDerivative(currentState.dopamineVesicles, {
    firingRate: daFiringRate,
    precursorAvailability: 0.8,
    drugEffect: inputs.stimulantEffect ?? 0,
  });
  const newDopamineVesicles = clamp(currentState.dopamineVesicles + daDopamine * dt, 0.1, 1);

  const neFiringRate = clamp(
    (inputs.norepiFiringRate ?? 0.5) + (inputs.stimulantEffect ?? 0) * 0.2,
    0, 1
  );
  const daNorepi = vesiclePoolDerivative(currentState.norepinephrineVesicles, {
    firingRate: neFiringRate,
    precursorAvailability: 0.8,
    drugEffect: inputs.stimulantEffect ?? 0,
  });
  const newNorepiVesicles = clamp(currentState.norepinephrineVesicles + daNorepi * dt, 0.1, 1);

  const serotoninFiring = clamp(inputs.serotoninFiringRate ?? 0.5, 0, 1);
  const tryptophan = inputs.tryptophanAvailability ?? 0.7;
  const dSerotonin = vesiclePoolDerivative(currentState.serotoninPrecursor, {
    firingRate: serotoninFiring,
    precursorAvailability: tryptophan,
    drugEffect: 0,
  });
  const newSerotoninPrecursor = clamp(currentState.serotoninPrecursor + dSerotonin * dt, 0.1, 1);

  const gabaBoost = (inputs.gabaBoost ?? 0) + currentState.adenosinePressure * 0.3 + (inputs.alcoholLevel ?? 0) * 0.02;
  const gabaRecovery = 0.003 * (0.7 - currentState.gabaPool);
  const gabaActivity = 0.002 * gabaBoost * (1 - currentState.gabaPool);
  const newGabaPool = clamp(currentState.gabaPool + (gabaRecovery + gabaActivity) * dt, 0.3, 1.0);

  const glutamateBlock = inputs.glutamateBlock ?? 0;
  const glutamateRecovery = 0.002 * (0.7 - currentState.glutamatePool);
  const glutamateExcitation = (inputs.stressLevel ?? 0) * 0.01 * (1 - currentState.glutamatePool);
  const glutamateSuppression = 0.005 * glutamateBlock * currentState.glutamatePool;
  const newGlutamatePool = clamp(
    currentState.glutamatePool + (glutamateRecovery + glutamateExcitation - glutamateSuppression) * dt,
    0.3, 1.0
  );

  const achCircadian = inputs.isAsleep ? 0.8 : 1.0;
  const achTarget = achCircadian * 0.6;
  const achDelta = 0.01 * (achTarget - currentState.acetylcholineTone);
  const newAchTone = clamp(currentState.acetylcholineTone + achDelta * dt, 0.2, 1.0);

  const bdnfExerciseBoost = (inputs.exerciseIntensity ?? 0) * 0.02;
  const bdnfStressSuppression = currentState.cortisolIntegral * 0.001;
  const bdnfRecovery = 0.001 * (0.6 - currentState.bdnfExpression);
  const newBdnfExpression = clamp(
    currentState.bdnfExpression + (bdnfRecovery + bdnfExerciseBoost - bdnfStressSuppression) * dt,
    0.2, 1.0
  );

  const ghReleaseTrigger = inputs.isAsleep ? 0.02 : (inputs.exerciseIntensity ?? 0) > 0.6 ? 0.015 : 0;
  const ghRecovery = 0.001 * (0.8 - currentState.ghReserve);
  const ghRelease = ghReleaseTrigger * currentState.ghReserve;
  const newGhReserve = clamp(currentState.ghReserve + (ghRecovery - ghRelease) * dt, 0.3, 1.0);

  // Receptor Adaptation
  const newReceptorStates = { ...currentState.receptorStates };
  const minDensity = RECEPTOR_ADAPTATION.MIN_DENSITY;
  const maxDensity = RECEPTOR_ADAPTATION.MAX_DENSITY;

  // D2
  const stimulantOccupancy = inputs.stimulantEffect ?? 0;
  if (stimulantOccupancy > RECEPTOR_ADAPTATION.OCCUPANCY_THRESHOLD) {
    const d2Current = newReceptorStates['D2'] ?? 1.0;
    const d2Delta = receptorAdaptation(d2Current, stimulantOccupancy, 'full_agonist', 'D2');
    newReceptorStates['D2'] = clamp(d2Current + d2Delta * dt, minDensity, maxDensity);
  } else if (newReceptorStates['D2'] !== undefined && newReceptorStates['D2'] !== 1.0) {
    const d2Current = newReceptorStates['D2'];
    const d2Delta = receptorAdaptation(d2Current, 0, 'full_agonist', 'D2');
    newReceptorStates['D2'] = clamp(d2Current + d2Delta * dt, minDensity, maxDensity);
  }

  // GABA-A
  const gabaOccupancy = inputs.gabaBoost ?? 0;
  if (gabaOccupancy > RECEPTOR_ADAPTATION.OCCUPANCY_THRESHOLD * 0.7) {
    const gabaAcurrent = newReceptorStates['GABA_A'] ?? 1.0;
    const gabaAdelta = receptorAdaptation(gabaAcurrent, gabaOccupancy, 'pam', 'GABAA');
    newReceptorStates['GABA_A'] = clamp(gabaAcurrent + gabaAdelta * dt, minDensity, maxDensity);
  } else if (newReceptorStates['GABA_A'] !== undefined && newReceptorStates['GABA_A'] !== 1.0) {
    const gabaAcurrent = newReceptorStates['GABA_A'];
    const gabaAdelta = receptorAdaptation(gabaAcurrent, 0, 'pam', 'GABAA');
    newReceptorStates['GABA_A'] = clamp(gabaAcurrent + gabaAdelta * dt, minDensity, maxDensity);
  }

  // A2A
  const caffeineOccupancy = (inputs.caffeineLevel ?? 0) / 200;
  if (caffeineOccupancy > RECEPTOR_ADAPTATION.OCCUPANCY_THRESHOLD) {
    const a2aCurrent = newReceptorStates['A2A'] ?? 1.0;
    const a2aDelta = receptorAdaptation(a2aCurrent, caffeineOccupancy, 'antagonist', 'A2A');
    newReceptorStates['A2A'] = clamp(a2aCurrent + a2aDelta * dt, minDensity, maxDensity);
  } else if (newReceptorStates['A2A'] !== undefined && newReceptorStates['A2A'] !== 1.0) {
    const a2aCurrent = newReceptorStates['A2A'];
    const a2aDelta = receptorAdaptation(a2aCurrent, 0, 'antagonist', 'A2A');
    newReceptorStates['A2A'] = clamp(a2aCurrent + a2aDelta * dt, minDensity, maxDensity);
  }

  // 5-HT2A
  const serotoninOccupancy = (inputs.serotoninFiringRate ?? 0.5) - 0.5;
  if (Math.abs(serotoninOccupancy) > 0.2) {
    const ht2aCurrent = newReceptorStates['5HT2A'] ?? 1.0;
    const mechanism = serotoninOccupancy > 0 ? 'full_agonist' : 'antagonist';
    const ht2aDelta = receptorAdaptation(ht2aCurrent, Math.abs(serotoninOccupancy * 2), mechanism, '5HT2A');
    newReceptorStates['5HT2A'] = clamp(ht2aCurrent + ht2aDelta * dt, minDensity, maxDensity);
  }

  // Beta Adrenergic
  const betaOccupancy = (inputs.stressLevel ?? 0) + (inputs.exerciseIntensity ?? 0) * 0.5;
  if (betaOccupancy > RECEPTOR_ADAPTATION.OCCUPANCY_THRESHOLD) {
    const betaCurrent = newReceptorStates['BETA'] ?? 1.0;
    const betaDelta = receptorAdaptation(betaCurrent, betaOccupancy, 'full_agonist', 'BETA_ADRENERGIC');
    newReceptorStates['BETA'] = clamp(betaCurrent + betaDelta * dt, minDensity, maxDensity);
  } else if (newReceptorStates['BETA'] !== undefined && newReceptorStates['BETA'] !== 1.0) {
    const betaCurrent = newReceptorStates['BETA'];
    const betaDelta = receptorAdaptation(betaCurrent, 0, 'full_agonist', 'BETA_ADRENERGIC');
    newReceptorStates['BETA'] = clamp(betaCurrent + betaDelta * dt, minDensity, maxDensity);
  }

  // NMDA
  const glutamateBlockOccupancy = inputs.glutamateBlock ?? 0;
  if (glutamateBlockOccupancy > RECEPTOR_ADAPTATION.OCCUPANCY_THRESHOLD) {
    const nmdaCurrent = newReceptorStates['NMDA'] ?? 1.0;
    const nmdaDelta = receptorAdaptation(nmdaCurrent, glutamateBlockOccupancy, 'antagonist', 'NMDA');
    newReceptorStates['NMDA'] = clamp(nmdaCurrent + nmdaDelta * dt, minDensity, maxDensity);
  }

  // Final state
  const finalState: HomeostasisState = {
    ...currentState,
    dopamineVesicles: newDopamineVesicles,
    norepinephrineVesicles: newNorepiVesicles,
    serotoninPrecursor: newSerotoninPrecursor,
    acetylcholineTone: newAchTone,
    gabaPool: newGabaPool,
    glutamatePool: newGlutamatePool,
    bdnfExpression: newBdnfExpression,
    ghReserve: newGhReserve,
    receptorStates: newReceptorStates,
  };

  // Compute corrections relative to analytical baselines
  const vesicleDepletionFactor = (pool: number, baseline: number) => {
    const depletionThreshold = 0.5;
    if (pool >= 0.8) return 0;
    if (pool <= depletionThreshold) return -baseline * 0.3;
    const severity = 1 - (pool - depletionThreshold) / (0.8 - depletionThreshold);
    return -baseline * 0.3 * severity;
  };

  const glucoseCorrection = finalState.glucosePool - (inputs.baselineGlucose ?? 90);
  const insulinCorrection = finalState.insulinPool - 8;
  const cortisolCorrection = finalState.cortisolPool - (inputs.baselineCortisol ?? 12);
  const adenosineEffect = finalState.adenosinePressure * 20;
  const betaFactor = (newReceptorStates['BETA'] ?? 1.0) - 1.0;
  const betaEffect = betaFactor * 0.15;

  return {
    newState: finalState,
    corrections: {
      glucose: glucoseCorrection,
      insulin: insulinCorrection,
      cortisol: cortisolCorrection,
      histamine: -finalState.adenosinePressure * 10,
      orexin: -finalState.adenosinePressure * 15,
      energy: -finalState.adenosinePressure * 25 + (inputs.exerciseIntensity ?? 0) * 10,
      melatonin: inputs.isAsleep ? finalState.adenosinePressure * 5 : -finalState.adenosinePressure * 3,
      dopamine: vesicleDepletionFactor(newDopamineVesicles, inputs.baselineDopamine ?? 50) + (inputs.baselineDopamine ?? 50) * ((newReceptorStates['D2'] ?? 1.0) - 1.0) * 0.25,
      norepi: vesicleDepletionFactor(newNorepiVesicles, inputs.baselineNorepi ?? 50) + betaEffect * (inputs.baselineNorepi ?? 50),
      serotonin: vesicleDepletionFactor(newSerotoninPrecursor, inputs.baselineSerotonin ?? 50) + (inputs.baselineSerotonin ?? 50) * ((newReceptorStates['5HT2A'] ?? 1.0) - 1.0) * 0.2,
      gaba: (newGabaPool - 0.7) * (inputs.baselineGaba ?? 50) * 0.3 + (inputs.baselineGaba ?? 50) * ((newReceptorStates['GABA_A'] ?? 1.0) - 1.0) * 0.2,
      glutamate: (newGlutamatePool - 0.7) * (inputs.baselineGlutamate ?? 50) * 0.3 + (inputs.baselineGlutamate ?? 50) * ((newReceptorStates['NMDA'] ?? 1.0) - 1.0) * 0.25,
      acetylcholine: (newAchTone - 0.6) * (inputs.baselineAcetylcholine ?? 50) * 0.2,
      adrenaline: (finalState.adrenalineReserve - 0.9) * (inputs.baselineAdrenaline ?? 50) * 0.4 + betaEffect * (inputs.baselineAdrenaline ?? 50),
      bdnf: (newBdnfExpression - 0.6) * (inputs.baselineBdnf ?? 50) * 0.3,
      growthHormone: ghReleaseTrigger > 0 ? finalState.ghReserve * 5 : 0,
      adenosineModulation: adenosineEffect * ((newReceptorStates['A2A'] ?? 1.0) - 1.0) * 0.3,
    },
  };
}

// --- Serialization for State Persistence ---

/**
 * Serialize HomeostasisState to a JSON-safe snapshot for storage
 */
export function serializeHomeostasisState(state: HomeostasisState): HomeostasisStateSnapshot {
  return {
    glucosePool: state.glucosePool,
    insulinPool: state.insulinPool,
    insulinAction: state.insulinAction,
    hepaticGlycogen: state.hepaticGlycogen,
    adenosinePressure: state.adenosinePressure,
    crhPool: state.crhPool,
    cortisolPool: state.cortisolPool,
    cortisolIntegral: state.cortisolIntegral,
    adrenalineReserve: state.adrenalineReserve,
    dopamineVesicles: state.dopamineVesicles,
    norepinephrineVesicles: state.norepinephrineVesicles,
    serotoninPrecursor: state.serotoninPrecursor,
    acetylcholineTone: state.acetylcholineTone,
    gabaPool: state.gabaPool,
    glutamatePool: state.glutamatePool,
    bdnfExpression: state.bdnfExpression,
    ghReserve: state.ghReserve,
    receptorStates: { ...state.receptorStates },
  };
}

/**
 * Deserialize a snapshot back to HomeostasisState
 * Merges with defaults to handle version migrations
 */
export function deserializeHomeostasisState(
  snapshot: Partial<HomeostasisStateSnapshot> | undefined
): HomeostasisState {
  if (!snapshot) {
    return { ...DEFAULT_HOMEOSTASIS_STATE };
  }

  return {
    glucosePool: snapshot.glucosePool ?? DEFAULT_HOMEOSTASIS_STATE.glucosePool,
    insulinPool: snapshot.insulinPool ?? DEFAULT_HOMEOSTASIS_STATE.insulinPool,
    insulinAction: snapshot.insulinAction ?? DEFAULT_HOMEOSTASIS_STATE.insulinAction,
    hepaticGlycogen: snapshot.hepaticGlycogen ?? DEFAULT_HOMEOSTASIS_STATE.hepaticGlycogen,
    adenosinePressure: snapshot.adenosinePressure ?? DEFAULT_HOMEOSTASIS_STATE.adenosinePressure,
    crhPool: snapshot.crhPool ?? DEFAULT_HOMEOSTASIS_STATE.crhPool,
    cortisolPool: snapshot.cortisolPool ?? DEFAULT_HOMEOSTASIS_STATE.cortisolPool,
    cortisolIntegral: snapshot.cortisolIntegral ?? DEFAULT_HOMEOSTASIS_STATE.cortisolIntegral,
    adrenalineReserve: snapshot.adrenalineReserve ?? DEFAULT_HOMEOSTASIS_STATE.adrenalineReserve,
    dopamineVesicles: snapshot.dopamineVesicles ?? DEFAULT_HOMEOSTASIS_STATE.dopamineVesicles,
    norepinephrineVesicles: snapshot.norepinephrineVesicles ?? DEFAULT_HOMEOSTASIS_STATE.norepinephrineVesicles,
    serotoninPrecursor: snapshot.serotoninPrecursor ?? DEFAULT_HOMEOSTASIS_STATE.serotoninPrecursor,
    acetylcholineTone: snapshot.acetylcholineTone ?? DEFAULT_HOMEOSTASIS_STATE.acetylcholineTone,
    gabaPool: snapshot.gabaPool ?? DEFAULT_HOMEOSTASIS_STATE.gabaPool,
    glutamatePool: snapshot.glutamatePool ?? DEFAULT_HOMEOSTASIS_STATE.glutamatePool,
    bdnfExpression: snapshot.bdnfExpression ?? DEFAULT_HOMEOSTASIS_STATE.bdnfExpression,
    ghReserve: snapshot.ghReserve ?? DEFAULT_HOMEOSTASIS_STATE.ghReserve,
    receptorStates: snapshot.receptorStates
      ? { ...snapshot.receptorStates }
      : { ...DEFAULT_HOMEOSTASIS_STATE.receptorStates },
  };
}

/**
 * Create a fresh homeostasis state, optionally based on a snapshot
 */
export function createHomeostasisState(
  snapshot?: Partial<HomeostasisStateSnapshot>
): HomeostasisState {
  return deserializeHomeostasisState(snapshot);
}

// --- Export for engine integration ---

export {
  rk4Step,
  glucoseInsulinDerivatives,
  sleepPressureDerivative,
  hpaDerivatives,
  vesiclePoolDerivative,
};
