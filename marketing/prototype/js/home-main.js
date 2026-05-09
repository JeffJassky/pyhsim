// Home page main sections — features, how, manifesto, cases, bloodwork, compare, pricing, FAQ.
window.PL = window.PL || {};

PL.renderHomeMain = function(){ return `
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
          <div class="vis-head"><span class="lt">SCENARIO B · 1D</span><span class="rt"><span class="pill">A</span><span class="pill on">B</span><span class="pill">+</span></span></div>
          <div class="v-timeline">
            <div class="axis"><span>8 AM</span><span>10</span><span>12 PM</span><span>2</span><span>4</span><span>6 PM</span><span>10</span></div>
            <div class="lanes">
              <div class="now" data-time="2:14 PM" style="left: 38%;"></div>
              <div class="lane"><span class="lname">Medications</span><div class="ltrack">
                <div class="chip" style="left:5%"><span class="d cy"></span>Caffeine 200 mg</div>
                <div class="chip" style="left:62%"><span class="d am"></span>Retatrutide</div>
              </div></div>
              <div class="lane"><span class="lname">Supplements</span><div class="ltrack">
                <div class="chip" style="left:14%"><span class="d gn"></span>Omega-3</div>
                <div class="chip" style="left:43%"><span class="d cy"></span>Alpha-GPC</div>
                <div class="chip" style="left:55%"><span class="d am"></span>Vit D3</div>
                <div class="chip" style="left:70%"><span class="d cy"></span>Magnesium</div>
              </div></div>
              <div class="lane"><span class="lname">Exercise</span><div class="ltrack">
                <div class="chip" style="left:9%"><span class="d gy"></span>Zone 2 · 40m</div>
                <div class="chip" style="left:48%"><span class="d gy"></span>Resistance</div>
              </div></div>
              <div class="lane"><span class="lname">Food</span><div class="ltrack">
                <div class="chip" style="left:12%"><span class="d gy"></span>Protein +40g</div>
                <div class="chip" style="left:45%"><span class="d gy"></span>Carb refeed</div>
              </div></div>
              <div class="lane"><span class="lname">Sleep</span><div class="ltrack">
                <div class="chip accent" style="left:78%; width: 21%;">Sleep · 8h 02m</div>
              </div></div>
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
          <div class="vis-head"><span class="lt">NERVOUS SYSTEM · LIVE</span><span class="rt"><span class="pill on">My goals</span><span class="pill">All</span></span></div>
          <div class="v-signals" style="margin-top:14px">
            ${PL.sig('Neuroplasticity','+12%','accent','0,22 12,20 24,18 36,12 48,6 60,5 72,8 84,10 96,11 108,9 120,7')}
            ${PL.sig('Dopamine','34.4 nM','dim','0,22 10,18 22,8 34,4 46,9 58,14 70,18 82,20 94,22 106,21 120,20')}
            ${PL.sig('Serotonin','13.2 nM','dim','0,22 14,21 28,18 42,12 56,9 70,12 84,16 98,18 120,20')}
            ${PL.sig('Norepinephrine','393 pg/mL','accent','0,22 8,20 18,16 28,8 38,3 48,5 60,10 72,14 84,17 96,19 108,20 120,21')}
            ${PL.sig('GABA','199 nM','dim','0,18 14,17 28,16 42,15 56,14 70,15 84,17 98,18 120,19', 'dim')}
            ${PL.sig('BDNF','+18%','accent','0,24 12,23 24,21 36,16 48,11 60,7 72,5 84,6 96,8 108,10 120,12')}
            ${PL.sig('Cortisol','17.5 µg/dL','dim','0,8 12,6 24,9 36,13 48,17 60,19 72,20 84,21 96,22 108,23 120,23','dim')}
            ${PL.sig('Melatonin','0.0 pg/mL','dim','0,24 16,24 32,24 48,24 64,23 80,22 96,18 110,12 120,7','dim')}
            ${PL.sig('Glucose','75.9 mg/dL','dim','0,18 12,16 24,12 36,8 48,11 60,15 72,17 84,16 96,14 108,15 120,16','dim')}
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
        <div class="vis" style="padding:24px;">
          <div class="vis-head" style="border-bottom:0;padding-bottom:0"><span class="lt">INSPECT · CAFFEINE</span><span class="rt"><span class="pill on">Active</span></span></div>
          <div style="padding-top:18px; display:flex; flex-direction:column; gap:14px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-dim)"><span>Time</span><span style="font-family:var(--mono);color:var(--ink)">8:15 AM</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-dim)"><span>Amount</span><span style="font-family:var(--mono);color:var(--accent)">200 mg</span></div>
            <div style="height:6px;background:var(--bg);border:1px solid var(--line-2);border-radius:999px;position:relative;"><span style="position:absolute;left:0;top:0;bottom:0;width:50%;background:var(--accent-soft);border-radius:999px;"></span><span style="position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:var(--accent);box-shadow:0 0 8px var(--accent);"></span></div>
            <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--ink-mute)"><span>0</span><span>100</span><span>200</span><span>300</span><span>400</span></div>
            <div class="mono" style="margin-top:10px">Biological effects</div>
            ${PL.eff('Adenosine A2A','−160.0','neg')}
            ${PL.eff('Adenosine A1','−80.0','neg')}
            ${PL.eff('Cortisol','+16.0 µg/dL')}
            ${PL.eff('Adrenaline','+24.0 pg/mL')}
            ${PL.eff('Norepinephrine','+187.5 pg/mL')}
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
          <div class="vis-head"><span class="lt">DOPAMINE · ACTIVE CONTRIBUTORS</span><span class="rt"><span class="pill">3D</span></span></div>
          <div style="padding-top:18px">
            <div class="mono" style="margin-bottom:8px">Your conditions</div>
            <div style="display:flex; gap:8px; flex-wrap: wrap; margin-bottom: 22px;">
              <span class="chip" style="position: static; transform:none;"><span class="d cy"></span>ADHD <span style="color:var(--ink-mute); margin-left:4px">−18% baseline</span></span>
              <span class="chip" style="position: static; transform:none;"><span class="d am"></span>Hashimoto's <span style="color:var(--ink-mute); margin-left:4px">TSH 4.8</span></span>
            </div>
            <div class="mono" style="margin-bottom:8px">Active contributors → dopamine</div>
            <div style="display:grid; grid-template-columns: repeat(2,1fr); gap: 6px;">
              ${PL.contrib('gn','Caffeine','+160 nM','accent')}
              ${PL.contrib('gn','Resistance','+7.0 nM','accent')}
              ${PL.contrib('gy','Cardio','+10.0 nM','accent')}
              ${PL.contrib('gy','Social','+4.0 nM','accent')}
              ${PL.contrib('am','Sleep','−8.0 nM','neg')}
              ${PL.contrib('am','Melatonin','−5.0 nM','neg')}
            </div>
            <div class="mono" style="margin: 22px 0 8px">Coupled pathways</div>
            <div style="display:flex; gap: 8px;">
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
      ${PL.caseCard('01','"How do I keep muscle on tirzepatide?"','10 mg/wk titration, three protein bumps per day, two resistance sessions, creatine 5 g, leucine 3 g pre-training. The lab flags catabolism risk on day-3 of every dose week and recommends shifting the heavier session +24 hours.',['GLP-1','Muscle preservation','Protein timing'])}
      ${PL.caseCard('02','"Is my caffeine actually still working?"','Tolerance modeling against 8 weeks of 400 mg/day. Adenosine receptor density adapts. Lab shows the cortisol response flattening and recommends a 14-day taper with L-theanine bridge.',['Stimulants','Tolerance','Taper'])}
      ${PL.caseCard('03','"Will methylene blue interact with my SSRI?"','Pharmacokinetic overlay flags MAO inhibition window. Lab refuses to model the stack and surfaces three peer-reviewed warnings, plus a "talk to your prescriber" card.',['Drug-interaction','Harm reduction'])}
      ${PL.caseCard('04','"Why am I crashing at 3 PM since starting BPC-157?"','Cross-references with cortisol curve, sleep quality, and the timing of an unrelated tyrosine supplement. Highlights that the crash predates BPC and correlates with a 6:30 AM caffeine pulse.',['Peptides','Energy','Confounders'])}
      ${PL.caseCard('05','"What does Hashimoto\'s actually do to my dopamine response?"','Conditions layer applies a baseline shift to D2 receptor density. Reward prediction error curves flatten. Lab recommends keeping resistance training and reducing the second-evening caffeine.',['Autoimmune','Conditions','Reward'])}
      ${PL.caseCard('06','"Can I cut my Adderall dose with the right protocol?"','User builds a 12-week scenario stacking Zone 2, omega-3, magnesium L-threonate, and structured morning light. Lab shows when the executive-function signal overlaps the reduced dose. <b>Provider in the loop.</b>',['ADHD','Dose reduction','Provider-led'])}
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
        <h3 style="margin-top:14px">From a single PDF, the lab <i>recalibrates</i>.</h3>
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
        ${PL.bloodCard('Free testosterone','REF 264–916 pg/mL',22,50,50,'LOW','YOU · 682','HIGH')}
        ${PL.bloodCard('TSH','REF 0.4–4.5 µIU/mL',12,60,78,'LOW','YOU · 4.8 (out of range)','HIGH')}
        ${PL.bloodCard('HbA1c','REF 4.0–5.6%',10,60,56,'LOW','YOU · 5.4','HIGH')}
        ${PL.bloodCard('ApoB','REF &lt; 90 mg/dL',0,70,64,'OPTIMAL','YOU · 82','BORDERLINE')}
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
      <div class="h"></div><div class="h">Habit / wearable apps</div><div class="h">Spreadsheet + ChatGPT</div><div class="h us">Protokol Lab</div>
      ${PL.cmp('Models drug + supplement interactions','No','Sort of','Yes — receptor-level')}
      ${PL.cmp('Compares two protocols A/B','No','Manual','Native')}
      ${PL.cmp('Personalizes to your bloodwork','No','No','PDF in, baselines out')}
      ${PL.cmp('Conditions-aware (PCOS, ADHD, T2D, …)','No','If you remember','Library + stacking')}
      ${PL.cmp('62-signal physiological readout','3–5 metrics','No','Yes')}
      ${PL.cmp('Refuses unsafe stacks (e.g. MAOI + SSRI)','No','Sometimes hallucinates','Hard-coded harm rules')}
      ${PL.cmp('Your data leaves your device','Always','Always','Only if you say so')}
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
        <ul><li>Browse all public protocols</li><li>Single 1-day scenario</li><li>20 signals, population baseline</li><li>Read-only conditions library</li></ul>
        <a class="btn price-cta" href="#waitlist">Start observing</a>
      </div>
      <div class="price feat">
        <h4>Lab access</h4>
        <div class="desc">The full lab. Your bloodwork, your stack, your day. For the people running real experiments on themselves and tired of guessing.</div>
        <div class="amt"><b>$24</b><span>/ month, billed annually</span></div>
        <ul><li>Unlimited scenarios &amp; A/B forks</li><li>All 62 signals across 1D/7D/30D</li><li>Bloodwork PDF parsing &amp; baselines</li><li>Full conditions library + stacking</li><li>Drug-interaction harm engine</li><li>Export protocols as PDF to bring to your provider</li></ul>
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
      ${PL.faq('01','Is Protokol Lab giving me medical advice?','No. Protokol Lab is an educational and self-experimentation tool. It models how compounds, foods, and behaviors are <i>likely</i> to affect known biological signals based on published literature and your inputs. It is not a substitute for a licensed clinician — and the harm-reduction engine will tell you when you\'ve hit the edge of where a model should be making decisions.', true)}
      ${PL.faq('02','How accurate is the model, really?','For acute pharmacokinetics of well-studied compounds (caffeine, common SSRIs, GLP-1s, common peptides), accuracy is high — these are textbook. For multi-compound stacks, chronic adaptation, and rarely-studied peptides, the model is directional. We tag every signal with a confidence band, and we are explicit about what we know vs. what we are extrapolating.')}
      ${PL.faq('03','Do you ever sell or share my bloodwork?','Never. Bloodwork PDFs are parsed on-device by default. The extracted markers are encrypted with a key only you hold, on devices you authorize. We do not sell, share, license, or train models on identifiable user data — and the Clinician tier ships with a HIPAA BAA.')}
      ${PL.faq('04','I\'m new to this. Will I just get scared by 62 signals?','Onboarding asks for one goal — focus, fat loss, sleep quality, recovery, libido, mood, longevity. The lab opens with the 6–8 signals that matter for that goal and quietly hides the rest until you\'re ready. You can also start by loading a public protocol someone has already built.')}
      ${PL.faq('05','Does it work without bloodwork?','Yes. Without labs, the model uses age- and sex-matched population baselines, and labels every prediction as "population-grounded." Once you upload labs, the relevant predictions get re-tagged "you-grounded." It\'s an honest split — you always know which is which.')}
      ${PL.faq('06','Should I show this to my prescriber?','Up to you. The lab can export any protocol as a clean PDF — mechanisms cited, doses listed, comparator scenario attached — specifically so you can walk into a 12-minute appointment with a structured artifact instead of a story. Some users do, some don\'t. We\'re not trying to replace your provider. We\'re trying to make you a more informed person sitting across from one.')}
      ${PL.faq('07','Who is this not for?','Casual fitness people who already feel great. People whose Apple Watch is the right level of detail. People who want to do exactly what their doctor said and nothing more. None of that is wrong — it\'s just not what we built. We built this for the people who decided their body is too important to outsource.')}
    </div>
  </div>
</section>
`; };

