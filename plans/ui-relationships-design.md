# Surfacing New PK/PD Relationships in the Inspector UIs

A design plan for how the engine's expanded biological relationships (drug clearance, inhibition, induction, binding, absorption, subject-specific impact, citations) should appear in the existing **intervention inspector** and **signal info panel** — without overwhelming the user.

Companion to `core/plans/medical-grade-pkpd-strategy.md`.

---

## 1. Design principles

1. **Show only what's there.** If a drug has no `induces[]`, the Induction section doesn't render. If a signal isn't an enzyme aux, no factor-breakdown section. Empty arrays are invisible, not "—".
2. **Progressive disclosure.** Each inspector lands on a short, scannable summary. Detail expands on click — accordion sections, never modal-stacked-on-modal.
3. **Educational hierarchy.** Information is layered by user intent:
   - **L1 — What does this do?** (PD effects — already shown)
   - **L2 — How does it work in YOUR body?** (subject impact — top placement)
   - **L3 — How is it cleared / what does it affect?** (clearance + interactions)
   - **L4 — Absorption and binding specifics** (oral PK, protein binding)
   - **L5 — Where does this knowledge come from?** (citations, always last)
4. **Data-type-specific visual treatment.** Don't render a table for everything. Match the visual to the data's semantics — see §3.
5. **Cross-linking is first-class.** Every enzyme/drug name is a clickable chip. The graph of relationships is the point.
6. **Live, time-aware values** where applicable. Modulator lists track the playhead minute.
7. **Subject impact gets a hero callout** — directional (faster/slower, more/less effect), color-coded.

---

## 2. Drug Intervention Inspector — layout

### Top of inspector

```
┌─────────────────────────────────────────────────┐
│  💊 Paroxetine — 20 mg                          │
│  Selective serotonin reuptake inhibitor          │
└─────────────────────────────────────────────────┘

┌─ Your Profile · This Drug ───────────────────────┐
│                                                  │
│   🔴 Slower clearance for you                    │
│      ~3-5× exposure vs typical                   │
│                                                  │
│   Why: You are a CYP2D6 Poor Metabolizer.        │
│   Paroxetine relies on CYP2D6 for 85% of its     │
│   elimination.                                   │
│                                                  │
│   [Explain in detail]   [Suggested adjustments]  │
└──────────────────────────────────────────────────┘
```

A single hero callout. Computed by walking the drug's clearance map and matching against subject's PGx / Child-Pugh / pregnancy / bloodwork state. Only renders when something actionable applies.

### Existing sections, kept

- Effects on signals (PD targets) — already present.
- Amounts (dosing controls) — already present.

### New sections (each collapsible, only rendered when data exists)

#### How this drug is cleared

Visual: horizontal **stacked bar** broken into enzyme contributions. Each segment is a clickable chip.

```
Hepatic clearance ────────────────────────────────
[████████ 40% CYP2D6][████ 25% CYP3A4][███ 20% CYP2C19][██ 15% other]
↑ click any segment to inspect that enzyme

Renal clearance ──────────────────────────────────
  Filtration   ▰▰▰▰▰░░░░░  50%
  OCT2 secretion  ▰▰▰▰░░░░░░  40%
  OAT1            ▰░░░░░░░░░  10%

Biliary clearance ────────────────────────────────
  via MRP2 transporter — 30% recycled (enterohepatic)
```

**Rationale**: stacked bar is the universally legible visual for "fractions of a whole." Skip rendering biliary if the drug has none.

#### Effects on other drugs (interactions)

Two tables, color-coded.

```
🔻 Inhibits enzymes
┌────────────────────────────────────────────────┐
│ CYP2D6   ⚠️ IRREVERSIBLE (k_inact 0.17/min)    │
│          Ki 0.05 mg/L · 7-14 day washout       │
│ CYP3A4   Competitive · Ki 0.8 mg/L (weak)      │
└────────────────────────────────────────────────┘

🔺 Induces enzymes
(none — paroxetine has no induction effects)
```

Mechanism-based inhibition gets its own visual prominence — orange warning badge with washout estimate computed from `1 / k_deg` of the affected enzyme.

#### Absorption & binding

Compact key-value strip:

