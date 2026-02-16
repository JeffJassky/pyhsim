export * from "./ui/weights";

// Resolve ambiguities explicitly by preferring registry for Subject entities
export type {
  BiologicalSex,
  MenstrualHormones,
  Physiology,
  Subject
} from "@kyneticbio/core";

export {
  DEFAULT_SUBJECT,
  derivePhysiology,
  INTERVENTIONS,
  INTERVENTION_MAP,
  CONDITION_LIBRARY,
  buildConditionAdjustments,
  Agents
} from "@kyneticbio/core";

// Export physiology-bound versions
export {
  initializeZeroState,
  createInitialState,
  integrateStep,
  computeDerivatives,
  SIGNALS_ALL,
  SIGNAL_DEFINITIONS,
  AUXILIARY_DEFINITIONS,
  HUMAN_RESOLVER,
  getAllUnifiedDefinitions,
  getMenstrualHormones
} from "@kyneticbio/core";

// Export everything else from core
export * from "@kyneticbio/core";