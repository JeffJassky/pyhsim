import type {
  Subject,
  ConditionKey,
  ConditionStateSnapshot,
  Goal,
  Signal,
  TimelineItem,
  ParamValues,
  InterventionKey,
} from '@/types';

export type Minute = number;

// Simplified representation of a timeline item for a preset
export interface InterventionPreset {
  key: InterventionKey;
  startMin: Minute;
  durationMin: Minute;
  params?: ParamValues;
  labelOverride?: string;
  group?: string | number;
}

export interface SimulationPreset {
  id: string; // Used in the URL, e.g., 'pmdd'
  label: string; // Display name
  description?: string;
  // Partial state for useUserStore
  userProfile: {
    subject?: Partial<Subject>;
    conditions?: Partial<Record<ConditionKey, Partial<ConditionStateSnapshot>>>;
    selectedGoals?: Goal[];
    enabledSignals?: Partial<Record<Signal, boolean>>;
    signalOrder?: Signal[];
  };
  // Timeline items for the preset
  timeline: InterventionPreset[];
  // Other potential state to load (e.g., initial chart filter, layout, etc.)
}
