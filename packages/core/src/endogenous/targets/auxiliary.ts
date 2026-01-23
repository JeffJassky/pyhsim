import type { AuxiliaryTargetDefinition } from "../types";

export const AUXILIARY = {
  adenosinePressure: {
    category: "auxiliary",
    system: "Sleep",
    description: 'Your "sleep debt"—builds up the longer you stay awake.',
  } as AuxiliaryTargetDefinition,
  dopamineVesicles: {
    category: "auxiliary",
    system: "Capacity",
    description: "Your dopamine reserves ready to be released.",
  } as AuxiliaryTargetDefinition,
  norepinephrineVesicles: {
    category: "auxiliary",
    system: "Capacity",
    description: "Your stored adrenaline-like chemicals.",
  } as AuxiliaryTargetDefinition,
  serotoninPrecursor: {
    category: "auxiliary",
    system: "Capacity",
    description: "Building blocks for making serotonin.",
  } as AuxiliaryTargetDefinition,
  gabaPool: {
    category: "auxiliary",
    system: "Capacity",
    description: "Your reserves for making GABA.",
  } as AuxiliaryTargetDefinition,
  glutamatePool: {
    category: "auxiliary",
    system: "Capacity",
    description: "Resources for making glutamate.",
  } as AuxiliaryTargetDefinition,
  hepaticGlycogen: {
    category: "auxiliary",
    system: "Metabolic",
    description: "Sugar stored in your liver that maintains blood glucose.",
  } as AuxiliaryTargetDefinition,
  insulinAction: {
    category: "auxiliary",
    system: "Metabolic",
    description: "How well your cells respond to insulin.",
  } as AuxiliaryTargetDefinition,
  cortisolIntegral: {
    category: "auxiliary",
    system: "Stress",
    description: "Your cumulative stress exposure over time.",
  } as AuxiliaryTargetDefinition,
  crhPool: {
    category: "auxiliary",
    system: "Stress",
    description: "The brain's stress alarm signal.",
  } as AuxiliaryTargetDefinition,
  ghReserve: {
    category: "auxiliary",
    system: "Growth",
    description: "Growth hormone ready to be released.",
  } as AuxiliaryTargetDefinition,
  bdnfExpression: {
    category: "auxiliary",
    system: "Growth",
    description: "Production of BDNF, a protein that helps brain cells grow.",
  } as AuxiliaryTargetDefinition,
  temperature: {
    category: "auxiliary",
    system: "Thermoregulation",
    description: "Core body temperature.",
  } as AuxiliaryTargetDefinition,
};
