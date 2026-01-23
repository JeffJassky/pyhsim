import type { EnzymeDefinition } from "../types";

export const ENZYMES = {
  MAO_A: {
    category: "enzyme",
    system: "Monoamine",
    description: "Breaks down serotonin, norepinephrine, and dopamine.",
    substrates: ["serotonin", "norepi", "dopamine"],
    baselineActivity: 1.0,
  } as EnzymeDefinition,
  MAO_B: {
    category: "enzyme",
    system: "Monoamine",
    description: "Mainly breaks down dopamine in the brain.",
    substrates: ["dopamine"],
    baselineActivity: 1.0,
  } as EnzymeDefinition,
  COMT: {
    category: "enzyme",
    system: "Monoamine",
    description: "Degrades dopamine, norepinephrine, and adrenaline.",
    substrates: ["dopamine", "norepi", "adrenaline"],
    baselineActivity: 1.0,
  } as EnzymeDefinition,
  AChE: {
    category: "enzyme",
    system: "Cholinergic",
    description: "Breaks down acetylcholine very rapidly.",
    substrates: ["acetylcholine"],
    baselineActivity: 1.0,
  } as EnzymeDefinition,
  DAO: {
    category: "enzyme",
    system: "Histaminergic",
    description: "Breaks down histamine from food.",
    substrates: ["histamine"],
    baselineActivity: 1.0,
  } as EnzymeDefinition,
};
