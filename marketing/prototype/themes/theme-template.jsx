/* eslint-disable */
// ThemedSample.jsx — one shared sample of the Protokol Lab marketing page,
// driven by a theme token object. Renders nav + hero + audience cards + a
// feature block, with a small style island scoped to this theme.

const COPY = {
  brand: 'Protokol Lab',
  brandTag: 'v0.4 · invite beta',
  navLinks: ['Use cases', 'How it works', 'Pricing', 'FAQ'],
  cta: 'Request access',
  eyebrow: 'A test flight for your routine',
  h1: ['Stop running ', { strike: 'months-long' }, ' experiments on ', { i: 'yourself' }, '.'],
  sub: 'Protokol Lab uses your bloodwork and a library of thousands of compounds, foods, and activities to run virtual experiments on your biology — so you can see what your routine is actually doing to you before you live through three months of guessing.',
  cta1: 'Request lab access',
  cta2: 'See how it works',
  metricCols: [
    ['1,200+', 'routines test-flown this week'],
    ['62', 'biological signals modeled'],
    ['14', 'bloodwork panels integrated'],
    ['Education', 'not medical advice. by design.'],
  ],
  audienceTitle: 'For the people who decided their body is their responsibility.',
  audienceSub: 'You read the studies. You screenshot the bloodwork. Pick the version of yourself the lab was built for.',
  audiences: [
    { code: 'A', label: 'GLP-1', h: 'You\'re on a GLP-1 and you want it to work without wrecking the rest of you.' },
    { code: 'B', label: 'Performance', h: 'You want output all day, every day. Without the 3 PM crash.' },
    { code: 'C', label: 'Longevity', h: 'You\'re optimizing for now and being here in 40 years.' },
    { code: 'D', label: 'Conditions', h: 'A chronic condition. The standard plan isn\'t enough.' },
    { code: 'E', label: 'ADHD', h: 'A baseline that holds, with or without the prescription.' },
  ],
  featureEyebrow: 'A worked example',
  featureH: 'Compose a day. See the whole body respond.',
  featureP: 'Drop in your dose, your training, your meals, your sleep. Watch every signal in your body move together — modeled against your bloodwork or, if you haven\'t had any yet, the relevant population baseline.',
  featureItems: [
    ['Receptor-level model', 'Caffeine doesn\'t just \"raise alertness\" — it binds adenosine A1 and A2A. The model knows.'],
    ['Two scenarios at once', 'Fork your day. \"Caffeine at 7 vs 9.\" Watch melatonin and cortisol redraw side-by-side.'],
    ['Your bloodwork, your baseline', 'TSH 4.8 isn\'t \"normal\" for you. The lab adjusts every prediction around you.'],
  ],
};

function renderInlineCopy(parts, theme) {
  return parts.map((p, i) => {
    if (typeof p === 'string') return p;
    if (p.strike) return <span key={i} style={{ position: 'relative' }}>
      {p.strike}
      <span style={{ position: 'absolute', left: '-2%', right: '-2%', top: '56%', height: 1, background: theme.inkDim, transform: 'rotate(-2deg)' }} />
    </span>;
    if (p.i) return <i key={i} style={{ color: theme.accentDeep || theme.accent, fontStyle: 'italic' }}>{p.i}</i>;
    return null;
  });
}

