import { describe, it, expect } from 'vitest';
import { computeDerivatives } from '@/models/engine/ode-solver';
import { initializeZeroState } from '@/models/engine/state';
import { dopamine } from '@/models/engine/signal-definitions/neurotransmitters';
import { DEFAULT_SUBJECT, derivePhysiology } from '@/models/domain/subject';
import type { DynamicsContext } from '@/types/unified';

describe('Solver Debug Flags', () => {
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

  const definitions = { dopamine };

  it('should have non-zero setpoint when baselines enabled', () => {
    const state = initializeZeroState();
    const derivs = computeDerivatives(
      state, 
      480, 
      ctx, 
      definitions, 
      {}, 
      [], 
      { enableBaselines: true }
    );
    // Dopamine setpoint is non-zero at 8AM
    // dSignal = (setpoint - current) / tau
    // Current is 0. So dSignal should be positive.
    expect(derivs.signals.dopamine).toBeGreaterThan(0.1);
  });

  it('should have zero setpoint contribution when baselines disabled', () => {
    const state = initializeZeroState();
    // Force state to 0. If setpoint is 0, dSignal should be 0.
    // If setpoint is normally ~60, and we disable baselines, setpoint becomes 0.
    // (0 - 0) / tau = 0.
    
    const derivs = computeDerivatives(
      state, 
      480, 
      ctx, 
      definitions, 
      {}, 
      [], 
      { enableBaselines: false }
    );
    
    expect(derivs.signals.dopamine).toBe(0);
  });
});
