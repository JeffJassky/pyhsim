// Master Physiology Types
export * from "./signals/types";
export * from "./targets/types";
export type {
  TargetKey,
  ReceptorKey,
  TransporterKey,
  EnzymeKey,
  AuxiliaryKey,
} from "./targets/definitions";

export interface MenstrualHormones {
  estrogen: number;
  progesterone: number;
  lh: number;
  fsh: number;
}
