import { SIGNALS_ALL } from '@/types/neurostate';
import { isKnownTarget } from './registry';

const SIGNAL_SET = new Set(SIGNALS_ALL);

export interface ValidationError {
  interventionKey: string;
  targetIndex: number;
  target: string;
  message: string;
}

/**
 * Check if a target string is valid (receptor, transporter, enzyme, or direct signal).
 */
export function isValidTarget(target: string): boolean {
  return isKnownTarget(target) || SIGNAL_SET.has(target as any);
}

/**
 * Validates all PD targets in an intervention definition.
 * Returns array of errors (empty if valid).
 */
export function validateInterventionTargets(def: { key: string; pharmacology?: { pd?: Array<{ target: string }> } }): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!def.pharmacology?.pd) return errors;

  def.pharmacology.pd.forEach((pd, index) => {
    if (!isValidTarget(pd.target)) {
      errors.push({
        interventionKey: def.key,
        targetIndex: index,
        target: pd.target,
        message: `Unknown pharmacological target "${pd.target}"`
      });
    }
  });

  return errors;
}

/**
 * Validates all interventions in a library.
 * Returns all validation errors found.
 */
export function validateInterventionLibrary(defs: Array<{ key: string; pharmacology?: { pd?: Array<{ target: string }> } }>): ValidationError[] {
  const allErrors: ValidationError[] = [];

  for (const def of defs) {
    const errors = validateInterventionTargets(def);
    allErrors.push(...errors);
  }

  return allErrors;
}
