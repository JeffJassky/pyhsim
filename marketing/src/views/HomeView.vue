<script setup lang="ts">
import Marquee from "@/components/Marquee.vue";
import Signal from "@/components/Signal.vue";
import Effect from "@/components/Effect.vue";
import Contributor from "@/components/Contributor.vue";
import CaseCard from "@/components/CaseCard.vue";
import BloodCard from "@/components/BloodCard.vue";
import CompareRow from "@/components/CompareRow.vue";
import FaqItem from "@/components/FaqItem.vue";
import FinalCTA from "@/components/FinalCTA.vue";

interface AudCard {
  slug: string;
  num: string;
  heading: string;
  body: string;
  quote: string;
  cite: string;
  cta: string;
}

const audienceCards: AudCard[] = [
  {
    slug: "glp1",
    num: "A · GLP-1",
    heading:
      "You're on a GLP-1 and you want it to work without wrecking the rest of you.",
    body: "Test-fly your tirzepatide titration against food timing, training, electrolytes, sleep, and muscle protein synthesis — months of n=1 in an afternoon.",
    quote: "\"I dropped 38 lb. I also lost grip strength I haven't gotten back.\"",
    cite: "— the post you don't want to write",
    cta: "For GLP-1 users →",
  },
  {
    slug: "performance",
    num: "B · Performance",
    heading:
      "You want output all day, every day. Without the 3 PM crash and the 11 PM heart rate.",
    body: "Stack your caffeine, nicotine, modafinil, peptides, and training. See where you're hitting the same receptor three times — and where the actual smoothing comes from.",
    quote: "\"Most days I'm guessing whether I overshot.\"",
    cite: "— a 4× founder we spoke with",
    cta: "For performance users →",
  },
  {
    slug: "longevity",
    num: "C · Longevity",
    heading: "You're optimizing for now <i>and</i> being here in 40 years.",
    body: "Rapamycin, metformin, NAD+, Zone 2, sauna. See ApoB, hsCRP, VO₂max, and biological age move together — and find the two interventions that are quietly duplicating each other.",
    quote: "\"I want a chemistry lab, not another habit tracker.\"",
    cite: "— every user we've talked to",
    cta: "For healthspan users →",
  },
  {
    slug: "health",
    num: "D · Conditions",
    heading: "You have a chronic condition and the standard plan isn't enough.",
    body: "Hashimoto's, PCOS, POTS, long-COVID, IBS, perimenopause. Layer your conditions, your bloodwork, and your actual day — and get a model that responds the way you do.",
    quote: "\"My doctor gave me 12 minutes. My condition has 8,760 hours.\"",
    cite: "— Hashimoto's, age 34",
    cta: "For self-managers →",
  },
  {
    slug: "adhd",
    num: "E · ADHD",
    heading: "You want a baseline that holds, with or without the prescription.",
    body: "Stack a protein-led morning, light, training, magnesium, omega-3, and tyrosine timing — and see how much of your function is actually <i>yours</i>. Built alongside your prescriber.",
    quote: "\"I want to know what's <i>me</i> and what's the medication.\"",
    cite: "— ADHD, late-diagnosed",
    cta: "For ADHD &amp; focus →",
  },
];

