import type { InterventionDef, Subject, Physiology } from "../../types";
import { PRESCRIPTION_INTERVENTIONS } from "./prescription.interventions";
import { SUPPLEMENT_INTERVENTIONS } from "./supplements.interventions";
import { LIFESTYLE_INTERVENTIONS } from "./lifestyle.interventions";
import { FOOD_INTERVENTIONS } from "./food.interventions";

/* ====================== Interventions ====================== */

/**
 * All interventions are now handled mechanistically by the ODE solver.
 * They either use:
 * 1. Explicit 'pharmacology' (PK/PD parameters)
 * 2. Target rates (for non-drug interventions like sleep/meditation)
 */

export const INTERVENTIONS: InterventionDef[] = [
  ...LIFESTYLE_INTERVENTIONS,
  ...PRESCRIPTION_INTERVENTIONS,
  ...SUPPLEMENT_INTERVENTIONS,
  ...FOOD_INTERVENTIONS,
];

export const INTERVENTION_MAP = new Map(
  INTERVENTIONS.map((def) => [def.key, def])
);

/**
 * Builds an intervention library based on the provided subject and physiology.
 */
export function buildInterventionLibrary(
  subject?: Subject,
  physiology?: Physiology
): InterventionDef[] {
  // Currently returns static library as the unified solver handles subject scaling internally
  return INTERVENTIONS;
}

export function clearInterventionLibraryCache(): void {
  // No-op in unified system
}

export * from './prescription.interventions';
export * from './supplements.interventions';
export * from './lifestyle.interventions';
export * from './food.interventions';
export * from './validation';