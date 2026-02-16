// Master Neurostate Types (Bridge to Packages)

import * as core from "@kyneticbio/core";
import * as physiology from "@kyneticbio/core";
import * as registry from "@kyneticbio/core";

// Resolve ambiguities explicitly (Hormones/Signals)
export type {
  Signal,
  NeuroSignal,
  HormoneSignal,
  MetabolicSignal,
  CircadianSignal,
  DerivedSignal,
  OrganHealthSignal,
  NutrientSignal,
  SignalUnitDefinition,
  ReceptorKey,
  TransporterKey,
  EnzymeKey,
  AuxiliaryKey,
  MenstrualHormones,
} from "@kyneticbio/core";

// Resolve Domain/Content types explicitly from Registry
export type {
  Subject,
  Physiology,
  BiologicalSex,
  ConditionKey,
  ConditionDef,
  ConditionStateSnapshot,
  ConditionAdjustments,
  NutritionTargets,
  InterventionDef,
  InterventionKey, // Moved to Registry
  ParamDef,
  ParamValues,
  TimelineItem,
  TimelineItemMeta,
  Scenario,
  HomeostasisStateSnapshot,
  HomeostasisSeries,
  OrganKey,
  OrganWeightMap,
  OrganScoreVector,
  MeterKey,
  MeterMap,
  MeterVector,
  MeterWeights,
  ArousalComponents,
  ArousalComponentKey,
  ArousalWeights,
  Goal,
  TrackedNutrients,
  LogTargets,
  MacroTargets,
  MacroRange,
} from "@kyneticbio/core";

export {
  DEFAULT_SUBJECT,
  derivePhysiology,
  DEFAULT_NUTRITION_TARGETS,
  CONDITION_LIBRARY,
  INTERVENTIONS,
  INTERVENTION_MAP,
  Agents,
  validateInterventionLibrary, // Moved to Registry
} from "@kyneticbio/core";

// Export everything from physiology (human specific)
export * from "@kyneticbio/core";

// Re-export specific generic types from core
export type {
  SimulationState,
  DynamicsContext,
  ActiveIntervention,
  SignalDefinition,
  AuxiliaryDefinition,
  PharmacologyDef,
  ItemForWorker,
  WorkerComputeRequest,
  WorkerComputeResponse,
  UUID,
  Minute,
  PhysiologicalUnit,
  PDMechanism,
  PharmacologicalTarget,
  IdealTendency,
  ResponseSpec,
} from "@kyneticbio/core";

// Specific UI State Types (Moved from core)
export type {
  EngineState,
  UIState,
  PanelSizes,
  ChartSeriesSpec,
  SliderParamDef,
  SelectParamDef,
  DivergingScale,
  HeatmapState,
  MeterState,
  ArousalState,
} from "./ui";

// Resolve ambiguities explicitly by preferring physiology-bound versions
export const {
  initializeZeroState,
  createInitialState,
  integrateStep,
  computeDerivatives,
  SIGNALS_ALL,
  SIGNAL_DEFINITIONS,
  AUXILIARY_DEFINITIONS,
  HUMAN_RESOLVER,
  getAllUnifiedDefinitions,
  getMenstrualHormones,
} = physiology;
