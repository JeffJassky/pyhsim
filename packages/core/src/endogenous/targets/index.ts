// Types
export type {
  TargetCategory,
  BaseTargetDefinition,
  ReceptorDefinition,
  TransporterDefinition,
  EnzymeDefinition,
  AuxiliaryTargetDefinition,
  TargetDefinition,
} from "./types";

// Registry Keys and Definitions
export {
  TARGETS,
  RECEPTORS,
  TRANSPORTERS,
  ENZYMES,
  AUXILIARY,
} from "./definitions";

export type {
  TargetKey,
  ReceptorKey,
  TransporterKey,
  EnzymeKey,
  AuxiliaryKey,
} from "./definitions";

// Registry Functions
export {
  isReceptor,
  isTransporter,
  isEnzyme,
  isAuxiliary,
  isKnownTarget,
  getTargetDescription,
  getTargetLabel,
  getReceptorSignals,
  getTransporterSignal,
  getEnzymeSubstrates,
  getAllReceptorKeys,
  getAllTransporterKeys,
  getAllEnzymeKeys,
} from "./registry";

export {
  RECEPTOR_ADAPTATION_DEFAULTS,
  TRANSPORTER_ADAPTATION_DEFAULTS,
} from "./defaults";
