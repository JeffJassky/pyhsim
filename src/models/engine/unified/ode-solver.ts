import type {
  SimulationState,
  DynamicsContext,
  UnifiedSignalDefinition,
  ClearanceTerm,
  ProductionTerm,
  AuxiliaryDefinition,
  ActiveIntervention,
  SolverDebugOptions
} from '@/types/unified';
import { type Signal } from '@/types/neurostate';
import { addStates, scaleState, initializeZeroState } from './state';
import { clamp, hill } from './utils';
import { isReceptor, getReceptorSignals } from '../../library/pharmacology';

/**
 * Calculate volume of distribution in Liters based on PK spec and subject
 */
function calculateVolumeOfDistribution(volumeSpec: any, ctx: DynamicsContext): number {
  if (!volumeSpec) return 50; // Default ~50L for a 70kg person

  const weight = ctx.subject?.weight ?? 70;
  const sex = ctx.subject?.sex ?? 'male';
  const tbw = ctx.physiology?.tbw ?? (weight * 0.6);
  const lbm = ctx.physiology?.leanBodyMass ?? (weight * 0.8);

  switch (volumeSpec.kind) {
    case 'tbw':
      return tbw * (volumeSpec.fraction ?? 0.6);
    case 'lbm':
      return lbm * (volumeSpec.base_L_kg ?? 1.0);
    case 'weight':
      return weight * (volumeSpec.base_L_kg ?? 0.7);
    case 'sex-adjusted':
      return weight * (sex === 'male' ? volumeSpec.male_L_kg : volumeSpec.female_L_kg);
    default:
      return 50;
  }
}

export type SignalDefinitionMap = Partial<Record<Signal, UnifiedSignalDefinition>>;
export type AuxiliaryDefinitionMap = Record<string, AuxiliaryDefinition>;

export interface SolverOptions {
  definitions: SignalDefinitionMap;
  auxiliaryDefinitions: AuxiliaryDefinitionMap;
  dt: number;
  debug?: SolverDebugOptions;
}

/**
 * Compute derivatives for the entire unified system
 */
