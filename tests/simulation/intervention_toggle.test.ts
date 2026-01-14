import { describe, it, expect } from 'vitest';
import { computeDerivatives } from '@/models/engine/ode-solver';
import { initializeZeroState } from '@/models/engine/state';
import { dopamine } from '@/models/engine/signal-definitions/neurotransmitters';
import { DEFAULT_SUBJECT, derivePhysiology } from '@/models/domain/subject';
import type { ActiveIntervention, DynamicsContext } from '@/types/unified';

describe('Intervention Toggle', () => {
  const subject = DEFAULT_SUBJECT;
  const physiology = derivePhysiology(subject);
  const ctx: DynamicsContext = {
    minuteOfDay: 480, // 8 AM
    circadianMinuteOfDay: 480, // 8 AM
    dayOfYear: 1,
    isAsleep: false,
    subject,
    physiology
  };

  const intervention: ActiveIntervention = {
    id: 'test',
    key: 'test',
    startTime: 400,
    duration: 100,
    intensity: 1,
    params: {},
    // Mock Rate intervention
    type: 'rate',
    target: 'dopamine',
    magnitude: 100
  } as any;

  it('should apply intervention when enabled', () => {
    const state = initializeZeroState();
    const derivs = computeDerivatives(
      state, 
      450, // inside window
      ctx,
      { dopamine },
      {},
      [intervention],
      { enableInterventions: true }
    );
    
    // Base dynamics (return to 0) + Production + Intervention
    // Dopamine setpoint at 8AM is ~65. Current 0.
    // Base d = (65 - 0)/120 = 0.54.
    // Intervention adds 100.
    // Result should be > 100.
    expect(derivs.signals.dopamine).toBeGreaterThan(50);
  });

  it('should ignore intervention when disabled', () => {
    const state = initializeZeroState();
    const derivs = computeDerivatives(
      state, 
      450,
      ctx,
      { dopamine },
      {},
      [intervention],
      { enableInterventions: false }
    );
    
    // Should only have base dynamics
    expect(derivs.signals.dopamine).toBeLessThan(50);
    expect(derivs.signals.dopamine).toBeGreaterThan(0);
  });
});
