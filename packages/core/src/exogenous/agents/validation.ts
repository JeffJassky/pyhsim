import type { PharmacologyDef } from "../../engine";

export interface AgentValidationError {
  path: string;
  message: string;
}

/**
 * Basic validation for agent pharmacology definitions.
 */
export function validateAgentPharmacology(def: PharmacologyDef): AgentValidationError[] {
  const errors: AgentValidationError[] = [];
  if (!def.molecule?.name) errors.push({ path: "molecule.name", message: "Missing molecule name" });
  if (!def.pk) errors.push({ path: "pk", message: "Missing PK model" });
  return errors;
}