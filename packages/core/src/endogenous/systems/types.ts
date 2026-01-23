import type { Signal, AuxiliaryKey } from '../types';

export interface BioSystemDef {
  id: string;
  label: string;
  icon: string;
  signals: Signal[];
  auxiliary?: AuxiliaryKey[];
  description: string;
  applicationDescription?: string;
}