// Big card-style sample at a fixed inner width. Caller sizes the artboard
// container around it.
function ThemedSample({ theme }) {
  const t = theme;
  const styleId = `themed-${t.id}`;
  // Scoped style island — only applies inside .themed-${id} root.
  const css = `
    .${styleId} { background: ${t.bg}; color: ${t.ink}; font-family: ${t.sans}; font-size: 16px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
    .${styleId} .serif { font-family: ${t.serif}; font-weight: ${t.serifWeight}; letter-spacing: ${t.serifTracking}; ${t.serifFontFeatures ? `font-feature-settings: ${t.serifFontFeatures};` : ''} }
    .${styleId} .mono { font-family: ${t.mono}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${t.inkMute}; }
    .${styleId} .mono-accent { font-family: ${t.mono}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${t.accent}; }
    .${styleId} .brand-mark { width: 18px; height: 18px; position: relative; }
    .${styleId} .brand-mark::before, .${styleId} .brand-mark::after { content: ""; position: absolute; inset: 0; border: 1px solid ${t.ink}; }
    .${styleId} .brand-mark::after { transform: rotate(45deg); border-color: ${t.accent}; }
    .${styleId} .btn { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 18px; font-size: 13px; font-weight: 500; border-radius: ${t.btnRadius}; cursor: pointer; border: 1px solid ${t.lineStrong}; color: ${t.ink}; background: transparent; transition: all .15s ease; }
    .${styleId} .btn.primary { background: ${t.accent}; color: ${t.accentInk}; border-color: transparent; }
    .${styleId} .btn.ghost { border-color: transparent; color: ${t.inkDim}; }
    .${styleId} .pill { display: inline-flex; gap: 8px; align-items: center; padding: 6px 14px; border: 1px solid ${t.line}; border-radius: 999px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${t.inkDim}; font-family: ${t.mono}; background: ${t.panel}; }
    .${styleId} .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: ${t.accent}; }
    .${styleId} a:hover { color: ${t.ink}; }
  `;

  return <div className={styleId} data-screen-label={t.name}>
    <style dangerouslySetInnerHTML={{ __html: css }} />

    {/* ------- NAV ------- */}
    <header style={{ borderBottom: `1px solid ${t.line}`, height: 64, display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
        <span className="brand-mark" />
        <span style={{ fontSize: 15 }}><b style={{ fontWeight: 600 }}>Protokol</b> Lab</span>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, paddingLeft: 12, marginLeft: 12, borderLeft: `1px solid ${t.line}`, whiteSpace: 'nowrap' }}>{COPY.brandTag}</span>
      </div>
      <div style={{ display: 'flex', gap: 26, fontSize: 13, color: t.inkDim }}>
        {COPY.navLinks.map((n, i) => <a key={i} href="#">{n}</a>)}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <a className="btn ghost" href="#">Sign in</a>
        <a className="btn primary" href="#">{COPY.cta} →</a>
      </div>
    </header>

    {/* ------- HERO ------- */}
    <section style={{ padding: '88px 40px 96px', position: 'relative', overflow: 'hidden', background: t.heroBg || t.bg }}>
      {t.heroDecoration && t.heroDecoration(t)}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1180 }}>
        <span className="pill"><span className="dot" />{COPY.eyebrow}</span>
        <h1 className="serif" style={{ fontSize: t.h1Size, lineHeight: t.h1LineHeight, letterSpacing: '-0.018em', margin: '28px 0 0', paddingBottom: '0.18em', maxWidth: '17ch' }}>
          {renderInlineCopy(COPY.h1, t)}
        </h1>
        <p style={{ marginTop: 24, maxWidth: '50ch', fontSize: 19, lineHeight: 1.55, color: t.inkDim }}>
          {COPY.sub}
        </p>
        <div style={{ marginTop: 36, display: 'flex', gap: 14 }}>
          <a className="btn primary" href="#" style={{ height: 48, padding: '0 26px', fontSize: 14 }}>{COPY.cta1} →</a>
          <a className="btn" href="#" style={{ height: 48, padding: '0 26px', fontSize: 14 }}>{COPY.cta2}</a>
        </div>
        <div style={{ marginTop: 64, paddingTop: 22, borderTop: `1px solid ${t.line}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {COPY.metricCols.map((m, i) => <div key={i}>
            <div style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 500, color: t.ink }}>{m[0]}</div>
            <div style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute, marginTop: 4, letterSpacing: '0.04em' }}>{m[1]}</div>
          </div>)}
        </div>
      </div>
    </section>

    {/* ------- AUDIENCE STRIP ------- */}
    <section style={{ padding: '88px 40px', borderTop: `1px solid ${t.line}`, background: t.bg }}>
      <div style={{ maxWidth: 1180 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 56, marginBottom: 48 }}>
          <span className="mono-accent">01 / Built for</span>
          <div>
            <h2 className="serif" style={{ fontSize: t.h2Size, lineHeight: 1.1, letterSpacing: '-0.012em', maxWidth: '22ch' }}>
              {(() => {
                const parts = COPY.audienceTitle.split('responsibility.');
                return <>{parts[0]}<i style={{ color: t.accentDeep || t.accent, fontStyle: 'italic' }}>responsibility</i>.</>;
              })()}
            </h2>
            <p style={{ marginTop: 24, color: t.inkDim, fontSize: 16, lineHeight: 1.55, maxWidth: '54ch' }}>{COPY.audienceSub}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: `1px solid ${t.line}`, borderRadius: t.cardRadius }}>
          {COPY.audiences.map((a, i) => <div key={i} style={{
            padding: '26px 22px',
            borderRight: i < 4 ? `1px solid ${t.line}` : 'none',
            background: t.panel,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: 260,
          }}>
            <div style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute, letterSpacing: '0.08em' }}>{a.code} · {a.label}</div>
            <h3 className="serif" style={{ fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.005em' }}>{a.h}</h3>
            <div style={{ marginTop: 'auto', fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>For {a.label.toLowerCase()} →</div>
          </div>)}
        </div>
      </div>
    </section>

    {/* ------- FEATURE ------- */}
    <section style={{ padding: '88px 40px', borderTop: `1px solid ${t.line}`, background: t.bgAlt || t.bg }}>
      <div style={{ maxWidth: 1180, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <span className="mono-accent">02 / The lab</span>
          <h3 className="serif" style={{ fontSize: 40, lineHeight: 1.12, letterSpacing: '-0.012em', margin: '18px 0 24px', maxWidth: '14ch' }}>
            Compose a day. See the <i style={{ color: t.accentDeep || t.accent, fontStyle: 'italic' }}>whole</i> body respond.
          </h3>
          <p style={{ color: t.inkDim, fontSize: 16, lineHeight: 1.6, maxWidth: '46ch' }}>{COPY.featureP}</p>
          <ul style={{ marginTop: 26 }}>
            {COPY.featureItems.map((it, i) => <li key={i} style={{
              display: 'grid',
              gridTemplateColumns: '18px 1fr',
              gap: 14,
              padding: '14px 0',
              borderTop: `1px solid ${t.line}`,
              fontSize: 14,
              alignItems: 'start',
            }}>
              <span style={{ color: t.accent, fontFamily: t.mono, transform: 'translateY(2px)' }}>+</span>
              <span>
                <b style={{ fontWeight: 500 }}>{it[0]}</b>
                <span style={{ display: 'block', color: t.inkDim, fontSize: 13, marginTop: 4 }}>{it[1]}</span>
              </span>
            </li>)}
          </ul>
        </div>
        {/* Sample visualization — kept abstract */}
        <div style={{
          background: t.panel,
          border: `1px solid ${t.line}`,
          borderRadius: t.cardRadius,
          padding: 24,
          position: 'relative',
          minHeight: 380,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: `1px solid ${t.line}` }}>
            <span className="mono" style={{ color: t.inkDim }}>Scenario B · 1d</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['A','B','+'].map((p, i) => <span key={i} style={{
                fontFamily: t.mono, fontSize: 10, padding: '4px 9px',
                border: `1px solid ${t.line}`, borderRadius: 2,
                color: i === 1 ? t.accentInk : t.inkDim,
                background: i === 1 ? t.accent : 'transparent',
                borderColor: i === 1 ? 'transparent' : t.line,
              }}>{p}</span>)}
            </div>
          </div>
          {/* Timeline lanes */}
          <div style={{ marginTop: 18 }}>
            {['Medications','Supplements','Exercise','Food','Sleep'].map((lane, i) => <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '92px 1fr',
              alignItems: 'center',
              height: 40,
              borderBottom: `1px solid ${t.line}`,
            }}>
              <span className="mono" style={{ fontSize: 10 }}>{lane}</span>
              <div style={{ position: 'relative', height: '100%' }}>
                {[
                  // (left%, label, accent?)
                  [[5, 'Caffeine 200 mg', true], [62, 'Retatrutide', false]],
                  [[14, 'Omega-3'], [43, 'Alpha-GPC', true], [70, 'Magnesium', true]],
                  [[9, 'Zone 2 · 40m'], [48, 'Resistance']],
                  [[12, 'Protein +40g'], [45, 'Carb refeed']],
                  [[78, 'Sleep · 8h 02m', true]],
                ][i].map((chip, j) => <div key={j} style={{
                  position: 'absolute',
                  left: `${chip[0]}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: 24,
                  padding: '0 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: t.chipBg,
                  border: `1px solid ${chip[2] ? t.accent : t.line}`,
                  borderRadius: 4,
                  fontSize: 11.5,
                  color: chip[2] ? t.accentDeep || t.accent : t.ink,
                  whiteSpace: 'nowrap',
                }}>{chip[1]}</div>)}
              </div>
            </div>)}
          </div>
        </div>
      </div>
    </section>
  </div>;
}

window.ThemedSample = ThemedSample;
