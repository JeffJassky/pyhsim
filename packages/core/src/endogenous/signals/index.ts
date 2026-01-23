import {
  deriveUnitDefinition,
  type SignalUnitDefinition,
  getDisplayValue as genericGetDisplayValue,
} from "./utils";

import { SIGNALS_ALL, type Signal } from "./types";
import type { PhysiologicalUnit } from "../../engine";

export * from "./types";
export * from "./utils";

export * from "./neurotransmitters";
export * from "./hormones";
export * from "./metabolic";
export * from "./circadian";
export * from "./derived";
export * from "./organ-health";
export * from "./nutrients";

import * as neurotransmitters from "./neurotransmitters";
import * as hormones from "./hormones";
import * as metabolic from "./metabolic";
import * as circadian from "./circadian";
import * as derived from "./derived";
import * as organHealth from "./organ-health";
import * as nutrients from "./nutrients";

export {
  neurotransmitters,
  hormones,
  metabolic,
  circadian,
  derived,
  organHealth,
  nutrients,
};

export const SIGNAL_DEFINITIONS_MAP = {
  ...neurotransmitters,
  ...hormones,
  ...metabolic,
  ...circadian,
  ...derived,
  ...organHealth,
  ...nutrients,
};

/**
 * Master registry of physiological units and their expected ranges.
 * Derived from the signal definitions catalog.
 */
export const SIGNAL_UNITS: Record<Signal, SignalUnitDefinition> =
  SIGNALS_ALL.reduce(
    (acc, key) => {
      const def = (SIGNAL_DEFINITIONS_MAP as any)[key];
      if (def) {
        acc[key as Signal] = deriveUnitDefinition(def);
      }
      return acc;
    },
    {} as Record<Signal, SignalUnitDefinition>,
  );

/**
 * Convenience wrapper for getting display values using the master unit map.
 */
export function getDisplayValue(
  signal: Signal,
  internalValue: number,
): { value: number; unit: PhysiologicalUnit } {
  return genericGetDisplayValue(signal, internalValue, SIGNAL_UNITS);
}
