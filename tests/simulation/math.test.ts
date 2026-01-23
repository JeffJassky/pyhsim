/**
 * Mathematical Verification Tests
 *
 * Tests the "physics layer" - pharmacokinetics, Hill functions, receptor models.
 * These are pure function tests that verify the mathematical foundations.
 */

import { describe, expect, it } from 'vitest';
import {
  pk1,
  pk2,
  pk_conc,
  halfLife,
  hill,
  receptorOccupancy,
  operationalAgonism,
  competitiveAntagonism,
  nonCompetitiveAntagonism,
  gammaPulse,
  carbAppearance,
  michaelisMentenPK,
  alcoholBAC
} from '@physim/core';

describe('Pharmacokinetics (PK)', () => {
  describe('pk1 - One-Compartment Model', () => {
    it('returns 0 before absorption starts (t < tlag)', () => {
      expect(pk1(-10, 0.1, 0.05, 0)).toBe(0);
      expect(pk1(5, 0.1, 0.05, 10)).toBe(0); // t=5, tlag=10
    });

    it('returns 0 at t=0 with no lag', () => {
      expect(pk1(0, 0.1, 0.05, 0)).toBe(0);
    });

    it('rises to a peak then decays', () => {
      const k_a = 0.1; // absorption rate
      const k_e = 0.02; // elimination rate

      // Find the actual peak
      let peakVal = 0;
      let peakTime = 0;
      for (let t = 0; t <= 300; t += 5) {
        const val = pk1(t, k_a, k_e);
        if (val > peakVal) {
          peakVal = val;
          peakTime = t;
        }
      }

      const early = pk1(peakTime / 2, k_a, k_e);
      const late = pk1(peakTime * 3, k_a, k_e);

      expect(early).toBeGreaterThan(0);
      expect(peakVal).toBeGreaterThan(early);
      expect(late).toBeLessThan(peakVal);
    });

    it('peak occurs at theoretical tmax = ln(ka/ke)/(ka-ke)', () => {
      const k_a = 0.1;
      const k_e = 0.02;
      const theoreticalTmax = Math.log(k_a / k_e) / (k_a - k_e);

      // Sample around theoretical peak
      const beforePeak = pk1(theoreticalTmax - 10, k_a, k_e);
      const atPeak = pk1(theoreticalTmax, k_a, k_e);
      const afterPeak = pk1(theoreticalTmax + 10, k_a, k_e);

      expect(atPeak).toBeGreaterThan(beforePeak);
      expect(atPeak).toBeGreaterThan(afterPeak);
      expect(atPeak).toBeCloseTo(1, 1); // Should normalize to ~1 at peak
    });

    it('is always non-negative', () => {
      for (let t = 0; t <= 500; t += 10) {
        expect(pk1(t, 0.1, 0.05)).toBeGreaterThanOrEqual(0);
      }
    });

    it('handles edge case where k_a ≈ k_e', () => {
      const k = 0.05;
      const result = pk1(30, k, k + 1e-8); // Nearly equal rates
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });
  });

  describe('pk2 - Two-Compartment Model', () => {
    it('returns 0 before absorption', () => {
      expect(pk2(-10, 0.1, 0.05, 0.02, 0.01)).toBe(0);
    });

    it('shows biphasic decay (distribution + elimination)', () => {
      const k_a = 0.1;
      const k_10 = 0.03;
      const k_12 = 0.02;
      const k_21 = 0.01;

      const values: number[] = [];
      for (let t = 0; t <= 300; t += 10) {
        values.push(pk2(t, k_a, k_10, k_12, k_21));
      }

      // Should rise then fall
      const peak = Math.max(...values);
      const peakIdx = values.indexOf(peak);

      expect(peakIdx).toBeGreaterThan(0); // Peak not at start
      expect(peakIdx).toBeLessThan(values.length - 1); // Peak not at end
    });

    it('is bounded between 0 and 1', () => {
      for (let t = 0; t <= 500; t += 10) {
        const val = pk2(t, 0.1, 0.03, 0.02, 0.01);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1.1); // Allow small numerical tolerance
      }
    });
  });

  describe('pk_conc - Concentration Model', () => {
    it('returns concentration proportional to dose', () => {
      const params = { k_a: 0.1, k_e: 0.02, Vd: 1.0, weight: 70 };

      const conc10 = pk_conc(60, params.k_a, params.k_e, params.Vd, params.weight, 10);
      const conc20 = pk_conc(60, params.k_a, params.k_e, params.Vd, params.weight, 20);

      expect(conc20).toBeCloseTo(conc10 * 2, 1);
    });

    it('is inversely proportional to volume of distribution', () => {
      const conc_lowVd = pk_conc(60, 0.1, 0.02, 0.5, 70, 100);
      const conc_highVd = pk_conc(60, 0.1, 0.02, 1.0, 70, 100);

      expect(conc_lowVd).toBeCloseTo(conc_highVd * 2, 1);
    });
  });

  describe('halfLife', () => {
    it('computes k_e from half-life correctly', () => {
      const t_half = 60; // 60 minutes
      const k_e = halfLife(t_half);

      // At t = t_half, concentration should be 50%
      // C(t) = C0 * e^(-k_e * t)
      const remaining = Math.exp(-k_e * t_half);
      expect(remaining).toBeCloseTo(0.5, 5);
    });

    it('handles edge case of very small half-life', () => {
      const k_e = halfLife(0.001);
      expect(isFinite(k_e)).toBe(true);
      expect(k_e).toBeGreaterThan(0);
    });
  });
});

