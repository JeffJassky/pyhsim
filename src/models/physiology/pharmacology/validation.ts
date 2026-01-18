import { SIGNALS_ALL, type Signal, type InterventionDef, type PharmacologyDef } from '@/types/neurostate';
import { isKnownTarget, isReceptor, getReceptorSignals } from './registry';
import { SIGNAL_UNITS } from '@/models/engine/signal-units';

const SIGNAL_SET = new Set(SIGNALS_ALL);
const AUXILIARY_POOLS = new Set([
  'adenosinePressure',
  'insulinAction',
  'hepaticGlycogen',
  'crhPool',
  'cortisolIntegral',
  'ghReserve',
  'dopamineVesicles',
  'norepinephrineVesicles',
  'serotoninPrecursor',
  'gabaPool',
  'glutamatePool',
  'bdnfExpression'
]);

export interface ValidationError {
  interventionKey: string;
  targetIndex: number;
  target: string;
  message: string;
}

/**
 * Check if a target string is valid (receptor, transporter, enzyme, signal, or pool).
 */
export function isValidTarget(target: string): boolean {
  return isKnownTarget(target) || SIGNAL_SET.has(target as any) || AUXILIARY_POOLS.has(target);
}

/**
 * Validates a single Pharmacology definition.
 */
export function validatePharmacology(key: string, pharmacology: PharmacologyDef): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!pharmacology.pd) return errors;

  pharmacology.pd.forEach((pd, index) => {
    // 1. Validate Target Existence
    if (!isValidTarget(pd.target)) {
      errors.push({
        interventionKey: key,
        targetIndex: index,
        target: pd.target,
        message: `Unknown pharmacological target "${pd.target}"`
      });
      return; 
    }

    // 2. Validate Units
    const target = pd.target;
    const effectUnit = pd.unit;
    let signalsToCheck: Signal[] = [];

    if (isReceptor(target)) {
      const downstream = getReceptorSignals(target);
      signalsToCheck = downstream.map(d => d.signal);
    } else if (target in SIGNAL_UNITS) {
      signalsToCheck = [target as Signal];
    }

    signalsToCheck.forEach((signal) => {
      const expectedUnit = SIGNAL_UNITS[signal]?.unit;

      if (!expectedUnit) {
        errors.push({
          interventionKey: key,
          targetIndex: index,
          target: target,
          message: `Target '${target}' maps to signal '${signal}' which has no definition in SIGNAL_UNITS.`
        });
        return;
      }

      if (!effectUnit) {
        errors.push({
          interventionKey: key,
          targetIndex: index,
          target: target,
          message: `Missing unit. Expected: '${expectedUnit}'.`
        });
        return;
      }

      const isModulator = pd.mechanism === 'PAM' || pd.mechanism === 'NAM';
      if (isModulator && (effectUnit === 'fold-change' || effectUnit === 'index')) {
        return; 
      }

      if (effectUnit !== expectedUnit) {
        errors.push({
          interventionKey: key,
          targetIndex: index,
          target: target,
          message: `Unit mismatch. Has '${effectUnit}', target '${signal}' requires '${expectedUnit}'.`
        });
      }
    });
  });

  return errors;
}


/**
 * Validates all interventions in a library.
 * Handles dynamic pharmacology factories by instantiating with default parameters.
 */
export function validateInterventionLibrary(defs: InterventionDef[]): ValidationError[] {
  const allErrors: ValidationError[] = [];

  for (const def of defs) {
    let pharms: PharmacologyDef[] = [];

    if (typeof def.pharmacology === 'function') {
      try {
        const defaultParams = Object.fromEntries(
          def.params.map(p => [p.key, p.default ?? 0])
        );
        const result = (def.pharmacology as any)(defaultParams);
        pharms = Array.isArray(result) ? result : [result];
      } catch (e) {
        allErrors.push({
          interventionKey: def.key,
          targetIndex: -1,
          target: 'factory',
          message: `Failed to instantiate dynamic pharmacology: ${e}`
        });
        continue;
      }
    } else if (def.pharmacology) {
      pharms = [def.pharmacology];
    }

    for (const pharm of pharms) {
      const errors = validatePharmacology(def.key, pharm);
      allErrors.push(...errors);
    }
  }

  return allErrors;
}