export function computeDerivatives(
  state: SimulationState,
  t: number,
  ctx: DynamicsContext,
  definitions: SignalDefinitionMap,
  auxiliaryDefinitions: AuxiliaryDefinitionMap = {},
  interventions: ActiveIntervention[] = [],
  debug?: SolverDebugOptions
): SimulationState {
  const derivatives = initializeZeroState();

  // --- 1. PK Compartment Derivatives ---
  // Group interventions by centralKey to handle multi-day dosing correctly
  const pkProcessed = new Set<string>();

  for (const intervention of interventions) {
    if (!intervention.pharmacology?.pk) continue;
    const pk = intervention.pharmacology.pk;
    const centralKey = `${intervention.id}_central`;

    // Skip if we've already processed this compartment
    if (pkProcessed.has(centralKey)) continue;
    pkProcessed.add(centralKey);

    const centralConc = state.pk[centralKey] ?? 0;

    // Activity-dependent interventions (sleep, exercise, meditation, etc.)
    if (pk.model === 'activity-dependent') {
      // Find if ANY intervention with this key is active
      const activeInt = interventions.find(iv =>
        `${iv.id}_central` === centralKey &&
        t >= iv.startTime && t <= iv.startTime + iv.duration
      );
      const targetConc = activeInt ? activeInt.intensity : 0;
      const tau = 5;
      derivatives.pk[centralKey] = (targetConc - centralConc) / tau;
      continue;
    }

    // Drug-based: sum inputs from ALL interventions sharing this compartment
    let totalInput = 0;
    for (const iv of interventions) {
      if (`${iv.id}_central` !== centralKey) continue;
      if (!iv.pharmacology?.pk) continue;

      const isActive = t >= iv.startTime && t <= iv.startTime + iv.duration;
      if (!isActive) continue;

      const dose = iv.params?.mg ?? iv.params?.dose ?? iv.params?.units ?? 100;
      const bioavailability = iv.pharmacology.pk.bioavailability ?? 1.0;
      const effectiveDose = dose * bioavailability * iv.intensity;
      const Vd = calculateVolumeOfDistribution(iv.pharmacology.pk.volume, ctx);

      totalInput += effectiveDose / iv.duration / Vd;
    }

    // Elimination: dC/dt = totalInput - ke * C
    const ke = pk.eliminationRate ?? (0.693 / (pk.halfLifeMin ?? 60));
    let dCentral = totalInput - ke * centralConc;

    // 2-Compartment handling
    if (pk.model === '2-compartment' && pk.k_12 && pk.k_21) {
      const peripheralKey = `${intervention.id}_peripheral`;
      const peripheralConc = state.pk[peripheralKey] ?? 0;
      dCentral += pk.k_21 * peripheralConc - pk.k_12 * centralConc;
      derivatives.pk[peripheralKey] = pk.k_12 * centralConc - pk.k_21 * peripheralConc;
    }

    derivatives.pk[centralKey] = dCentral;
  }

  // --- 2. Signal Derivatives ---
  for (const signalKey of Object.keys(definitions) as Signal[]) {
    const def = definitions[signalKey];
    if (!def) continue;

    const currentValue = state.signals[signalKey] ?? 0;
    const setpoint = (debug?.enableBaselines !== false) ? def.dynamics.setpoint(ctx) : 0;

    // Base return-to-setpoint dynamics
    let dSignal = (setpoint - currentValue) / def.dynamics.tau;

    // Production terms
    if (debug?.enableBaselines !== false) {
      for (const prod of def.dynamics.production) {
        const sourceValue = getSourceValue(prod.source, state, ctx);
        const transformedValue = prod.transform?.(sourceValue, state, ctx) ?? sourceValue;
        dSignal += prod.coefficient * transformedValue;
      }
    }

    // Clearance terms
    for (const clear of def.dynamics.clearance) {
      const clearanceRate = computeClearanceRate(clear, currentValue, state, ctx);
      dSignal -= clearanceRate * currentValue;
    }

    // Couplings (Modulated by Receptor Sensitivity)
    // Coupling strengths are normalized by tau to convert from analytical values to ODE rates
    if (debug?.enableCouplings !== false) {
      for (const coupling of def.dynamics.couplings) {
        const sourceValue = getSourceValue(coupling.source, state, ctx);
        const receptorKey = `${coupling.source}_sensitivity`;
        const sensitivity = state.receptors[receptorKey] ?? 1.0;
        // Normalize by tau: strength represents "units change per unit source at steady state"
        // Dividing by tau converts to rate of change per minute
        const normalizedStrength = coupling.strength / def.dynamics.tau;
        const effect = normalizedStrength * sourceValue * sensitivity;
        dSignal += coupling.effect === 'stimulate' ? effect : -effect;
      }
    }

    // Interventions (Forcing functions)
    if (debug?.enableInterventions !== false) {
      for (const intervention of interventions) {
        // 1. Simple Rate support
        if ((intervention as any).target === signalKey && (intervention as any).type === 'rate') {
          const isActive = t >= intervention.startTime && (!intervention.duration || t <= intervention.startTime + intervention.duration);
          if (isActive) {
            dSignal += (intervention as any).magnitude ?? 0;
          }
        }

        // 2. Mechanistic PD support
        if (intervention.pharmacology?.pd) {
          const centralKey = `${intervention.id}_central`;
          const concentration = state.pk[centralKey] ?? 0;

          if (concentration > 0) {
            const pk = intervention.pharmacology.pk;
            const isActivityDependent = pk?.model === 'activity-dependent';

            for (const effect of intervention.pharmacology.pd) {
              // Determine all signals affected by this target and their coupling sign
              // sign: 1 = excitatory (agonist increases signal), -1 = inhibitory (agonist decreases signal)
              const targets = getSignalTargets(effect.target);
              if (effect.target === signalKey) {
                targets.push({ signal: signalKey as Signal, sign: 1 });
              }

              const targetSpec = targets.find(t => t.signal === signalKey);
              
              if (targetSpec) {
                const density = state.receptors[`${effect.target}_density`] ?? 1.0;
                const signalTau = def.dynamics.tau;

                let response: number;

                if (isActivityDependent) {
                  // Activity-dependent: concentration is 0-1
                  // Normalize by signalTau so effectGain represents steady-state unit shift
                  response = (concentration * (effect.effectGain ?? 10) * density) / signalTau;
                } else {
                  // Drug-based: use Hill function with Ki or EC50
                  let effectiveConc = concentration;
                  const molarMass = intervention.pharmacology?.molecule?.molarMass;
                  
                  // Convert mg/L to nM or uM if specified and molar mass is available
                  if (molarMass && molarMass > 0) {
                    if (effect.unit === 'nM') {
                      effectiveConc = (concentration / molarMass) * 1000000;
                    } else if (effect.unit === 'uM' || effect.unit === 'µM') {
                      effectiveConc = (concentration / molarMass) * 1000;
                    }
                  }

                  const EC50 = effect.EC50 ?? effect.Ki ?? 100;
                  const occupancy = hill(effectiveConc, EC50, 1.2);
                  const efficacy = effect.tau ?? 10;
                  
                  // Normalize by signalTau so effectGain represents steady-state unit shift
                  response = (EmaxModel(occupancy, efficacy) * (effect.effectGain ?? 50) * density) / signalTau;
                }

                // Apply pathway polarity
                if (effect.mechanism === 'agonist' || effect.mechanism === 'PAM') {
                  dSignal += response * targetSpec.sign;
                } else if (effect.mechanism === 'antagonist') {
                  // Antagonist logic:
                  // 1. Blocking an EXCITATORY target (sign > 0) -> Reduces signal.
                  //    Scale by current value to prevent going below zero (cannot block what isn't there).
                  // 2. Blocking an INHIBITORY target (sign < 0) -> Increases signal (Disinhibition).
                  //    Add directly (like an agonist) since we are releasing the brake.
                  
                  if (targetSpec.sign > 0) {
                    dSignal -= response * targetSpec.sign * (currentValue / (currentValue + 20));
                  } else {
                    // sign is negative, so -response * sign is positive
                    dSignal -= response * targetSpec.sign; 
                  }
                }
              }
            }
          }
        }
      }
    }

    derivatives.signals[signalKey] = Number.isFinite(dSignal) ? dSignal : 0;
  }

  // --- 3. Receptor Adaptation Derivatives ---
  if (debug?.enableReceptors !== false) {
    for (const receptorKey of Object.keys(state.receptors)) {
      if (receptorKey.endsWith('_density')) {
        const baseKey = receptorKey.replace('_density', '');
        const R = state.receptors[receptorKey];
        
        let totalOccupancy = 0;
        for (const intervention of interventions) {
          if (!intervention.pharmacology?.pd) continue;
          const conc = state.pk[`${intervention.id}_central`] ?? 0;
          const effect = intervention.pharmacology.pd.find((e: any) => e.target === baseKey);
          if (effect && conc > 0) {
            totalOccupancy += hill(conc, effect.EC50 ?? 100, 1.2);
          }
        }

        const dR = 0.0005 * (1.0 - R) - 0.002 * Math.min(1.0, totalOccupancy) * R;
        derivatives.receptors[receptorKey] = dR;
      }
    }
  }

  // --- 4. Auxiliary Derivatives ---
  for (const auxKey of Object.keys(auxiliaryDefinitions)) {
    const def = auxiliaryDefinitions[auxKey];
    const currentValue = state.auxiliary[auxKey] ?? 0;
    const setpoint = (debug?.enableHomeostasis !== false) ? def.dynamics.setpoint(ctx) : 0;
    let dAux = (setpoint - currentValue) / def.dynamics.tau;

    if (debug?.enableHomeostasis !== false) {
      for (const prod of def.dynamics.production) {
        const sourceValue = getSourceValue(prod.source, state, ctx);
        dAux += prod.coefficient * (prod.transform?.(sourceValue, state, ctx) ?? sourceValue);
      }
    }

    for (const clear of def.dynamics.clearance) {
      dAux -= computeClearanceRate(clear, currentValue, state, ctx) * currentValue;
    }

    // Interventions targeting auxiliary variables (Transporters/Enzymes)
    if (debug?.enableInterventions !== false) {
      for (const intervention of interventions) {
        if (intervention.pharmacology?.pd) {
          const centralKey = `${intervention.id}_central`;
          const concentration = state.pk[centralKey] ?? 0;

          if (concentration > 0) {
            for (const effect of intervention.pharmacology.pd) {
              if (effect.target === auxKey) {
                // For enzymes/transporters, we usually don't have density states, 
                // but we can scale by the current value to represent percent inhibition
                const EC50 = effect.EC50 ?? effect.Ki ?? 100;
                const occupancy = hill(concentration, EC50, 1.2);
                
                // Gain here represents maximum steady-state shift
                // For a transporter, effectGain 30.0 means it can shift activity by 30 (e.g. huge inhibition)
                const tau = def.dynamics.tau;
                const response = (occupancy * (effect.effectGain ?? 1.0)) / tau;

                if (effect.mechanism === 'agonist' || effect.mechanism === 'PAM') {
                  dAux += response;
                } else if (effect.mechanism === 'antagonist' || effect.mechanism === 'NAM') {
                  dAux -= response * (currentValue / (currentValue + 0.1));
                }
              }
            }
          }
        }
      }
    }

    derivatives.auxiliary[auxKey] = Number.isFinite(dAux) ? dAux : 0;
  }

  return derivatives;
}

