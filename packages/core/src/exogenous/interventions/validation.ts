import {
  type Signal,
  SIGNALS_ALL,
  SIGNAL_UNITS,
  getReceptorSignals,
  isKnownTarget,
  isReceptor,
} from "../../endogenous";
import type { PharmacologyDef } from "../../engine";
import type { InterventionDef } from "../../types";

export interface InterventionValidationError {
  interventionKey: string;
  targetIndex: number;
  target: string;
  message: string;
}

/**
 * Check if a target string is valid (mechanism, signal, or auxiliary pool).
 */
export function isValidTarget(target: string): boolean {
  return (
    isKnownTarget(target) || (SIGNALS_ALL as readonly string[]).includes(target)
  );
}

/**
 * Validates a single Pharmacology definition.
 */
export function validateInterventionPharmacology(
  key: string,
  pharmacology: PharmacologyDef,
): InterventionValidationError[] {
  const errors: InterventionValidationError[] = [];
  if (!pharmacology.pd) return errors;

  pharmacology.pd.forEach((pd: any, index: number) => {
    // 1. Validate Target Existence
    if (!isValidTarget(pd.target)) {
      errors.push({
        interventionKey: key,
        targetIndex: index,
        target: pd.target,
        message: `Unknown pharmacological target "${pd.target}"`,
      });
      return;
    }

    // 2. Validate Units
    const target = pd.target;
    const effectUnit = pd.unit;
    let signalsToCheck: Signal[] = [];

    if (isReceptor(target)) {
      const downstream = getReceptorSignals(target);
      signalsToCheck = downstream.map((d) => d.signal);
    } else if ((SIGNAL_UNITS as any)[target]) {
      signalsToCheck = [target as Signal];
    }

    signalsToCheck.forEach((signal) => {
      const expectedUnit = (SIGNAL_UNITS as any)[signal]?.unit;

      if (!expectedUnit) {
        errors.push({
          interventionKey: key,
          targetIndex: index,
          target: target,
          message: `Target '${target}' maps to signal '${signal}' which has no definition in SIGNAL_UNITS.`,
        });
        return;
      }

      if (!effectUnit) {
        errors.push({
          interventionKey: key,
          targetIndex: index,
          target: target,
          message: `Missing unit. Expected: '${expectedUnit}'.`,
        });
        return;
      }

      const isModulator = pd.mechanism === "PAM" || pd.mechanism === "NAM";
      if (
        isModulator &&
        (effectUnit === "fold-change" || effectUnit === "index")
      ) {
        return;
      }

      if (effectUnit !== expectedUnit) {
        errors.push({
          interventionKey: key,
          targetIndex: index,
          target: target,
          message: `Unit mismatch. Has '${effectUnit}', target '${signal}' requires '${expectedUnit}'.`,
        });
      }
    });
  });

  return errors;
}

/**
 * Validates all interventions in a library.
 */
export function validateInterventionLibrary(
  defs: InterventionDef[],
): InterventionValidationError[] {
  const allErrors: InterventionValidationError[] = [];

  for (const def of defs) {
    let pharms: PharmacologyDef[] = [];

    if (typeof def.pharmacology === "function") {
      try {
        // Instantiate with dummy params for validation
        const defaultParams = Object.fromEntries(
          def.params.map((p: any) => [p.key, p.default ?? 0]),
        );
        const result = (def.pharmacology as any)(defaultParams);
        pharms = Array.isArray(result) ? result : [result];
      } catch (e) {
        allErrors.push({
          interventionKey: def.key,
          targetIndex: -1,
          target: "factory",
          message: `Failed to instantiate dynamic pharmacology: ${e}`,
        });
        continue;
      }
    } else if (def.pharmacology) {
      pharms = [def.pharmacology];
    }

    for (const pharm of pharms) {
      const errors = validateInterventionPharmacology(def.key, pharm);
      allErrors.push(...errors);
    }
  }

  return allErrors;
}
