import { SIGNALS_ALL, type Signal } from '@/types/neurostate';
import type { UnifiedSignalDefinition, AuxiliaryDefinition, DynamicsContext } from '@/types/unified';
import * as metabolic from './signal-definitions/metabolic';
import * as hormones from './signal-definitions/hormones';
import { 
  dopamine, serotonin, norepi, gaba, glutamate, acetylcholine, endocannabinoid,
  dopamineVesicles, norepinephrineVesicles, serotoninPrecursor, gabaPool, glutamatePool 
} from './signal-definitions/neurotransmitters';
import * as circadian from './signal-definitions/circadian';
import * as derived from './signal-definitions/derived';
import * as biomarkers from './signal-definitions/biomarkers';
import { getAllTransporterKeys, getAllEnzymeKeys, ENZYMES } from '../physiology/pharmacology';

export const SIGNAL_DEFINITIONS: Partial<Record<Signal, UnifiedSignalDefinition>> = {
  // Metabolic
  glucose: metabolic.glucose,
  insulin: metabolic.insulin,
  glucagon: metabolic.glucagon,
  
  // Hormones
  cortisol: hormones.cortisol,
  adrenaline: hormones.adrenaline,
  leptin: hormones.leptin,
  ghrelin: hormones.ghrelin,
  oxytocin: hormones.oxytocin,
  prolactin: hormones.prolactin,
  vasopressin: hormones.vasopressin,
  vip: hormones.vip,
  testosterone: hormones.testosterone,
  estrogen: hormones.estrogen,
  progesterone: hormones.progesterone,
  lh: hormones.lh,
  fsh: hormones.fsh,
  thyroid: hormones.thyroid,
  growthHormone: hormones.growthHormone,
  glp1: hormones.glp1,

  // Neuro
  dopamine,
  serotonin,
  norepi,
  gaba,
  glutamate,
  acetylcholine,
  endocannabinoid,

  // Circadian
  melatonin: circadian.melatonin,
  orexin: circadian.orexin,
  histamine: circadian.histamine,

  // Derived
  energy: derived.energy,
  hrv: derived.hrv,
  bloodPressure: derived.bloodPressure,
  inflammation: derived.inflammation,
  bdnf: derived.bdnf,
  vagal: derived.vagal,
  ketone: derived.ketone,
  ethanol: derived.ethanol,
  acetaldehyde: derived.acetaldehyde,
  magnesium: derived.magnesium,
  sensoryLoad: derived.sensoryLoad,
  mtor: derived.mtor,
  ampk: derived.ampk,
  oxygen: derived.oxygen,

  // Biomarkers
  ferritin: biomarkers.ferritin,
  shbg: biomarkers.shbg,
  dheas: biomarkers.dheas,
  alt: biomarkers.alt,
  ast: biomarkers.ast,
  egfr: biomarkers.egfr,
  vitaminD3: biomarkers.vitaminD3,
};

// --- Enzyme and Transporter Defaults ---
const createStaticAux = (key: string, initial: number = 1.0): AuxiliaryDefinition => ({
  key,
  dynamics: {
    setpoint: () => initial,
    tau: 1440,
    production: [],
    clearance: []
  },
  initialValue: initial
});

export const AUXILIARY_DEFINITIONS: Record<string, AuxiliaryDefinition> = {
  // Metabolic
  insulinAction: metabolic.insulinAction,
  hepaticGlycogen: metabolic.hepaticGlycogen,
  
  // Hormones
  crhPool: hormones.crhPool,
  cortisolIntegral: hormones.cortisolIntegral,
  ghReserve: hormones.ghReserve,

  // Neuro
  dopamineVesicles: dopamineVesicles,
  norepinephrineVesicles: norepinephrineVesicles,
  serotoninPrecursor: serotoninPrecursor,
  gabaPool: gabaPool,
  glutamatePool: glutamatePool,

  // Circadian
  adenosinePressure: circadian.adenosinePressure,

  // Derived
  bdnfExpression: derived.bdnfExpression,

  // Enzymes & Transporters (generated from pharmacology registry)
  ...Object.fromEntries(
    getAllTransporterKeys().map(key => [key, createStaticAux(key)])
  ),
  ...Object.fromEntries(
    getAllEnzymeKeys().map(key => [key, createStaticAux(key, ENZYMES[key].baselineActivity ?? 1.0)])
  ),
};

/**
 * Gets a complete map of all signals with their unified definitions.
 * Missing signals are filled with generic setpoint-driven dynamics.
 */
export function getAllUnifiedDefinitions(): Record<Signal, UnifiedSignalDefinition> {
  const all: Record<Signal, UnifiedSignalDefinition> = {} as any;

  for (const signal of SIGNALS_ALL) {
    if (SIGNAL_DEFINITIONS[signal]) {
      all[signal] = SIGNAL_DEFINITIONS[signal]!;
    } else {
      // Generic fallback
      all[signal] = {
        key: signal,
        label: signal,
        unit: 'units',
        dynamics: {
          setpoint: () => 0,
          tau: 60,
          production: [],
          clearance: [],
          couplings: []
        },
        initialValue: 0,
        display: { color: '#ccc' }
      };
    }
  }

  return all;
}

export * from './ode-solver';
export * from './state';
export * from './utils';