/**
 * 4th Order Runge-Kutta Integrator Step
 */
export function integrateStep(
  state: SimulationState,
  t: number,
  dt: number,
  ctx: DynamicsContext,
  definitions: SignalDefinitionMap,
  auxiliaryDefinitions: AuxiliaryDefinitionMap = {},
  interventions: ActiveIntervention[] = [],
  debug?: SolverDebugOptions
): SimulationState {
  const k1 = computeDerivatives(state, t, ctx, definitions, auxiliaryDefinitions, interventions, debug);
  
  const k2State = addStates(state, scaleState(k1, dt / 2));
  const k2 = computeDerivatives(k2State, t + dt / 2, ctx, definitions, auxiliaryDefinitions, interventions, debug);
  
  const k3State = addStates(state, scaleState(k2, dt / 2));
  const k3 = computeDerivatives(k3State, t + dt / 2, ctx, definitions, auxiliaryDefinitions, interventions, debug);
  
  const k4State = addStates(state, scaleState(k3, dt));
  const k4 = computeDerivatives(k4State, t + dt, ctx, definitions, auxiliaryDefinitions, interventions, debug);

  const combined = scaleState(
    addStates(
      k1,
      addStates(
        scaleState(k2, 2),
        addStates(scaleState(k3, 2), k4)
      )
    ),
    1 / 6
  );

  let nextState = addStates(state, scaleState(combined, dt));

  if (debug?.enableBaselines !== false) {
    for (const signalKey of Object.keys(definitions) as Signal[]) {
      const def = definitions[signalKey]!;
      const min = def.min ?? 0;
      const max = def.max ?? Infinity;
      nextState.signals[signalKey] = clamp(nextState.signals[signalKey], min, max);
    }
  }

  for (const auxKey of Object.keys(auxiliaryDefinitions)) {
    // Keep auxiliary variables like enzymes/vesicles in [0, 2] range
    nextState.auxiliary[auxKey] = clamp(nextState.auxiliary[auxKey], 0, 2.0);
  }

  return nextState;
}

