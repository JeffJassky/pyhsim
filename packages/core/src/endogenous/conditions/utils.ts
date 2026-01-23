import type {
  Signal,
  ResponseSpec,
  ProfileBaselineAdjustments,
  ProfileCouplingAdjustments,
} from "../../engine";
import { RECEPTOR_SIGNAL_MAP, RECEPTOR_SENSITIVITY_GAIN } from "./mappings";
import type {
  ConditionKey,
  ConditionDef,
  ConditionStateSnapshot,
  ConditionAdjustments,
} from "./types";
import type { ReceptorKey, TransporterKey, EnzymeKey } from "../targets";
import { CONDITION_LIBRARY } from "./index";

const linear = (gain: number): ResponseSpec => ({ kind: "linear", gain });

/**
 * Computes signal adjustments from receptor/transporter modifiers
 */
function computeMechanisticEffects(
  condition: ConditionDef,
  intensity: number,
): {
  baselines: ProfileBaselineAdjustments;
  receptors: Partial<Record<ReceptorKey, number>>;
  transporters: Partial<Record<TransporterKey, number>>;
  sensitivities: Partial<Record<ReceptorKey, number>>;
} {
  const baselines: ProfileBaselineAdjustments = {};
  const receptors: Partial<Record<ReceptorKey, number>> = {};
  const transporters: Partial<Record<TransporterKey, number>> = {};
  const sensitivities: Partial<Record<ReceptorKey, number>> = {};

  for (const mod of condition.receptorModifiers ?? []) {
    const densityDelta = (mod.density ?? 0) * intensity;
    if (densityDelta !== 0) {
      receptors[mod.receptor] = (receptors[mod.receptor] ?? 0) + densityDelta;
      const densityMappings = RECEPTOR_SIGNAL_MAP[mod.receptor] ?? [];
      for (const { signal, gainPerDensity } of densityMappings) {
        const signalDelta = densityDelta * gainPerDensity;
        baselines[signal] = baselines[signal] ?? {};
        baselines[signal]!.amplitude =
          (baselines[signal]!.amplitude ?? 0) + signalDelta;
      }
    }

    const sensitivityDelta = (mod.sensitivity ?? 0) * intensity;
    if (sensitivityDelta !== 0) {
      sensitivities[mod.receptor] =
        (sensitivities[mod.receptor] ?? 0) + sensitivityDelta;
      const sensitivityMappings = RECEPTOR_SENSITIVITY_GAIN[mod.receptor] ?? [];
      for (const { signal, gainPerSensitivity } of sensitivityMappings) {
        const signalDelta = sensitivityDelta * gainPerSensitivity;
        baselines[signal] = baselines[signal] ?? {};
        baselines[signal]!.amplitude =
          (baselines[signal]!.amplitude ?? 0) + signalDelta;
      }
    }
  }

  for (const mod of condition.transporterModifiers ?? []) {
    const delta = mod.activity * intensity;
    transporters[mod.transporter] =
      (transporters[mod.transporter] ?? 0) + delta;
  }

  return { baselines, receptors, transporters, sensitivities };
}

/**
 * Builds the complete condition adjustments from enabled conditions
 */
export function buildConditionAdjustments(
  state: Record<ConditionKey, ConditionStateSnapshot>,
): ConditionAdjustments {
  const baselineAdjustments: ProfileBaselineAdjustments = {};
  const couplingAdjustments: ProfileCouplingAdjustments = {};
  const receptorDensities: Partial<Record<ReceptorKey, number>> = {};
  const receptorSensitivities: Partial<Record<ReceptorKey, number>> = {};
  const transporterActivities: Partial<Record<TransporterKey, number>> = {};
  const enzymeActivities: Partial<Record<EnzymeKey, number>> = {};

  const ensureBaseline = (signal: Signal) => {
    if (!baselineAdjustments[signal]) {
      baselineAdjustments[signal] = {};
    }
    return baselineAdjustments[signal]!;
  };

  for (const condition of CONDITION_LIBRARY) {
    const snapshot = state[condition.key];
    if (!snapshot?.enabled) continue;

    const defaultParamKey = condition.params[0]?.key;
    const hasMechanistic = !!(
      condition.receptorModifiers?.length ||
      condition.transporterModifiers?.length ||
      condition.enzymeModifiers?.length
    );

    const paramKey =
      condition.receptorModifiers?.[0]?.paramKey ?? defaultParamKey;
    const intensity =
      paramKey && snapshot.params[paramKey] !== undefined
        ? snapshot.params[paramKey]
        : 1;

    const {
      baselines: mechBaselines,
      receptors,
      transporters,
      sensitivities,
    } = computeMechanisticEffects(condition, intensity);

    for (const [signal, adj] of Object.entries(mechBaselines)) {
      if (!adj) continue;
      const record = ensureBaseline(signal as Signal);
      record.amplitude = (record.amplitude ?? 0) + (adj.amplitude ?? 0);
    }

    for (const [rec, val] of Object.entries(receptors)) {
      if (val === undefined) continue;
      receptorDensities[rec as ReceptorKey] =
        (receptorDensities[rec as ReceptorKey] ?? 0) + val;
    }

    for (const [rec, val] of Object.entries(sensitivities)) {
      if (val === undefined) continue;
      receptorSensitivities[rec as ReceptorKey] =
        (receptorSensitivities[rec as ReceptorKey] ?? 0) + val;
    }

    for (const [trans, val] of Object.entries(transporters)) {
      if (val === undefined) continue;
      transporterActivities[trans as TransporterKey] =
        (transporterActivities[trans as TransporterKey] ?? 0) + val;
    }

    for (const modifier of condition.signalModifiers ?? []) {
      const modParamKey = modifier.paramKey ?? defaultParamKey;
      const modIntensity =
        modParamKey && snapshot.params[modParamKey] !== undefined
          ? snapshot.params[modParamKey]
          : 1;

      const target = modifier.key;

      if (modifier.baseline) {
        const record = ensureBaseline(target);
        if (modifier.baseline.amplitudeGain !== undefined && !hasMechanistic) {
          record.amplitude =
            (record.amplitude ?? 0) +
            modifier.baseline.amplitudeGain * modIntensity;
        }
        if (modifier.baseline.phaseShiftMin !== undefined) {
          record.phaseShiftMin =
            (record.phaseShiftMin ?? 0) +
            modifier.baseline.phaseShiftMin * modIntensity;
        }
      }

      if (modifier.couplingGains) {
        const extras = (couplingAdjustments[target] =
          couplingAdjustments[target] ?? []);
        for (const [source, gain] of Object.entries(modifier.couplingGains)) {
          if (!gain) continue;
          extras.push({
            source: source as Signal,
            mapping: linear(gain * modIntensity),
            description: `Condition (${condition.label})`,
          });
        }
      }
    }

    for (const mod of condition.enzymeModifiers ?? []) {
      const enzParamKey = mod.paramKey ?? defaultParamKey;
      const enzIntensity =
        enzParamKey && snapshot.params[enzParamKey] !== undefined
          ? snapshot.params[enzParamKey]
          : 1;
      enzymeActivities[mod.enzyme] =
        (enzymeActivities[mod.enzyme] ?? 0) + mod.activity * enzIntensity;
    }
  }

  return {
    baselines: baselineAdjustments,
    couplings: couplingAdjustments,
    receptorDensities,
    receptorSensitivities,
    transporterActivities,
    enzymeActivities,
  };
}