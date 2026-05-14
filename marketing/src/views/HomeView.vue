<script setup lang="ts">
</script>

<template>
  <!-- HERO — methodology-first, video preserved -->
  <section class="hero">
    <video
      class="hero-video"
      src="/hero-video.mov"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
    ></video>
    <div class="wrap hero-inner">
      <span class="eyebrow"
        ><span class="dot"></span> The self-experimentation lab.</span
      >
      <h1 class="h1">
        If we can't <i>cite&nbsp;it</i>,<br />we don't model&nbsp;it.
      </h1>
      <p class="hero-sub">
        A <b>simulation lab</b> for your routine. 1,200+ compounds, 62
        biological signals, every effect traced to peer-reviewed pharmacology.
        Test changes before you live through them.
      </p>
      <div class="hero-ctas">
        <a class="btn btn-primary btn-lg" href="#join">
          Run a scenario <span class="arr">→</span>
        </a>
        <a class="btn btn-lg" href="#how">How the model works</a>
      </div>
      <div class="hero-tagline">
        <div>
          <div class="stat-big">1,200+ compounds</div>
          <div class="stat-label">Pharmacology library, every effect cited</div>
        </div>
        <div>
          <div class="stat-big">62 signals</div>
          <div class="stat-label">From dopamine to ApoB, modeled together</div>
        </div>
        <div>
          <div class="stat-big">Your bloodwork</div>
          <div class="stat-label">Quest, LabCorp, Function — parsed and baselined</div>
        </div>
      </div>
    </div>
  </section>

  <!-- CAPABILITY STACK — 3 verbs -->
  <section class="stack">
    <div class="wrap">
      <div class="stack-grid">
        <h2>What the lab lets you do.</h2>
        <div class="stack-items">
          <div class="stack-item">
            <span class="num">01</span>
            <div>
              <h3>Test changes before you live them.</h3>
              <p>
                Drop a new compound, a different dose, a re-timed meal into your
                day and see how the rest of your body responds. The next twelve
                weeks, simulated in an afternoon.
              </p>
            </div>
          </div>
          <div class="stack-item">
            <span class="num">02</span>
            <div>
              <h3>Find the overlaps in your stack.</h3>
              <p>
                Caffeine, nicotine, modafinil — they're often hitting the same
                receptor three different ways. The lab decomposes every input
                down to its binding profile and shows you what's redundant.
              </p>
            </div>
          </div>
          <div class="stack-item">
            <span class="num">03</span>
            <div>
              <h3>Iterate in afternoons, not months.</h3>
              <p>
                You won't find out you were wrong twelve weeks from now. You'll
                know within ten minutes — and you can fork the day, test the
                change, and pick the version of you you want.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CATEGORIES — peptides first -->
  <section class="cats" id="what">
    <div class="wrap-wide">
      <div class="cats-head">
        <span class="mono-accent">02 / What we model</span>
        <h2>
          Every compound, every food, every workout — modeled
          <i>together</i>.
        </h2>
        <p>
          Built around the things our users actually take. Peptides first,
          because no one else is doing it honestly.
        </p>
      </div>

      <div class="cat-grid">
        <div class="cat">
          <h3>Peptides</h3>
          <div class="cat-count">40+ compounds</div>
          <ul class="cat-items">
            <li>Retatrutide</li>
            <li>Tirzepatide</li>
            <li>Semaglutide</li>
            <li>BPC-157</li>
            <li>TB-500</li>
            <li>GHK-Cu</li>
            <li>MOTS-c</li>
          </ul>
        </div>
        <div class="cat">
          <h3>Stimulants &amp; nootropics</h3>
          <div class="cat-count">60+ compounds</div>
          <ul class="cat-items">
            <li>Caffeine</li>
            <li>Modafinil</li>
            <li>Methylene blue</li>
            <li>L-Theanine</li>
            <li>Alpha-GPC</li>
            <li>Lion's Mane</li>
            <li>Nicotine</li>
          </ul>
        </div>
        <div class="cat">
          <h3>Longevity stack</h3>
          <div class="cat-count">30+ compounds</div>
          <ul class="cat-items">
            <li>Rapamycin</li>
            <li>Metformin</li>
            <li>NAD+</li>
            <li>Berberine</li>
            <li>Resveratrol</li>
            <li>Spermidine</li>
            <li>Bempedoic acid</li>
          </ul>
        </div>
        <div class="cat">
          <h3>Hormones &amp; TRT</h3>
          <div class="cat-count">25+ compounds</div>
          <ul class="cat-items">
            <li>Testosterone</li>
            <li>Enclomiphene</li>
            <li>Anastrozole</li>
            <li>HCG</li>
            <li>Progesterone</li>
            <li>DHEA</li>
          </ul>
        </div>
        <div class="cat">
          <h3>Foundational supplements</h3>
          <div class="cat-count">80+ compounds</div>
          <ul class="cat-items">
            <li>Creatine</li>
            <li>Magnesium L-threonate</li>
            <li>Omega-3</li>
            <li>Vitamin D3</li>
            <li>Ashwagandha</li>
            <li>Glycine</li>
            <li>Tyrosine</li>
          </ul>
        </div>
        <div class="cat">
          <h3>Lifestyle interventions</h3>
          <div class="cat-count">40+ inputs</div>
          <ul class="cat-items">
            <li>Zone 2 cardio</li>
            <li>Resistance training</li>
            <li>Sauna</li>
            <li>Cold exposure</li>
            <li>Morning light</li>
            <li>HRV breathing</li>
            <li>Sleep timing</li>
          </ul>
        </div>
        <div class="cat conditions">
          <span class="mono-accent" style="color: var(--accent-deep)"
            >Modeled for</span
          >
          <h3>20+ chronic conditions, stackable.</h3>
          <div class="cat-count">20+ conditions</div>
          <ul class="cat-items">
            <li>ADHD</li>
            <li>Hashimoto's</li>
            <li>PCOS</li>
            <li>POTS</li>
            <li>T2D</li>
            <li>Perimenopause</li>
            <li>Long-COVID</li>
            <li>Sleep apnea</li>
            <li>Hypertension</li>
            <li>IBS</li>
            <li>Anxiety</li>
            <li>Depression</li>
          </ul>
        </div>
      </div>

      <div class="cats-cta">
        <a href="#full-library" class="btn btn-outline">See the full library →</a>
      </div>
    </div>
  </section>

  <!-- METHODOLOGY BAND -->
  <section class="methodology">
    <div class="wrap method-grid">
      <div>
        <span class="mono-accent">03 / The standard</span>
        <h2>
          Built <i>in the open</i>.
          <small
            >Every effect curve in the lab is traced to a published study. Every
            drug interaction is rule-coded by a pharmacist, not hallucinated by
            an LLM.</small
          >
        </h2>
      </div>
      <div class="method-list">
        <div class="method-item">
          <div class="check">✓</div>
          <div>
            <h4>Every effect has a citation.</h4>
            <p>
              Hover any biological effect in the model and you'll see the paper
              it came from. If we can't cite it, we don't model it.
            </p>
          </div>
        </div>
        <div class="method-item">
          <div class="check">✓</div>
          <div>
            <h4>Confidence bands, not false certainty.</h4>
            <p>
              Every prediction is tagged with how strong the underlying evidence
              is. Rapamycin Q14d has weak human data; we say so.
            </p>
          </div>
        </div>
        <div class="method-item">
          <div class="check">✓</div>
          <div>
            <h4>Drug interactions are rule-coded.</h4>
            <p>
              MAOIs + SSRIs. Methylene blue + serotonergics. Hard rules from
              pharmacist-reviewed sources, not statistical guesses.
            </p>
          </div>
        </div>
        <div class="method-item">
          <div class="check">✓</div>
          <div>
            <h4>The model knows what it doesn't know.</h4>
            <p>
              Pregnant, breastfeeding, under 18, or stacking compounds with low
              literature — the lab flags it and refuses to overstate confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SOCIAL PROOF — protocols people are building -->
  <section class="social">
    <div class="wrap">
      <div class="social-head">
        <span class="mono-accent">04 / In the lab right now</span>
        <h2>The protocols people are <i>building</i>.</h2>
        <p>
          Real scenarios from the closed beta. Names removed. Doses preserved.
          Nothing here is a recommendation — they're worked examples to show you
          the shape of what you'd design for yourself.
        </p>
      </div>

      <div class="proto-grid">
        <article class="proto">
          <div class="proto-img">
            <span class="proto-img-label">GLP-1 · 41M</span>
          </div>
          <div class="proto-body">
            <div class="meta">12-week scenario</div>
            <h4>Muscle-first tirzepatide.</h4>
            <p>
              10 mg/wk titration with three protein bumps, two resistance
              sessions, and electrolyte support. Lab flags catabolism risk on
              day-3 of every dose week.
            </p>
            <div class="proto-tags">
              <span class="proto-tag">Tirzepatide</span>
              <span class="proto-tag">Muscle</span>
              <span class="proto-tag">Electrolytes</span>
            </div>
          </div>
        </article>

        <article class="proto">
          <div
            class="proto-img"
            style="background-image: linear-gradient(135deg, rgba(94,110,74,0.18), rgba(196,99,60,0.10)), radial-gradient(ellipse at top right, rgba(94,110,74,0.22), transparent 60%);"
          >
            <span class="proto-img-label">Performance · 38M</span>
          </div>
          <div class="proto-body">
            <div class="meta">14-day scenario</div>
            <h4>Two-pulse caffeine, no afternoon stims.</h4>
            <p>
              Replaced a 600 mg/day caffeine + nicotine loop. 100 mg AM, 100 mg
              before lunch, hard cutoff. HRV +9 ms in two weeks.
            </p>
            <div class="proto-tags">
              <span class="proto-tag">Caffeine</span>
              <span class="proto-tag">HRV</span>
              <span class="proto-tag">Sleep</span>
            </div>
          </div>
        </article>

        <article class="proto">
          <div
            class="proto-img"
            style="background-image: linear-gradient(135deg, rgba(196,99,60,0.20), rgba(94,110,74,0.08)), radial-gradient(ellipse at bottom left, rgba(196,99,60,0.18), transparent 65%);"
          >
            <span class="proto-img-label">Conditions · 41F</span>
          </div>
          <div class="proto-body">
            <div class="meta">16-week scenario</div>
            <h4>Hashimoto's + perimenopause + iron low.</h4>
            <p>
              Levothyroxine timing, alternate-day iron repletion, magnesium PM,
              structured light exposure. Ferritin +28 ng/mL modeled.
            </p>
            <div class="proto-tags">
              <span class="proto-tag">Hashimoto's</span>
              <span class="proto-tag">Iron</span>
              <span class="proto-tag">Perimenopause</span>
            </div>
          </div>
        </article>

        <article class="proto">
          <div
            class="proto-img"
            style="background-image: linear-gradient(135deg, rgba(94,110,74,0.16), rgba(196,99,60,0.16)), radial-gradient(ellipse at top left, rgba(196,99,60,0.22), transparent 60%);"
          >
            <span class="proto-img-label">ADHD · 33F</span>
          </div>
          <div class="proto-body">
            <div class="meta">12-week scenario</div>
            <h4>Natural-baseline dopamine, alongside Vyvanse.</h4>
            <p>
              Bright light, protein-led morning, training, magnesium
              L-threonate, tyrosine timing. No dose change. 3 PM crash flattened.
            </p>
            <div class="proto-tags">
              <span class="proto-tag">ADHD</span>
              <span class="proto-tag">Dopamine</span>
              <span class="proto-tag">Provider-led</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- IDENTITY BAND -->
  <section class="identity">
    <div class="wrap identity-inner">
      <span class="mono-accent">05 / Who it's for</span>
      <h2>The lab for the <i>self-clinician</i>.</h2>
      <p>
        For people who refuse to outsource their body. You've read the studies.
        You've screenshot the bloodwork. You've felt the difference between
        "in range" and well. The lab is built for what you do next.
      </p>
    </div>
  </section>

  <!-- HOW THE MODEL WORKS — pipeline + limits -->
  <section class="pipeline" id="how">
    <div class="wrap">
      <div class="pipeline-head">
        <span class="mono-accent">06 / How the model works</span>
        <h2>The pipeline behind <i>every prediction</i>.</h2>
        <p>
          You don't need to understand any of this to use the lab. But if you
          want to know how a model earns the right to make a claim about your
          body — here's how ours does.
        </p>
      </div>

      <div class="pipe-steps">
        <div class="pipe-step">
          <div class="num">STEP 01</div>
          <h3>Cited inputs.</h3>
          <div class="pipe-vis">
            <div class="vis-cite">
              <div class="vis-cite-row">
                <span class="what">Caffeine → A2A</span
                ><span class="src">Fredholm 1999</span>
              </div>
              <div class="vis-cite-row">
                <span class="what">Caffeine → cortisol</span
                ><span class="src">Lovallo 2005</span>
              </div>
              <div class="vis-cite-row">
                <span class="what">Tirzepatide → MPS</span
                ><span class="src">Wilkinson 2024</span>
              </div>
            </div>
          </div>
          <p>
            Every compound is decomposed into its receptor binding profile and
            downstream effects, each one traced to a peer-reviewed source.
          </p>
        </div>

        <div class="pipe-step">
          <div class="num">STEP 02</div>
          <h3>Receptor-level modeling.</h3>
          <div class="pipe-vis">
            <div class="vis-receptor">
              <div class="center">Caffeine 200 mg</div>
              <div class="branches">
                <div class="branch">
                  A1<br /><b style="color: var(--accent)">−80</b>
                </div>
                <div class="branch">
                  A2A<br /><b style="color: var(--accent)">−160</b>
                </div>
                <div class="branch">
                  Cortisol<br /><b style="color: var(--accent)">+16</b>
                </div>
              </div>
            </div>
          </div>
          <p>
            Dose, timing, and your own baseline propagate through the receptor
            graph — and every downstream signal moves with realistic magnitude
            and timing.
          </p>
        </div>

        <div class="pipe-step">
          <div class="num">STEP 03</div>
          <h3>Honest limits.</h3>
          <div class="pipe-vis">
            <div class="vis-refusal">
              <div class="refusal-stack">SSRI + Methylene Blue</div>
              <div class="msg">Refused · MAOI window</div>
            </div>
          </div>
          <p>
            When the model isn't confident — or the stack is unsafe — it tells
            you. We'd rather be useful in fewer places than wrong in more.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section class="pricing-band" id="pricing">
    <div class="wrap">
      <span class="mono-accent">07 / Pricing</span>
      <h2 class="price-h2" style="margin-top: 18px">
        What could cost you <span class="strike">three months</span><br />
        is <i>twenty-four dollars</i>.
      </h2>
      <p class="price-sub">
        Founding-member pricing. Locks for life. Cancel anytime. Every protocol
        exports as JSON the day you decide to leave.
      </p>

      <div class="price-card">
        <div class="left">
          <span class="badge">HSA / FSA eligible</span>
          <h3>Lab access</h3>
          <div class="amount">
            <span class="big">$0.80</span>
            <span class="unit">/ day</span>
          </div>
          <div class="billed">Billed annually at $288 · $24/month</div>
          <a
            href="#join"
            class="btn btn-primary btn-lg"
            style="height: 52px; padding: 0 28px"
            >Join the lab <span class="arr">→</span></a
          >
        </div>
        <div class="divider"></div>
        <div class="right">
          <ul>
            <li>1,200+ compounds, every effect cited.</li>
            <li>62 biological signals, modeled together.</li>
            <li>Bloodwork PDF parsing — Quest, LabCorp, Function.</li>
            <li>Twenty+ chronic conditions, stackable.</li>
            <li>Drug-interaction harm engine, rule-coded.</li>
            <li>A/B any two scenarios. Iterate in afternoons.</li>
            <li>Export every protocol as PDF or JSON.</li>
            <li>No ads. No selling your bloodwork. Ever.</li>
          </ul>
        </div>
      </div>

      <div class="quotes">
        <div class="quote-card">
          <div class="quote-stars">★★★★★</div>
          <p>
            "This is what I wish I'd had on day one of my GLP-1. Twelve months
            of mistakes I now would have avoided."
          </p>
        </div>
        <div class="quote-card">
          <div class="quote-stars">★★★★★</div>
          <p>
            "I caught a duplicate in my stack the first afternoon. Saved me from
            a tolerance break I was about to start."
          </p>
        </div>
        <div class="quote-card">
          <div class="quote-stars">★★★★★</div>
          <p>
            "Finally a tool that doesn't pretend to be my doctor. The receipts
            on every effect are the whole point."
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CLOSING — black box -->
  <section class="closer">
    <div class="wrap-narrow closer-inner">
      <h2>
        Your body isn't a <i>black box</i>.<br />
        <span class="line2">Stop treating it like one.</span>
      </h2>
      <p>Closed beta. Tell us what you're building and we'll get you in.</p>
      <div class="closer-ctas">
        <a
          href="#join"
          class="btn btn-primary btn-lg"
          style="height: 52px; padding: 0 32px"
          >Request access <span class="arr">→</span></a
        >
        <a href="#how" class="btn btn-lg">Read the methodology</a>
      </div>
    </div>
  </section>
</template>