```
Absorption ───────────────────────────────────────
  Oral · ~95% bioavailable · Tmax ~6 hours

  Affected by:  ✓ Fed state (-30% rate)
                ✓ Gut P-gp inducers (rifampin)
                ✓ SIBO methane peak

Plasma binding ───────────────────────────────────
  ████████████░░░░░  95% albumin-bound · fu 0.05

  In hypoalbuminemia (your albumin 3.0 g/dL),
  your effective fu rises to ~0.15.
```

Only rendered for oral drugs and binding-declared drugs respectively.

#### Where this comes from (citations)

Always last. Compact list with confidence color and source name; click any to open `CitationModal`. Numbered superscripts also appear inline elsewhere where the citation drove a specific value.

```
References (3)
  ¹ CPIC CYP2D6 Genotype Guideline · 2020 · high
  ² Bertelsen 2003 · CYP2D6 MBI characterization · high
  ³ DrugBank — paroxetine entry · database
```

---

## 3. Visual treatment by data type

| Data type | Visual element |
|---|---|
| Fractions that sum to 1.0 | **Stacked horizontal bar**, segments clickable |
| Probabilities / percentages with one number | **Mini bar gauge** (▰▰▰░░░░░ 30%) |
| Lists of related items (inhibits, induces, refs) | **Compact table** w/ numeric columns right-aligned |
| Categorical/ordinal status (metabolizer status, Child-Pugh class) | **Pill badge** with class-based color |
| Boolean flags (MBI, P-gp substrate, EHR) | **Warning/info badge** with explanatory tooltip |
| Subject-specific impact direction | **Hero callout** with up/down arrow + magnitude |
| Composition of a multiplicative chain | **Factor breakdown table** showing `base × f1 × f2 × ... = result` |
| Drug↔enzyme cross-references | **Clickable chip** with consistent enzyme/drug styling |
| Citations | **Numbered superscripts inline + reference list footer** (classic academic) |

---

## 4. Signal Info Panel — additions

### Generic signal (cortisol, dopamine, glucose, etc.)

Adds at bottom:

```
🔻 Currently inhibiting (at 14:23)
   (none active)

🔺 Currently inducing
   (none active)

Reference range ▰▰▰▰▰▰▰░░░  6-23 µg/dL
Your bloodwork value: 12.4 µg/dL ← drives setpoint

References (2)
  ¹ Cortisol diurnal rhythm review · ...
```

### Enzyme/transporter aux signal (NEW — special treatment)

This is a new signal class and deserves a distinct layout. Lands on:

```
┌─ CYP3A4 Activity ───────────────────────────────┐
│                                                  │
│   Your current activity: 0.74                    │
│   ↘ down from genetic baseline 1.0               │
│                                                  │
│   Why current state:                             │
│   ┌──────────────────────────────────────────┐  │
│   │ Genetic baseline       1.00              │  │
│   │ × Sex (female)         1.25              │  │
│   │ × Age (28y)            1.00              │  │
│   │ × Diurnal (14:23)      0.98              │  │
│   │ × Inflammation (CRP 4) 0.82              │  │
│   │ × Hepatic injury       1.00              │  │
│   │ × Pregnancy            1.00              │  │
│   │ × Induction stimulus   1.00              │  │
│   │ × MBI survival         0.74              │  │
│   │ = effective            0.74              │  │
│   └──────────────────────────────────────────┘  │
│                                                  │
│   🔻 Currently inactivating (paroxetine)         │
│   🔺 Currently induced by (—)                    │
│   Drugs cleared by CYP3A4 (4 in timeline)        │
│      • Alprazolam (20% of its clearance)         │
│      • Simvastatin (...)                         │
│                                                  │
│   References (6)                                 │
└──────────────────────────────────────────────────┘
```

The **factor breakdown table** is the marquee element — it shows the user EXACTLY why their CYP3A4 activity is what it is right now. Each factor row has a tooltip explaining its mechanism.

### Live time-awareness

