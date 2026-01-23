import type { PharmacologyDef } from "../../engine";

/**
 * Normalizes a list of pharmacology definitions into a single array.
 */
export function normalizePharmacology(input: PharmacologyDef | PharmacologyDef[]): PharmacologyDef[] {
  return Array.isArray(input) ? input : [input];
}
