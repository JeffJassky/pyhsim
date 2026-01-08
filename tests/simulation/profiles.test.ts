/**
 * Profile System Tests
 *
 * Tests the neurophysiological profile system including:
 * - Receptor density and sensitivity effects
 * - Transporter activity effects
 * - Enzyme activity effects
 * - Profile parameter scaling
 */

import { describe, expect, it } from 'vitest';
import {
  buildProfileAdjustments,
  PROFILE_LIBRARY,
  type ProfileKey,
  type ProfileStateSnapshot,
} from '@/models/profiles';

// Helper to create profile state
function createProfileState(
  overrides: Partial<Record<ProfileKey, { enabled: boolean; params: Record<string, number> }>> = {}
): Record<ProfileKey, ProfileStateSnapshot> {
  const baseState: Record<ProfileKey, ProfileStateSnapshot> = {
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
    if (baseState[key as ProfileKey] && value) {
      baseState[key as ProfileKey] = {
        enabled: value.enabled ?? false,
        params: { ...baseState[key as ProfileKey].params, ...(value.params ?? {}) },
      };
    }
  }

  return baseState;
}

describe('Profile Library', () => {
  it('contains all expected profiles', () => {
    const profileKeys = PROFILE_LIBRARY.map(p => p.key);
    expect(profileKeys).toContain('adhd');
    expect(profileKeys).toContain('autism');
    expect(profileKeys).toContain('depression');
    expect(profileKeys).toContain('anxiety');
    expect(profileKeys).toContain('pots');
    expect(profileKeys).toContain('mcas');
    expect(profileKeys).toContain('insomnia');
    expect(profileKeys).toContain('pcos');
  });

  it('each profile has at least one modifier type', () => {
    for (const profile of PROFILE_LIBRARY) {
      const hasModifiers =
        (profile.receptorModifiers?.length ?? 0) > 0 ||
        (profile.transporterModifiers?.length ?? 0) > 0 ||
        (profile.enzymeModifiers?.length ?? 0) > 0 ||
        (profile.signalModifiers?.length ?? 0) > 0;

      expect(hasModifiers).toBe(true);
    }
  });

  it('each profile has valid parameter definitions', () => {
    for (const profile of PROFILE_LIBRARY) {
      expect(profile.params.length).toBeGreaterThan(0);

      for (const param of profile.params) {
        expect(param.min).toBeLessThan(param.max);
        expect(param.default).toBeGreaterThanOrEqual(param.min);
        expect(param.default).toBeLessThanOrEqual(param.max);
      }
    }
  });
});