const cases = [
  {
    ix: "01",
    heading: '"How do I keep muscle on tirzepatide?"',
    body: "10 mg/wk titration, three protein bumps per day, two resistance sessions, creatine 5 g, leucine 3 g pre-training. The lab flags catabolism risk on day-3 of every dose week and recommends shifting the heavier session +24 hours.",
    tags: ["GLP-1", "Muscle preservation", "Protein timing"],
  },
  {
    ix: "02",
    heading: '"Is my caffeine actually still working?"',
    body: "Tolerance modeling against 8 weeks of 400 mg/day. Adenosine receptor density adapts. Lab shows the cortisol response flattening and recommends a 14-day taper with L-theanine bridge.",
    tags: ["Stimulants", "Tolerance", "Taper"],
  },
  {
    ix: "03",
    heading: '"Will methylene blue interact with my SSRI?"',
    body: "Pharmacokinetic overlay flags MAO inhibition window. Lab refuses to model the stack and surfaces three peer-reviewed warnings, plus a \"talk to your prescriber\" card.",
    tags: ["Drug-interaction", "Harm reduction"],
  },
  {
    ix: "04",
    heading: '"Why am I crashing at 3 PM since starting BPC-157?"',
    body: "Cross-references with cortisol curve, sleep quality, and the timing of an unrelated tyrosine supplement. Highlights that the crash predates BPC and correlates with a 6:30 AM caffeine pulse.",
    tags: ["Peptides", "Energy", "Confounders"],
  },
  {
    ix: "05",
    heading: "\"What does Hashimoto's actually do to my dopamine response?\"",
    body: "Conditions layer applies a baseline shift to D2 receptor density. Reward prediction error curves flatten. Lab recommends keeping resistance training and reducing the second-evening caffeine.",
    tags: ["Autoimmune", "Conditions", "Reward"],
  },
  {
    ix: "06",
    heading: '"Can I cut my Adderall dose with the right protocol?"',
    body: "User builds a 12-week scenario stacking Zone 2, omega-3, magnesium L-threonate, and structured morning light. Lab shows when the executive-function signal overlaps the reduced dose. <b>Provider in the loop.</b>",
    tags: ["ADHD", "Dose reduction", "Provider-led"],
  },
];

const compareRows = [
  ["Models drug + supplement interactions", "No", "Sort of", "Yes — receptor-level"],
  ["Compares two protocols A/B", "No", "Manual", "Native"],
  ["Personalizes to your bloodwork", "No", "No", "PDF in, baselines out"],
  ["Conditions-aware (PCOS, ADHD, T2D, …)", "No", "If you remember", "Library + stacking"],
  ["62-signal physiological readout", "3–5 metrics", "No", "Yes"],
  [
    "Refuses unsafe stacks (e.g. MAOI + SSRI)",
    "No",
    "Sometimes hallucinates",
    "Hard-coded harm rules",
  ],
  ["Your data leaves your device", "Always", "Always", "Only if you say so"],
] as const;

const faqs = [
  {
    ix: "01",
    q: "Is Protokol Lab giving me medical advice?",
    a: "No. Protokol Lab is an educational and self-experimentation tool. It models how compounds, foods, and behaviors are <i>likely</i> to affect known biological signals based on published literature and your inputs. It is not a substitute for a licensed clinician — and the harm-reduction engine will tell you when you've hit the edge of where a model should be making decisions.",
    open: true,
  },
  {
    ix: "02",
    q: "How accurate is the model, really?",
    a: "For acute pharmacokinetics of well-studied compounds (caffeine, common SSRIs, GLP-1s, common peptides), accuracy is high — these are textbook. For multi-compound stacks, chronic adaptation, and rarely-studied peptides, the model is directional. We tag every signal with a confidence band, and we are explicit about what we know vs. what we are extrapolating.",
  },
  {
    ix: "03",
    q: "Do you ever sell or share my bloodwork?",
    a: "Never. Bloodwork PDFs are parsed on-device by default. The extracted markers are encrypted with a key only you hold, on devices you authorize. We do not sell, share, license, or train models on identifiable user data — and the Clinician tier ships with a HIPAA BAA.",
  },
  {
    ix: "04",
    q: "I'm new to this. Will I just get scared by 62 signals?",
    a: "Onboarding asks for one goal — focus, fat loss, sleep quality, recovery, libido, mood, longevity. The lab opens with the 6–8 signals that matter for that goal and quietly hides the rest until you're ready. You can also start by loading a public protocol someone has already built.",
  },
  {
    ix: "05",
    q: "Does it work without bloodwork?",
    a: "Yes. Without labs, the model uses age- and sex-matched population baselines, and labels every prediction as \"population-grounded.\" Once you upload labs, the relevant predictions get re-tagged \"you-grounded.\" It's an honest split — you always know which is which.",
  },
  {
    ix: "06",
    q: "Should I show this to my prescriber?",
    a: "Up to you. The lab can export any protocol as a clean PDF — mechanisms cited, doses listed, comparator scenario attached — specifically so you can walk into a 12-minute appointment with a structured artifact instead of a story. Some users do, some don't. We're not trying to replace your provider. We're trying to make you a more informed person sitting across from one.",
  },
  {
    ix: "07",
    q: "Who is this not for?",
    a: "Casual fitness people who already feel great. People whose Apple Watch is the right level of detail. People who want to do exactly what their doctor said and nothing more. None of that is wrong — it's just not what we built. We built this for the people who decided their body is too important to outsource.",
  },
];
</script>

