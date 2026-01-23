import type { TransporterDefinition } from "../types";

export const TRANSPORTERS = {
  DAT: {
    category: "transporter",
    system: "Dopaminergic",
    description:
      "The dopamine vacuum cleaner—sucks dopamine back into neurons after release.",
    primarySignal: "dopamine",
    adaptation: { k_up: 0.001, k_down: 0.002 },
  } as TransporterDefinition,
  NET: {
    category: "transporter",
    system: "Norepinephrinergic",
    description: "Clears norepinephrine (adrenaline's cousin) from synapses.",
    primarySignal: "norepi",
    adaptation: { k_up: 0.001, k_down: 0.002 },
  } as TransporterDefinition,
  SERT: {
    category: "transporter",
    system: "Serotonergic",
    description: "The main target of SSRI antidepressants.",
    primarySignal: "serotonin",
    adaptation: { k_up: 0.0008, k_down: 0.0015 },
  } as TransporterDefinition,
  GAT1: {
    category: "transporter",
    system: "GABAergic",
    description: "Removes GABA from synapses.",
    primarySignal: "gaba",
  } as TransporterDefinition,
  GLT1: {
    category: "transporter",
    system: "Glutamatergic",
    description: "Cleans up glutamate to prevent brain overstimulation.",
    primarySignal: "glutamate",
  } as TransporterDefinition,
};