describe('buildProfileAdjustments', () => {
  describe('Identity (No Effect)', () => {
    it('returns empty adjustments when no profiles are enabled', () => {
      const state = createProfileState();
      const adjustments = buildProfileAdjustments(state);

      expect(Object.keys(adjustments.baselines)).toHaveLength(0);
      expect(Object.keys(adjustments.receptorDensities)).toHaveLength(0);
      expect(Object.keys(adjustments.transporterActivities)).toHaveLength(0);
    });

    it('returns empty adjustments when profile is enabled at severity 0', () => {
      const state = createProfileState({
        adhd: { enabled: true, params: { severity: 0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      // At severity 0, all effects should be zero or minimal
      for (const [, adj] of Object.entries(adjustments.baselines)) {
        expect(Math.abs(adj?.amplitude ?? 0)).toBeLessThan(0.001);
      }
    });
  });

  describe('ADHD Profile', () => {
    it('increases DAT activity (faster dopamine clearance)', () => {
      const state = createProfileState({
        adhd: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.transporterActivities['DAT']).toBeGreaterThan(0);
    });

    it('increases NET activity (faster norepinephrine clearance)', () => {
      const state = createProfileState({
        adhd: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.transporterActivities['NET']).toBeGreaterThan(0);
    });

    it('DAT activity scales with severity', () => {
      const lowSeverity = buildProfileAdjustments(
        createProfileState({ adhd: { enabled: true, params: { severity: 0.3 } } })
      );
      const highSeverity = buildProfileAdjustments(
        createProfileState({ adhd: { enabled: true, params: { severity: 1.0 } } })
      );

      expect(highSeverity.transporterActivities['DAT']).toBeGreaterThan(
        lowSeverity.transporterActivities['DAT']!
      );
    });

    it('reduces D2 receptor density', () => {
      const state = createProfileState({
        adhd: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.receptorDensities['D2']).toBeLessThan(0);
    });
  });

  describe('Depression Profile', () => {
    it('increases SERT activity (faster serotonin clearance)', () => {
      const state = createProfileState({
        depression: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.transporterActivities['SERT']).toBeGreaterThan(0);
    });

    it('adjusts 5-HT1A receptor sensitivity', () => {
      const state = createProfileState({
        depression: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      // Depression has 5HT1A sensitivity increase (autoreceptor supersensitivity)
      expect(adjustments.receptorSensitivities['5HT1A']).toBeGreaterThan(0);
    });
  });

  describe('MCAS Profile', () => {
    it('reduces DAO enzyme activity', () => {
      const state = createProfileState({
        mcas: { enabled: true, params: { activation: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.enzymeActivities['DAO']).toBeLessThan(0);
    });

    it('DAO reduction scales with activation level', () => {
      const lowActivation = buildProfileAdjustments(
        createProfileState({ mcas: { enabled: true, params: { activation: 0.3 } } })
      );
      const highActivation = buildProfileAdjustments(
        createProfileState({ mcas: { enabled: true, params: { activation: 1.0 } } })
      );

      // Higher activation = more DAO reduction (more negative)
      expect(highActivation.enzymeActivities['DAO']).toBeLessThan(
        lowActivation.enzymeActivities['DAO']!
      );
    });
  });

  describe('Anxiety Profile', () => {
    it('reduces GABA-A receptor density', () => {
      const state = createProfileState({
        anxiety: { enabled: true, params: { reactivity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.receptorDensities['GABA_A']).toBeLessThan(0);
    });

    it('reduces MAO-A activity', () => {
      const state = createProfileState({
        anxiety: { enabled: true, params: { reactivity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.enzymeActivities['MAO_A']).toBeLessThan(0);
    });
  });

  describe('POTS Profile', () => {
    it('reduces NET activity (NE accumulation)', () => {
      const state = createProfileState({
        pots: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      // POTS has NET dysfunction leading to NE accumulation
      expect(adjustments.transporterActivities['NET']).toBeLessThan(0);
    });

    it('increases Alpha1 receptor sensitivity', () => {
      const state = createProfileState({
        pots: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.receptorSensitivities['Alpha1']).toBeGreaterThan(0);
    });
  });

  describe('Insomnia Profile', () => {
    it('increases orexin receptor sensitivity', () => {
      const state = createProfileState({
        insomnia: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.receptorSensitivities['OX2R']).toBeGreaterThan(0);
    });

    it('reduces melatonin receptor density', () => {
      const state = createProfileState({
        insomnia: { enabled: true, params: { severity: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.receptorDensities['MT1']).toBeLessThan(0);
    });
  });

  describe('Autism Profile', () => {
    it('reduces GABA-A receptor density (E/I imbalance)', () => {
      const state = createProfileState({
        autism: { enabled: true, params: { eibalance: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.receptorDensities['GABA_A']).toBeLessThan(0);
    });

    it('reduces oxytocin receptor density', () => {
      const state = createProfileState({
        autism: { enabled: true, params: { eibalance: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      expect(adjustments.receptorDensities['OXTR']).toBeLessThan(0);
    });

    it('reduces SERT activity (hyperserotonemia)', () => {
      const state = createProfileState({
        autism: { enabled: true, params: { eibalance: 1.0 } },
      });
      const adjustments = buildProfileAdjustments(state);

      // Reduced SERT = slower serotonin clearance = higher serotonin
      expect(adjustments.transporterActivities['SERT']).toBeLessThan(0);
    });
  });
});

describe('Profile Effect Directions', () => {
  describe('Transporter Activity Directions', () => {
    it('ADHD: DAT↑ should mean faster dopamine clearance', () => {
      // This is a documentation/validation test
      const adhd = PROFILE_LIBRARY.find(p => p.key === 'adhd');
      const datMod = adhd?.transporterModifiers?.find(m => m.transporter === 'DAT');

      expect(datMod).toBeDefined();
      expect(datMod!.activity).toBeGreaterThan(0); // Positive = increased activity
    });

    it('POTS: NET↓ should mean slower NE clearance (accumulation)', () => {
      const pots = PROFILE_LIBRARY.find(p => p.key === 'pots');
      const netMod = pots?.transporterModifiers?.find(m => m.transporter === 'NET');

      expect(netMod).toBeDefined();
      expect(netMod!.activity).toBeLessThan(0); // Negative = decreased activity
    });
  });

  describe('Receptor Density Directions', () => {
    it('Autism: GABA_A↓ represents reduced inhibition', () => {
      const autism = PROFILE_LIBRARY.find(p => p.key === 'autism');
      const gabaMod = autism?.receptorModifiers?.find(m => m.receptor === 'GABA_A');

      expect(gabaMod).toBeDefined();
      expect(gabaMod!.density).toBeLessThan(0);
    });
  });

  describe('Enzyme Activity Directions', () => {
    it('MCAS: DAO↓ means slower histamine clearance', () => {
      const mcas = PROFILE_LIBRARY.find(p => p.key === 'mcas');
      const daoMod = mcas?.enzymeModifiers?.find(m => m.enzyme === 'DAO');

      expect(daoMod).toBeDefined();
      expect(daoMod!.activity).toBeLessThan(0); // Negative = reduced enzyme activity
    });

    it('Anxiety: MAO_A↓ means slower monoamine degradation', () => {
      const anxiety = PROFILE_LIBRARY.find(p => p.key === 'anxiety');
      const maoMod = anxiety?.enzymeModifiers?.find(m => m.enzyme === 'MAO_A');

      expect(maoMod).toBeDefined();
      expect(maoMod!.activity).toBeLessThan(0);
    });
  });
});

describe('Profile Magnitude Sanity', () => {
  it('Transporter activity deltas are physiologically reasonable (< 100%)', () => {
    for (const profile of PROFILE_LIBRARY) {
      for (const mod of profile.transporterModifiers ?? []) {
        expect(Math.abs(mod.activity)).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it('Receptor density deltas are physiologically reasonable (< 50%)', () => {
    for (const profile of PROFILE_LIBRARY) {
      for (const mod of profile.receptorModifiers ?? []) {
        if (mod.density !== undefined) {
          expect(Math.abs(mod.density)).toBeLessThanOrEqual(0.5);
        }
      }
    }
  });

  it('Enzyme activity deltas are physiologically reasonable (< 50%)', () => {
    for (const profile of PROFILE_LIBRARY) {
      for (const mod of profile.enzymeModifiers ?? []) {
        expect(Math.abs(mod.activity)).toBeLessThanOrEqual(0.5);
      }
    }
  });
});

describe('Profile Combination', () => {
  it('Multiple profiles combine additively', () => {
    const adhdOnly = buildProfileAdjustments(
      createProfileState({ adhd: { enabled: true, params: { severity: 0.5 } } })
    );
    const anxietyOnly = buildProfileAdjustments(
      createProfileState({ anxiety: { enabled: true, params: { reactivity: 0.5 } } })
    );
    const combined = buildProfileAdjustments(
      createProfileState({
        adhd: { enabled: true, params: { severity: 0.5 } },
        anxiety: { enabled: true, params: { reactivity: 0.5 } },
      })
    );

    // DAT should be same (only ADHD affects it)
    expect(combined.transporterActivities['DAT']).toBeCloseTo(
      adhdOnly.transporterActivities['DAT']!,
      5
    );

    // MAO_A should be same (only Anxiety affects it)
    expect(combined.enzymeActivities['MAO_A']).toBeCloseTo(
      anxietyOnly.enzymeActivities['MAO_A']!,
      5
    );

    // GABA_A density should combine (both reduce it)
    // This is less straightforward since we're testing the combination behavior
    if (adhdOnly.receptorDensities['GABA_A'] && anxietyOnly.receptorDensities['GABA_A']) {
      expect(combined.receptorDensities['GABA_A']).toBeLessThan(
        adhdOnly.receptorDensities['GABA_A']!
      );
    }
  });
});

describe('No Double-Counting', () => {
  it('Mechanistic profiles do not apply legacy amplitude adjustments', () => {
    // ADHD has both mechanistic (transporterModifiers) and legacy (signalModifiers)
    // The amplitude from signalModifiers should NOT be applied when mechanistic modifiers exist
    const state = createProfileState({
      adhd: { enabled: true, params: { severity: 1.0 } },
    });
    const adjustments = buildProfileAdjustments(state);

    // The dopamine amplitude adjustment should come ONLY from mechanistic modifiers
    // (receptor density effects), not from legacy signalModifiers
    const dopamineAmplitude = adjustments.baselines['dopamine']?.amplitude ?? 0;

    // With our fix, dopamine amplitude should be from D2 density effect only
    // D2 density -0.15 × 0.25 gainPerDensity = -0.0375
    // NOT the legacy -0.2 from signalModifiers
    expect(Math.abs(dopamineAmplitude)).toBeLessThan(0.15);
  });

  it('Phase shifts from legacy modifiers are still applied', () => {
    // Phase shifts are not modeled mechanistically, so they should still be applied
    const state = createProfileState({
      adhd: { enabled: true, params: { severity: 1.0 } },
    });
    const adjustments = buildProfileAdjustments(state);

    // ADHD has melatonin phase shift in legacy modifiers
    const melatoninPhase = adjustments.baselines['melatonin']?.phaseShiftMin ?? 0;
    expect(melatoninPhase).toBeGreaterThan(0); // Delayed melatonin in ADHD
  });

  it('Coupling gains from legacy modifiers are still applied', () => {
    const state = createProfileState({
      adhd: { enabled: true, params: { severity: 1.0 } },
    });
    const adjustments = buildProfileAdjustments(state);

    // ADHD has coupling gains for cortisol in legacy modifiers
    expect(adjustments.couplings['cortisol']?.length).toBeGreaterThan(0);
  });
});
