// Export types and math from engine, but NOT the solver functions that are overridden by physiology
export type {
  // Signal, // Use the specialized Union type from physiology instead
  SignalDefinition,
  AuxiliaryDefinition,
  SimulationState,
  SolverDebugOptions,
  DynamicsContext,
  ProductionTerm,
  ClearanceTerm,
  ClearanceType,
  DynamicCoupling,
  SignalDynamics,
  IdealTendency,
  ActiveIntervention,
  Minute,
  UUID,
  WorkerComputeRequest,
  WorkerComputeResponse,
  PDMechanism,
  PharmacologicalTarget,
  PharmacologyDef,
  ResponseSpec,
  CouplingSpec,
  ProfileBaselineAdjustments,
  ProfileCouplingAdjustments,
  PhysiologicalUnit,
  ItemForWorker,
} from "./engine";

export { gaussian, sigmoid, clamp, runOptimizedV2 } from "./engine"; // Math utils and core solver

export * from "./types";
export * from "./endogenous";
export * from "./exogenous";
