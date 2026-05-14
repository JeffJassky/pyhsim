/**
 * Decomposes a per-enzyme activity auxiliary signal into a complete factor
 * chain at the playhead minute. Each factor renders as its own row only when
 * it deviates meaningfully from 1.00; rows at exactly 1.00 are hidden so the
 * table focuses on what's actually contributing.
 *
 * Static factors (constant during the simulation): genetic baseline, sex, age,
 * pregnancy state, hepatic disease (Child-Pugh).
 *
 * Dynamic factors (vary across the simulation): diurnal phase, inflammation,
 * acute hepatic injury (ALT/bilirubin), active drug induction, mechanism-based
 * inhibition. Each is computed independently from subject + playhead + timeline.
 *
 * The "Engine residual" row exposes any gap between the UI-computed product
 * and the engine's live signal value. Hidden when within 2% rounding noise;
 * surfaces honestly otherwise so the user is never confused by a missing piece.
 */

import { computed, type ComputedRef } from 'vue';
import type {
  Subject,
  MetabolizerStatus,
  DrugMetabolizingEnzymeKey,
  InterventionDef,
  EnzymeInhibition,
  EnzymeInduction,
} from '@kyneticbio/core';
import type { TimelineItem } from '@/types';
import {
  computeDiurnalFactor,
  computeInflammationFactor,
  computeHepaticInjuryFactor,
  enzymeTau,
} from '@/models/domain/enzyme-display-configs';
import {
  auxSignalKeyToMetabolizingEnzyme,
  isoToMinuteOfDay,
  timeInRangeMinOfDay,
} from '@/models/domain/enzyme-key-mapping';
// Display tables live in core to avoid drift with the engine's authoritative values.
import {
  getStatusActivityMultiplier,
  getCOMTActivityMultiplier,
  pregnancyFactor,
  childPughFactor,
  computeChildPughClass,
} from '@kyneticbio/core';

export interface FactorRow {
  label: string;
  value: number;
  context?: string;
  tooltip?: string;
}

export interface EnzymeFactorBreakdown {
  rows: FactorRow[];
  liveValue: number;
}

// Sex / age tables remain local — these are UI display approximations of the
// core enzyme aux-signal _builder.ts factor chain, not authoritative tables.
// The values mirror what _builder.ts uses; if/when those become part of a
// public enzyme-config export, this duplication should follow suit.
const SEX_FACTOR_FEMALE: Partial<Record<DrugMetabolizingEnzymeKey, number>> = {
  CYP3A4: 1.25, CYP3A5: 1.0, CYP1A2: 0.7, CYP2B6: 1.5, CYP2C9: 1.0,
  CYP2C19: 1.0, CYP2D6: 1.0, CYP2E1: 0.85, CES1: 0.7, UGT1A1: 1.0,
  UGT2B7: 1.0, TPMT: 1.0, DPYD: 1.0, NAT2: 1.0, COMT: 1.0,
};

const AGE_DECLINE_RATE: Partial<Record<DrugMetabolizingEnzymeKey, number>> = {
  CYP3A4: 0.005, CYP3A5: 0.004, CYP1A2: 0.004, CYP2B6: 0.005, CYP2C9: 0.004,
  CYP2C19: 0.005, CYP2D6: 0.003, CYP2E1: 0.003, CES1: 0.003, UGT1A1: 0.003,
  UGT2B7: 0.003, TPMT: 0, DPYD: 0.002, NAT2: 0.002, COMT: 0.002,
};

const AGE_FLOOR: Partial<Record<DrugMetabolizingEnzymeKey, number>> = {
  CYP3A4: 0.6, CYP1A2: 0.7, CYP2D6: 0.7, CYP2C9: 0.65,
};

function geneticBaseline(
  subject: Subject,
  enzyme: DrugMetabolizingEnzymeKey,
): { value: number; context?: string } {
  if (enzyme === 'COMT') {
    const g = subject.genetics?.nutrigenomics?.comt_v158m;
    if (!g) return { value: 1.0 };
    return { value: getCOMTActivityMultiplier(g), context: g };
  }
  const panel = subject.genetics?.pharmacogenomics as Record<string, MetabolizerStatus | undefined> | undefined;
  const status = panel?.[`${enzyme.toLowerCase()}_status`];
  if (!status) return { value: 1.0 };
  return { value: getStatusActivityMultiplier(enzyme, status), context: status };
}

