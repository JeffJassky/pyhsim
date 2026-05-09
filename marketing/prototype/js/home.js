// Home page content — extracted from the original Protokol Lab.html.
window.PL = window.PL || {};

PL.renderHome = function(){
  return `
<!-- ============ HERO ============ -->
<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-glow"></div>
  <div class="wrap hero-inner">
    <span class="eyebrow"><span class="dot"></span> A test flight for your routine</span>
    <h1 class="h1">
      Stop running <span class="strike">months-long</span> experiments<br>
      on <i>yourself</i>.
    </h1>
    <p class="hero-sub">
      Protokol Lab uses your bloodwork and a library of thousands of compounds, foods, and activities to run <b>virtual experiments on your biology</b> — so you can see what your routine is actually doing to you before you live through three months of guessing. Drop in your stack, scrub the day, watch the body respond.
    </p>
    <div class="hero-ctas">
      <a class="btn btn-primary btn-lg" href="#waitlist">Request lab access <span class="arr">→</span></a>
      <a class="btn btn-lg" href="#how">See how it works</a>
    </div>
    <div class="hero-meta">
      <div><b>1,200+</b><span>routines test-flown this week</span></div>
      <div><b>62</b><span>biological signals modeled</span></div>
      <div><b>14</b><span>bloodwork panels integrated</span></div>
      <div><b>Education</b><span>not medical advice. by design.</span></div>
    </div>
  </div>
</section>

<!-- ============ MARQUEE ============ -->
<div class="marquee">
  <div class="marquee-track">
    <span>Tirzepatide</span><span>Semaglutide</span><span>Retatrutide</span><span>BPC-157</span><span>TB-500</span><span>Methylene Blue</span><span>Creatine</span><span>Magnesium L-Threonate</span><span>NAD+</span><span>Berberine</span><span>Metformin</span><span>Rapamycin</span><span>Lion's Mane</span><span>L-Theanine</span><span>Caffeine</span><span>Ashwagandha</span><span>Cold Exposure</span><span>Zone 2</span><span>HRV-paced breathing</span><span>Continuous glucose</span>
    <span>Tirzepatide</span><span>Semaglutide</span><span>Retatrutide</span><span>BPC-157</span><span>TB-500</span><span>Methylene Blue</span><span>Creatine</span><span>Magnesium L-Threonate</span><span>NAD+</span><span>Berberine</span><span>Metformin</span><span>Rapamycin</span><span>Lion's Mane</span><span>L-Theanine</span><span>Caffeine</span><span>Ashwagandha</span><span>Cold Exposure</span><span>Zone 2</span><span>HRV-paced breathing</span><span>Continuous glucose</span>
  </div>
</div>

<!-- ============ AUDIENCE (5 cards now) ============ -->
<section class="section" id="who">
  <div class="wrap">
    <div class="section-head">
      <div class="label"><span class="mono-accent">01 / Built for</span></div>
      <div>
        <h2>For the people who decided their body is <i>their</i> responsibility.</h2>
        <p>You read the studies. You screenshot the bloodwork. You're skeptical of influencers, picky about your prescriber, and very tired of advice from people whose biology has nothing to do with yours. <b>Pick the version of yourself the lab was built for.</b></p>
      </div>
    </div>

    <div class="audience">
      <a class="aud" href="#/glp1">
        <span class="num">A · GLP-1</span>
        <h3>You're on a GLP-1 and you want it to work without wrecking the rest of you.</h3>
        <p>Test-fly your tirzepatide titration against food timing, training, electrolytes, sleep, and muscle protein synthesis — months of n=1 in an afternoon.</p>
        <div class="quote">"I dropped 38 lb. I also lost grip strength I haven't gotten back."<cite>— the post you don't want to write</cite></div>
        <span class="deeper">For GLP-1 users →</span>
      </a>
      <a class="aud" href="#/performance">
        <span class="num">B · Performance</span>
        <h3>You want output all day, every day. Without the 3 PM crash and the 11 PM heart rate.</h3>
        <p>Stack your caffeine, nicotine, modafinil, peptides, and training. See where you're hitting the same receptor three times — and where the actual smoothing comes from.</p>
        <div class="quote">"Most days I'm guessing whether I overshot."<cite>— a 4× founder we spoke with</cite></div>
        <span class="deeper">For performance users →</span>
      </a>
      <a class="aud" href="#/longevity">
        <span class="num">C · Longevity</span>
        <h3>You're optimizing for now <i>and</i> being here in 40 years.</h3>
        <p>Rapamycin, metformin, NAD+, Zone 2, sauna. See ApoB, hsCRP, VO₂max, and biological age move together — and find the two interventions that are quietly duplicating each other.</p>
        <div class="quote">"I want a chemistry lab, not another habit tracker."<cite>— every user we've talked to</cite></div>
        <span class="deeper">For healthspan users →</span>
      </a>
      <a class="aud" href="#/health">
        <span class="num">D · Conditions</span>
        <h3>You have a chronic condition and the standard plan isn't enough.</h3>
        <p>Hashimoto's, PCOS, POTS, long-COVID, IBS, perimenopause. Layer your conditions, your bloodwork, and your actual day — and get a model that responds the way you do.</p>
        <div class="quote">"My doctor gave me 12 minutes. My condition has 8,760 hours."<cite>— Hashimoto's, age 34</cite></div>
        <span class="deeper">For self-managers →</span>
      </a>
      <a class="aud" href="#/adhd">
        <span class="num">E · ADHD</span>
        <h3>You want a baseline that holds, with or without the prescription.</h3>
        <p>Stack a protein-led morning, light, training, magnesium, omega-3, and tyrosine timing — and see how much of your function is actually <i>yours</i>. Built alongside your prescriber.</p>
        <div class="quote">"I want to know what's <i>me</i> and what's the medication."<cite>— ADHD, late-diagnosed</cite></div>
        <span class="deeper">For ADHD &amp; focus →</span>
      </a>
    </div>
  </div>
</section>
${PL.renderHomeMain()}
${PL.renderFinalCTA()}
`;
};