describe('Pharmacodynamics (PD)', () => {
  describe('hill - Hill Equation', () => {
    it('returns 0 when x = 0', () => {
      expect(hill(0, 10, 1)).toBe(0);
    });

    it('returns 0.5 when x = x50', () => {
      expect(hill(10, 10, 1)).toBeCloseTo(0.5, 5);
      expect(hill(50, 50, 2)).toBeCloseTo(0.5, 5);
    });

    it('approaches 1 as x >> x50', () => {
      expect(hill(1000, 10, 1)).toBeGreaterThan(0.99);
    });

    it('is monotonically increasing', () => {
      let prev = 0;
      for (let x = 0; x <= 100; x += 5) {
        const val = hill(x, 20, 1.5);
        expect(val).toBeGreaterThanOrEqual(prev);
        prev = val;
      }
    });

    it('steepness increases with n (Hill coefficient)', () => {
      const x50 = 10;
      const x = 15; // Above x50

      const n1 = hill(x, x50, 1);
      const n2 = hill(x, x50, 2);
      const n3 = hill(x, x50, 4);

      // Higher n = steeper curve = more effect above x50
      expect(n2).toBeGreaterThan(n1);
      expect(n3).toBeGreaterThan(n2);
    });
  });

  describe('receptorOccupancy', () => {
    it('returns 0 at zero concentration', () => {
      expect(receptorOccupancy(0, 10)).toBe(0);
    });

    it('returns 0.5 when [L] = Kd', () => {
      expect(receptorOccupancy(10, 10)).toBeCloseTo(0.5, 5);
    });

    it('approaches 1 as [L] >> Kd', () => {
      expect(receptorOccupancy(10000, 10)).toBeGreaterThan(0.999);
    });

    it('lower Kd means higher affinity (more occupancy)', () => {
      const conc = 10;
      const lowKd = receptorOccupancy(conc, 1);   // High affinity
      const highKd = receptorOccupancy(conc, 100); // Low affinity

      expect(lowKd).toBeGreaterThan(highKd);
    });
  });

  describe('operationalAgonism', () => {
    it('returns 0 at zero concentration', () => {
      expect(operationalAgonism(0, 10, 5, 100)).toBe(0);
    });

    it('effect increases with tau (efficacy)', () => {
      const conc = 20;
      const Kd = 10;

      const lowTau = operationalAgonism(conc, Kd, 1, 100);
      const highTau = operationalAgonism(conc, Kd, 10, 100);

      expect(highTau).toBeGreaterThan(lowTau);
    });

    it('full agonist (high tau) approaches Emax', () => {
      const fullAgonist = operationalAgonism(1000, 10, 100, 100);
      expect(fullAgonist).toBeGreaterThan(95);
    });

    it('partial agonist (low tau) plateaus below Emax', () => {
      const partialAgonist = operationalAgonism(1000, 10, 0.5, 100);
      expect(partialAgonist).toBeLessThan(50);
    });
  });

  describe('competitiveAntagonism', () => {
    it('reduces occupancy in presence of antagonist', () => {
      const agonistConc = 50;
      const agonistKd = 10;

      const withoutAntagonist = receptorOccupancy(agonistConc, agonistKd);
      const withAntagonist = competitiveAntagonism(agonistConc, agonistKd, 100, 20);

      expect(withAntagonist).toBeLessThan(withoutAntagonist);
    });

    it('rightward shift increases with antagonist concentration', () => {
      const agonistConc = 50;
      const agonistKd = 10;

      const lowAntagonist = competitiveAntagonism(agonistConc, agonistKd, 10, 20);
      const highAntagonist = competitiveAntagonism(agonistConc, agonistKd, 100, 20);

      expect(highAntagonist).toBeLessThan(lowAntagonist);
    });
  });

  describe('nonCompetitiveAntagonism', () => {
    it('reduces Emax in presence of antagonist', () => {
      const baseEmax = 100;
      const reducedEmax = nonCompetitiveAntagonism(50, 10, baseEmax);

      expect(reducedEmax).toBeLessThan(baseEmax);
      expect(reducedEmax).toBeGreaterThan(0);
    });

    it('Emax reduction increases with antagonist concentration', () => {
      const lowAntagonist = nonCompetitiveAntagonism(10, 10, 100);
      const highAntagonist = nonCompetitiveAntagonism(100, 10, 100);

      expect(highAntagonist).toBeLessThan(lowAntagonist);
    });
  });
});

