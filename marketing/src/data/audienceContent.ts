export interface AudienceMetric {
  value: string;
  label: string;
}

export interface AudienceAnxiety {
  num: string;
  title: string;
  body: string;
}

export interface AudienceProtocolLegend {
  k: string;
  v: string;
}

export interface AudienceProtocol {
  lab: string;
  title: string;
  desc: string;
  legend: AudienceProtocolLegend[];
}

export interface AudienceSignal {
  name: string;
  val: string;
  klass: "accent" | "dim";
  points: string;
}

export interface AudienceTest {
  name: string;
  why: string;
  src: string;
}

export interface AudienceContent {
  eyebrow: string;
  h1: string;
  sub: string;
  metrics: AudienceMetric[];
  anxieties: AudienceAnxiety[];
  protocol: AudienceProtocol;
  signals: AudienceSignal[];
  tests: AudienceTest[];
}

const metric = (value: string, label: string): AudienceMetric => ({ value, label });
const anx = (num: string, title: string, body: string): AudienceAnxiety => ({ num, title, body });
const leg = (k: string, v: string): AudienceProtocolLegend => ({ k, v });
const sig = (
  name: string,
  val: string,
  klass: "accent" | "dim",
  points: string,
): AudienceSignal => ({ name, val, klass, points });
const test = (name: string, why: string, src: string): AudienceTest => ({ name, why, src });