function getSourceValue(source: ProductionTerm['source'], state: SimulationState, ctx: DynamicsContext): number {
  if (source === 'constant' || source === 'circadian') return 1.0;
  return Math.max(0, state.signals[source] ?? 0);
}

function EmaxModel(occupancy: number, tau: number): number {
  return (occupancy * tau) / (occupancy * tau + occupancy + 1);
}

/**
 * Get signals affected by a pharmacological target.
 * Uses centralized registry from @/models/library/pharmacology.
 * Transporters/enzymes return empty (they work via clearance, not direct coupling).
 */
function getSignalTargets(target: string): Array<{ signal: Signal, sign: number }> {
  if (isReceptor(target)) {
    return getReceptorSignals(target);
  }
  // Transporters and enzymes don't directly couple to signals
  // (they work via clearance mechanisms in the auxiliary system)
  return [];
}

function computeClearanceRate(clear: ClearanceTerm, currentValue: number, state: SimulationState, ctx: DynamicsContext): number {
  let rate = clear.rate;

  switch (clear.type) {
    case 'linear':
      rate = clear.rate;
      break;
    case 'saturable':
      const Km = clear.Km ?? 100;
      rate = clear.rate / (Km + currentValue);
      break;
    case 'enzyme-dependent':
      // Default to 1.0 if enzyme not initialized (enzymes have baseline activity of 1)
      const enzymeActivity = state.auxiliary[clear.enzyme!] ?? 1.0;
      rate = clear.rate * enzymeActivity;
      break;
  }

  if (clear.transform) {
    rate = rate * clear.transform(currentValue, state, ctx);
  }

  return Math.max(0, rate);
}
