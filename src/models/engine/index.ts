/**
 * RE-EXPORT FROM PACKAGES
 * This file maintains backward compatibility while delegating to the new monorepo packages.
 */

import * as core from "@physim/core";
import * as physiology from "@physim/core";
import * as registry from "@physim/core";

// Resolve ambiguities by preferring physiology-bound versions
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
} = physiology;

// Export everything else from core
export * from "@physim/core";

// Re-export specific registry items
export { INTERVENTIONS, INTERVENTION_MAP } from "@physim/core";