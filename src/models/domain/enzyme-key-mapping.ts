/**
 * Single source of truth for converting between three representations of
 * drug-metabolizing enzymes and transporters:
 *
 *   - Canonical key:  "CYP3A4", "UGT1A1", "P_gp", "BCRP" ...
 *     (the form used in PharmacologyDef.pk.clearance.hepatic.enzymes, .inhibits,
 *     .induces, and core's pgx panel)
 *   - Auxiliary signal key:  "cyp3a4Activity", "ugt1a1Activity", "pgpActivity"
 *     (the form used in core's AUXILIARY_DEFINITIONS_MAP and chart series)
 *   - Display label:  pretty name for UI ("P-glycoprotein (ABCB1)", "CYP3A4")
 *
 * Previously every consumer (InspectorPanel, useActiveModulators,
 * useEnzymeFactorBreakdown, EnzymeDetailsDrawer) maintained its own variant of
 * these maps. They had drifted in coverage; this module is the canonical home.
 */

import type { DrugMetabolizingEnzymeKey } from '@kyneticbio/core';

const TRANSPORTER_KEYS = [
  'P_gp', 'BCRP', 'SLCO1B1', 'OCT2', 'OAT1', 'OAT3', 'MATE1', 'MRP2',
] as const;
type TransporterKey = (typeof TRANSPORTER_KEYS)[number];

const TRANSPORTER_AUX_STEMS: Record<TransporterKey, string> = {
  P_gp: 'pgp',
  BCRP: 'bcrp',
  SLCO1B1: 'slco1b1',
  OCT2: 'oct2',
  OAT1: 'oat1',
  OAT3: 'oat3',
  MATE1: 'mate1',
  MRP2: 'mrp2',
};

const TRANSPORTER_DISPLAY: Record<TransporterKey, string> = {
  P_gp: 'P-glycoprotein (ABCB1)',
  BCRP: 'BCRP (ABCG2)',
  SLCO1B1: 'SLCO1B1 (OATP1B1)',
  OCT2: 'OCT2',
  OAT1: 'OAT1',
  OAT3: 'OAT3',
  MATE1: 'MATE1',
  MRP2: 'MRP2 (ABCC2)',
};

const TRANSPORTER_AUX_TO_CANONICAL: Record<string, TransporterKey> =
  Object.fromEntries(
    (Object.entries(TRANSPORTER_AUX_STEMS) as [TransporterKey, string][]).map(
      ([canon, stem]) => [stem, canon],
    ),
  );

export function isAuxActivitySignal(key: string): boolean {
  return /Activity$/.test(key);
}

/** Forward: canonical enzyme/transporter key → auxiliary signal key. */
export function enzymeToAuxSignalKey(enzyme: string): string | null {
  if (/^CYP\d/i.test(enzyme) || /^UGT\d/i.test(enzyme)) {
    return enzyme.toLowerCase() + 'Activity';
  }
  if (enzyme in TRANSPORTER_AUX_STEMS) {
    return TRANSPORTER_AUX_STEMS[enzyme as TransporterKey] + 'Activity';
  }
  const nonCypPhaseOne = ['CES1', 'TPMT', 'DPYD', 'NAT2', 'COMT'];
  if (nonCypPhaseOne.includes(enzyme)) {
    return enzyme.toLowerCase() + 'Activity';
  }
  return null;
}

/**
 * Reverse: auxiliary signal key → canonical enzyme/transporter key.
 * Returns `null` for non-activity signals or unknown stems.
 */
export function auxSignalKeyToEnzyme(signalKey: string): string | null {
  if (!isAuxActivitySignal(signalKey)) return null;
  const stem = signalKey.slice(0, -'Activity'.length);
  if (/^(cyp|ugt)\d/i.test(stem)) return stem.toUpperCase();
  if (stem in TRANSPORTER_AUX_TO_CANONICAL) {
    return TRANSPORTER_AUX_TO_CANONICAL[stem];
  }
  const nonCyp: Record<string, string> = {
    ces1: 'CES1', tpmt: 'TPMT', dpyd: 'DPYD', nat2: 'NAT2', comt: 'COMT',
  };
  return nonCyp[stem] ?? null;
}

/**
 * Narrower reverse: returns only DrugMetabolizingEnzymeKey (CYP/UGT/phase-II
 * conjugators) — used by the factor-breakdown composable whose lookup tables
 * are keyed by that union. Transporter aux signals return `undefined`.
 */
export function auxSignalKeyToMetabolizingEnzyme(
  signalKey: string,
): DrugMetabolizingEnzymeKey | undefined {
  const canon = auxSignalKeyToEnzyme(signalKey);
  if (!canon) return undefined;
  if ((TRANSPORTER_AUX_TO_CANONICAL as Record<string, unknown>)[canon.toLowerCase()]) {
    return undefined;
  }
  if (canon in TRANSPORTER_AUX_STEMS) return undefined;
  return canon as DrugMetabolizingEnzymeKey;
}

/** Pretty label for UI. Transporters get gene-product names; CYPs/UGTs unchanged. */
export function enzymeDisplayLabel(enzyme: string): string {
  if (enzyme in TRANSPORTER_DISPLAY) {
    return TRANSPORTER_DISPLAY[enzyme as TransporterKey];
  }
  return enzyme;
}

/**
 * Returns whether `t` is inside `[startMin, endMin]`, handling wraparound
 * across the day boundary. When endMin < startMin (e.g., 23:00 → 01:00), the
 * interval is treated as union of [startMin, 1440) and [0, endMin].
 *
 * All inputs are minute-of-day (0..1439). The composables that call this work
 * in minute-of-day because timeline items store ISO strings whose date portion
 * isn't authoritative for the simulated day.
 */
export function timeInRangeMinOfDay(
  t: number,
  startMin: number,
  endMin: number,
): boolean {
  if (endMin >= startMin) return t >= startMin && t <= endMin;
  return t >= startMin || t <= endMin;
}

/** Minute-of-day (UTC) from ISO timestamp. Matches existing playhead convention. */
export function isoToMinuteOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
