// Shared partials: nav (with Use cases dropdown), footer, marquee.
window.PL = window.PL || {};

PL.AUDIENCES = [
  { slug: 'glp1',         code: 'A', label: 'GLP-1',          title: 'GLP-1 users',         blurb: 'Keep the loss. Keep the muscle. Keep the mood.' },
  { slug: 'performance',  code: 'B', label: 'Performance',    title: 'Cognitive & physical performance', blurb: 'Output without overshoot. All day, every day.' },
  { slug: 'longevity',    code: 'C', label: 'Longevity',      title: 'Longevity & healthspan', blurb: 'Decades of compounding. Modeled, not guessed.' },
  { slug: 'health',       code: 'D', label: 'Chronic conditions', title: 'Hashimoto\'s · PCOS · POTS', blurb: 'For the patient who became their own clinician.' },
  { slug: 'adhd',         code: 'E', label: 'ADHD & focus',   title: 'ADHD & natural focus', blurb: 'Build a baseline before — or beside — the prescription.' },
];

PL.renderNav = function(activeSlug){
  const items = PL.AUDIENCES.map(a => `
    <a class="menu-item" href="#/${a.slug}">
      <span class="ic">${a.code}</span>
      <span>
        <span class="tt">${a.title}</span>
        <span class="ds">${a.blurb}</span>
      </span>
      <span class="ar">→</span>
    </a>
  `).join('');
  return `
  <header class="nav">
    <div class="wrap nav-inner">
      <a class="brand" href="#/">
        <span class="brand-mark"></span>
        <span class="brand-name"><b>Protokol</b> Lab</span>
        <span class="brand-tag">v0.4 · INVITE BETA</span>
      </a>
      <nav class="nav-links">
        <div class="menu" id="useCasesMenu">
          <button class="menu-trigger" type="button" aria-expanded="false">Use cases</button>
          <div class="menu-panel" role="menu">${items}</div>
        </div>
        <a href="#/#how">How it works</a>
        <a href="#/#features">The lab</a>
        <a href="#/#science">Science</a>
        <a href="#/#pricing">Pricing</a>
        <a href="#/#faq">FAQ</a>
      </nav>
      <div class="nav-cta">
        <a class="btn btn-ghost" href="#login">Sign in</a>
        <a class="btn btn-primary" href="#waitlist">Request access <span class="arr">→</span></a>
      </div>
    </div>
  </header>`;
};

PL.renderFooter = function(){
  return `
  <footer>
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-col">
          <a class="brand" href="#/" style="margin-bottom:18px;">
            <span class="brand-mark"></span>
            <span class="brand-name"><b>Protokol</b> Lab</span>
          </a>
          <p style="color:var(--ink-dim); font-size:13px; max-width: 36ch; line-height:1.55; margin:0;">
            A test flight for your routine. Built for the people who decided their body is too important to outsource.
          </p>
        </div>
        <div class="foot-col">
          <h6>Use cases</h6>
          ${PL.AUDIENCES.map(a => `<a href="#/${a.slug}">${a.title}</a>`).join('')}
        </div>
        <div class="foot-col">
          <h6>Product</h6>
          <a href="#/#features">The lab</a>
          <a href="#/#how">How it works</a>
          <a href="#/#pricing">Pricing</a>
          <a href="#/#science">Science</a>
        </div>
        <div class="foot-col">
          <h6>Trust</h6>
          <a href="#privacy">Privacy</a>
          <a href="#security">Security</a>
          <a href="#data">Your data, your hardware</a>
          <a href="#terms">Terms</a>
          <a href="#contact">founder@protokol.lab</a>
        </div>
      </div>
      <div class="disclaimer">
        <b style="color:var(--ink)">Important.</b> Protokol Lab is an educational tool for adults running their own experiments. It is not a medical device, does not diagnose, and does not treat any condition. Predictions are model-based and may be wrong. Talk to a licensed clinician before changing medications, peptides, or supplements — especially during pregnancy, while breastfeeding, or if you have a diagnosed condition. Nothing in this product is medical advice. By design.
      </div>
      <div class="foot-bottom">
        <span>© 2026 Protokol Lab, Inc. — All experiments your own.</span>
        <span>Built because we felt like shit and wanted to feel better.</span>
      </div>
    </div>
  </footer>`;
};

PL.renderAudSwitcher = function(activeSlug){
  return `
  <div class="aud-switch">
    <div class="wrap">
      <div class="aud-switch-inner">
        ${PL.AUDIENCES.map(a => `<a href="#/${a.slug}" class="${a.slug===activeSlug?'on':''}">${a.code} · ${a.label}</a>`).join('')}
      </div>
    </div>
  </div>`;
};

PL.renderCrumb = function(activeTitle){
  return `
  <div class="wrap" style="padding-top:32px;">
    <div class="crumb"><a href="#/">Protokol Lab</a><span class="sep">/</span><a href="#/#who">Use cases</a><span class="sep">/</span><span class="here">${activeTitle}</span></div>
  </div>`;
};

PL.renderFinalCTA = function(extra){
  return `
  <section class="final">
    <div class="wrap-narrow">
      <span class="mono-accent">Invite-only beta</span>
      <h2 style="margin-top:18px">${extra && extra.headline ? extra.headline : 'Run the experiment <i>before</i> you run it on yourself.'}</h2>
      <p>${extra && extra.body ? extra.body : 'Request access to the closed beta. We\'re letting in 50 new lab users a week. If you\'re building your own routine and tired of guessing, we want you in.'}</p>
      <div class="ctas">
        <a class="btn btn-primary btn-lg" href="#waitlist">Request lab access <span class="arr">→</span></a>
        <a class="btn btn-lg" href="#/#how">Read the methodology</a>
      </div>
    </div>
  </section>`;
};

// Wire up the Use cases dropdown after each render.
PL.bindNav = function(){
  const menu = document.getElementById('useCasesMenu');
  if(!menu) return;
  const trigger = menu.querySelector('.menu-trigger');
  const close = () => { menu.classList.remove('open'); trigger.setAttribute('aria-expanded','false'); };
  const open  = () => { menu.classList.add('open'); trigger.setAttribute('aria-expanded','true'); };
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.contains('open') ? close() : open();
  });
  document.addEventListener('click', (e) => {
    if(!menu.contains(e.target)) close();
  });
  menu.querySelectorAll('.menu-item').forEach(a => a.addEventListener('click', close));
};

// Bind FAQ details if present
PL.bindFAQ = function(){
  // Browsers handle <details> natively; nothing to do.
};