export const AUDIENCE_CONTENT: Record<string, AudienceContent> = {
  glp1: {
    eyebrow: "For GLP-1 users · Tirzepatide · Semaglutide · Retatrutide",
    h1: "Lose the weight. Keep the <i>rest</i> of you.",
    sub: "I've used multiple GLP-1s. The weight came off. So did things I didn't plan to lose: muscle, hair, mineral status, sleep depth, libido. <b>This is the tool I wish I'd had on day one of my first 2.5 mg.</b> Drop in your dose, your training, your protein, and watch the rest of your body respond.",
    metrics: [
      metric("38%", "of GLP-1 weight loss is lean mass, untreated"),
      metric("7", "side-effects modeled dose-by-dose"),
      metric("12-mo", "off-ramp scenarios, not platitudes"),
      metric("Education", "not medical advice. by design."),
    ],
    anxieties: [
      anx(
        "01",
        "Muscle loss you can't feel until your grip strength tells you.",
        "Up to 38% of weight lost on a GLP-1 is lean mass when nothing is done about it. Drop your dose, your training, and your real protein intake into the lab and it tells you which dose week you're catabolic — before your DEXA does.",
      ),
      anx(
        "02",
        "Side effects that scale with the dose, not the timing.",
        "Nausea, sulfur burps, constipation, gallbladder pressure, hair shed. The model maps probability against dose, titration speed, and what you actually ate this week. <i>Predict</i> bad days before you live them.",
      ),
      anx(
        "03",
        "The rebound nobody talks about.",
        "75% of people regain most of the weight within a year of stopping. Test-fly the off-ramp — slow taper, protein-led nutrition, resistance training — as a 12-month scenario, not a \"maintenance\" platitude.",
      ),
      anx(
        "04",
        "The 5-year question your prescriber doesn't have data for.",
        "Long-term effects on bone density, gastric motility, thyroid C-cells. The lab doesn't pretend to have answers. It surfaces the confidence band, the studies it pulled from, and where you're extrapolating into uncertainty.",
      ),
    ],
    protocol: {
      lab: "PROTOCOL · MUSCLE-FIRST GLP-1 (Tirzepatide 10 mg/wk)",
      title:
        "Tirzepatide titration with full muscle preservation, electrolyte support, and weekly catabolism check-ins.",
      desc: "A real scenario built by a 41-year-old beta user, 92 kg starting weight, no T2D, two resistance sessions weekly. Doses preserved. Annotations are theirs.",
      legend: [
        leg("DOSE", "Tirzepatide · 2.5 → 5 → 7.5 → 10 mg/wk over 12 weeks"),
        leg("PROTEIN", "1.6 g/kg/day, three feedings, leucine 3 g pre-training"),
        leg("TRAINING", "Mon + Thu resistance · Sat Zone 2 · NO Tue–Wed cardio"),
        leg("MINERALS", "Mg 400 mg · K 1g · Na 4–5g · Vit D3 5000 IU"),
        leg("MONITOR", "Grip · DEXA Q12W · ferritin · TSH · ApoB · fasting insulin"),
        leg("HARM RULES", "Stop dose escalation if grip drops &gt; 8% week-over-week"),
      ],
    },
    signals: [
      sig("Body weight", "−1.4 kg/wk", "accent", "0,4 16,7 32,10 48,13 64,15 80,17 96,18 108,19 120,20"),
      sig("Lean mass", "−0.2 kg/wk", "accent", "0,12 20,12 40,13 60,13 80,14 100,14 120,14"),
      sig(
        "Muscle protein synth.",
        "+18% post-train",
        "accent",
        "0,22 16,16 32,8 48,5 64,7 80,12 96,18 120,22",
      ),
      sig("Grip strength", "−2.1%", "dim", "0,8 24,9 48,10 72,11 96,12 120,13"),
      sig("Nausea risk", "LOW", "dim", "0,18 16,14 32,8 48,6 64,9 80,14 96,17 120,18"),
      sig("Sulfur burps", "TRACE", "dim", "0,22 24,21 48,18 72,17 96,18 120,20"),
      sig("Sleep quality", "+9%", "accent", "0,16 24,14 48,10 72,8 96,9 120,10"),
      sig("Mood (PHQ proxy)", "+4 pts", "accent", "0,18 24,16 48,13 72,10 96,9 120,9"),
    ],
    tests: [
      test("DEXA scan", "Lean mass tracking. Every 12 weeks.", "BodySpec · InBody"),
      test("Grip dynamometer", "Weekly. Earliest catabolism signal.", "Camry / Jamar"),
      test("Ferritin + TIBC", "Iron status crashes silently on aggressive caloric deficit.", "Quest · LabCorp"),
      test("Free T3 / TSH", "Thyroid down-regulation under chronic deficit.", "Quest · LabCorp"),
      test("ApoB", "Cardiovascular tracking through weight loss.", "Quest · Function"),
      test("Bone density", "Year 2+ users. Caloric deficit + GLP-1.", "BodySpec DEXA"),
    ],
  },
  performance: {
    eyebrow: "For high-output people · Founders · Operators · Athletes",
    h1: "Output without <i>overshoot</i>. Every day.",
    sub: "Caffeine, nicotine, modafinil, peptides, training, fasted mornings. The performance stack people run is full of hidden duplicates — three things acting on adenosine, two things stacking cortisol, nothing actually building parasympathetic capacity. <b>The lab finds the pile-ups so you stop running them.</b>",
    metrics: [
      metric("62", "signals tracked across 24 hours"),
      metric("11", "crash patterns the lab names"),
      metric("A/B", "any two days of your stack"),
      metric("Receptor-level", "not \"caffeine → alert\""),
    ],
    anxieties: [
      anx(
        "01",
        "The 3 PM crash you've been blaming on lunch.",
        "It's rarely lunch. Usually it's your 7:30 AM caffeine still flat-lining adenosine while glucose dips and cortisol blunts. The lab draws all three on the same axis and tells you which one to move first.",
      ),
      anx(
        "02",
        "The Saturday tax.",
        "Five 18-hour days, then 14 hours of sleep and a migraine. The model tracks parasympathetic debt across the week — and shows you which 30-minute change buys you back four hours.",
      ),
      anx(
        "03",
        "Stim tolerance you're paying for in libido and sleep.",
        "Adenosine receptors up-regulate. Dopamine D2 down-regulates. Testosterone, libido, and deep sleep show it before you do. The lab tags compounds with their tolerance half-life and surfaces taper windows.",
      ),
      anx(
        "04",
        "Stacking three things that all do the same thing.",
        "Caffeine + nicotine + modafinil all hit similar pathways. The lab decomposes every input into receptor binding profile and shows you the duplicates — and the pathways you're ignoring.",
      ),
    ],
    protocol: {
      lab: "PROTOCOL · ALL-DAY OUTPUT, NO 3 PM TROUGH",
      title:
        "Two-pulse caffeine, intentional carb dosing, parasympathetic training, no afternoon stims.",
      desc: "A founder, 38, fasted-morning preference, two kids. Replaced a 600 mg/day caffeine + nicotine pouch loop. 14 days to baseline.",
      legend: [
        leg("STIMULANTS", "100 mg caffeine 7 AM + 100 mg 11:30 AM, hard cutoff. No nicotine."),
        leg("MEAL TIMING", "Protein-led break-fast at 11 AM. Carb-forward dinner."),
        leg("TRAINING", "Tue / Thu resistance · Sat Zone 2 · daily 10-min HRV breathing"),
        leg("SUPPLEMENTS", "L-theanine 200 mg w/ AM caffeine · Mg-glycinate 400 mg PM"),
        leg("MONITOR", "HRV (morning) · CGM 2 wks/quarter · DEXA · resting HR"),
        leg("HARM RULES", "No caffeine after 12:30 PM · no modafinil &gt; 2x/wk"),
      ],
    },
    signals: [
      sig("Cognitive output (proxy)", "+11%", "accent", "0,22 16,12 32,8 48,7 64,8 80,9 96,8 108,7 120,7"),
      sig("Adenosine pressure", "LOW–MID", "dim", "0,20 16,16 32,10 48,8 64,11 80,14 96,16 120,18"),
      sig("Cortisol", "smoothed", "dim", "0,8 16,7 32,8 48,11 64,14 80,17 96,19 108,21 120,22"),
      sig("HRV", "+9 ms vs prior", "accent", "0,18 24,16 48,13 72,10 96,9 120,8"),
      sig("Resting HR", "−4 bpm", "accent", "0,8 24,9 48,10 72,12 96,13 120,14"),
      sig("Glucose stability", "tight", "dim", "0,14 24,13 48,12 72,12 96,13 120,14"),
      sig("Sleep latency", "9 min", "accent", "0,8 24,9 48,11 72,13 96,14 120,15"),
      sig("Deep sleep %", "21%", "accent", "0,18 24,15 48,11 72,8 96,7 120,7"),
    ],
    tests: [
      test("HRV (morning)", "Trend, not absolute. Daily.", "Whoop · Oura · Apple"),
      test("CGM, 2-week sprints", "Glycemic stability is half the \"all-day\" battle.", "Stelo · Lingo · Levels"),
      test("Free testosterone", "Down-trends silently under chronic stim load.", "Quest · LabCorp"),
      test("ApoB", "Performance routines with high cortisol drift this.", "Quest · Function"),
      test("Cortisol AM/PM", "Two-point. Catches inverted curves.", "DUTCH · Quest"),
      test("Ferritin", "Endurance + protein-restricted founders.", "Quest · LabCorp"),
    ],
  },
  longevity: {
    eyebrow: "For healthspan optimizers · Rapamycin · Metformin · Zone 2",
    h1: "Decades of compounding, <i>modeled</i> not guessed.",
    sub: "You're running rapamycin, NAD+, metformin, intentional Zone 2, sauna, ApoB-targeted nutrition. <b>You're also stacking three interventions that all hit mTOR and ignoring the one that builds mitochondria.</b> The lab maps your stack onto the actual pathways and tells you what's redundant.",
    metrics: [
      metric("4", "primary longevity pathways modeled"),
      metric("10-yr", "horizon for chronic predictions"),
      metric("ApoB · hsCRP · HbA1c · IL-6", "tracked together"),
      metric("Conservative", "it under-promises"),
    ],
    anxieties: [
      anx(
        "01",
        "Rapamycin every two weeks vs every week — the data does not exist for you.",
        "It exists for mice. The lab won't pretend otherwise. It surfaces confidence bands, the studies they came from, and a \"talk to your prescriber\" card. Then it models the most-likely outcome for <i>your</i> ApoB and IL-6.",
      ),
      anx(
        "02",
        "You're hitting mTOR from three angles and igniting AMPK from none.",
        "Rapa + protein cycling + caloric restriction → all suppressing mTOR. Where's the mitochondrial biogenesis side? The lab decomposes every intervention into pathways and shows you where you're duplicating and where you're neglecting.",
      ),
      anx(
        "03",
        "VO₂max is the strongest mortality predictor and you're training for the wrong thing.",
        "Zone 2 builds mitochondrial density. Zone 5 builds VO₂max ceiling. Most people do neither. The lab models your weekly polarized split and projects 5-year VO₂max.",
      ),
      anx(
        "04",
        "Cardiovascular events still kill ⅓ of you. ApoB is the actual lever.",
        "Not LDL-C. ApoB. The lab targets &lt; 60 mg/dL aggressively, models the response of every diet and lipid-lowering intervention, and won't let you forget the one biomarker that predicts the most.",
      ),
    ],
    protocol: {
      lab: "PROTOCOL · POLARIZED + RAPA + APOB-CONTROLLED",
      title:
        "Rapamycin Q14d, metformin (T2D-trending only), ApoB-targeted lipidology, polarized cardio.",
      desc: "A 47-year-old beta user, ApoB starting at 102, hsCRP 1.4, fasting insulin 9. 12-month modeled outcome.",
      legend: [
        leg("mTOR / AMPK", "Rapamycin 6 mg Q14d (provider-led) · 16:8 TRF Mon–Fri"),
        leg("LIPIDS", "Bempedoic acid 180 mg · 5 g EPA · ApoB target &lt; 60"),
        leg("CARDIO", "3× Zone 2 (45m HR 130) + 1× VO₂max intervals (4x4)"),
        leg("STRENGTH", "Twice-weekly. Compound lifts. Bone + muscle insurance."),
        leg("MONITOR", "ApoB · hsCRP · HbA1c · IL-6 · VO₂max · DEXA · LP(a)"),
        leg("HARM RULES", "Stop rapa if hsCRP &gt; 3 · skip if any infection"),
      ],
    },
    signals: [
      sig("ApoB", "82 → 58 mg/dL", "accent", "0,8 24,10 48,12 72,15 96,17 120,19"),
      sig("hsCRP", "1.4 → 0.6", "accent", "0,8 24,10 48,13 72,16 96,18 120,20"),
      sig("HbA1c", "5.4 → 5.1", "accent", "0,12 24,13 48,14 72,15 96,16 120,17"),
      sig("VO₂max", "42 → 47", "accent", "0,22 24,19 48,16 72,12 96,10 120,8"),
      sig("Fasting insulin", "9 → 5.5", "accent", "0,8 24,10 48,12 72,14 96,16 120,17"),
      sig("Visceral fat", "−18%", "accent", "0,8 24,10 48,12 72,14 96,16 120,18"),
      sig("Bone density", "+1.4%", "accent", "0,18 24,17 48,16 72,15 96,14 120,13"),
      sig("Biological age (proxy)", "−2.1 yr", "accent", "0,8 24,10 48,12 72,14 96,16 120,18"),
    ],
    tests: [
      test("ApoB", "The single best CVD biomarker. Quarterly.", "Quest · LabCorp"),
      test("hsCRP", "Inflammation. Spikes catch overtraining and infection.", "Quest · Function"),
      test("LP(a)", "Once. Genetic. Changes the rest of the protocol.", "Quest · LabCorp"),
      test("HOMA-IR", "Insulin resistance. Earlier than HbA1c.", "Quest · Function"),
      test("VO₂max", "Strongest mortality predictor. Twice yearly.", "Lab · Garmin estimate"),
      test("DEXA + bone density", "Body comp + osteoporosis hedge.", "BodySpec"),
    ],
  },
  health: {
    eyebrow: "For people self-managing chronic conditions",
    h1: "When the standard plan isn't <i>enough</i>.",
    sub: "Hashimoto's, PCOS, POTS, IBS, perimenopause, long-COVID. Twelve minutes with a doctor, then 8,760 hours alone with a body that doesn't do textbook things. <b>The lab is built for the second number.</b> It is not medical advice. It is the structured artifact you bring to the people who give it.",
    metrics: [
      metric("10+", "condition profiles in the library"),
      metric("Stackable", "PCOS + Hashimoto's ≠ either alone"),
      metric("Bloodwork-aware", "Quest · LabCorp · Function"),
      metric("Education", "not medical advice. by design."),
    ],
    anxieties: [
      anx(
        "01",
        "Your TSH is \"in range.\" You feel like you're moving through wet cement.",
        "The standard reference range is 0.4–4.5. Most functional thyroid practitioners flag &gt; 2.5 in symptomatic people. The lab applies your conditions so a \"normal\" lab still produces a realistic energy curve — the one you're actually living.",
      ),
      anx(
        "02",
        "You were told stress is the cause. Then handed an SSRI.",
        "The lab won't prescribe anything. It will model your full lifestyle protocol — sleep, light, training, micronutrients, magnesium L-threonate — alongside any prescription, and let <i>you</i> see where the lifts come from.",
      ),
      anx(
        "03",
        "Your symptoms move in clusters that no app tracks together.",
        "POTS users live with brain fog, palpitations, post-meal hypotension, and salt cravings. The lab renders them on the same scenario so you can cross-reference what triggered the cluster yesterday.",
      ),
      anx(
        "04",
        "The plan from the standard-of-care visit is too generic to help.",
        "It's a population baseline. Add your conditions, your meds, your bloodwork, your real life — and you get something personal enough to actually run with. And clean enough to hand back to that same provider.",
      ),
    ],
    protocol: {
      lab: "PROTOCOL · HASHIMOTO'S + PERIMENOPAUSE + IRON LOW",
      title:
        "Levothyroxine timing, iron repletion, magnesium, light exposure, training cap.",
      desc: "A 41-year-old beta user. TSH 4.2, ferritin 24, perimenopausal cycle disruption, 60% baseline energy. 16-week scenario.",
      legend: [
        leg("MEDS", "Levothyroxine 75 mcg AM, fasted, 60 min before food (preserved)"),
        leg("IRON", "Ferrous bisglycinate 25 mg w/ vit C · alternate-day dosing"),
        leg("MINERALS", "Mg-glycinate 400 mg PM · selenium 200 mcg · zinc 15 mg"),
        leg("LIGHT", "10-min bright light AM · sundown red-light evening"),
        leg("TRAINING", "Cap at 3 sessions/wk · resistance &gt; cardio · no fasted Z2"),
        leg("HARM RULES", "Stop iron if hsCRP &gt; 3 · re-test ferritin Q8W"),
      ],
    },
    signals: [
      sig("Daily energy (proxy)", "+34%", "accent", "0,22 16,18 32,14 48,11 64,9 80,8 96,7 120,7"),
      sig("TSH", "4.2 → 1.8", "accent", "0,8 24,10 48,12 72,14 96,16 120,18"),
      sig("Ferritin", "24 → 65", "accent", "0,22 24,19 48,15 72,11 96,8 120,7"),
      sig("Cycle regularity", "+", "accent", "0,18 24,16 48,13 72,11 96,10 120,10"),
      sig("Brain fog (proxy)", "−42%", "accent", "0,8 16,12 32,15 48,17 64,19 80,20 96,21 120,22"),
      sig("Sleep quality", "+22%", "accent", "0,18 24,14 48,11 72,9 96,8 120,7"),
      sig("Cortisol AM", "sharper", "accent", "0,18 16,12 32,8 48,10 64,14 80,17 96,20 120,22"),
      sig("HRV", "+12 ms", "accent", "0,18 24,16 48,12 72,10 96,8 120,7"),
    ],
    tests: [
      test("Full thyroid panel", "TSH + Free T3 + Free T4 + reverse T3 + TPO antibodies.", "Quest · LabCorp"),
      test("Ferritin + transferrin sat.", "Iron deficiency without anemia is the silent driver.", "Quest · LabCorp"),
      test("Vit D · Mg RBC · Zn", "Subclinical deficiencies show up as \"fatigue.\"", "Quest · Function"),
      test("Sex hormone panel", "Cycle days 3 + 21. Perimenopause = chaos otherwise.", "Quest · DUTCH"),
      test("hsCRP", "Iron + autoimmune flares.", "Quest · LabCorp"),
      test("Continuous glucose, 2 wks", "POTS · PCOS · post-meal symptoms.", "Stelo · Lingo"),
    ],
  },
  adhd: {
    eyebrow: "For ADHD users — diagnosed, late-diagnosed, or considering",
    h1: "A baseline that <i>holds</i>. With or without the prescription.",
    sub: "I'm ADHD. I've used multiple medications. What I wanted to know — and couldn't find anywhere — was how much of my function was <i>me</i> and how much was the prescription. The lab models your natural-baseline stack alongside your medication, with your prescriber in the loop. It will not recommend skipping doses. It will show you the gap honestly so you can decide what to do about it.",
    metrics: [
      metric("D2 · D1 · α-2A", "dopamine sub-receptors modeled"),
      metric("Provider-led", "no dose changes from the lab"),
      metric("+14–22%", "typical natural-baseline lift"),
      metric("Education", "not medical advice. by design."),
    ],
    anxieties: [
      anx(
        "01",
        "You can't feel your medication anymore.",
        "D2 down-regulation. The lab shows the curve, models a structured tolerance break with bridge supplements, and surfaces the talk-to-your-prescriber card. It will never recommend skipping a dose. It recommends the conversation.",
      ),
      anx(
        "02",
        "You're afraid to taper because you don't know what's real.",
        "The lab models a parallel scenario — your medicated day vs your protocol-supported day — so you can see the gap honestly. You decide. Your prescriber decides. The lab just removes the guessing.",
      ),
      anx(
        "03",
        "The crashes hit at the same time every day.",
        "3 PM dopamine cliff. Render it against your caffeine timing, your last protein feeding, and your sleep debt — and find the smallest change that closes it.",
      ),
      anx(
        "04",
        "You want to take this seriously and have nothing structured to follow.",
        "The lab gives you a 12-week scaffold — light, protein, training, sleep, magnesium L-threonate, omega-3, tyrosine — calibrated to your sleep type and your medication schedule.",
      ),
    ],
    protocol: {
      lab: "PROTOCOL · NATURAL-BASELINE DOPAMINE STACK (provider-led)",
      title:
        "Light + protein + training + Mg-L-threonate + tyrosine timing alongside Vyvanse 30 mg.",
      desc: "A 33-year-old beta user, late-diagnosed, on Vyvanse 30 mg AM. 12-week protocol; goal: structural baseline lift, not dose change.",
      legend: [
        leg("MORNING", "Bright light 10 min · 40 g protein within 60 min of waking"),
        leg("MEDICATION", "Vyvanse 30 mg as prescribed (preserved · no changes here)"),
        leg("TRAINING", "Mon/Wed/Fri resistance · Tue/Thu Zone 2 walks"),
        leg("NUTRIENTS", "Mg-L-threonate 1.5 g PM · omega-3 2 g · tyrosine 500 mg AM (pre-med)"),
        leg("ENVIRONMENT", "Caffeine cap 200 mg · last by 10:30 AM · phone OOO 9–11 PM"),
        leg("HARM RULES", "Tyrosine + medication only with prescriber sign-off · no MAOIs"),
      ],
    },
    signals: [
      sig("Dopamine baseline (proxy)", "+14%", "accent", "0,22 16,19 32,15 48,12 64,10 80,9 96,8 120,8"),
      sig("Sustained attention (proxy)", "+18%", "accent", "0,22 16,19 32,16 48,12 64,9 80,7 96,7 120,6"),
      sig("3 PM crash", "flattened", "accent", "0,8 16,12 32,17 48,21 64,17 80,13 96,11 120,11"),
      sig("Sleep latency", "11 min", "accent", "0,8 24,10 48,12 72,14 96,15 120,16"),
      sig("Resting HR", "−2 bpm", "accent", "0,8 24,9 48,11 72,12 96,13 120,14"),
      sig("HRV", "+8 ms", "accent", "0,18 24,16 48,14 72,12 96,11 120,10"),
      sig("Mood (proxy)", "+3 pts", "accent", "0,18 24,15 48,12 72,10 96,8 120,7"),
      sig("Med \"felt strength\"", "steady", "dim", "0,14 24,14 48,14 72,14 96,14 120,14"),
    ],
    tests: [
      test("Ferritin", "&lt; 50 ng/mL impairs dopamine synthesis. Often missed.", "Quest · LabCorp"),
      test("Vit D · Mg RBC · zinc", "All cofactors. All commonly low in ADHD.", "Quest · Function"),
      test("Free T3 / TSH", "Subclinical thyroid mimics ADHD inattention.", "Quest · LabCorp"),
      test("Homocysteine + B12", "Methylation matters for catecholamine synthesis.", "Quest · LabCorp"),
      test("Cortisol AM/PM", "Two-point. Flat curve = afternoon crashes.", "DUTCH · Quest"),
      test("HbA1c + fasting glucose", "Glycemic dips destabilize attention faster than caffeine.", "Quest · LabCorp"),
    ],
  },
};
