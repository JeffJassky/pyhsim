import type { SignalDefinition, AuxiliaryDefinition } from "../../engine";
import * as neurotransmitters from "./neurotransmitters";
import * as hormones from "./hormones";
import * as metabolic from "./metabolic";
import * as circadian from "./circadian";
import * as derived from "./derived";
import * as organHealth from "./organ-health";
import * as nutrients from "./nutrients";

/**
 * Filter keys that are actual Signal Definitions (SignalDefinition)
 * and not Auxiliary Definitions or other exports.
 */
type SignalKeys<T> = {
  [K in keyof T]: T[K] extends SignalDefinition ? K : never;
}[keyof T];

export type NeuroSignal = SignalKeys<typeof neurotransmitters>;
export type HormoneSignal = SignalKeys<typeof hormones>;
export type MetabolicSignal = SignalKeys<typeof metabolic>;
export type CircadianSignal = SignalKeys<typeof circadian>;
export type DerivedSignal = SignalKeys<typeof derived>;
export type OrganHealthSignal = SignalKeys<typeof organHealth>;
export type NutrientSignal = SignalKeys<typeof nutrients>;

export type Signal =
  | NeuroSignal
  | HormoneSignal
  | MetabolicSignal
  | CircadianSignal
  | DerivedSignal
  | OrganHealthSignal
  | NutrientSignal;

function isSignal(def: any): boolean {
  return def && def.dynamics && Array.isArray(def.dynamics.couplings);
}

function isAuxiliary(def: any): boolean {
  return def && def.dynamics && !Array.isArray(def.dynamics.couplings);
}

const ALL_MODULES = [
  neurotransmitters,
  hormones,
  metabolic,
  circadian,
  derived,
  organHealth,
  nutrients,
];

/**
 * All valid signal keys derived from the catalog.
 */
export const SIGNALS_ALL: readonly Signal[] = ALL_MODULES.flatMap((mod) =>
  Object.entries(mod)
    .filter(([_, v]) => isSignal(v))
    .map(([k]) => k as Signal),
);

/**
 * All valid auxiliary keys derived from the catalog.
 */
export const AUXILIARY_ALL: string[] = ALL_MODULES.flatMap((mod) =>
  Object.entries(mod)
    .filter(([_, v]) => isAuxiliary(v))
    .map(([k]) => k),
);

export const AUXILIARY_DEFINITIONS_MAP: Record<string, AuxiliaryDefinition> =

  Object.fromEntries(

    ALL_MODULES.flatMap((mod) =>

      Object.entries(mod).filter(([_, v]) => isAuxiliary(v)),

    ),

  ) as Record<string, AuxiliaryDefinition>;
