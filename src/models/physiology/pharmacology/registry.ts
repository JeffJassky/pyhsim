import type { Signal } from '@/types/neurostate';
import { SIGNAL_UNITS } from '@/models/engine/signal-units';
import { RAW_TARGETS } from './definitions';
import type {
  ReceptorTarget,
  TransporterTarget,
  EnzymeTarget,
  AuxiliaryTarget,
  PharmacologicalTarget,
  ReceptorDefinition,
  TransporterDefinition,
  EnzymeDefinition,
  AuxiliaryTargetDefinition,
  TargetDefinition,
  RegistryTargetKey,
} from './types';

/**
 * TYPE-SAFE TARGET REGISTRY
 * We map the RAW_TARGETS to the structured interfaces.
 */
export const TARGET_DEFINITIONS: TargetDefinition[] = Object.entries(RAW_TARGETS).map(([key, def]) => ({
  target: key as PharmacologicalTarget,
  ...def,
  // Ensure signals in couplings/substrates are typed as Signal
} as any as TargetDefinition));

/** Derived maps for O(1) lookups */
export const RECEPTORS: Record<ReceptorTarget, ReceptorDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'receptor').map(d => [d.target, d])) as any;

export const TRANSPORTERS: Record<TransporterTarget, TransporterDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'transporter').map(d => [d.target, d])) as any;

export const ENZYMES: Record<EnzymeTarget, EnzymeDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'enzyme').map(d => [d.target, d])) as any;

export const AUXILIARY: Record<AuxiliaryTarget, AuxiliaryTargetDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'auxiliary').map(d => [d.target, d])) as any;


// === LOOKUP FUNCTIONS ===

export function isReceptor(target: string): target is ReceptorTarget {
  return target in RECEPTORS;
}

export function isTransporter(target: string): target is TransporterTarget {
  return target in TRANSPORTERS;
}

export function isEnzyme(target: string): target is EnzymeTarget {
  return target in ENZYMES;
}

export function isAuxiliary(target: string): target is AuxiliaryTarget {
  return target in AUXILIARY;
}

export function isKnownTarget(target: string): boolean {
  return target in RAW_TARGETS;
}

/**
 * Global lookup for any pharmacological target description.
 */
export function getTargetDescription(target: PharmacologicalTarget): string {
  const regKey = target as RegistryTargetKey;
  if (regKey in RAW_TARGETS) {
    return RAW_TARGETS[regKey].description;
  }
  
  // Fallback to signal descriptions
  const signalDef = SIGNAL_UNITS[target as Signal];
  if (signalDef) return signalDef.description;

  return '';
}

/**
 * Global lookup for a clean human-readable label for any target.
 */
export function getTargetLabel(target: PharmacologicalTarget): string {
  const regKey = target as RegistryTargetKey;
  if (regKey in RAW_TARGETS) {
    const def = RAW_TARGETS[regKey];
    if (def.category === 'receptor') return `${target} Receptor`;
    if (def.category === 'transporter') return `${target} Transporter`;
    if (def.category === 'enzyme') return `${target} Enzyme`;
    
    // Auxiliary: convert camelCase to Title Case with spaces
    return (target as string).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  const signalDef = SIGNAL_UNITS[target as Signal];
  if (signalDef) return signalDef.label;

  return target;
}

/**
 * Get all signals affected by a receptor target.
 */
export function getReceptorSignals(target: string): Array<{ signal: Signal; sign: number }> {
  if (isReceptor(target)) {
    return RECEPTORS[target].couplings;
  }
  return [];
}

/**
 * Get the primary signal for a transporter.
 */
export function getTransporterSignal(target: TransporterTarget): Signal {
  return TRANSPORTERS[target].primarySignal;
}

/**
 * Get all substrate signals for an enzyme.
 */
export function getEnzymeSubstrates(target: EnzymeTarget): Signal[] {
  return ENZYMES[target].substrates;
}

/**
 * Get all transporter keys (for auxiliary generation).
 */
export function getAllTransporterKeys(): TransporterTarget[] {
  return Object.keys(TRANSPORTERS) as TransporterTarget[];
}

/**
 * Get all enzyme keys (for auxiliary generation).
 */
export function getAllEnzymeKeys(): EnzymeTarget[] {
  return Object.keys(ENZYMES) as EnzymeTarget[];
}