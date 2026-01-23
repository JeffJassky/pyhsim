/**
 * Monotonicity Tests
 *
 * Tests that verify directional relationships:
 * - Dose-response: more drug → more effect
 * - Severity scaling: higher severity → stronger effect
 * - Transporter/receptor direction: correct sign of effects
 */

import { describe, expect, it } from 'vitest';
import { buildConditionAdjustments, CONDITION_LIBRARY } from '@physim/core';
import type { ConditionKey, ConditionStateSnapshot } from '@physim/core';

// Helper to create condition state
function createConditionState(
  overrides: Partial<Record<ConditionKey, { enabled: boolean; params: Record<string, number> }>> = {}
): Record<ConditionKey, ConditionStateSnapshot> {
  const baseState: Record<ConditionKey, ConditionStateSnapshot> = {
    adhd: { enabled: false, params: { severity: 0.6 } },
    autism: { enabled: false, params: { eibalance: 0.5 } },
    depression: { enabled: false, params: { severity: 0.5 } },
    anxiety: { enabled: false, params: { reactivity: 0.5 } },
    pots: { enabled: false, params: { severity: 0.5 } },
    mcas: { enabled: false, params: { activation: 0.5 } },
    insomnia: { enabled: false, params: { severity: 0.5 } },
    pcos: { enabled: false, params: { severity: 0.5 } },
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (baseState[key as ConditionKey] && value) {
      baseState[key as ConditionKey] = {
        enabled: value.enabled ?? false,
        params: { ...baseState[key as ConditionKey].params, ...(value.params ?? {}) },
      };
    }
  }

  return baseState;
}

