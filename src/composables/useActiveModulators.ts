/**
 * Returns drugs currently on the timeline that inhibit or induce a given enzyme
 * or transporter signal at a specific time (the playhead minute).
 *
 * "Currently" means the timeline item's window contains the playhead minute.
 * This is a timeline-based check, not a concentration-aware check — a drug
 * that was dosed an hour ago but has since cleared from plasma will still
 * appear here while its timeline item is active. For most timeline items
 * spanning minutes-to-hours, this is a good proxy. Future iteration could
 * hit the engine's PK buffer for true concentration-aware filtering.
 */

import { computed, type ComputedRef } from 'vue';
import type {
  PharmacologyDef,
  EnzymeInhibition,
  EnzymeInduction,
  InterventionDef,
} from '@kyneticbio/core';
import type { TimelineItem } from '@/types';
import {
  auxSignalKeyToEnzyme,
  isoToMinuteOfDay,
  timeInRangeMinOfDay,
} from '@/models/domain/enzyme-key-mapping';

export interface ActiveInhibitor {
  itemId: string;
  drugLabel: string;
  drugKey: string;
  enzyme: string;
  mechanism: EnzymeInhibition['mechanism'];
  Ki_mg_per_L: number;
  k_inact_per_min?: number;
}

export interface ActiveInducer {
  itemId: string;
  drugLabel: string;
  drugKey: string;
  enzyme: string;
  Emax: number;
  EC50_mg_per_L: number;
}

export interface ActiveModulators {
  inhibitors: ActiveInhibitor[];
  inducers: ActiveInducer[];
}

function resolvePharmacology(
  def: InterventionDef,
  params: Record<string, any>,
): PharmacologyDef[] {
  if (typeof def.pharmacology === 'function') {
    const result = (def.pharmacology as any)(params);
    return Array.isArray(result) ? result : [result];
  }
  return [def.pharmacology as PharmacologyDef];
}

export function useActiveModulators(
  signalKey: ComputedRef<string | undefined>,
  playheadMin: ComputedRef<number>,
  timelineItems: ComputedRef<TimelineItem[]>,
  defsMap: ComputedRef<Map<string, InterventionDef>>,
): ComputedRef<ActiveModulators> {
  return computed(() => {
    const inhibitors: ActiveInhibitor[] = [];
    const inducers: ActiveInducer[] = [];

    const sig = signalKey.value;
    if (!sig) return { inhibitors, inducers };

    // Map signal aux key (e.g., "cyp3a4Activity") → enzyme key ("CYP3A4")
    const enzymeKey = auxSignalKeyToEnzyme(sig);
    if (!enzymeKey) return { inhibitors, inducers };

    const t = playheadMin.value;

    for (const item of timelineItems.value) {
      const startMin = isoToMinuteOfDay(item.start);
      const endMin = item.end ? isoToMinuteOfDay(item.end) : startMin + 1;
      if (!timeInRangeMinOfDay(t, startMin, endMin)) continue;
      if (item.meta.disabled) continue;

      const def = defsMap.value.get(item.meta.key);
      if (!def) continue;

      const pharms = resolvePharmacology(def, item.meta.params ?? {});

      for (const pharm of pharms as any[]) {
        for (const inh of (pharm.inhibits ?? []) as EnzymeInhibition[]) {
          if (inh.enzyme !== enzymeKey) continue;
          inhibitors.push({
            itemId: item.id,
            drugLabel: item.meta.labelOverride || def.label,
            drugKey: item.meta.key,
            enzyme: inh.enzyme,
            mechanism: inh.mechanism,
            Ki_mg_per_L: inh.Ki_mg_per_L,
            k_inact_per_min: inh.k_inact_per_min,
          });
        }
        for (const ind of (pharm.induces ?? []) as EnzymeInduction[]) {
          if (ind.enzyme !== enzymeKey) continue;
          inducers.push({
            itemId: item.id,
            drugLabel: item.meta.labelOverride || def.label,
            drugKey: item.meta.key,
            enzyme: ind.enzyme,
            Emax: ind.Emax,
            EC50_mg_per_L: ind.EC50_mg_per_L,
          });
        }
      }
    }

    return { inhibitors, inducers };
  });
}