// Helpers
PL.sig = (name, val, klass, points, valKlass) => `
  <div class="sig"><div class="top"><span class="name">${name}</span><span class="val ${valKlass||''}">${val}</span></div>
    <svg viewBox="0 0 120 28" preserveAspectRatio="none"><polyline fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" points="${points}" style="color:var(--${klass==='accent'?'accent':'ink-dim'})"/></svg></div>`;

PL.eff = (l, v, klass) => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-top:1px solid var(--line)"><span style="color:var(--ink-dim)">${l}</span><span style="font-family:var(--mono);color:var(--${klass==='neg'?'neg':'accent'})">${v}</span></div>`;

PL.contrib = (dot, name, val, valKlass) => `<div class="chip" style="position: static; transform:none; justify-content: space-between;"><span><span class="d ${dot}"></span> ${name}</span><span style="color:${valKlass==='neg'?'oklch(0.78 0.12 25)':'var(--accent)'}">${val}</span></div>`;

PL.caseCard = (ix, h5, p, tags) => `
  <div class="case"><span class="ix">CASE · ${ix}</span><div>
    <h5>${h5}</h5><p>${p}</p>
    <div class="tags">${tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
  </div></div>`;

PL.bloodCard = (h, ref, l, w, you, lo, mid, hi) => `
  <div class="blood-card">
    <div class="top"><h6>${h}</h6><span class="ref">${ref}</span></div>
    <div class="bar"><span class="range" style="left:${l}%;width:${w}%"></span><span class="you" style="left:${you}%"></span></div>
    <div class="bar-meta"><span>${lo}</span><span>${mid}</span><span>${hi}</span></div>
  </div>`;

PL.cmp = (l, a, b, c) => `
  <div class="row-l">${l}</div><div class="no">${a}</div><div class="no">${b}</div><div class="col-us yes">${c}</div>`;

PL.faq = (ix, q, a, open) => `
  <details${open?' open':''}>
    <summary><span class="ix">Q · ${ix}</span><span>${q}</span><span class="pm">+</span></summary>
    <div class="a">${a}</div>
  </details>`;
