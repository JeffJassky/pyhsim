/* eslint-disable */
// theme-canvas.jsx — renders the DesignCanvas with one artboard per theme.

const SERIF = '"Fraunces", "Tiempos", Georgia, serif';
const SERIF_DISP = '"Instrument Serif", "Tiempos", Georgia, serif';
const SANS_CLINIC = '"Inter", system-ui, -apple-system, "Helvetica Neue", sans-serif';
const SANS_DEFAULT = '"Inter", system-ui, -apple-system, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

// Subtle grid decoration for techy themes
function gridDecoration(t){
  return <div style={{
    position: 'absolute', inset: 0,
    background: `linear-gradient(to right, ${t.line} 1px, transparent 1px) 0 0 / 88px 100%, linear-gradient(to bottom, ${t.line} 1px, transparent 1px) 0 0 / 100% 88px`,
    opacity: 0.5,
    maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 50%, transparent 100%)',
    pointerEvents: 'none',
  }} />;
}

// Soft watercolor blob — for humanized themes
function blobDecoration(color){
  return (t) => <div style={{
    position: 'absolute', right: '-8%', top: '8%',
    width: 540, height: 540,
    background: `radial-gradient(ellipse at center, ${color}, transparent 65%)`,
    filter: 'blur(40px)',
    pointerEvents: 'none',
    borderRadius: '50%',
  }} />;
}

const THEMES = [
  // ---------- CURRENT (reference) ----------
  {
    id: 'current',
    name: 'Current · Lab',
    description: 'Your current site for reference.',
    bg: '#0b0d0e',
    bgAlt: '#0e1112',
    panel: '#101314',
    line: '#1f2426',
    lineStrong: '#2a3033',
    ink: '#e9e6df',
    inkDim: '#a9a59c',
    inkMute: '#6f6c66',
    accent: 'oklch(0.78 0.12 195)',
    accentDeep: 'oklch(0.78 0.12 195)',
    accentInk: '#06181b',
    chipBg: '#1b2122',
    serif: SERIF_DISP,
    serifWeight: 400,
    serifTracking: '-0.01em',
    sans: SANS_DEFAULT,
    mono: MONO,
    h1Size: 76,
    h1LineHeight: 1.1,
    h2Size: 44,
    btnRadius: '2px',
    cardRadius: '2px',
    heroDecoration: gridDecoration,
  },

  // ---------- 1. PARCHMENT (Function-adjacent) ----------
  {
    id: 'parchment',
    name: 'Parchment · Editorial',
    description: 'Function-adjacent. Cream, sage, warm brown ink, Fraunces. Editorial and unhurried.',
    bg: '#f0eadc',
    bgAlt: '#ebe4d2',
    panel: '#f6f1e4',
    line: 'rgba(75,55,30,0.13)',
    lineStrong: 'rgba(75,55,30,0.25)',
    ink: '#2b2218',
    inkDim: '#67594a',
    inkMute: '#9c8c79',
    accent: '#5e6e4a',           // muted olive sage
    accentDeep: '#3f4a32',
    accentInk: '#f6f1e4',
    chipBg: '#ebe4d2',
    serif: SERIF,
    serifWeight: 350,
    serifTracking: '-0.018em',
    serifFontFeatures: '"ss01", "ss02"',
    sans: SANS_DEFAULT,
    mono: MONO,
    h1Size: 88,
    h1LineHeight: 1.08,
    h2Size: 50,
    btnRadius: '999px',           // pill buttons — wellness signature
    cardRadius: '14px',           // generous radius
    heroDecoration: blobDecoration('rgba(94,110,74,0.16)'),
  },

  // ---------- 2. CLINIC (Warm white + terracotta) ----------
  {
    id: 'clinic',
    name: 'Clinic · Warm',
    description: 'Warm white with terracotta. A modern clinic that\'s on your side. Inter sans, soft Fraunces display.',
    bg: '#fbf8f3',
    bgAlt: '#f5efe4',
    panel: '#ffffff',
    line: 'rgba(40,30,20,0.10)',
    lineStrong: 'rgba(40,30,20,0.22)',
    ink: '#1c1a17',
    inkDim: '#5a5249',
    inkMute: '#928876',
    accent: '#c4633c',            // terracotta
    accentDeep: '#a14e2c',
    accentInk: '#ffffff',
    chipBg: '#ffffff',
    serif: SERIF,
    serifWeight: 380,
    serifTracking: '-0.02em',
    serifFontFeatures: '"ss01"',
    sans: SANS_CLINIC,
    mono: MONO,
    h1Size: 84,
    h1LineHeight: 1.08,
    h2Size: 48,
    btnRadius: '8px',
    cardRadius: '10px',
    heroDecoration: blobDecoration('rgba(196,99,60,0.10)'),
  },

  // ---------- 3. PRAIRIE (Mineral / sage soft) ----------
  {
    id: 'prairie',
    name: 'Prairie · Sage',
    description: 'Ivory + sage + soft peach. Most spa-leaning of the light options. For the calmest reader.',
    bg: '#ecede3',
    bgAlt: '#e4e6d8',
    panel: '#f3f4e9',
    line: 'rgba(35,50,28,0.13)',
    lineStrong: 'rgba(35,50,28,0.25)',
    ink: '#23311c',
    inkDim: '#576249',
    inkMute: '#8b9075',
    accent: '#d99879',            // soft peach-clay
    accentDeep: '#b8714f',
    accentInk: '#23311c',
    chipBg: '#f3f4e9',
    serif: SERIF,
    serifWeight: 350,
    serifTracking: '-0.018em',
    serifFontFeatures: '"ss01"',
    sans: SANS_DEFAULT,
    mono: MONO,
    h1Size: 86,
    h1LineHeight: 1.08,
    h2Size: 48,
    btnRadius: '999px',
    cardRadius: '16px',
    heroDecoration: blobDecoration('rgba(217,152,121,0.18)'),
  },

  // ---------- 4. TWILIGHT (Warm dark) ----------
  {
    id: 'twilight',
    name: 'Twilight · Warm dark',
    description: 'For users who still want dark — but human. Deep brown-black, cream type, muted apricot.',
    bg: '#191411',
    bgAlt: '#1d1815',
    panel: '#231d18',
    line: 'rgba(220,200,170,0.10)',
    lineStrong: 'rgba(220,200,170,0.22)',
    ink: '#ece1cf',
    inkDim: '#a89786',
    inkMute: '#6e6256',
    accent: '#d9a578',            // apricot/honey
    accentDeep: '#e8b990',
    accentInk: '#1a1410',
    chipBg: '#2a221c',
    serif: SERIF,
    serifWeight: 380,
    serifTracking: '-0.018em',
    sans: SANS_DEFAULT,
    mono: MONO,
    h1Size: 86,
    h1LineHeight: 1.08,
    h2Size: 48,
    btnRadius: '8px',
    cardRadius: '10px',
    heroDecoration: blobDecoration('rgba(217,165,120,0.12)'),
  },
];

const AB_W = 1280;
const AB_H = 1480;

function App(){
  return <DesignCanvas>
    <DCSection id="themes" title="Theme exploration" subtitle="Same content, different temperatures. Pick a direction — I'll apply it everywhere.">
      {THEMES.map(t => <DCArtboard key={t.id} id={t.id} label={t.name} width={AB_W} height={AB_H}>
        <ThemedSample theme={t} />
      </DCArtboard>)}
    </DCSection>
  </DesignCanvas>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