The "Currently inhibiting / inducing" lists are computed at the playhead minute (using the same logic as the engine's per-sub-step computation). As the user scrubs the timeline, these lists update.

---

## 5. Component breakdown

### Reusable atoms

- `EnzymeChip.vue` — pill rendering `CYP3A4` with consistent color per enzyme system. Click → open signal panel.
- `DrugChip.vue` — pill rendering drug name. Click → open drug inspector.
- `CitationRef.vue` — inline superscript number that opens modal on click; hovers show preview.
- `CitationList.vue` — numbered reference list footer.
- `MBIBadge.vue` — orange "Irreversible" badge with washout-time tooltip.
- `ConfidenceLabel.vue` — high/medium/low color label (already in bibliography).
- `StackedFractionBar.vue` — segmented bar for clearance breakdown.
- `MiniGauge.vue` — single-number bar gauge.
- `FactorBreakdown.vue` — multiplicative chain table.
- `SubjectImpactCallout.vue` — hero card with direction and magnitude.
- `MechanismBadge.vue` — competitive/noncompetitive/MBI label.

### Inspector sections

Drug inspector:
- `DrugSubjectImpactSection.vue`
- `DrugClearanceSection.vue`
- `DrugInteractionsSection.vue`
- `DrugAbsorptionBindingSection.vue`
- `DrugReferencesSection.vue`

Signal info panel:
- `EnzymeActivityBreakdownSection.vue` (enzyme/transporter aux signals only)
- `SignalActiveModulatorsSection.vue` (live, all signals)
- `SignalReferencesSection.vue`

### Composables

- `useDrugSubjectImpact(drug, subject)` — computes the hero-callout text and direction. Returns null when nothing actionable applies.
- `useActiveModulators(signalKey, minuteOfDay)` — returns inhibitors/inducers at a given moment.
- `useEnzymeFactorBreakdown(enzymeKey, subject, state, minuteOfDay)` — returns the table rows of factor decomposition.

---

## 6. Implementation phases

| Phase | Deliverable | Effort |
|---|---|---|
| UI-1 | Atoms — chips, badges, gauges, citation refs | 1 day |
| UI-2 | Drug clearance section + interactions section (most concrete win) | 1 day |
| UI-3 | Subject impact callout (drug inspector hero) | 1 day |
| UI-4 | Absorption + binding section | 0.5 day |
| UI-5 | Drug references section + inline CitationRef rendering | 0.5 day |
| UI-6 | Signal info panel — active modulators (live) | 1 day |
| UI-7 | Signal info panel — enzyme factor breakdown (the marquee table) | 1 day |
| UI-8 | Cross-link wiring — chip clicks navigate inspectors | 0.5 day |
| UI-9 | Empty states, tooltips, polish | 1 day |

Total: ~7-8 days for full surfacing.

---

## 7. Open design questions

1. **Where does the drug inspector currently live?** Need to identify the existing inspector component(s) and where to inject new sections without breaking the existing flow.

2. **Subject impact wording library** — phrases like "slower clearance for you", "more sensitive to opioids", "this drug is inactivated faster than usual" need a tone/voice review. Educational but not alarmist. (Phase 4 candidate: AI-generated personalized summaries from the structured data.)

3. **Numerical precision** — show `0.74` or `74%` or `~75%`? Convention should be:
   - Activities/fractions/free-fraction: 2 sig figs (`0.74`, `0.05`, `40%`)
   - Doses, concentrations, Ki/EC50: 2-3 sig figs with units
   - Times: round to clinically meaningful unit (`~7 days`, `~6 hours`, `~30 min`)

4. **Subject-specific impact for signals (not drugs)** — should the cortisol signal panel show "your bloodwork value of 12.4 drives the setpoint"? Yes; treat as same hero-callout pattern.

5. **What about conditions?** Conditions (ADHD, depression, MTHFR, etc.) also have receptor/transporter modifiers. Same surfacing pattern: condition inspector adds a section "Changes these targets" with chips. Out of scope for this PR but designed-for.

6. **Mobile / narrow viewport** — accordion collapse is the answer; stacked bars stay horizontal; tables become 2-column.

---

## 8. Order to ship

Recommend: **atoms → drug inspector sections → signal panel sections → cross-link wiring → polish**. This is the dependency order; each phase produces something visible.

Start with atoms because every later phase consumes them. Then the drug inspector wins fastest because it's already a destination users navigate to. Signal panel follows because the live-modulators logic shares composables with the drug inspector's interactions logic. Cross-linking is last because it requires both inspectors to exist.
