import type { Signal } from '@/types';
import type { SimulationState, ActiveIntervention, DynamicsContext } from '@/types/unified';
import { 
  integrateStep, 
  createInitialState, 
  SIGNAL_DEFINITIONS, 
  AUXILIARY_DEFINITIONS, 
  getAllUnifiedDefinitions 
} from '@/models/engine';
import { DEFAULT_SUBJECT, derivePhysiology } from '@/models/domain/subject';

self.onmessage = (event: MessageEvent<{ 
  intervention: any; 
  signal: Signal; 
}>) => {
  const { intervention } = event.data;
  
  const subject = DEFAULT_SUBJECT;
  const physiology = derivePhysiology(subject);
  
  const unifiedDefs = getAllUnifiedDefinitions();
  
  let state = createInitialState(unifiedDefs, AUXILIARY_DEFINITIONS, {
    subject,
    physiology,
    isAsleep: false
  });

  const activeInterventions: ActiveIntervention[] = [
    {
      id: 'preview',
      key: intervention.key,
      startTime: 0,
      duration: intervention.defaultDurationMin ?? 60,
      intensity: 1.0,
      params: {},
      pharmacology: intervention.pharmacology
    }
  ];

  const points: number[] = [];
  const dt = 5;
  const steps = 48; // 4 hours

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    const ctx: DynamicsContext = {
      minuteOfDay: t % 1440,
      circadianMinuteOfDay: t % 1440,
      dayOfYear: 1,
      isAsleep: false,
      subject,
      physiology
    };
    
    // Step ODE
    state = integrateStep(state, t, dt, ctx, unifiedDefs, AUXILIARY_DEFINITIONS, activeInterventions);
    
    // Collect specific signal value
    points.push(state.signals[event.data.signal] ?? 0);
  }

  self.postMessage({ points });
};