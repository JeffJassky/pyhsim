/**
 * Walks a drug's pharmacology against the current subject's biology and surfaces
 * the most clinically meaningful single insight as a hero-callout payload.
 *
 * Returns null when nothing actionable applies (most healthy subjects on most
 * drugs). The intent is "say something only when it matters" — avoid noise.
 *
 * Currently surfaces (in priority order):
 *   1. Genetic metabolizer status for the drug's dominant clearance enzyme
 *   2. Severe hepatic injury (Child-Pugh B/C)
 *   3. Pregnancy state when drug is significantly affected
 *   4. Acute inflammation (hsCRP >5) for CYP3A4-cleared drugs
 *
 * Future: stack multiple insights; AI-generated summary; suggested dose
 * adjustments. v1 is single-insight to keep the inspector calm.
 */

import { computed, type ComputedRef } from 'vue';
import type {
  PharmacologyDef,
  Subject,
  MetabolizerStatus,
  DrugMetabolizingEnzymeKey,
} from '@kyneticbio/core';
import { getStatusActivityMultiplier } from '@kyneticbio/core';

export interface SubjectImpact {
  direction: 'up' | 'down' | 'neutral';
  headline: string;
  magnitude?: string;
  explanation?: string;
}

// Activity multipliers come from core's pgx tables via getStatusActivityMultiplier().
// Local duplicates removed in favor of the shared authoritative values.

function metabolizerLabel(status: MetabolizerStatus): string {
  switch (status) {
    case 'Poor': return 'Poor Metabolizer (PM)';
    case 'Intermediate': return 'Intermediate Metabolizer (IM)';
    case 'Normal': return 'Normal Metabolizer';
    case 'Rapid': return 'Rapid Metabolizer (RM)';
    case 'Ultrarapid': return 'Ultrarapid Metabolizer (UM)';
  }
}

function getSubjectStatusForEnzyme(
  subject: Subject,
  enzyme: DrugMetabolizingEnzymeKey,
): MetabolizerStatus | undefined {
  const panel = subject.genetics?.pharmacogenomics as Record<string, MetabolizerStatus | undefined> | undefined;
  if (!panel) return undefined;
  return panel[`${enzyme.toLowerCase()}_status`];
}

