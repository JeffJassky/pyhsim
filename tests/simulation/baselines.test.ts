import { describe, expect, it } from 'vitest';
import { SIGNAL_BASELINES } from '@/models/signals';
import { SIGNALS_ALL, type Minute } from '@/types';

describe('Signal Baseline Continuity', () => {
  const ctx = {
    chronotypeShiftMin: 0,
    sleepDebt: 0,
  };

  SIGNALS_ALL.forEach((signal) => {
    const baselineFn = SIGNAL_BASELINES[signal];
    if (!baselineFn) return;

    it(`signal "${signal}" is identical at 0 and 1440 minutes`, () => {
      const val0 = baselineFn(0 as Minute, ctx);
      const val1440 = baselineFn(1440 as Minute, ctx);
      
      // Should be very close to identical
      expect(val1440).toBeCloseTo(val0, 5);
    });

    it(`signal "${signal}" is smooth across midnight (1439 to 1440)`, () => {
      const val1439 = baselineFn(1439 as Minute, ctx);
      const val1440 = baselineFn(1440 as Minute, ctx);
      const val1441 = baselineFn(1441 as Minute, ctx);

      const diff1 = Math.abs(val1440 - val1439);
      const diff2 = Math.abs(val1441 - val1440);

      // Transition should not be a jump
      // For a 1-minute step, most signals change very little.
      // We allow a small epsilon for signals with steep but continuous slopes.
      expect(diff1).toBeLessThan(2.0); 
      expect(diff1).toBeCloseTo(diff2, 1); // Derivative should be similar
    });
    
    it(`signal "${signal}" handles multi-day simulation (2880 minutes)`, () => {
      const val0 = baselineFn(0 as Minute, ctx);
      const val2880 = baselineFn(2880 as Minute, ctx);
      expect(val2880).toBeCloseTo(val0, 5);
    });
  });
});