function ageFactor(age: number, enzyme: DrugMetabolizingEnzymeKey): number {
  if (age <= 40) return 1.0;
  const rate = AGE_DECLINE_RATE[enzyme] ?? 0.003;
  const floor = AGE_FLOOR[enzyme] ?? 0.7;
  return Math.max(floor, 1.0 - (age - 40) * rate);
}

// childPughClass + childPughFactor are now provided by @kyneticbio/core
// (imported above). The local copy used to drift from core — see the
// useEnzymeFactorBreakdown call site for the replacement pattern.

function hourLabel(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(Math.floor(m % 60)).padStart(2, '0');
  const period = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${period}`;
}

function resolveDrugPharmacology(def: InterventionDef, params: Record<string, any>): any[] {
  if (typeof def.pharmacology === 'function') {
    const result = (def.pharmacology as any)(params);
    return Array.isArray(result) ? result : [result];
  }
  return [def.pharmacology];
}

function computeDrugDynamicFactors(
  enzyme: DrugMetabolizingEnzymeKey,
  playheadMin: number,
  timelineItems: TimelineItem[],
  defsMap: Map<string, InterventionDef>,
): { induction: number; inducers: string[]; mbiSurvival: number; mbiDrugs: string[] } {
  let bestInduction = 1.0;
  const inducers: string[] = [];
  let mbiRate = 0;
  const mbiDrugs: string[] = [];

  for (const item of timelineItems) {
    if (item.meta.disabled) continue;
    const startMin = isoToMinuteOfDay(item.start);
    const endMin = item.end ? isoToMinuteOfDay(item.end) : startMin + 1;
    if (!timeInRangeMinOfDay(playheadMin, startMin, endMin)) continue;

    const def = defsMap.get(item.meta.key);
    if (!def) continue;
    const pharms = resolveDrugPharmacology(def, item.meta.params ?? {});

    for (const pharm of pharms) {
      for (const ind of (pharm.induces ?? []) as EnzymeInduction[]) {
        if (ind.enzyme !== enzyme) continue;
        // Display heuristic: assume drug at half-saturating concentration so the
        // multiplier shown is 1 + 0.5·Emax. Engine residual will catch any gap.
        const mult = 1 + ind.Emax * 0.5;
        if (mult > bestInduction) bestInduction = mult;
        inducers.push(def.label || item.meta.key);
      }
      for (const inh of (pharm.inhibits ?? []) as EnzymeInhibition[]) {
        if (inh.mechanism !== 'mechanism-based' || !inh.k_inact_per_min) continue;
        if (inh.enzyme !== enzyme) continue;
        mbiRate += inh.k_inact_per_min * 0.5;
        mbiDrugs.push(def.label || item.meta.key);
      }
    }
  }

  const k_deg = 1 / enzymeTau(enzyme);
  const mbiSurvival = k_deg / (k_deg + mbiRate);

  return { induction: bestInduction, inducers, mbiSurvival, mbiDrugs };
}

const SIGNIFICANT = 0.005;
function isSignificant(v: number): boolean {
  return Math.abs(v - 1) >= SIGNIFICANT;
}

export function useEnzymeFactorBreakdown(
  signalKey: ComputedRef<string>,
  liveValue: ComputedRef<number | undefined>,
  subject: ComputedRef<Subject | undefined>,
  playheadMin: ComputedRef<number>,
  timelineItems: ComputedRef<TimelineItem[]>,
  defsMap: ComputedRef<Map<string, InterventionDef>>,
): ComputedRef<EnzymeFactorBreakdown | null> {
  return computed(() => {
    const enzyme = auxSignalKeyToMetabolizingEnzyme(signalKey.value);
    const subj = subject.value;
    const live = liveValue.value;
    if (!enzyme || !subj || live === undefined) return null;

    const rows: FactorRow[] = [];

    // ---- Static factors (constant during sim) ----
    const baseline = geneticBaseline(subj, enzyme);
    rows.push({
      label: 'Genetic baseline',
      value: baseline.value,
      context: baseline.context,
      tooltip: 'Activity multiplier from your genotype at this enzyme.',
    });

    const sexF = subj.sex === 'female' ? (SEX_FACTOR_FEMALE[enzyme] ?? 1.0) : 1.0;
    if (isSignificant(sexF)) {
      rows.push({
        label: 'Sex',
        value: sexF,
        context: subj.sex,
        tooltip: 'Per-enzyme sex-typical baseline activity (Anderson 2005).',
      });
    }

    const ageF = ageFactor(subj.age, enzyme);
    if (isSignificant(ageF)) {
      rows.push({
        label: 'Age',
        value: ageF,
        context: `${subj.age}y`,
        tooltip: 'Hepatic enzyme synthesis declines mildly with age above 40.',
      });
    }

    const pregF = pregnancyFactor(enzyme, subj.pregnancyState);
    if (isSignificant(pregF)) {
      rows.push({
        label: 'Pregnancy',
        value: pregF,
        context: subj.pregnancyState,
        tooltip: 'Trimester-specific CYP modulation (Tasnif 2016, Pfeil 2011).',
      });
    }

    const cpScore = subj.bloodwork?.childPughScore;
    const cpF = childPughFactor(enzyme, cpScore);
    if (isSignificant(cpF)) {
      const cpClass = computeChildPughClass(cpScore);
      rows.push({
        label: 'Hepatic disease',
        value: cpF,
        context: cpClass ? `Child-Pugh ${cpClass}` : 'Child-Pugh',
        tooltip: 'Per-CYP differential sensitivity to chronic liver disease (Edginton 2008).',
      });
    }

    // ---- Dynamic factors (vary across sim) ----
    const diurnalF = computeDiurnalFactor(enzyme, playheadMin.value);
    if (isSignificant(diurnalF)) {
      rows.push({
        label: 'Diurnal rhythm',
        value: diurnalF,
        context: hourLabel(playheadMin.value),
        tooltip: 'Time-of-day rhythm in hepatic enzyme expression. Updates as you scrub the timeline.',
      });
    }

    const hsCRP = subj.bloodwork?.inflammation?.hsCRP_mg_L ?? 1.0;
    const inflammationF = computeInflammationFactor(enzyme, hsCRP);
    if (isSignificant(inflammationF)) {
      rows.push({
        label: 'Inflammation',
        value: inflammationF,
        context: `hsCRP ${hsCRP.toFixed(1)} mg/L`,
        tooltip: 'IL-6 / cytokines suppress CYP transcription (Aitken 2006, Morgan 2009).',
      });
    }

    const alt = subj.bloodwork?.metabolic?.alt_U_L ?? 25;
    const bil = subj.bloodwork?.metabolic?.bilirubin_mg_dL ?? 0.7;
    const hepInjuryF = computeHepaticInjuryFactor(alt, bil);
    if (isSignificant(hepInjuryF)) {
      rows.push({
        label: 'Hepatic injury',
        value: hepInjuryF,
        context: `ALT ${alt} U/L · bilirubin ${bil} mg/dL`,
        tooltip: 'Acute hepatocellular damage from elevated ALT or bilirubin.',
      });
    }

    const drugs = computeDrugDynamicFactors(enzyme, playheadMin.value, timelineItems.value, defsMap.value);
    if (isSignificant(drugs.induction)) {
      rows.push({
        label: 'Active induction',
        value: drugs.induction,
        context: drugs.inducers.join(', '),
        tooltip: 'Upregulation from inducer drugs currently on the timeline.',
      });
    }
    if (isSignificant(drugs.mbiSurvival)) {
      rows.push({
        label: 'MBI inactivation',
        value: drugs.mbiSurvival,
        context: drugs.mbiDrugs.join(', '),
        tooltip: 'Irreversible enzyme inactivation by mechanism-based inhibitors. Recovery takes days.',
      });
    }

    // ---- Engine residual ----
    // Honest disclosure: if our UI factors don't multiply to the engine's live
    // value, surface the gap. Hidden under 2% drift (rounding noise).
    const product = rows.reduce((acc, r) => acc * r.value, 1);
    const residual = live / Math.max(0.0001, product);
    if (Math.abs(residual - 1) > 0.02) {
      rows.push({
        label: 'Engine residual',
        value: residual,
        tooltip: "Gap between the UI's factor chain and the engine's live value. Small drift is expected; large values indicate a factor the UI doesn't track yet.",
      });
    }

    return { rows, liveValue: live };
  });
}