<template>
  <!-- HERO -->
  <section class="hero">
    <div class="hero-grid"></div>
    <div class="hero-glow"></div>
    <div class="wrap hero-inner">
      <span class="eyebrow"><span class="dot"></span> A test flight for your routine</span>
      <h1 class="h1">
        Stop running <span class="strike">months-long</span> experiments<br />
        on <i>yourself</i>.
      </h1>
      <p class="hero-sub">
        Protokol Lab uses your bloodwork and a library of thousands of compounds, foods, and activities to run <b>virtual experiments on your biology</b> — so you can see what your routine is actually doing to you before you live through three months of guessing. Drop in your stack, scrub the day, watch the body respond.
      </p>
      <div class="hero-ctas">
        <a class="btn btn-primary btn-lg" href="#waitlist">
          Request lab access <span class="arr">→</span>
        </a>
        <RouterLink class="btn btn-lg" to="/#how">See how it works</RouterLink>
      </div>
      <div class="hero-meta">
        <div><b>1,200+</b><span>routines test-flown this week</span></div>
        <div><b>62</b><span>biological signals modeled</span></div>
        <div><b>14</b><span>bloodwork panels integrated</span></div>
        <div><b>Education</b><span>not medical advice. by design.</span></div>
      </div>
    </div>
  </section>

  <Marquee />

  <!-- AUDIENCE -->
  <section class="section" id="who">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">01 / Built for</span></div>
        <div>
          <h2>For the people who decided their body is <i>their</i> responsibility.</h2>
          <p>
            You read the studies. You screenshot the bloodwork. You're skeptical of influencers, picky about your prescriber, and very tired of advice from people whose biology has nothing to do with yours. <b>Pick the version of yourself the lab was built for.</b>
          </p>
        </div>
      </div>

      <div class="audience">
        <RouterLink
          v-for="c in audienceCards"
          :key="c.slug"
          class="aud"
          :to="`/${c.slug}`"
        >
          <span class="num">{{ c.num }}</span>
          <h3 v-html="c.heading"></h3>
          <p v-html="c.body"></p>
          <div class="quote">
            {{ c.quote }}<cite v-html="c.cite"></cite>
          </div>
          <span class="deeper" v-html="c.cta"></span>
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- FEATURES -->
  <section class="section" id="features">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">02 / The lab</span></div>
        <div>
          <h2>Everything you put into your body, on one <i>timeline</i>. Everything it does to you, on the next.</h2>
          <p>The lab is two surfaces stacked: a 24-hour scenario you compose, and a live readout of every signal that scenario moves. Drag, drop, dose, reorder. Watch the body respond.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-text">
          <span class="mono-accent">Feature · 01</span>
          <h3>Compose a day. <i>Compare</i> two days.</h3>
          <p>Lay out your compounds, foods, training, sleep, and environment as a visual timeline. Then fork the scenario. <b>"Caffeine at 7am vs 9am"</b>, <b>"Retatrutide week 4 vs week 12"</b>, <b>"this protocol vs the version my doctor signed off on."</b></p>
          <ul>
            <li><b>Side-by-side scenarios</b><span>Run A and B against the same body and compare every signal at once.</span></li>
            <li><b>1D / 7D / 30D horizons</b><span>See acute spikes, weekly rhythms, and chronic adaptation in the same view.</span></li>
            <li><b>Drag to reschedule</b><span>Move a 200 mg caffeine block from 7:35 AM to 12:55 PM and watch melatonin, cortisol, and sleep latency reshape live.</span></li>
          </ul>
        </div>
        <div class="feature-vis">
          <div class="vis">
            <div class="vis-head">
              <span class="lt">SCENARIO B · 1D</span>
              <span class="rt"><span class="pill">A</span><span class="pill on">B</span><span class="pill">+</span></span>
            </div>
            <div class="v-timeline">
              <div class="axis">
                <span>8 AM</span><span>10</span><span>12 PM</span><span>2</span><span>4</span><span>6 PM</span><span>10</span>
              </div>
              <div class="lanes">
                <div class="now" data-time="2:14 PM" style="left: 38%"></div>
                <div class="lane">
                  <span class="lname">Medications</span>
                  <div class="ltrack">
                    <div class="chip" style="left: 5%"><span class="d cy"></span>Caffeine 200 mg</div>
                    <div class="chip" style="left: 62%"><span class="d am"></span>Retatrutide</div>
                  </div>
                </div>
                <div class="lane">
                  <span class="lname">Supplements</span>
                  <div class="ltrack">
                    <div class="chip" style="left: 14%"><span class="d gn"></span>Omega-3</div>
                    <div class="chip" style="left: 43%"><span class="d cy"></span>Alpha-GPC</div>
                    <div class="chip" style="left: 55%"><span class="d am"></span>Vit D3</div>
                    <div class="chip" style="left: 70%"><span class="d cy"></span>Magnesium</div>
                  </div>
                </div>
                <div class="lane">
                  <span class="lname">Exercise</span>
                  <div class="ltrack">
                    <div class="chip" style="left: 9%"><span class="d gy"></span>Zone 2 · 40m</div>
                    <div class="chip" style="left: 48%"><span class="d gy"></span>Resistance</div>
                  </div>
                </div>
                <div class="lane">
                  <span class="lname">Food</span>
                  <div class="ltrack">
                    <div class="chip" style="left: 12%"><span class="d gy"></span>Protein +40g</div>
                    <div class="chip" style="left: 45%"><span class="d gy"></span>Carb refeed</div>
                  </div>
                </div>
                <div class="lane">
                  <span class="lname">Sleep</span>
                  <div class="ltrack">
                    <div class="chip accent" style="left: 78%; width: 21%">Sleep · 8h 02m</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="feature flip">
        <div class="feature-text">
          <span class="mono-accent">Feature · 02</span>
          <h3>62 signals. <i>One</i> body. Watch them move together.</h3>
          <p>Every input you place on the timeline propagates through a graph of biological pathways. Dopamine reads from caffeine, cardio, sleep, resistance training, and meditation — at once, with realistic timing and magnitude. <b>Nothing is a single number.</b></p>
          <ul>
            <li><b>Nervous, endocrine, metabolic, immune</b><span>Neuroplasticity, dopamine, GABA, melatonin, cortisol, glucose, vitality, burn rate, weight, and 50+ more.</span></li>
            <li><b>Goal-aware filtering</b><span>Tag a goal — focus, fat loss, sleep quality, longevity — and the dashboard surfaces only the signals that matter for it.</span></li>
            <li><b>Scrub the day</b><span>Drag the playhead across 24 hours. The whole body redraws under your finger.</span></li>
          </ul>
        </div>
        <div class="feature-vis">
          <div class="vis">
            <div class="vis-head">
              <span class="lt">NERVOUS SYSTEM · LIVE</span>
              <span class="rt"><span class="pill on">My goals</span><span class="pill">All</span></span>
            </div>
            <div class="v-signals" style="margin-top: 14px">
              <Signal name="Neuroplasticity" val="+12%" klass="accent" points="0,22 12,20 24,18 36,12 48,6 60,5 72,8 84,10 96,11 108,9 120,7" />
              <Signal name="Dopamine" val="34.4 nM" klass="dim" points="0,22 10,18 22,8 34,4 46,9 58,14 70,18 82,20 94,22 106,21 120,20" />
              <Signal name="Serotonin" val="13.2 nM" klass="dim" points="0,22 14,21 28,18 42,12 56,9 70,12 84,16 98,18 120,20" />
              <Signal name="Norepinephrine" val="393 pg/mL" klass="accent" points="0,22 8,20 18,16 28,8 38,3 48,5 60,10 72,14 84,17 96,19 108,20 120,21" />
              <Signal name="GABA" val="199 nM" klass="dim" points="0,18 14,17 28,16 42,15 56,14 70,15 84,17 98,18 120,19" val-klass="dim" />
              <Signal name="BDNF" val="+18%" klass="accent" points="0,24 12,23 24,21 36,16 48,11 60,7 72,5 84,6 96,8 108,10 120,12" />
              <Signal name="Cortisol" val="17.5 µg/dL" klass="dim" points="0,8 12,6 24,9 36,13 48,17 60,19 72,20 84,21 96,22 108,23 120,23" val-klass="dim" />
              <Signal name="Melatonin" val="0.0 pg/mL" klass="dim" points="0,24 16,24 32,24 48,24 64,23 80,22 96,18 110,12 120,7" val-klass="dim" />
              <Signal name="Glucose" val="75.9 mg/dL" klass="dim" points="0,18 12,16 24,12 36,8 48,11 60,15 72,17 84,16 96,14 108,15 120,16" val-klass="dim" />
            </div>
          </div>
        </div>
      </div>

      <div class="feature">
        <div class="feature-text">
          <span class="mono-accent">Feature · 03</span>
          <h3>Inspect any input. <i>See</i> the receptors it touches.</h3>
          <p>Click caffeine. Read what it does to adenosine A1, A2A, cortisol, adrenaline, and norepinephrine — in your own units, at your own dose, with your own conditions applied. No more "caffeine increases focus." Tell us how, and how much.</p>
          <ul>
            <li><b>Receptor-level mechanism</b><span>Each compound is decomposed into its actual binding profile and downstream effects.</span></li>
            <li><b>Dose-dependent everything</b><span>200 mg ≠ 400 mg. Slide the dose; the effect curve and the side-effect risk curve both move.</span></li>
            <li><b>Annotate as you go</b><span>"Felt jittery at 250 mg. Dropped to 150 + L-theanine, much smoother." Notes attach to the compound, not a generic journal.</span></li>
          </ul>
        </div>
        <div class="feature-vis">
          <div class="vis" style="padding: 24px">
            <div class="vis-head" style="border-bottom: 0; padding-bottom: 0">
              <span class="lt">INSPECT · CAFFEINE</span>
              <span class="rt"><span class="pill on">Active</span></span>
            </div>
            <div style="padding-top: 18px; display: flex; flex-direction: column; gap: 14px">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--ink-dim)">
                <span>Time</span>
                <span style="font-family: var(--mono); color: var(--ink)">8:15 AM</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--ink-dim)">
                <span>Amount</span>
                <span style="font-family: var(--mono); color: var(--accent)">200 mg</span>
              </div>
              <div style="height: 6px; background: var(--bg); border: 1px solid var(--line-2); border-radius: 999px; position: relative">
                <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 50%; background: var(--accent-soft); border-radius: 999px"></span>
                <span style="position: absolute; left: 50%; top: -3px; bottom: -3px; width: 2px; background: var(--accent); box-shadow: 0 0 8px var(--accent)"></span>
              </div>
              <div style="display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--ink-mute)">
                <span>0</span><span>100</span><span>200</span><span>300</span><span>400</span>
              </div>
              <div class="mono" style="margin-top: 10px">Biological effects</div>
              <Effect label="Adenosine A2A" value="−160.0" kind="neg" />
              <Effect label="Adenosine A1" value="−80.0" kind="neg" />
              <Effect label="Cortisol" value="+16.0 µg/dL" />
              <Effect label="Adrenaline" value="+24.0 pg/mL" />
              <Effect label="Norepinephrine" value="+187.5 pg/mL" />
            </div>
          </div>
        </div>
      </div>

      <div class="feature flip">
        <div class="feature-text">
          <span class="mono-accent">Feature · 04</span>
          <h3>Tell the model who <i>you</i> are.</h3>
          <p>The same dose hits a 28-year-old endurance athlete and a 52-year-old with Hashimoto's very differently. Tag your conditions. Drop in your last bloodwork PDF. The model rebalances every prediction around <b>your</b> baseline.</p>
          <ul>
            <li><b>Conditions library</b><span>ADHD, PCOS, Hashimoto's, T2D, perimenopause, long-COVID, IBS, sleep apnea, depression, anxiety — and stacking them.</span></li>
            <li><b>Bloodwork upload</b><span>Quest, LabCorp, Function, InsideTracker, Marek. Drop the PDF; we extract markers and reset the baselines.</span></li>
            <li><b>Population fallback</b><span>No labs yet? We use age- and sex-matched population curves, and tell you which signals you're guessing on.</span></li>
          </ul>
        </div>
        <div class="feature-vis">
          <div class="vis">
            <div class="vis-head">
              <span class="lt">DOPAMINE · ACTIVE CONTRIBUTORS</span>
              <span class="rt"><span class="pill">3D</span></span>
            </div>
            <div style="padding-top: 18px">
              <div class="mono" style="margin-bottom: 8px">Your conditions</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px">
                <span class="chip" style="position: static; transform: none">
                  <span class="d cy"></span>ADHD
                  <span style="color: var(--ink-mute); margin-left: 4px">−18% baseline</span>
                </span>
                <span class="chip" style="position: static; transform: none">
                  <span class="d am"></span>Hashimoto's
                  <span style="color: var(--ink-mute); margin-left: 4px">TSH 4.8</span>
                </span>
              </div>
              <div class="mono" style="margin-bottom: 8px">Active contributors → dopamine</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px">
                <Contributor dot="gn" name="Caffeine" value="+160 nM" />
                <Contributor dot="gn" name="Resistance" value="+7.0 nM" />
                <Contributor dot="gy" name="Cardio" value="+10.0 nM" />
                <Contributor dot="gy" name="Social" value="+4.0 nM" />
                <Contributor dot="am" name="Sleep" value="−8.0 nM" kind="neg" />
                <Contributor dot="am" name="Melatonin" value="−5.0 nM" kind="neg" />
              </div>
              <div class="mono" style="margin: 22px 0 8px">Coupled pathways</div>
              <div style="display: flex; gap: 8px">
                <span class="pill on">Cortisol · linear</span>
                <span class="pill">Norepinephrine · sigmoid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section class="section" id="how">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">03 / Workflow</span></div>
        <div>
          <h2>From "I think this is working" to <i>"here's exactly what's moving"</i> in four steps.</h2>
          <p>Most of our beta users finish their first complete protocol in under 20 minutes. Adjusting it is the part that takes weeks — because the iteration is the whole point.</p>
        </div>
      </div>
      <div class="steps">
        <div class="step"><div class="num">01</div><h4>Calibrate to your body.</h4><p>Add age, sex, training history, sleep type. Tag conditions. Optionally drop your last bloodwork — the model resets every baseline against it.</p></div>
        <div class="step"><div class="num">02</div><h4>Compose a scenario.</h4><p>Drag compounds, foods, training, sleep, and environment onto a 24-hour, 7-day, or 30-day timeline. Set doses, times, and durations.</p></div>
        <div class="step"><div class="num">03</div><h4>Read every signal.</h4><p>62 biological signals draw against your scenario in real time. Filter by goal — focus, fat loss, recovery, sleep quality, longevity, libido, mood.</p></div>
        <div class="step"><div class="num">04</div><h4>Fork, compare, ship it.</h4><p>Save the scenario as a Protocol. Run an A/B against the version you're living. Adopt the winner — or take the comparison to your provider.</p></div>
      </div>
    </div>
  </section>

  <!-- MANIFESTO -->
  <section class="manifesto">
    <div class="wrap">
      <div class="manifesto-grid">
        <div>
          <span class="mono-accent">A note from the founder</span>
          <blockquote>I built this because I felt like shit and my body felt like a <i>black box.</i></blockquote>
          <cite>— the founder</cite>
        </div>
        <div class="manifesto-side">
          <p>I'm ADHD. I'm overweight. I've had major sleep issues, attention issues, executive functioning issues, and I've used multiple GLP-1s. For years I tried to fix it the normal way: ask the doctor, follow the influencer, copy the friend, run the routine for three months and hope.</p>
          <p>None of those people had my biology. None of them had my labs. None of them were going to live in my body for the next forty years. And the apps I tried were busy giving me a streak for closing my rings.</p>
          <p>So I built the tool I wanted: a place where I could drop in my actual stack — compounds, food, training, sleep, the GLP-1 — and <b>see what it was doing to me</b> before I lived through it. Not advice. Not a coach. A model. Fundamentals of how a body actually works, run against the body I actually have.</p>
          <p>If you're already at your goals and your routine is working, this isn't for you. <b>If your body feels like a black box and you've decided to take responsibility for it anyway — welcome to the lab.</b></p>
        </div>
      </div>
    </div>
  </section>

  <!-- CASES -->
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">04 / Real protocols</span></div>
        <div>
          <h2>The questions our users come in with — and the ones they leave with.</h2>
          <p>Every box below is a real scenario users have built and saved during the closed beta. Names removed. Doses preserved.</p>
        </div>
      </div>
      <div class="cases">
        <CaseCard
          v-for="c in cases"
          :key="c.ix"
          :ix="c.ix"
          :heading="c.heading"
          :body="c.body"
          :tags="c.tags"
        />
      </div>
    </div>
  </section>

  <!-- BLOODWORK -->
  <section class="section" id="science">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">05 / Personalization</span></div>
        <div>
          <h2>The model is good. With your bloodwork, it gets <i>specific</i>.</h2>
          <p>Drop in a PDF from Quest, LabCorp, Function, InsideTracker, or Marek Health. We extract 70+ markers, recalibrate baselines, and tell you which signals are now grounded in <i>your</i> body and which are still population averages.</p>
        </div>
      </div>
      <div class="blood">
        <div class="blood-left">
          <span class="mono-accent">Markers we calibrate against</span>
          <h3 style="margin-top: 14px">From a single PDF, the lab <i>recalibrates</i>.</h3>
          <p>We never share your labs. Bloodwork parsing runs on-device by default, and the extracted markers stay encrypted with your key. You can wipe them at any time — and the model gracefully falls back to population baselines if you do.</p>
          <ul class="blood-list">
            <li><span class="name">Free testosterone</span><span class="val">682 pg/mL</span><span class="src">QUEST · 04/14</span></li>
            <li><span class="name">SHBG</span><span class="val">28 nmol/L</span><span class="src">QUEST · 04/14</span></li>
            <li><span class="name">TSH</span><span class="val">4.8 µIU/mL</span><span class="src">LABCORP · 02/01</span></li>
            <li><span class="name">Fasting insulin</span><span class="val">7.2 µIU/mL</span><span class="src">FUNCTION · 03/22</span></li>
            <li><span class="name">HbA1c</span><span class="val">5.4%</span><span class="src">FUNCTION · 03/22</span></li>
            <li><span class="name">hsCRP</span><span class="val">0.6 mg/L</span><span class="src">FUNCTION · 03/22</span></li>
            <li><span class="name">ApoB</span><span class="val">82 mg/dL</span><span class="src">QUEST · 04/14</span></li>
            <li><span class="name">25-OH Vitamin D</span><span class="val">38 ng/mL</span><span class="src">FUNCTION · 03/22</span></li>
          </ul>
        </div>
        <div class="blood-right">
          <span class="mono-accent">How it shows up in the lab</span>
          <BloodCard
            heading="Free testosterone"
            ref="REF 264–916 pg/mL"
            :range-left="22"
            :range-width="50"
            :you-at="50"
            lo="LOW"
            mid="YOU · 682"
            hi="HIGH"
          />
          <BloodCard
            heading="TSH"
            ref="REF 0.4–4.5 µIU/mL"
            :range-left="12"
            :range-width="60"
            :you-at="78"
            lo="LOW"
            mid="YOU · 4.8 (out of range)"
            hi="HIGH"
          />
          <BloodCard
            heading="HbA1c"
            ref="REF 4.0–5.6%"
            :range-left="10"
            :range-width="60"
            :you-at="56"
            lo="LOW"
            mid="YOU · 5.4"
            hi="HIGH"
          />
          <BloodCard
            heading="ApoB"
            ref="REF &lt; 90 mg/dL"
            :range-left="0"
            :range-width="70"
            :you-at="64"
            lo="OPTIMAL"
            mid="YOU · 82"
            hi="BORDERLINE"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- COMPARE -->
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">06 / Honest comparison</span></div>
        <div>
          <h2>What the other apps in your phone <i>can't</i> do.</h2>
          <p>We respect every tool below. We use most of them ourselves. They're just not built for the protocol-design problem — and pretending otherwise would waste your time.</p>
        </div>
      </div>
      <div class="compare">
        <div class="h"></div>
        <div class="h">Habit / wearable apps</div>
        <div class="h">Spreadsheet + ChatGPT</div>
        <div class="h us">Protokol Lab</div>
        <CompareRow
          v-for="row in compareRows"
          :key="row[0]"
          :label="row[0]"
          :habit="row[1]"
          :spreadsheet="row[2]"
          :us="row[3]"
        />
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section class="section" id="pricing">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">07 / Access</span></div>
        <div>
          <h2>Two tiers. <i>No</i> ads. No selling your bloodwork. Ever.</h2>
          <p>Founding-member pricing while we're in invite beta. Locks for life. Cancel any time, your protocols come with you as JSON. We're not building a clinic. We're not selling medical advice. We're building a tool you own.</p>
        </div>
      </div>
      <div class="pricing">
        <div class="price">
          <h4>Observer</h4>
          <div class="desc">Read the lab, run public protocols, learn the model. For people just starting to take their biology seriously.</div>
          <div class="amt"><b>$0</b><span>/ month · forever</span></div>
          <ul>
            <li>Browse all public protocols</li>
            <li>Single 1-day scenario</li>
            <li>20 signals, population baseline</li>
            <li>Read-only conditions library</li>
          </ul>
          <a class="btn price-cta" href="#waitlist">Start observing</a>
        </div>
        <div class="price feat">
          <h4>Lab access</h4>
          <div class="desc">The full lab. Your bloodwork, your stack, your day. For the people running real experiments on themselves and tired of guessing.</div>
          <div class="amt"><b>$24</b><span>/ month, billed annually</span></div>
          <ul>
            <li>Unlimited scenarios &amp; A/B forks</li>
            <li>All 62 signals across 1D/7D/30D</li>
            <li>Bloodwork PDF parsing &amp; baselines</li>
            <li>Full conditions library + stacking</li>
            <li>Drug-interaction harm engine</li>
            <li>Export protocols as PDF to bring to your provider</li>
          </ul>
          <a class="btn btn-primary price-cta" href="#waitlist">Request lab access <span class="arr">→</span></a>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="section" id="faq">
    <div class="wrap">
      <div class="section-head">
        <div class="label"><span class="mono-accent">08 / Questions</span></div>
        <div>
          <h2>The questions we get every week.</h2>
          <p>If yours isn't here, the team reads every founder@ email personally during the beta.</p>
        </div>
      </div>
      <div class="faq">
        <FaqItem
          v-for="f in faqs"
          :key="f.ix"
          :ix="f.ix"
          :q="f.q"
          :a="f.a"
          :open="f.open"
        />
      </div>
    </div>
  </section>

  <FinalCTA />
</template>
