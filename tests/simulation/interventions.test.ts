import { describe, it, expect } from 'vitest';
import { INTERVENTIONS } from '@/models/library/interventions';
import { SIGNAL_UNITS } from '@/models/engine/unified/signal-units';
import { isReceptor, getReceptorSignals } from '@/models/library/pharmacology';

describe('Intervention Unit Integrity', () => {
  it('should have matching units for all pharmacological effects', () => {
    const errors: string[] = [];

    INTERVENTIONS.forEach((intervention) => {
      const pd = intervention.pharmacology.pd;
      if (!pd) return;

      pd.forEach((effect, index) => {
        const target = effect.target;
        const effectUnit = effect.unit;

        // 1. Resolve the actual signal(s) being affected
        let signalsToCheck: Signal[] = [];

        if (isReceptor(target)) {
          // If target is a receptor (e.g., "DAT"), get the downstream signals (e.g., "dopamine")
          const downstream = getReceptorSignals(target);
          signalsToCheck = downstream.map(d => d.signal);
        } else if (target in SIGNAL_UNITS) {
          // Target is a direct signal (e.g., "dopamine")
          signalsToCheck = [target as Signal];
        } else {
          // Target might be an auxiliary variable or unknown
          // We currently only strictly enforce units for registered Signals
          return;
        }

        // 2. Validate units against each affected signal
        signalsToCheck.forEach((signal) => {
          const expectedUnit = SIGNAL_UNITS[signal]?.unit;

          if (!expectedUnit) {
            // Signal exists but has no unit definition? This is a registry error.
            errors.push(
              `[${intervention.key}] Target '${target}' maps to signal '${signal}', which has no definition in SIGNAL_UNITS.`
            );
            return;
          }

          if (!effectUnit) {
            errors.push(
              `[${intervention.key}] Effect on '${target}' (index ${index}) is missing a unit. Expected: '${expectedUnit}'.`
            );
            return;
          }

          // Special Case: Allosteric Modulators (PAM/NAM) act as multipliers/modifiers, not direct concentration additions.
          // They should typically use 'fold-change' or 'index'.
          const isModulator = effect.mechanism === 'PAM' || effect.mechanism === 'NAM';
          if (isModulator && (effectUnit === 'fold-change' || effectUnit === 'index')) {
            return; // Valid
          }

          // Standard Case: Agonists/Antagonists usually represent effective concentration equivalents
          if (effectUnit !== expectedUnit) {
            errors.push(
              `[${intervention.key}] Effect on '${target}' has unit '${effectUnit}', but target '${signal}' requires '${expectedUnit}'.`
            );
          }
        });
      });
    });

    if (errors.length > 0) {
      throw new Error(`Intervention Unit Mismatches Found:\n${errors.join('\n')}`);
    }
  });
});
