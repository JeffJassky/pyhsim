import { describe, it, expect } from 'vitest';
import { INTERVENTIONS } from '@physim/core';
import { validateInterventionLibrary } from '@physim/core';

describe('Intervention Unit Integrity', () => {
  it('should have matching units for all pharmacological effects', () => {
    const errors = validateInterventionLibrary(INTERVENTIONS);

    if (errors.length > 0) {
      const messages = errors.map(e => `[${e.interventionKey}] ${e.message}`).join('\n');
      throw new Error(`Intervention Unit Mismatches Found:\n${messages}`);
    }
  });
});
