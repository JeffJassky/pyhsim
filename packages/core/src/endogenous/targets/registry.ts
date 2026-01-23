import type { Signal } from '../types';
import { SIGNAL_UNITS } from '../signals';
import { TARGETS, RECEPTORS, TRANSPORTERS, ENZYMES, AUXILIARY } from './definitions';
import type { TargetKey, ReceptorKey, TransporterKey, EnzymeKey, AuxiliaryKey } from './definitions';

// === LOOKUP FUNCTIONS ===

export function isReceptor(target: string): target is ReceptorKey {
  return target in RECEPTORS;
}

export function isTransporter(target: string): target is TransporterKey {
  return target in TRANSPORTERS;
}

export function isEnzyme(target: string): target is EnzymeKey {
  return target in ENZYMES;
}

export function isAuxiliary(target: string): target is AuxiliaryKey {
  return target in AUXILIARY;
}

export function isKnownTarget(target: string): target is TargetKey {
  return target in TARGETS;
}

/**
 * Global lookup for any pharmacological target description.
 */
export function getTargetDescription(target: string): string {
  if (isKnownTarget(target)) {
    return TARGETS[target].description;
  }
  
  // Fallback to signal descriptions
  const signalDef = (SIGNAL_UNITS as any)[target];
  if (signalDef) return signalDef.description;

  return '';
}

/**
 * Global lookup for a clean human-readable label for any target.
 */
export function getTargetLabel(target: string): string {
  if (isKnownTarget(target)) {
    const def = TARGETS[target];
    if (def.category === 'receptor') return `${target} Receptor`;
    if (def.category === 'transporter') return `${target} Transporter`;
    if (def.category === 'enzyme') return `${target} Enzyme`;
    
    // Auxiliary: convert camelCase to Title Case with spaces
    return target.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  const signalDef = (SIGNAL_UNITS as any)[target];
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
export function getTransporterSignal(target: TransporterKey): Signal {
  return TRANSPORTERS[target].primarySignal;
}

/**
 * Get all substrate signals for an enzyme.
 */
export function getEnzymeSubstrates(target: EnzymeKey): Signal[] {
  return ENZYMES[target].substrates;
}

/**
 * Get all receptor keys.
 */
export function getAllReceptorKeys(): ReceptorKey[] {
  return Object.keys(RECEPTORS) as ReceptorKey[];
}

/**
 * Get all transporter keys.
 */
export function getAllTransporterKeys(): TransporterKey[] {
  return Object.keys(TRANSPORTERS) as TransporterKey[];
}

/**
 * Get all enzyme keys.
 */
export function getAllEnzymeKeys(): EnzymeKey[] {
  return Object.keys(ENZYMES) as EnzymeKey[];
}