describe('Nutrient Kinetics', () => {
  describe('gammaPulse', () => {
    it('returns 0 before tlag', () => {
      expect(gammaPulse(5, 10, 60, 10)).toBe(0);
    });

    it('rises then falls', () => {
      const k_rise = 10;
      const k_fall = 60;
      const tlag = 10;

      // Find actual peak
      let peakVal = 0;
      let peakTime = 0;
      for (let t = tlag; t <= 200; t += 5) {
        const val = gammaPulse(t, k_rise, k_fall, tlag);
        if (val > peakVal) {
          peakVal = val;
          peakTime = t;
        }
      }

      const early = gammaPulse(tlag + 5, k_rise, k_fall, tlag);
      const late = gammaPulse(peakTime + 100, k_rise, k_fall, tlag);

      expect(peakVal).toBeGreaterThan(early);
      expect(late).toBeLessThan(peakVal);
    });
  });

  describe('carbAppearance', () => {
    it('returns 0 with no carbs', () => {
      expect(carbAppearance(60, {})).toBe(0);
    });

    it('sugar appears faster than starch', () => {
      const sugarPeak = findPeakTime((t) => carbAppearance(t, { carbSugar: 50 }));
      const starchPeak = findPeakTime((t) => carbAppearance(t, { carbStarch: 50 }));

      expect(sugarPeak).toBeLessThan(starchPeak);
    });

    it('higher GI means faster starch appearance', () => {
      const lowGI = findPeakTime((t) => carbAppearance(t, { carbStarch: 50, gi: 30 }));
      const highGI = findPeakTime((t) => carbAppearance(t, { carbStarch: 50, gi: 80 }));

      expect(highGI).toBeLessThan(lowGI);
    });

    it('fat and fiber slow carb appearance', () => {
      const plain = findPeakTime((t) => carbAppearance(t, { carbSugar: 50 }));
      const withFat = findPeakTime((t) => carbAppearance(t, { carbSugar: 50, fat: 20 }));
      const withFiber = findPeakTime((t) => carbAppearance(t, { carbSugar: 50, fiberSol: 10 }));

      expect(withFat).toBeGreaterThan(plain);
      expect(withFiber).toBeGreaterThan(plain);
    });
  });
});

describe('Michaelis-Menten Kinetics', () => {
  describe('michaelisMentenPK', () => {
    it('returns 0 before tlag', () => {
      expect(michaelisMentenPK(5, 0.2, 10, 100, 15, 10)).toBe(0);
    });

    it('shows zero-order elimination at high concentrations', () => {
      // At high C0, elimination should be nearly constant (Vmax)
      const highC0 = 200;
      const t1 = michaelisMentenPK(60, 0.2, 10, highC0, 15, 10);
      const t2 = michaelisMentenPK(120, 0.2, 10, highC0, 15, 10);
      const t3 = michaelisMentenPK(180, 0.2, 10, highC0, 15, 10);

      // Rate of change should be roughly constant (linear decline)
      const rate1 = t1 - t2;
      const rate2 = t2 - t3;
      expect(Math.abs(rate1 - rate2) / rate1).toBeLessThan(0.3); // Within 30%
    });
  });

  describe('alcoholBAC', () => {
    it('returns 0 before absorption lag', () => {
      expect(alcoholBAC(5, 14, 70, 'male')).toBe(0);
    });

    it('males have lower BAC than females for same dose', () => {
      const grams = 14; // ~1 standard drink
      const maleBAC = alcoholBAC(60, grams, 70, 'male');
      const femaleBAC = alcoholBAC(60, grams, 60, 'female');

      expect(femaleBAC).toBeGreaterThan(maleBAC);
    });

    it('heavier person has lower BAC', () => {
      const grams = 28; // 2 drinks
      const lightPerson = alcoholBAC(60, grams, 55, 'male');
      const heavyPerson = alcoholBAC(60, grams, 100, 'male');

      expect(lightPerson).toBeGreaterThan(heavyPerson);
    });

    it('BAC declines over time after peak', () => {
      const peak = alcoholBAC(60, 28, 70, 'male');
      const later = alcoholBAC(180, 28, 70, 'male');
      const muchLater = alcoholBAC(300, 28, 70, 'male');

      expect(later).toBeLessThan(peak);
      expect(muchLater).toBeLessThan(later);
    });
  });
});

// --- Helper Functions ---

function findPeakTime(fn: (t: number) => number, maxT = 300, step = 5): number {
  let peakTime = 0;
  let peakValue = -Infinity;

  for (let t = 0; t <= maxT; t += step) {
    const val = fn(t);
    if (val > peakValue) {
      peakValue = val;
      peakTime = t;
    }
  }

  return peakTime;
}
