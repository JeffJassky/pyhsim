import type { PhysiologicalUnit, SignalDefinition } from "../../engine";
import type { Signal } from "./types";

export interface SignalUnitDefinition {
  label: string;
  unit: PhysiologicalUnit;
  referenceRange: { low: number; high: number };
  min: number;
  max: number;
  description: string;
}

/**
 * Derives unit metadata from a signal definition.
 */
export function deriveUnitDefinition(def: any): SignalUnitDefinition {
  return {
    label: def.label ?? def.key,
    unit: def.unit ?? "index",
    referenceRange: {
      low: def.display?.referenceRange?.min ?? 0,
      high: def.display?.referenceRange?.max ?? 100,
    },
    min: def.min ?? 0,
    max: def.max ?? 1000,
    description: def.description ?? "",
  };
}

/**
 * Conversion factors to map current internal values to Physical Units.
 */
export const UNIT_CONVERSIONS: Partial<
  Record<Signal, { scaleFactor: number }>
> = {
  inflammation: { scaleFactor: 0.1 },
  vagal: { scaleFactor: 0.01 },
};

/**
 * Utility to convert an internal engine value to a display value with its unit.
 */
export function getDisplayValue(
  signal: Signal,
  internalValue: number,
  unitMap: Record<Signal, SignalUnitDefinition>,
): { value: number; unit: PhysiologicalUnit } {
  const def = unitMap[signal];
  const conversion = UNIT_CONVERSIONS[signal];

  const value = conversion
    ? internalValue * conversion.scaleFactor
    : internalValue;

  return {
    value,
    unit: def?.unit ?? "index",
  };
}