export function useDrugSubjectImpact(
  pharmacology: ComputedRef<PharmacologyDef | null>,
  subject: ComputedRef<Subject | undefined>,
): ComputedRef<SubjectImpact | null> {
  return computed(() => {
    const pharm = pharmacology.value as any;
    const subj = subject.value;
    if (!pharm || !subj) return null;

    const hepatic = pharm.pk?.clearance?.hepatic;
    if (!hepatic?.enzymes) return null;

    // 1. PGx-driven impact: find the enzyme contributing most to clearance
    // that ALSO has a non-normal metabolizer status on the subject.
    let bestImpact: { fraction: number; enzyme: string; status: MetabolizerStatus; aucRatio: number } | null = null;
    for (const [enzyme, fraction] of Object.entries(hepatic.enzymes) as [string, number][]) {
      if (!fraction) continue;
      const status = getSubjectStatusForEnzyme(subj, enzyme as DrugMetabolizingEnzymeKey);
      if (!status || status === 'Normal') continue;

      // Apparent CL change: fraction × (activity_status - 1) + 1
      // AUC ratio is approximately the inverse.
      const activity = getStatusActivityMultiplier(enzyme as DrugMetabolizingEnzymeKey, status);
      const aucRatio = 1 / (1 - fraction * (1 - activity));

      // Pick the impact whose AUC ratio departs most from 1.0
      if (!bestImpact || Math.abs(Math.log(aucRatio)) > Math.abs(Math.log(bestImpact.aucRatio))) {
        bestImpact = { fraction, enzyme, status, aucRatio };
      }
    }

    if (bestImpact && Math.abs(Math.log(bestImpact.aucRatio)) > 0.15) {
      // ~15% AUC departure threshold — below this, don't bother the user.
      const direction: 'up' | 'down' = bestImpact.aucRatio > 1 ? 'up' : 'down';
      const magnitudeText =
        bestImpact.aucRatio > 1
          ? `~${bestImpact.aucRatio.toFixed(1)}× exposure vs typical`
          : `~${(1 / bestImpact.aucRatio).toFixed(1)}× faster clearance vs typical`;
      const headline =
        direction === 'up'
          ? 'Slower clearance for you — higher and longer exposure'
          : 'Faster clearance for you — lower and shorter exposure';
      const explanation = `You are a ${metabolizerLabel(bestImpact.status)} for ${bestImpact.enzyme}. This drug relies on ${bestImpact.enzyme} for ${Math.round(bestImpact.fraction * 100)}% of its elimination.`;
      return { direction, headline, magnitude: magnitudeText, explanation };
    }

    // 2. Child-Pugh impact (any class B/C)
    const cps = subj.bloodwork?.childPughScore;
    if (cps) {
      const components = [cps.albumin, cps.bilirubin, cps.inr, cps.ascites, cps.encephalopathy];
      const provided = components.filter((c) => c !== undefined).length;
      if (provided >= 3) {
        // Quick re-compute of class
        const score =
          (cps.albumin === undefined ? 1 : cps.albumin > 3.5 ? 1 : cps.albumin >= 2.8 ? 2 : 3) +
          (cps.bilirubin === undefined ? 1 : cps.bilirubin < 2 ? 1 : cps.bilirubin <= 3 ? 2 : 3) +
          (cps.inr === undefined ? 1 : cps.inr < 1.7 ? 1 : cps.inr <= 2.3 ? 2 : 3) +
          (cps.ascites === undefined || cps.ascites === 'none' ? 1 : cps.ascites === 'mild' ? 2 : 3) +
          (cps.encephalopathy === undefined || cps.encephalopathy === 'none' ? 1 : cps.encephalopathy === 'I-II' ? 2 : 3);
        const cls = score <= 6 ? 'A' : score <= 9 ? 'B' : 'C';
        if (cls !== 'A') {
          const fractionHepatic = Object.values(hepatic.enzymes as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0);
          if (fractionHepatic > 0.5) {
            const factor = cls === 'B' ? 0.55 : 0.3;
            return {
              direction: 'up',
              headline: `Slower hepatic clearance — Child-Pugh Class ${cls}`,
              magnitude: `~${(1 / factor).toFixed(1)}× exposure expected`,
              explanation: `This drug is primarily cleared by the liver. With ${cls === 'B' ? 'moderate' : 'severe'} hepatic impairment, enzyme synthesis is reduced.`,
            };
          }
        }
      }
    }

    // 3. Pregnancy
    if (subj.pregnancyState && subj.pregnancyState !== 'non-pregnant' && subj.pregnancyState !== 'postpartum') {
      // Look at the dominant enzyme
      const sorted = (Object.entries(hepatic.enzymes) as [string, number][]).sort((a, b) => b[1] - a[1]);
      const [dominantEnzyme] = sorted[0] ?? [];
      if (dominantEnzyme === 'CYP3A4') {
        return {
          direction: 'down',
          headline: `Faster clearance during ${subj.pregnancyState} pregnancy`,
          magnitude: '~2× faster (CYP3A4 elevated)',
          explanation: 'CYP3A4 activity rises substantially during pregnancy. Therapeutic levels may require dose adjustment.',
        };
      }
      if (dominantEnzyme === 'CYP1A2') {
        return {
          direction: 'up',
          headline: `Slower clearance during ${subj.pregnancyState} pregnancy`,
          magnitude: '~2× exposure (CYP1A2 suppressed)',
          explanation: 'CYP1A2 activity drops substantially during pregnancy. Lower doses may suffice; monitor for accumulation.',
        };
      }
    }

    return null;
  });
}