describe('Condition Severity Monotonicity', () => {
  describe('ADHD', () => {
    it('DAT activity increases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const datActivities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ adhd: { enabled: true, params: { severity } } })
        );
        return adj.transporterActivities['DAT'] ?? 0;
      });

      // Each should be greater than or equal to the previous
      for (let i = 1; i < datActivities.length; i++) {
        expect(datActivities[i]).toBeGreaterThan(datActivities[i - 1]);
      }
    });

    it('NET activity increases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const netActivities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ adhd: { enabled: true, params: { severity } } })
        );
        return adj.transporterActivities['NET'] ?? 0;
      });

      for (let i = 1; i < netActivities.length; i++) {
        expect(netActivities[i]).toBeGreaterThan(netActivities[i - 1]);
      }
    });

    it('D2 receptor density decreases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const d2Densities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ adhd: { enabled: true, params: { severity } } })
        );
        return adj.receptorDensities['D2'] ?? 0;
      });

      // D2 density should become more negative with severity
      for (let i = 1; i < d2Densities.length; i++) {
        expect(d2Densities[i]).toBeLessThan(d2Densities[i - 1]);
      }
    });
  });

  describe('Depression', () => {
    it('SERT activity increases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const sertActivities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ depression: { enabled: true, params: { severity } } })
        );
        return adj.transporterActivities['SERT'] ?? 0;
      });

      for (let i = 1; i < sertActivities.length; i++) {
        expect(sertActivities[i]).toBeGreaterThan(sertActivities[i - 1]);
      }
    });

    it('5HT1A sensitivity increases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const sensitivities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ depression: { enabled: true, params: { severity } } })
        );
        return adj.receptorSensitivities['5HT1A'] ?? 0;
      });

      for (let i = 1; i < sensitivities.length; i++) {
        expect(sensitivities[i]).toBeGreaterThan(sensitivities[i - 1]);
      }
    });
  });

  describe('MCAS', () => {
    it('DAO activity decreases (more negative) monotonically with activation', () => {
      const activations = [0.2, 0.4, 0.6, 0.8, 1.0];
      const daoActivities = activations.map(activation => {
        const adj = buildConditionAdjustments(
          createConditionState({ mcas: { enabled: true, params: { activation } } })
        );
        return adj.enzymeActivities['DAO'] ?? 0;
      });

      // DAO should become more negative with activation
      for (let i = 1; i < daoActivities.length; i++) {
        expect(daoActivities[i]).toBeLessThan(daoActivities[i - 1]);
      }
    });

    it('H1 sensitivity increases monotonically with activation', () => {
      const activations = [0.2, 0.4, 0.6, 0.8, 1.0];
      const sensitivities = activations.map(activation => {
        const adj = buildConditionAdjustments(
          createConditionState({ mcas: { enabled: true, params: { activation } } })
        );
        return adj.receptorSensitivities['H1'] ?? 0;
      });

      for (let i = 1; i < sensitivities.length; i++) {
        expect(sensitivities[i]).toBeGreaterThan(sensitivities[i - 1]);
      }
    });
  });

  describe('Anxiety', () => {
    it('GABA-A density decreases monotonically with reactivity', () => {
      const reactivities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const gabaDensities = reactivities.map(reactivity => {
        const adj = buildConditionAdjustments(
          createConditionState({ anxiety: { enabled: true, params: { reactivity } } })
        );
        return adj.receptorDensities['GABA_A'] ?? 0;
      });

      for (let i = 1; i < gabaDensities.length; i++) {
        expect(gabaDensities[i]).toBeLessThan(gabaDensities[i - 1]);
      }
    });

    it('Alpha1 sensitivity increases monotonically with reactivity', () => {
      const reactivities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const sensitivities = reactivities.map(reactivity => {
        const adj = buildConditionAdjustments(
          createConditionState({ anxiety: { enabled: true, params: { reactivity } } })
        );
        return adj.receptorSensitivities['Alpha1'] ?? 0;
      });

      for (let i = 1; i < sensitivities.length; i++) {
        expect(sensitivities[i]).toBeGreaterThan(sensitivities[i - 1]);
      }
    });
  });

  describe('POTS', () => {
    it('NET activity decreases (more negative) monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const netActivities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ pots: { enabled: true, params: { severity } } })
        );
        return adj.transporterActivities['NET'] ?? 0;
      });

      // NET should become more negative with severity
      for (let i = 1; i < netActivities.length; i++) {
        expect(netActivities[i]).toBeLessThan(netActivities[i - 1]);
      }
    });

    it('Alpha1 sensitivity increases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const sensitivities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ pots: { enabled: true, params: { severity } } })
        );
        return adj.receptorSensitivities['Alpha1'] ?? 0;
      });

      for (let i = 1; i < sensitivities.length; i++) {
        expect(sensitivities[i]).toBeGreaterThan(sensitivities[i - 1]);
      }
    });
  });

  describe('Insomnia', () => {
    it('OX2R sensitivity increases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const sensitivities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ insomnia: { enabled: true, params: { severity } } })
        );
        return adj.receptorSensitivities['OX2R'] ?? 0;
      });

      for (let i = 1; i < sensitivities.length; i++) {
        expect(sensitivities[i]).toBeGreaterThan(sensitivities[i - 1]);
      }
    });

    it('MT1 density decreases monotonically with severity', () => {
      const severities = [0.2, 0.4, 0.6, 0.8, 1.0];
      const densities = severities.map(severity => {
        const adj = buildConditionAdjustments(
          createConditionState({ insomnia: { enabled: true, params: { severity } } })
        );
        return adj.receptorDensities['MT1'] ?? 0;
      });

      for (let i = 1; i < densities.length; i++) {
        expect(densities[i]).toBeLessThan(densities[i - 1]);
      }
    });
  });

  describe('Autism', () => {
    it('GABA-A density decreases monotonically with E/I imbalance', () => {
      const balances = [0.2, 0.4, 0.6, 0.8, 1.0];
      const densities = balances.map(eibalance => {
        const adj = buildConditionAdjustments(
          createConditionState({ autism: { enabled: true, params: { eibalance } } })
        );
        return adj.receptorDensities['GABA_A'] ?? 0;
      });

      for (let i = 1; i < densities.length; i++) {
        expect(densities[i]).toBeLessThan(densities[i - 1]);
      }
    });

    it('OXTR density decreases monotonically with E/I imbalance', () => {
      const balances = [0.2, 0.4, 0.6, 0.8, 1.0];
      const densities = balances.map(eibalance => {
        const adj = buildConditionAdjustments(
          createConditionState({ autism: { enabled: true, params: { eibalance } } })
        );
        return adj.receptorDensities['OXTR'] ?? 0;
      });

      for (let i = 1; i < densities.length; i++) {
        expect(densities[i]).toBeLessThan(densities[i - 1]);
      }
    });
  });
});

