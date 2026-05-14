/**
 * Pharmacokinetics signal group — exposes the engine's per-CYP and
 * per-transporter activity auxiliary signals as chartable entries.
 *
 * These exist as AuxiliaryDefinitions in core (registered in
 * core/src/endogenous/signals/enzymes and /signals/transporters). They aren't
 * SignalDefinitions, so the default chart catalog ignores them. This module
 * lifts them into the chart UI as their own group, default disabled.
 */

export const PHARMACOKINETICS_SIGNAL_KEYS: readonly string[] = [
  // Phase I CYPs
  'cyp1a2Activity',
  'cyp2b6Activity',
  'cyp2c9Activity',
  'cyp2c19Activity',
  'cyp2d6Activity',
  'cyp2e1Activity',
  'cyp3a4Activity',
  'cyp3a5Activity',
  // Phase I non-CYP
  'ces1Activity',
  // Phase II conjugation
  'ugt1a1Activity',
  'ugt2b7Activity',
  'tpmtActivity',
  'dpydActivity',
  'nat2Activity',
  'comtActivity',
  // Drug transporters
  'pgpActivity',
  'bcrpActivity',
  'slco1b1Activity',
  'oct2Activity',
  'oat1Activity',
  'oat3Activity',
  'mate1Activity',
  'mrp2Activity',
] as const;

export const PHARMACOKINETICS_SIGNAL_KEY_SET: ReadonlySet<string> = new Set(
  PHARMACOKINETICS_SIGNAL_KEYS,
);

export function isPharmacokineticsSignal(key: string): boolean {
  return PHARMACOKINETICS_SIGNAL_KEY_SET.has(key);
}

export const PHARMACOKINETICS_GROUP = {
  id: 'pharmacokinetics',
  label: 'Pharmacokinetics',
  icon: '💊',
  description:
    "Drug-metabolizing enzymes and transporters. Each value is a multiplier relative to your baseline activity (1.00). Composed live from your genetics, inflammation, hepatic state, and any active inducers or inhibitors on the timeline.",
} as const;
