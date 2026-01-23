import { RECEPTORS } from "./receptors";
import { TRANSPORTERS } from "./transporters";
import { ENZYMES } from "./enzymes";
import { AUXILIARY } from "./auxiliary";
import type { TargetCategory } from "./types";

/**
 * MASTER TARGET DEFINITIONS
 * This is the unified Source of Truth for all biological "hardware"
 * (receptors, transporters, enzymes, and auxiliary pools).
 */
export const TARGETS = {
  ...RECEPTORS,
  ...TRANSPORTERS,
  ...ENZYMES,
  ...AUXILIARY,
};

/**
 * Re-exporting subsets for specific lookups
 */
export { RECEPTORS, TRANSPORTERS, ENZYMES, AUXILIARY };

/**
 * Derived Types
 */
export type ReceptorKey = keyof typeof RECEPTORS;
export type TransporterKey = keyof typeof TRANSPORTERS;
export type EnzymeKey = keyof typeof ENZYMES;
export type AuxiliaryKey = keyof typeof AUXILIARY;
export type TargetKey = keyof typeof TARGETS;

/**
 * Helper to check if a string is a valid target key
 */
export function isKnownTarget(key: string): key is TargetKey {
  return key in TARGETS;
}

/**
 * Helper to check category
 */
export function getTargetCategory(key: TargetKey): TargetCategory {
  return TARGETS[key].category;
}

/**
 * Helper to check if target is a receptor
 */
export function isReceptor(key: string): key is ReceptorKey {
  return key in RECEPTORS;
}
