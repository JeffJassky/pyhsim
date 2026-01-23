import type { PharmacologyDef } from "../../engine";

export type AgentFactory = (...args: any[]) => PharmacologyDef;

export interface AgentMetadata {
  cid?: number; // PubChem CID
  cas?: string; // CAS number
  smiles?: string;
  references?: string[];
}

export interface RegisteredAgent {
  key: string;
  factory: AgentFactory;
  metadata?: AgentMetadata;
}
