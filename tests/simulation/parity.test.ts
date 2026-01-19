import { describe, it, expect } from 'vitest';
import { runNumericalV1 } from '@/models/engine/solvers/numerical-v1';
import { runOptimizedV2 } from '@/models/engine/solvers/optimized-v2';
import { DEFAULT_SUBJECT, derivePhysiology } from '@/models/domain/subject';
import { buildInterventionLibrary } from '@/models/registry/interventions';
import { buildWorkerRequest } from '@/core/serialization';
import type { Minute, TimelineItem } from '@/types';

describe('V1 vs V2 Engine Parity Test', () => {
  const subject = DEFAULT_SUBJECT;
  const physiology = derivePhysiology(subject);
  // Match real app: 2-day grid
  const gridMins = Array.from({ length: 576 }, (_, i) => (i * 5) as Minute);

  // Build defs exactly like real app
  const defs = buildInterventionLibrary(subject, physiology);
  const clonedDefs = JSON.parse(JSON.stringify(defs));

  // Create timeline items like real app
  const timelineItems: TimelineItem[] = [
    {
      id: 'sleep-item',
      start: '2024-01-01T00:00:00',  // Midnight
      end: '2024-01-01T08:00:00',    // 8 AM
      meta: { key: 'sleep', params: {}, intensity: 1.0 },
    }
  ];

  // Build request exactly like engine.ts does
  const baseRequest = buildWorkerRequest(gridMins, timelineItems, clonedDefs, {
    options: {
      subject,
      physiology,
      debug: {
        enableBaselines: true,
        enableInterventions: true,
        enableCouplings: true,
        enableHomeostasis: true,
        enableReceptors: true,
        enableTransporters: true,
        enableEnzymes: true,
        enableConditions: true,
      }
    }
  });

  // Resolve pharmacology from ORIGINAL defs (like engine.ts lines 204-222)
  baseRequest.items.forEach(item => {
    const def = defs.find(d => d.key === item.meta.key);
    let resolvedPharm: any[] = [];
    if (def) {
      if (typeof def.pharmacology === 'function') {
        const result = (def.pharmacology as any)(item.meta.params || {});
        resolvedPharm = Array.isArray(result) ? result : [result];
      } else if (def.pharmacology) {
        resolvedPharm = [def.pharmacology];
      }
    }
    (item as any).resolvedPharmacology = resolvedPharm;
  });

  // Final serialization (like engine.ts line 225)
  const request = JSON.parse(JSON.stringify(baseRequest));

  it('should have identical trajectories for sleep-only scenario', () => {
    // Request is already serialized above
    const resV1 = runNumericalV1(request);
    const resV2 = runOptimizedV2(request);

    // Find maximum divergence across all time points
    let maxDiff = 0;
    let maxDiffTime = 0;
    let maxDiffV1 = 0;
    let maxDiffV2 = 0;

    for (let i = 0; i < gridMins.length; i++) {
      const v1 = resV1.series['melatonin'][i];
      const v2 = resV2.series['melatonin'][i];
      const diff = Math.abs(v1 - v2);

      if (diff > maxDiff) {
        maxDiff = diff;
        maxDiffTime = gridMins[i];
        maxDiffV1 = v1;
        maxDiffV2 = v2;
      }
    }

    console.log(`\n=== MAXIMUM DIVERGENCE ===`);
    console.log(`Time: T=${maxDiffTime} minutes`);
    console.log(`V1: ${maxDiffV1.toFixed(4)}`);
    console.log(`V2: ${maxDiffV2.toFixed(4)}`);
    console.log(`Diff: ${maxDiff.toFixed(4)}`);
    console.log(`========================\n`);

    // Also log values at key points
    const keyTimes = [0, 60, 120, 240, 360, 480, 600, 720];
    console.log('Key time points:');
    for (const t of keyTimes) {
      const idx = gridMins.findIndex(m => m >= t);
      if (idx >= 0) {
        const v1 = resV1.series['melatonin'][idx];
        const v2 = resV2.series['melatonin'][idx];
        console.log(`T=${gridMins[idx]} | V1: ${v1.toFixed(2)}, V2: ${v2.toFixed(2)}, diff: ${Math.abs(v1-v2).toFixed(3)}`);
      }
    }

    expect(maxDiff).toBeLessThan(5.0);
  });
});
