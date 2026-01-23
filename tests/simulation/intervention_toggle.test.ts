import { describe, it, expect } from 'vitest';
import { computeDerivatives, initializeZeroState } from '@physim/core';
import { dopamine } from '@physim/core';
import { DEFAULT_SUBJECT, derivePhysiology } from '@physim/core';
import type { ActiveIntervention, DynamicsContext } from '@/types';

describe('Intervention Toggle (Optimized V2)', () => {
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
      { debug: { enableInterventions: true } }
    );
    
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
      { debug: { enableInterventions: false } }
    );
    
    // Should only have base dynamics
    expect(derivs.signals.dopamine).toBeLessThan(50);
    expect(derivs.signals.dopamine).toBeGreaterThan(0);
  });
});
