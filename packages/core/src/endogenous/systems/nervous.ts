import type { BioSystemDef } from "./types";

export const nervous: BioSystemDef = {
  id: "nervous",
  label: "Nervous System",
  icon: "🧠",
  signals: [
    "dopamine",
    "serotonin",
    "acetylcholine",
    "gaba",
    "glutamate",
    "norepi",
    "histamine",
    "orexin",
    "endocannabinoid",
    "bdnf",
    "sensoryLoad",
  ],
  auxiliary: [
    "adenosinePressure",
    "dopamineVesicles",
    "norepinephrineVesicles",
    "serotoninPrecursor",
    "gabaPool",
    "bdnfExpression",
  ],
  description:
    "The network of neurons and neurotransmitters that controls perception, thought, and immediate bodily responses.",
  applicationDescription:
    "Monitor neurotransmitter balance and synaptic health.",
};
