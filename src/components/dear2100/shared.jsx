// @ts-check
// Dear 2100 — shared visual primitives, ported from the locked design
// (Dear_2100_V2_Copilot_Handoff.zip / app.jsx §2,4,6). Layout, spacing and
// copy are kept verbatim per the integration guide's golden rules; the only
// functional change from the original mock is that inputs are now
// controlled (value/onChange) instead of holding their own local
// placeholder state, so real answers can be captured and persisted.
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { RED, NAVY, GOLD } from '@/lib/dear2100Content';
import { Logo, MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET } from '@/components/Logo';

export { RED, NAVY, GOLD };

/* ---------------- Type + micro primitives ---------------- */

export const Eyebrow = ({ children, dark, align = 'left' }) => (
  <span
    className={`font-d2100-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] ${align === 'right' ? 'text-right' : ''}`}
    style={{ color: dark ? 'rgba(251,247,236,0.45)' : 'rgba(0,56,160,0.42)' }}
  >
    {children}
  </span>
);

export const ProgressTrack = ({ pct = 0, dark }) => (
  <div className="relative h-[3px] w-full rounded-full mt-3 overflow-visible" style={{ background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,56,160,0.10)' }}>
    <div
      className="h-full rounded-full transition-all relative"
      style={{
        width: `${pct}%`,
        background: dark ? 'linear-gradient(90deg, rgba(255,255,255,0.55), #fff)' : `linear-gradient(90deg, ${RED}99, ${RED})`,
        boxShadow: dark ? '0 0 8px rgba(255,255,255,0.5)' : `0 0 8px ${RED}66`,
      }}
    >
      <span
        className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full"
        style={{ background: dark ? '#fff' : RED, boxShadow: dark ? '0 0 0 4px rgba(255,255,255,0.22)' : `0 0 0 4px ${RED}2E` }}
      />
    </div>
  </div>
);

const BrandMark = ({ dark }) => (
  <div className="flex items-center gap-1.5" style={dark ? { filter: 'brightness(0) invert(1)', opacity: 0.85 } : undefined}>
    <Logo className="h-[22px] w-[22px]" decorative src={MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET} background="transparent" />
  </div>
);

export const Header = ({ left, pct, dark, onBack }) => (
  <div className="shrink-0 px-6 pt-9 relative z-10">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="no-tap -ml-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ color: dark ? 'rgba(251,247,236,0.6)' : 'rgba(0,56,160,0.55)' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <Eyebrow dark={dark}>{left}</Eyebrow>
      </div>
      <BrandMark dark={dark} />
    </div>
    {pct != null && <ProgressTrack pct={pct} dark={dark} />}
    {pct == null && <div className="h-px w-full mt-3.5" style={{ background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,56,160,0.10)' }} />}
  </div>
);

export const Headline = ({ children, dark, size = 'lg', className = '' }) => (
  <h1
    className={`font-d2100-display font-bold ${size === 'xl' ? 'text-[42px] leading-[1.08]' : size === 'lg' ? 'text-[35px] leading-[1.1]' : size === 'md' ? 'text-[29px] leading-[1.14]' : 'text-[24px] leading-[1.18]'} ${className}`}
    style={{ color: dark ? '#FBF7EC' : NAVY }}
  >
    {children}
  </h1>
);

export const Sub = ({ children, dark, className = '' }) => (
  <p className={`font-d2100-read text-[15px] leading-relaxed mt-3 ${className}`} style={{ color: dark ? 'rgba(251,247,236,0.62)' : 'rgba(26,26,26,0.58)' }}>
    {children}
  </p>
);

export const Footnote = ({ children, dark }) => (
  <p className="font-d2100-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-center" style={{ color: dark ? 'rgba(251,247,236,0.4)' : 'rgba(0,56,160,0.38)' }}>
    {children}
  </p>
);

/* ---------------- Buttons ---------------- */

export const Btn = ({ children, variant = 'solidRed', onClick, className = '', fullWidth = true, disabled = false }) => {
  const base = `no-tap ${fullWidth ? 'w-full' : 'w-auto'} py-4 rounded-full font-d2100-sans font-semibold text-[15.5px] tracking-wide transition-all active:scale-[0.98] shrink-0 relative overflow-hidden disabled:opacity-40`;
  const styles = {
    solidRed: { background: `linear-gradient(180deg, #E42115, ${RED} 60%, #B70C05)`, color: '#fff', boxShadow: '0 14px 28px -10px rgba(216,16,8,0.55), inset 0 1px 0 rgba(255,255,255,0.35)' },
    solidNavy: { background: `linear-gradient(180deg, #144BC4, ${NAVY} 60%, #002B80)`, color: '#fff', boxShadow: '0 14px 28px -10px rgba(0,56,160,0.5), inset 0 1px 0 rgba(255,255,255,0.3)' },
    outlineRed: { background: 'transparent', color: RED, border: `1.5px solid ${RED}` },
    outlineNavy: { background: 'transparent', color: NAVY, border: `1.5px solid rgba(0,56,160,0.55)` },
    outlineWhite: { background: 'transparent', color: '#FBF7EC', border: '1.5px solid rgba(251,247,236,0.55)' },
    ghost: { background: 'transparent', color: 'rgba(26,26,26,0.4)', textDecoration: 'underline', boxShadow: 'none' },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${className}`} style={styles[variant]}>
      {children}
    </button>
  );
};

/* ---------------- Screen scaffold ---------------- */

export const Screen = ({ dark, header, children, footNote, button, illustration, align = 'start', compactHeader = true }) => (
  // h-[100dvh] (fixed, not min-h-full): the route wrapper above only sets
  // min-height, which per spec doesn't count as an "explicit height" for
  // percentage-height descendants, so min-h-full here would silently
  // collapse to content size on any screen shorter than the viewport. A
  // *fixed* height (rather than min-height) also keeps this outer box from
  // growing past the viewport, so the flex-1 middle region's min-h-0 below
  // can do its job: scroll internally, never the page itself.
  <div className="relative flex h-[100dvh] w-full flex-col" style={{ background: dark ? 'radial-gradient(120% 85% at 50% 12%, #1D4FB0 0%, #071B4A 68%)' : '#EDE7DA' }}>
    {dark && <div className="dear2100-starfield" />}
    <div className={`absolute inset-0 pointer-events-none ${dark ? 'dear2100-grain-overlay dear2100-grain-overlay-dark' : 'dear2100-grain-overlay'}`} />
    <Header left={header.left} pct={header.pct} dark={dark} onBack={header.onBack} />
    {illustration}
    <div className={`min-h-0 flex-1 px-6 ${compactHeader ? 'pt-4' : 'pt-14'} pb-8 overflow-y-auto dear2100-hide-scrollbar flex flex-col relative z-10 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>{children}</div>
    <div className="shrink-0 px-6 pb-9 pt-3 relative z-10">
      {footNote && <div className="mb-3"><Footnote dark={dark}>{footNote}</Footnote></div>}
      {button}
    </div>
  </div>
);

/* ---------------- Selection controls ---------------- */

export const GLYPH_PATHS = {
  clock: 'M8 4v4l2.6 2.6 M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z',
  coin: 'M8 2v12 M5.2 4.6c0-1 1.3-1.8 2.8-1.8s2.8.8 2.8 1.8-1.3 1.4-2.8 1.4-2.8.4-2.8 1.4 1.3 1.8 2.8 1.8 2.8-.8 2.8-1.8',
  warning: 'M8 6.2v3 M8 11.6h.01 M7.1 2.6 1.4 12.4a1 1 0 0 0 .87 1.5h11.46a1 1 0 0 0 .87-1.5L8.9 2.6a1 1 0 0 0-1.74 0Z',
  users: 'M2.2 13c.4-2 2-3.2 3.8-3.2s3.4 1.2 3.8 3.2 M6 7.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M10 5.4c1.2.2 2.2 1.1 2.4 2.4 M10.2 9.9c1.4.3 2.6 1.4 3 3',
  shield: 'M8 1.6 13.4 3.6v4C13.4 11 11 13 8 14.4 5 13 2.6 11 2.6 7.6v-4L8 1.6Z',
  mask: 'M3 6.4c1.6-1.8 3.4-2.4 5-2.4s3.4.6 5 2.4c0 3.6-2.2 6.4-5 6.4s-5-2.8-5-6.4Z M6 7.4h.01 M10 7.4h.01',
  joke: 'M8 14.4A6.4 6.4 0 1 0 8 1.6a6.4 6.4 0 0 0 0 12.8Z M5.6 6.4h.01 M10.4 6.4h.01 M5.4 9.4c.7.9 1.6 1.4 2.6 1.4s1.9-.5 2.6-1.4',
  door: 'M4.4 2h5.2v12H4.4Z M9.6 2 12 3v10l-2.4 1 M7.2 8h.01',
  eye: 'M1.4 8S3.6 3.6 8 3.6 14.6 8 14.6 8 12.4 12.4 8 12.4 1.4 8 1.4 8Z M8 9.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z',
  compass: 'M8 14.4A6.4 6.4 0 1 0 8 1.6a6.4 6.4 0 0 0 0 12.8Z M9.9 6.1 8.9 9 6 10l1-2.9 2.9-1Z',
  heart: 'M8 13.4S2.4 10 2.4 6a2.9 2.9 0 0 1 5.2-1.8A2.9 2.9 0 0 1 13.6 6c0 4-5.6 7.4-5.6 7.4Z',
  spark: 'M8 1.6 9.3 6.7 14.4 8 9.3 9.3 8 14.4 6.7 9.3 1.6 8 6.7 6.7Z',
  flag: 'M3.4 14V2 M3.4 2.8h9l-1.8 3 1.8 3h-9',
  book: 'M3 2.6h5.2a1.6 1.6 0 0 1 1.6 1.6V14a1.4 1.4 0 0 0-1.4-1.4H3Z M13.4 2.6H8.2v9.8a1.4 1.4 0 0 1 1.4-1.4h3.8Z',
  scale: 'M8 1.6v12.8 M4.6 3.4h6.8 M8 3.4 4 8.8h8L8 3.4Z M2 8.8a2 2 0 0 0 4 0 M10 8.8a2 2 0 0 0 4 0',
  edit: 'M2.4 13.6 3 10.7 10.7 3 13 5.3 5.3 13Z M9.6 3.9 12.1 6.4',
};

export const Glyph = ({ name, color, size = 15 }) =>
  GLYPH_PATHS[name] ? (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      {GLYPH_PATHS[name].split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : 'M' + seg} stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  ) : null;

export const Pill = ({ children, selected, dark, size = 'md', onClick, icon }) => {
  const padY = size === 'sm' ? 'py-2.5' : 'py-3.5';
  const text = size === 'sm' ? 'text-[12.5px]' : 'text-[13.5px]';
  let style;
  if (dark) {
    style = selected
      ? { background: `linear-gradient(180deg, #E42115, ${RED})`, borderColor: RED, color: '#fff', boxShadow: `0 8px 18px -6px ${RED}88` }
      : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.28)', color: 'rgba(251,247,236,0.85)' };
  } else {
    style = selected
      ? { background: `linear-gradient(180deg, #1349C7, ${NAVY})`, borderColor: NAVY, color: '#fff', boxShadow: `0 8px 18px -6px ${NAVY}77` }
      : { background: 'rgba(255,255,255,0.45)', borderColor: 'rgba(0,56,160,0.20)', color: 'rgba(0,56,160,0.82)', boxShadow: '0 1px 2px rgba(0,56,160,0.06)' };
  }
  const iconColor = selected ? '#fff' : dark ? 'rgba(251,247,236,0.6)' : `${NAVY}99`;
  return (
    <button type="button" onClick={onClick} className={`no-tap rounded-2xl border ${padY} ${text} px-3 font-d2100-sans font-medium text-center transition-all leading-snug flex items-center justify-center gap-2`} style={style}>
      {icon && <Glyph name={icon} color={iconColor} />}
      <span>{children}</span>
    </button>
  );
};

export const Grid = ({ options, selected, dark, size, cols = 2, icons, onToggle }) => (
  <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
    {options.map((o) => (
      <Pill key={o} selected={selected?.includes(o)} dark={dark} size={size} icon={icons?.[o]} onClick={onToggle ? () => onToggle(o) : undefined}>{o}</Pill>
    ))}
  </div>
);

export const Counter = ({ n, dark }) => (
  <p className="font-d2100-sans text-[12.5px] mt-1.5" style={{ color: dark ? 'rgba(251,247,236,0.45)' : 'rgba(26,26,26,0.42)' }}>
    Select all that apply · <span className="font-semibold">{n} selected</span>
  </p>
);

export const SecondaryBlock = ({ label, children, dark }) => (
  <div className="mt-7 pt-6" style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,56,160,0.12)'}` }}>
    <p className="font-d2100-sans text-[10px] font-semibold uppercase tracking-[0.18em] mb-2.5" style={{ color: dark ? 'rgba(251,247,236,0.38)' : 'rgba(0,56,160,0.38)' }}>{label}</p>
    {children}
  </div>
);

/* Read-only styled box — used for recaps/joins that reflect already-captured
   state rather than accepting new typing (e.g. the chosen-values join). */
export const ReadoutBox = ({ placeholder, value, dark, compact }) => (
  <div
    className={compact ? 'rounded-2xl px-3.5 py-2.5 font-d2100-read italic text-[13px] mt-2.5 min-h-[42px]' : 'rounded-2xl px-4 py-4 font-d2100-read italic text-[16px] mt-5 min-h-[86px]'}
    style={{
      border: `1.5px solid ${value ? RED : dark ? 'rgba(255,255,255,0.3)' : 'rgba(216,16,8,0.4)'}`,
      color: value ? (dark ? '#FBF7EC' : '#1A2A55') : dark ? 'rgba(251,247,236,0.4)' : 'rgba(26,26,26,0.38)',
      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)',
      boxShadow: value ? `0 6px 16px -8px ${RED}55, inset 0 1px 0 rgba(255,255,255,0.5)` : 'inset 0 1px 2px rgba(0,56,160,0.05)',
    }}
  >
    {value || placeholder}
  </div>
);

/* Real, controlled text entry styled to match the locked design's TextArea. */
export const TextInput = ({ placeholder, value, onChange, dark, compact, autoFocus }) => (
  <textarea
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    placeholder={placeholder}
    autoFocus={autoFocus}
    rows={compact ? 1 : 3}
    className={`w-full resize-none bg-transparent outline-none placeholder:opacity-100 ${compact ? 'rounded-2xl px-3.5 py-2.5 font-d2100-read italic text-[13px] mt-2.5 min-h-[42px]' : 'rounded-2xl px-4 py-4 font-d2100-read italic text-[16px] mt-5 min-h-[86px]'}`}
    style={{
      border: `1.5px solid ${value ? RED : dark ? 'rgba(255,255,255,0.3)' : 'rgba(216,16,8,0.4)'}`,
      color: dark ? '#FBF7EC' : '#1A2A55',
      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)',
      boxShadow: value ? `0 6px 16px -8px ${RED}55, inset 0 1px 0 rgba(255,255,255,0.5)` : 'inset 0 1px 2px rgba(0,56,160,0.05)',
    }}
  />
);