describe('Effect Direction Validation', () => {
  describe('Transporter Activity → Signal Direction', () => {
    it('Higher DAT activity (ADHD) should reduce dopamine', () => {
      // Verify the condition defines positive DAT activity (increased clearance)
      const adj = buildConditionAdjustments(
        createConditionState({ adhd: { enabled: true, params: { severity: 1.0 } } })
      );

      // DAT activity should be positive (increased)
      expect(adj.transporterActivities['DAT']).toBeGreaterThan(0);

      // In the engine, this gets applied as: dopamine /= (1 + DAT_activity)
      // So positive DAT activity → reduced dopamine (correct for ADHD)
    });

    it('Lower NET activity (POTS) should increase norepinephrine', () => {
      const adj = buildConditionAdjustments(
        createConditionState({ pots: { enabled: true, params: { severity: 1.0 } } })
      );

      // NET activity should be negative (decreased clearance)
      expect(adj.transporterActivities['NET']).toBeLessThan(0);

      // In the engine, this gets applied as: norepi /= (1 + NET_activity)
      // So negative NET activity → 1/(1-x) → increased norepi (correct for POTS)
    });

    it('Higher SERT activity (Depression) should reduce serotonin', () => {
      const adj = buildConditionAdjustments(
        createConditionState({ depression: { enabled: true, params: { severity: 1.0 } } })
      );

      // SERT activity should be positive (increased clearance)
      expect(adj.transporterActivities['SERT']).toBeGreaterThan(0);
    });
  });

  describe('Enzyme Activity → Signal Direction', () => {
    it('Lower DAO activity (MCAS) should increase histamine', () => {
      const adj = buildConditionAdjustments(
        createConditionState({ mcas: { enabled: true, params: { activation: 1.0 } } })
      );

      // DAO activity should be negative (reduced degradation)
      expect(adj.enzymeActivities['DAO']).toBeLessThan(0);

      // In the engine, histamineEnzymeGain = (1 - daoActivity) * 0.4 when daoActivity < 1
      // So negative DAO → daoActivity < 1 → positive histamine gain
    });

    it('Lower MAO-A activity (Anxiety) should affect monoamines', () => {
      const adj = buildConditionAdjustments(
        createConditionState({ anxiety: { enabled: true, params: { reactivity: 1.0 } } })
      );

      // MAO_A activity should be negative (reduced degradation)
      expect(adj.enzymeActivities['MAO_A']).toBeLessThan(0);
    });
  });
});

describe('Linearity of Scaling', () => {
  it('Doubling severity roughly doubles the effect', () => {
    const halfSeverity = buildConditionAdjustments(
      createConditionState({ adhd: { enabled: true, params: { severity: 0.5 } } })
    );
    const fullSeverity = buildConditionAdjustments(
      createConditionState({ adhd: { enabled: true, params: { severity: 1.0 } } })
    );

    const halfDAT = halfSeverity.transporterActivities['DAT'] ?? 0;
    const fullDAT = fullSeverity.transporterActivities['DAT'] ?? 0;

    // Full severity should be ~2x half severity (within 20%)
    const ratio = fullDAT / halfDAT;
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(2.5);
  });

  it('Zero severity produces zero effect', () => {
    const zeroSeverity = buildConditionAdjustments(
      createConditionState({ adhd: { enabled: true, params: { severity: 0 } } })
    );

    expect(zeroSeverity.transporterActivities['DAT'] ?? 0).toBeCloseTo(0, 10);
    expect(zeroSeverity.transporterActivities['NET'] ?? 0).toBeCloseTo(0, 10);
    expect(zeroSeverity.receptorDensities['D2'] ?? 0).toBeCloseTo(0, 10);
  });
});