/* Suggestion-chip bank, now controlled: value/onChange come from the
   caller's answer state instead of local component state, so typing or
   tapping a chip both write into the same real, persisted field. */
export const SuggestionField = ({ placeholder, dark, suggestions, value = '', onChange, maxHeight = 190, compact }) => (
  <>
    <TextInput placeholder={placeholder} value={value} onChange={onChange} dark={dark} compact={compact} />
    <div className={compact ? 'mt-2' : 'mt-3'}>
      <div
        className="flex flex-wrap gap-2 overflow-y-auto dear2100-hide-scrollbar"
        style={{ maxHeight, maskImage: 'linear-gradient(180deg, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg, black 80%, transparent 100%)' }}
      >
        {suggestions.map((s) => {
          const sel = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange?.(s)}
              className="no-tap shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-d2100-sans font-medium whitespace-nowrap transition-all"
              style={{
                background: sel ? (dark ? `linear-gradient(180deg, #E42115, ${RED})` : `linear-gradient(180deg, #1349C7, ${NAVY})`) : dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                borderColor: sel ? 'transparent' : dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,56,160,0.18)',
                color: sel ? '#fff' : dark ? 'rgba(251,247,236,0.75)' : 'rgba(0,56,160,0.75)',
                boxShadow: sel ? `0 6px 14px -6px ${dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,56,160,0.45)'}` : 'none',
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
      {!compact && (
        <p className="font-d2100-sans text-[10px] mt-2" style={{ color: dark ? 'rgba(251,247,236,0.32)' : 'rgba(0,56,160,0.32)' }}>
          {suggestions.length} ideas — scroll for more, or type your own
        </p>
      )}
    </div>
  </>
);

/* ---------------- Hand-drawn wordmark + underline ---------------- */

export const Squiggle = ({ color = RED, width = 220 }) => (
  <svg width={width} height="26" viewBox="0 0 220 26" fill="none" className="mx-auto -mt-1">
    <path d="M4 18C40 8 80 8 110 15C140 22 180 22 216 12" stroke={color} strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
    <path d="M2 14C42 22 78 22 112 13C146 4 182 6 218 16" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const Wordmark = ({ dark }) => (
  <div className="relative text-center">
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full pointer-events-none"
      style={{
        background: dark
          ? 'radial-gradient(closest-side, rgba(255,255,255,0.16), rgba(255,255,255,0) 72%)'
          : `radial-gradient(closest-side, ${GOLD}22, rgba(216,16,8,0) 72%)`,
        filter: 'blur(2px)',
      }}
    />
    <svg width="290" height="290" viewBox="0 0 290 290" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <circle cx="145" cy="145" r="128" fill="none" stroke={dark ? 'rgba(255,255,255,0.14)' : `${GOLD}55`} strokeWidth="1" strokeDasharray="1 7" strokeLinecap="round" />
      <circle cx="145" cy="145" r="108" fill="none" stroke={dark ? 'rgba(255,255,255,0.1)' : `${NAVY}22`} strokeWidth="1" />
    </svg>
    <h1 className="relative font-d2100-hand font-bold text-[64px] leading-[0.92]" style={{ color: dark ? '#FBF7EC' : NAVY }}>
      Dear<br />2100.
    </h1>
    <div className="relative"><Squiggle color={RED} /></div>
  </div>
);

export const WelcomeWordmark = () => (
  <div className="text-center">
    <h1 className="font-d2100-marker leading-[1.05]" style={{ color: NAVY, fontWeight: 700, fontSize: '96px' }}>
      Dear 2100.
    </h1>
    <Squiggle color={RED} width={280} />
  </div>
);

/* ---------------- Illustrations ---------------- */

export const EvolutionIllustration = ({ step = 0 }) => {
  const badges = ['LIVE POV · THREAT DETECTED', 'LIVE POV · ALARM TRIGGERED', 'LIVE POV · REASONING ARRIVES LATE'];
  const scale = 1 + step * 0.24;
  return (
    <div className="relative h-[168px] mt-2 rounded-[22px] overflow-hidden shrink-0">
      <svg viewBox="0 0 400 190" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="d2100-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B1A3E" />
            <stop offset="55%" stopColor="#3A2E52" />
            <stop offset="100%" stopColor="#7A4A3A" />
          </linearGradient>
          <radialGradient id="d2100-moon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE9B8" />
            <stop offset="100%" stopColor="#F3B65B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="190" fill="url(#d2100-sky)" />
        <circle cx="290" cy="70" r="42" fill="url(#d2100-moon)" />
        <circle cx="290" cy="70" r="14" fill="#FFE9B8" />
        <path d="M0 190 L0 120 Q90 90 180 122 T400 110 L400 190 Z" fill="#1A1E33" />
        <g style={{ transformOrigin: '170px 130px', transform: `scale(${scale})`, transition: 'transform 0.45s ease' }}>
          <path d="M140 108 L180 132 L118 132 Z" fill={RED} opacity="0.85" />
          <ellipse cx="160" cy="134" rx="7" ry="5" fill="#F3D28A" />
          <ellipse cx="182" cy="134" rx="7" ry="5" fill="#F3D28A" />
          <circle cx="160" cy="134" r="2.2" fill="#1A1E33" />
          <circle cx="182" cy="134" r="2.2" fill="#1A1E33" />
          {step >= 1 && <circle cx="171" cy="130" r="26" fill="none" stroke={RED} strokeWidth="1.4" opacity="0.65" />}
        </g>
        {step === 2 && (
          <g stroke="#fff" strokeWidth="1.2" opacity="0.8" fill="none">
            <path d="M110 95 h12 M110 95 v12" />
            <path d="M240 95 h-12 M240 95 v12" />
            <path d="M110 168 h12 M110 168 v-12" />
            <path d="M240 168 h-12 M240 168 v-12" />
          </g>
        )}
      </svg>
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-d2100-sans font-bold tracking-widest text-white" style={{ background: RED }}>
        {badges[step]}
      </div>
    </div>
  );
};

export const URGE_POINTS = [
  { x: 0, y: 53, t: '0:00', label: 'It starts', caption: 'A thought or trigger fires the alarm. The urge is small — this is the easiest point to notice it.' },
  { x: 66, y: 50, t: '0:08', label: 'Still quiet', caption: 'For a few seconds, barely anything happens. This is the window most people miss.' },
  { x: 118, y: 9, t: '0:20', label: 'Peak', caption: 'This is as intense as it gets. It feels unbearable — but it is also the turning point.' },
  { x: 140, y: 28, t: '0:25', label: 'Cresting', caption: 'Still strong, but already less than a moment ago. You made it past the hardest second.' },
  { x: 190, y: 44, t: '0:38', label: 'Easing', caption: 'The wave is breaking. Every second now costs it strength, not you.' },
  { x: 238, y: 51, t: '0:50', label: 'Settling', caption: 'Almost back to baseline. The urge is running out of fuel.' },
  { x: 280, y: 52, t: '1:00', label: 'Passing', caption: 'It’s gone, or close to it. You didn’t act on it — and it passed anyway. That’s the whole lesson.' },
];

const catmullRomPath = (pts) => {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
};

export const UrgeWave = ({ stop, onAdvance }) => {
  const full = catmullRomPath(URGE_POINTS);
  const traveled = catmullRomPath(URGE_POINTS.slice(0, stop + 1));
  const active = URGE_POINTS[stop];
  const isLast = stop === URGE_POINTS.length - 1;

  // Immersive dynamic colors and glow based on direction (up/down)
  const isGoingUp = stop <= 2;
  const glowColor = isGoingUp ? RED : '#00A86B'; // vibrant red up, calming green down
  const strokeColor = isGoingUp ? RED : '#00965E';

  return (
    <div className="mt-4">
      <svg viewBox="0 0 280 70" className="w-full h-[80px] overflow-visible">
        <defs>
          <filter id="urge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @keyframes pulse-glow {
              0% { opacity: 0.5; filter: drop-shadow(0 0 2px ${RED}); }
              50% { opacity: 1.0; filter: drop-shadow(0 0 8px ${RED}); }
              100% { opacity: 0.5; filter: drop-shadow(0 0 2px ${RED}); }
            }
            @keyframes calm-glow {
              0% { opacity: 0.7; filter: drop-shadow(0 0 3px #00A86B); }
              50% { opacity: 0.9; filter: drop-shadow(0 0 4px #00A86B); }
              100% { opacity: 0.7; filter: drop-shadow(0 0 3px #00A86B); }
            }
            .pulse-active {
              animation: pulse-glow 1.2s infinite ease-in-out;
            }
            .settle-active {
              animation: calm-glow 2s infinite ease-in-out;
            }
          `}</style>
        </defs>
        <path d={full} fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" opacity="0.1" />
        
        {/* Glowing aura path behind the traveled path */}
        <path
          d={traveled}
          fill="none"
          stroke={glowColor}
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#urge-glow)"
          opacity={isGoingUp ? 0.8 : 0.6}
          className={isGoingUp ? "pulse-active" : "settle-active"}
          style={{ transition: 'stroke 0.8s ease, d 0.5s ease' }}
        />

        {/* Crisp foreground path */}
        <path
          d={traveled}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease, d 0.5s ease' }}
        />

        {URGE_POINTS.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={i <= stop ? (i <= 2 ? RED : '#00965E') : 'rgba(26,26,26,0.15)'}
            style={{ transition: 'fill 0.8s ease' }}
          />
        ))}

        {/* Glowing active indicator node */}
        <circle
          cx={active.x}
          cy={active.y}
          r="6"
          fill={strokeColor}
          stroke="#fff"
          strokeWidth="2"
          className={isGoingUp ? "pulse-active" : "settle-active"}
          style={{
            transition: 'cx 0.6s cubic-bezier(0.4,0,0.2,1), cy 0.6s cubic-bezier(0.4,0,0.2,1), fill 0.8s ease'
          }}
        />
        
        <text
          x={Math.min(Math.max(active.x, 20), 260)}
          y={active.y - 12 < 8 ? active.y + 19 : active.y - 11}
          textAnchor="middle"
          className="font-d2100-sans"
          style={{
            fontSize: 9,
            fontWeight: 800,
            fill: strokeColor,
            letterSpacing: 1,
            transition: 'x 0.6s ease, y 0.6s ease, fill 0.8s ease'
          }}
        >
          {active.t}
        </text>
      </svg>
      <div className="flex items-center justify-between mt-1">
        <p className="font-d2100-sans text-[10.5px] font-bold uppercase tracking-widest" style={{ color: strokeColor, transition: 'color 0.8s ease' }}>{active.label}</p>
        <p className="font-d2100-sans text-[9.5px] font-medium" style={{ color: 'rgba(26,26,26,0.38)' }}>{stop + 1} / {URGE_POINTS.length}</p>
      </div>
      <p className="font-d2100-sans text-[12.5px] leading-relaxed mt-1.5" style={{ color: 'rgba(26,26,26,0.58)' }}>{active.caption}</p>
      {!isLast ? (
        <button
          type="button"
          onClick={onAdvance}
          className="no-tap mt-3 w-full rounded-full py-2.5 font-d2100-sans text-[12px] font-bold uppercase tracking-wide transition-all active:scale-[0.98] shadow-sm hover:brightness-105"
          style={{ background: isGoingUp ? 'rgba(216,16,8,0.08)' : 'rgba(0,150,94,0.08)', color: strokeColor, border: `1px solid ${isGoingUp ? 'rgba(216,16,8,0.15)' : 'rgba(0,150,94,0.15)'}`, transition: 'all 0.8s ease' }}
        >
          Keep the urge moving →
        </button>
      ) : (
        <div className="mt-3 w-full rounded-full py-2.5 text-center font-d2100-sans text-[12px] font-bold uppercase tracking-wide" style={{ background: 'rgba(0,150,94,0.1)', color: '#00965E', border: '1px solid rgba(0,150,94,0.2)' }}>
          The urge has passed
        </div>
      )}
    </div>
  );
};

export const BrainPathwayIllustration = () => (
  <div className="relative h-[86px] rounded-[20px] overflow-hidden shrink-0" style={{ background: 'linear-gradient(160deg, #0B1A3E 0%, #1A2A55 100%)' }}>
    <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <path d="M40 104 Q28 58 72 32 Q112 8 162 16 Q212 22 232 52 Q250 60 252 76 Q254 88 240 90 Q238 102 222 103 L216 118 L200 118 L194 105 Q142 114 92 108 L86 119 L70 119 L66 104 Z" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.3" />
      <ellipse cx="118" cy="44" rx="40" ry="25" fill={`${GOLD}20`} stroke={GOLD} strokeWidth="1.2" />
      <text x="118" y="42" textAnchor="middle" fontSize="8" fontWeight="700" fill={GOLD}>PREFRONTAL CORTEX</text>
      <text x="118" y="53" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.55)">reasoning · slow lane</text>
      <circle cx="204" cy="68" r="17" fill={`${RED}30`} stroke={RED} strokeWidth="1.2" />
      <text x="204" y="66" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">AMYGDALA</text>
      <text x="204" y="76" textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.65)">fight/flight</text>
      <path d="M12 68 L58 68" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
      <path d="M58 68 Q135 92 187 70" fill="none" stroke={RED} strokeWidth="1.6" strokeDasharray="3 3" />
      <path d="M58 68 Q74 48 92 43" fill="none" stroke={GOLD} strokeWidth="1.6" />
      <path d="M148 46 Q172 54 188 63" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="2 3" />
    </svg>
    <div className="absolute left-3 bottom-2 right-3 flex justify-between font-d2100-sans text-[7.5px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
      <span style={{ color: `${GOLD}CC` }}>Slow lane · reasoning</span>
      <span style={{ color: `${RED}` }}>Fast lane · reflex</span>
    </div>
  </div>
);

/* ---------------- Reusable content blocks ---------------- */

export const ContrastList = ({ dark, avoidTitle, avoidItems, actTitle, actItems }) => (
  <div className="grid grid-cols-2 gap-2.5 mt-2">
    <div>
      <p className="font-d2100-sans text-[9.5px] font-bold uppercase tracking-widest mb-2.5" style={{ color: dark ? 'rgba(251,247,236,0.85)' : 'rgba(26,26,26,0.4)' }}>{avoidTitle}</p>
      <ul className="space-y-2.5">
        {avoidItems.map((t) => (
          <li key={t} className="flex gap-2 items-start font-d2100-sans text-[12.5px] leading-snug" style={{ color: dark ? 'rgba(251,247,236,0.82)' : 'rgba(26,26,26,0.55)' }}>
            <span className="w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5" style={{ borderColor: dark ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,26,0.3)' }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
    <div className="pl-3.5" style={{ borderLeft: `1.5px solid ${RED}` }}>
      <p className="font-d2100-sans text-[9.5px] font-bold uppercase tracking-widest mb-2.5" style={{ color: RED }}>{actTitle}</p>
      <ul className="space-y-2.5">
        {actItems.map((t) => (
          <li key={t} className="flex gap-2 items-start font-d2100-sans text-[12.5px] font-medium leading-snug" style={{ color: dark ? '#FBF7EC' : NAVY }}>
            <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0 mt-0.5"><circle cx="7" cy="7" r="6.5" stroke={RED} strokeWidth="1.4" fill="none" /><path d="M4 7.2l2 2 4-4.4" stroke={RED} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export const Card = ({ children, dark, accent }) => (
  <div
    className="rounded-[20px] p-4"
    style={{
      background: dark ? 'rgba(255,255,255,0.06)' : 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))',
      border: `1px solid ${accent ? RED + '55' : dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,56,160,0.12)'}`,
      boxShadow: dark ? '0 10px 24px -12px rgba(0,0,0,0.5)' : '0 14px 30px -16px rgba(0,56,160,0.28), inset 0 1px 0 rgba(255,255,255,0.7)',
    }}
  >
    {children}
  </div>
);

export const DownArrow = () => (
  <div className="flex justify-center my-1">
    <svg width="11" height="14" viewBox="0 0 14 18"><path d="M7 0v14M1 9l6 6 6-6" stroke="rgba(0,56,160,0.28)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
);

export const ValueTriad = ({ values }) => {
  const pts = [
    { x: 100, y: 20 },
    { x: 46, y: 98 },
    { x: 154, y: 98 },
  ];
  return (
    <div className="mt-8 flex justify-center">
      <svg width="230" height="146" viewBox="0 0 200 124">
        <defs>
          <radialGradient id="d2100-triHubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.4" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="d2100-triHubFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1349C7" />
            <stop offset="100%" stopColor={NAVY} />
          </linearGradient>
          <linearGradient id="d2100-triPillFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E42115" />
            <stop offset="100%" stopColor={RED} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="59" r="44" fill="url(#d2100-triHubGlow)" />
        {pts.map((p, i) => (
          <line key={i} x1="100" y1="59" x2={p.x} y2={p.y} stroke={NAVY} strokeOpacity="0.18" strokeWidth="1.3" strokeDasharray="3 3" strokeLinecap="round" />
        ))}
        <circle cx="100" cy="59" r="27" fill="none" stroke="rgba(0,56,160,0.15)" strokeDasharray="1.5 4" />
        <circle cx="100" cy="59" r="18" fill="url(#d2100-triHubFill)" />
        <text x="100" y="56.5" textAnchor="middle" className="font-d2100-sans" style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.06em', fill: 'rgba(255,255,255,0.88)' }}>SELF</text>
        <text x="100" y="64" textAnchor="middle" className="font-d2100-sans" style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.06em', fill: 'rgba(255,255,255,0.88)' }}>CONCEPT</text>
        {pts.map((p, i) => {
          const v = values[i];
          return (
            <g key={i}>
              <rect x={p.x - 40} y={p.y - 11} width="80" height="22" rx="11" fill={v ? 'url(#d2100-triPillFill)' : 'rgba(255,255,255,0.7)'} stroke={v ? 'none' : 'rgba(0,56,160,0.22)'} strokeDasharray={v ? '0' : '2 2'} style={v ? { filter: 'drop-shadow(0 4px 8px rgba(216,16,8,0.28))' } : undefined} />
              <text x={p.x} y={p.y + 3.2} textAnchor="middle" className="font-d2100-sans" style={{ fontSize: 9, fontWeight: 700, fill: v ? '#fff' : 'rgba(0,56,160,0.4)' }}>{v || 'Pick a value'}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const PathwayMap = ({ nodes, compact, highlightLast = true, showLoop = true }) => {
  const dense = nodes.length > 7;
  return (
  <div className="mt-2 relative">
    {nodes.map((n, i) => {
      const isLast = highlightLast && i === nodes.length - 1;
      return (
        <div key={n.label} className={`relative flex gap-2 ${dense ? 'pb-1' : 'pb-2.5'} last:pb-0`}>
          {i < nodes.length - 1 && <div className="absolute left-[9px] top-5 bottom-0 w-[1.5px]" style={{ background: 'rgba(255,255,255,0.14)' }} />}
          <div
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 z-10"
            style={{ background: isLast ? `linear-gradient(180deg, #E42115, ${RED})` : 'rgba(255,255,255,0.06)', border: isLast ? 'none' : '1px solid rgba(255,255,255,0.22)' }}
          >
            <Glyph name={n.icon} color={isLast ? '#fff' : 'rgba(251,247,236,0.7)'} size={9} />
          </div>
          <div className={dense ? '' : 'pt-0.5'}>
            <p className="font-d2100-sans text-[10px] font-bold leading-tight" style={{ color: isLast ? RED : '#FBF7EC' }}>{n.label}</p>
            {!compact && <p className="font-d2100-sans text-[9px] leading-tight" style={{ color: 'rgba(251,247,236,0.5)' }}>{n.v}</p>}
          </div>
        </div>
      );
    })}
    {showLoop && <p className="font-d2100-sans text-[9px] italic mt-1 pl-[26px]" style={{ color: 'rgba(216,16,8,0.75)' }}>↺ loops back and reinforces the same wound</p>}
  </div>
  );
};
