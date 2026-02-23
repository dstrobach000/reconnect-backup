'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MatrixWordTicker from './MatrixWordTicker';
import StyledDropdown from './StyledDropdown';

const MOVEMENT_WORDS = ['CITIES', 'CREWS', 'ARTISTS', 'LISTENERS', 'PROMOTERS', 'INSTITUTIONS'];
const EVENT_HEADLINE = '1.–3. 10. 2026 BRNO';
const EVENT_SUBHEAD = 'PANELS + WORKSHOPS + NETWORKING + CONCERTS + PARTIES';
const HERO_SLIDES = [
  '/images/hero/hero01.jpg',
  '/images/hero/hero02.jpg',
  '/images/hero/hero03.jpg',
  '/images/hero/hero04.jpg',
  '/images/hero/hero05.jpg',
];
const DEFAULT_HERO_OVERLAY_VIDEO = '/exports/1920_ring_01.mp4';
const HERO_CYCLE_INTERVAL_MS = 2000;
const STORAGE_KEY = 'reconnect-hero-text-controls-v1';
const STORAGE_EVENT = 'reconnect-hero-text-controls-updated';
const SHARED_SETTINGS_ENDPOINT = '/api/hero-text-style';
const OVERLAY_VIDEO_OPTIONS_ENDPOINT = '/api/composer-export?scope=all';
const OVERLAY_SOURCE_VIDEO_PATTERN = /^1920_.+\.mp4$/i;
const DEFAULT_THEME_COLOR = '#39ff14';
const FILL_STROKE_MODES = ['fill', 'stroke', 'fill-stroke'] as const;
const TEXT_TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'] as const;
type FillStrokeMode = (typeof FILL_STROKE_MODES)[number];
type TextTransformMode = (typeof TEXT_TRANSFORMS)[number];
type HighlightMode = 'theme' | 'custom';
const OVERLAY_BLEND_MODES = ['screen', 'overlay', 'lighten', 'soft-light', 'multiply', 'normal'] as const;
type OverlayBlendMode = (typeof OVERLAY_BLEND_MODES)[number];
const DEFAULT_OVERLAY_BLEND_MODE: OverlayBlendMode = 'screen';
const DEFAULT_OVERLAY_OPACITY = 0.6;
const HERO_STYLE_OPTIONS = [
  { value: 'graphic', label: 'Graphic' },
  { value: 'photo', label: 'Photo' },
  { value: 'overlay', label: 'Overlay' },
] as const;
type HeroStyleMode = (typeof HERO_STYLE_OPTIONS)[number]['value'];
const DEFAULT_HERO_STYLE_MODE: HeroStyleMode = 'overlay';
type TextControls = {
  fontFamily: string;
  color: string;
  mode: FillStrokeMode;
  strokeWidth: number;
  fontSize: number;
  mobileScale: number;
  letterSpacing: number;
  textTransform: TextTransformMode;
};
type SavedControlsPayload = {
  titleControls?: Partial<TextControls>;
  tickerControls?: Partial<TextControls>;
  eventControls?: Partial<TextControls>;
  themeColor?: string;
  highlightMode?: HighlightMode;
  highlightColor?: string;
  highlightRadius?: number;
  overlayBlendMode?: OverlayBlendMode;
  overlayOpacity?: number;
  overlayVideo?: string;
};
type OverlayVideoItem = {
  filename: string;
  url: string;
};

function hasSavedControls(payload: SavedControlsPayload | null | undefined) {
  if (!payload) return false;
  return Boolean(
    payload.titleControls ||
      payload.tickerControls ||
      payload.eventControls ||
      payload.themeColor ||
      payload.highlightMode ||
      payload.highlightColor ||
      typeof payload.highlightRadius !== 'undefined' ||
      payload.overlayBlendMode ||
      typeof payload.overlayOpacity !== 'undefined' ||
      payload.overlayVideo,
  );
}

const DEFAULT_TITLE_CONTROLS = {
  fontFamily: 'var(--font-mekanikal)',
  color: '#39ff14',
  mode: 'stroke',
  strokeWidth: 1,
  fontSize: 72,
  mobileScale: 0.52,
  letterSpacing: -0.025,
  textTransform: 'uppercase',
} satisfies TextControls;
const DEFAULT_TICKER_CONTROLS = {
  fontFamily: 'var(--font-documan)',
  color: '#39ff14',
  mode: 'fill',
  strokeWidth: 0,
  fontSize: 48,
  mobileScale: 0.62,
  letterSpacing: 0.15,
  textTransform: 'uppercase',
} satisfies TextControls;
const DEFAULT_EVENT_CONTROLS = {
  fontFamily: 'var(--font-roobertmono)',
  color: '#000000',
  mode: 'fill',
  strokeWidth: 0,
  fontSize: 30,
  mobileScale: 0.7,
  letterSpacing: 0.04,
  textTransform: 'uppercase',
} satisfies TextControls;
const DEFAULT_HIGHLIGHT_MODE: HighlightMode = 'theme';
const DEFAULT_HIGHLIGHT_COLOR = '#000000';
const DEFAULT_HIGHLIGHT_RADIUS = 0;
const SWATCH_ROWS = 9;
const SAFARI_SWATCH_HUES = [214, 230, 248, 267, 288, 318, 350, 18, 32, 50, 78, 126] as const;
const SAFARI_SWATCH_SATURATIONS = [72, 72, 68, 64, 60, 62, 68, 70, 56, 72, 74, 66] as const;
const SAFARI_SWATCH_LIGHTNESS = [14, 20, 27, 34, 42, 50, 58, 68, 80] as const;
const PRESENTATION_THEME_OVERRIDES = [
  '#dee8fc',
  '#d95c26',
  '#7386e8',
  '#958018',
  '#12960d',
  '#96560d',
] as const;

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const normalizedHue = h / 60;
  const x = chroma * (1 - Math.abs((normalizedHue % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (normalizedHue >= 0 && normalizedHue < 1) {
    r = chroma;
    g = x;
  } else if (normalizedHue < 2) {
    r = x;
    g = chroma;
  } else if (normalizedHue < 3) {
    g = chroma;
    b = x;
  } else if (normalizedHue < 4) {
    g = x;
    b = chroma;
  } else if (normalizedHue < 5) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  const m = lightness - chroma / 2;
  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const SAFARI_SWATCH_COLORS = SAFARI_SWATCH_HUES.flatMap((hue, index) =>
  SAFARI_SWATCH_LIGHTNESS.map((lightness) =>
    hslToHex(hue, SAFARI_SWATCH_SATURATIONS[index], lightness),
  ),
);
const FONT_OPTIONS = [
  { label: 'Mekanikal', value: 'var(--font-mekanikal)' },
  { label: 'Documan', value: 'var(--font-documan)' },
  { label: 'Dazzed', value: 'var(--font-dazzed)' },
  { label: 'Lazzer', value: 'var(--font-lazzer)' },
  { label: 'NewEdge666', value: 'var(--font-newedge666)' },
  { label: 'Ofform', value: 'var(--font-ofform)' },
  { label: 'NG Hofmann', value: 'var(--font-hofmann)' },
  { label: 'Roobert Mono', value: 'var(--font-roobertmono)' },
];
const FILL_STROKE_OPTIONS: Array<{ label: string; value: FillStrokeMode }> = [
  { label: 'Fill', value: 'fill' },
  { label: 'Stroke', value: 'stroke' },
  { label: 'Fill + Stroke', value: 'fill-stroke' },
];
const TEXT_TRANSFORM_OPTIONS: Array<{ label: string; value: TextTransformMode }> = [
  { label: 'None', value: 'none' },
  { label: 'Uppercase', value: 'uppercase' },
  { label: 'Lowercase', value: 'lowercase' },
  { label: 'Capitalize', value: 'capitalize' },
];

function normalizeControls(
  rawControls: Partial<TextControls> | undefined,
  defaults: TextControls,
): TextControls {
  const merged = { ...defaults, ...(rawControls ?? {}) };
  const strokeWidth = Number(merged.strokeWidth);
  const fontSize = Number(merged.fontSize);
  const mobileScale = Number(merged.mobileScale);
  const letterSpacing = Number(merged.letterSpacing);

  return {
    ...merged,
    mode: FILL_STROKE_MODES.includes(merged.mode as FillStrokeMode)
      ? (merged.mode as FillStrokeMode)
      : defaults.mode,
    textTransform: TEXT_TRANSFORMS.includes(merged.textTransform as TextTransformMode)
      ? (merged.textTransform as TextTransformMode)
      : defaults.textTransform,
    strokeWidth: Number.isFinite(strokeWidth) ? strokeWidth : defaults.strokeWidth,
    fontSize: Number.isFinite(fontSize) ? fontSize : defaults.fontSize,
    mobileScale: Number.isFinite(mobileScale)
      ? Math.min(1, Math.max(0.3, mobileScale))
      : defaults.mobileScale,
    letterSpacing: Number.isFinite(letterSpacing) ? letterSpacing : defaults.letterSpacing,
  };
}

function shuffleList<T>(list: T[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function normalizeThemeColor(rawColor: unknown, fallback: string) {
  if (typeof rawColor !== 'string') return fallback;
  const color = rawColor.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
}

function normalizeHighlightMode(rawMode: unknown): HighlightMode {
  return rawMode === 'custom' ? 'custom' : 'theme';
}

function normalizeHighlightRadius(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return DEFAULT_HIGHLIGHT_RADIUS;
  return Math.min(24, Math.max(0, numberValue));
}

function normalizeOverlayBlendMode(value: unknown): OverlayBlendMode {
  if (typeof value !== 'string') return DEFAULT_OVERLAY_BLEND_MODE;
  return OVERLAY_BLEND_MODES.includes(value as OverlayBlendMode)
    ? (value as OverlayBlendMode)
    : DEFAULT_OVERLAY_BLEND_MODE;
}

function normalizeOverlayOpacity(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return DEFAULT_OVERLAY_OPACITY;
  return Math.min(1, Math.max(0, numberValue));
}

function normalizeOverlayVideoSource(value: unknown) {
  if (typeof value !== 'string') return DEFAULT_HERO_OVERLAY_VIDEO;
  const source = value.trim();
  if (!source || source.includes('..')) return DEFAULT_HERO_OVERLAY_VIDEO;
  if (source.startsWith('/exports/')) return source;
  if (/^[^/?#]+\.mp4$/i.test(source)) {
    return `/exports/${source}`;
  }
  return DEFAULT_HERO_OVERLAY_VIDEO;
}

function normalizeOverlayVideoItem(item: unknown): OverlayVideoItem | null {
  if (!item || typeof item !== 'object') return null;
  const value = item as Record<string, unknown>;
  if (typeof value.filename !== 'string' || !value.filename) return null;
  if (typeof value.url !== 'string' || !value.url) return null;
  const url = normalizeOverlayVideoSource(value.url);
  if (!url.startsWith('/exports/')) return null;

  return {
    filename: value.filename,
    url,
  };
}

function isOverlaySourceVideoAllowed(filename: string) {
  return OVERLAY_SOURCE_VIDEO_PATTERN.test(filename);
}

function hexToRgbTriplet(hexColor: string) {
  const normalized = normalizeThemeColor(hexColor, DEFAULT_THEME_COLOR);
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function formatDisplayText(text: string, textTransform: TextTransformMode) {
  switch (textTransform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text
        .toLowerCase()
        .replace(/\b([a-z])/g, (match, char) => `${char.toUpperCase()}`);
    default:
      return text;
  }
}

function getTextStyle({
  fontFamily,
  color,
  mode,
  strokeWidth,
  fontSize,
  mobileScale,
  letterSpacing,
}: TextControls) {
  const normalizedStroke = Math.max(0, Number(strokeWidth) || 0);
  const normalizedFontSize = Math.max(12, Number(fontSize) || 12);
  const normalizedMobileScale = Math.min(1, Math.max(0.3, Number(mobileScale) || 0.3));
  const normalizedLetterSpacing = Number(letterSpacing) || 0;
  const minFontSize = Math.max(12, Math.round(normalizedFontSize * normalizedMobileScale));
  const fontDelta = normalizedFontSize - minFontSize;
  const fluidFontSize =
    fontDelta <= 0
      ? `${normalizedFontSize}px`
      : `clamp(${minFontSize}px, calc(${minFontSize}px + ${fontDelta} * ((100vw - 360px) / 1080)), ${normalizedFontSize}px)`;
  const showFill = mode !== 'stroke';
  const showStroke = mode !== 'fill' && normalizedStroke > 0;

  return {
    fontFamily,
    fontSize: fluidFontSize,
    letterSpacing: `${normalizedLetterSpacing}em`,
    color: showFill ? color : 'transparent',
    WebkitTextFillColor: showFill ? color : 'transparent',
    WebkitTextStroke: showStroke ? `${normalizedStroke}px ${color}` : '0 transparent',
  };
}

function TickBox({ enabled, sizeClass = 'h-4 w-4', markClass = 'h-2.5 w-2.5' }) {
  return (
    <span
      className={`relative flex ${sizeClass} items-center justify-center border border-[rgb(var(--signal-rgb)/0.7)] ${
        enabled ? 'bg-[rgb(var(--signal-rgb)/0.18)]' : 'bg-black'
      }`}
      aria-hidden="true"
    >
      {enabled ? (
        <svg viewBox="0 0 10 10" className={`${markClass} overflow-visible text-[var(--signal)]`}>
          <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.25" />
          <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      ) : null}
    </span>
  );
}

function ToggleField({ label, enabled, onToggle }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={enabled}
      onClick={onToggle}
      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em]"
    >
      <TickBox enabled={enabled} />
      <span>{label}</span>
    </button>
  );
}

function ColorSwatchField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (nextColor: string) => void;
  disabled?: boolean;
}) {
  const [hexInput, setHexInput] = useState(value);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 900);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const commitHexInput = useCallback(() => {
    if (disabled) return;
    onChange(normalizeThemeColor(hexInput, value));
  }, [disabled, hexInput, onChange, value]);

  const copyHex = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
      <span>{label}</span>
      <div
        className={`rounded border border-[rgb(var(--signal-rgb)/0.35)] bg-black/75 p-2 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <div className="mb-2 grid grid-flow-col grid-cols-12 grid-rows-9 gap-1">
          {SAFARI_SWATCH_COLORS.map((color) => (
            <button
              key={`${label}-${color}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange(color)}
              className={`h-4 w-full rounded-sm border ${
                normalizeThemeColor(value, DEFAULT_THEME_COLOR) === color
                  ? 'border-[rgb(var(--signal-rgb)/0.95)]'
                  : 'border-black/50'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Set ${label.toLowerCase()} to ${color}`}
              title={color}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="h-7 w-7 rounded border border-[rgb(var(--signal-rgb)/0.4)]"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          />
          <input
            className="h-7 min-w-0 flex-1 rounded border border-[rgb(var(--signal-rgb)/0.35)] bg-black/90 px-2 text-[11px] normal-case tracking-normal"
            type="text"
            inputMode="text"
            value={hexInput}
            disabled={disabled}
            onChange={(event) => setHexInput(event.target.value)}
            onBlur={commitHexInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitHexInput();
              }
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label={`${label} hex code`}
          />
          <button
            type="button"
            onClick={copyHex}
            className="h-7 rounded border border-[rgb(var(--signal-rgb)/0.4)] bg-black/90 px-2 text-[9px] uppercase tracking-[0.14em]"
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'No Copy' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextStyleControls({
  label,
  controls,
  onChange,
}: {
  label: string;
  controls: TextControls;
  onChange: (field: keyof TextControls, value: string | number) => void;
}) {
  return (
    <fieldset className="rounded border border-[rgb(var(--signal-rgb)/0.45)] p-2">
      <legend className="px-1 text-[10px] uppercase tracking-[0.2em]">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
          Font
          <StyledDropdown
            value={controls.fontFamily}
            onChange={(value) => onChange('fontFamily', value)}
            options={FONT_OPTIONS.map((font) => ({ value: font.value, label: font.label }))}
            tone="dark"
            className="w-full min-w-0"
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
          Color
          <input
            className="h-8 w-full rounded border border-[rgb(var(--signal-rgb)/0.35)] bg-black/80 p-1"
            type="color"
            value={controls.color}
            onChange={(event) => onChange('color', event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
          Fill / Stroke
          <StyledDropdown
            value={controls.mode}
            onChange={(value) => onChange('mode', value)}
            options={FILL_STROKE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            tone="dark"
            className="w-full min-w-0"
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
          Stroke Width ({controls.strokeWidth}px)
          <input
            className="signal-slider h-8 appearance-none bg-transparent"
            type="range"
            min="0"
            max="8"
            step="0.25"
            value={controls.strokeWidth}
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
            onChange={(event) => onChange('strokeWidth', event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
          Font Size ({controls.fontSize}px)
          <input
            className="signal-slider h-8 appearance-none bg-transparent"
            type="range"
            min="16"
            max="180"
            step="1"
            value={controls.fontSize}
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
            onChange={(event) => onChange('fontSize', event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
          Mobile Scale ({Math.round(controls.mobileScale * 100)}%)
          <input
            className="signal-slider h-8 appearance-none bg-transparent"
            type="range"
            min="0.3"
            max="1"
            step="0.01"
            value={controls.mobileScale}
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
            onChange={(event) => onChange('mobileScale', event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
          Letter Spacing ({controls.letterSpacing}em)
          <input
            className="signal-slider h-8 appearance-none bg-transparent"
            type="range"
            min="-0.1"
            max="0.4"
            step="0.005"
            value={controls.letterSpacing}
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
            onChange={(event) => onChange('letterSpacing', event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em] sm:col-span-2">
          Text Transform
          <StyledDropdown
            value={controls.textTransform}
            onChange={(value) => onChange('textTransform', value)}
            options={TEXT_TRANSFORM_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            tone="dark"
            className="w-full min-w-0"
          />
        </label>
      </div>
    </fieldset>
  );
}

export default function HeroRadar({ controlsEnabled = true }: { controlsEnabled?: boolean }) {
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState(HERO_SLIDES);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [loadedHeroSlides, setLoadedHeroSlides] = useState<Set<string>>(new Set());
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [presentationThemeOverride, setPresentationThemeOverride] = useState<string | null>(null);
  const [titleControls, setTitleControls] = useState<TextControls>(DEFAULT_TITLE_CONTROLS);
  const [tickerControls, setTickerControls] = useState<TextControls>(DEFAULT_TICKER_CONTROLS);
  const [eventControls, setEventControls] = useState<TextControls>(DEFAULT_EVENT_CONTROLS);
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(DEFAULT_HIGHLIGHT_MODE);
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const [highlightRadius, setHighlightRadius] = useState(DEFAULT_HIGHLIGHT_RADIUS);
  const [overlayBlendMode, setOverlayBlendMode] = useState<OverlayBlendMode>(DEFAULT_OVERLAY_BLEND_MODE);
  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT_OVERLAY_OPACITY);
  const [overlayVideo, setOverlayVideo] = useState(DEFAULT_HERO_OVERLAY_VIDEO);
  const [overlayVideoInput, setOverlayVideoInput] = useState(DEFAULT_HERO_OVERLAY_VIDEO);
  const [overlayVideoOptions, setOverlayVideoOptions] = useState<OverlayVideoItem[]>([]);
  const [isOverlayPlaybackReady, setIsOverlayPlaybackReady] = useState(false);
  const [presentationHeroStyle, setPresentationHeroStyle] = useState<HeroStyleMode>(DEFAULT_HERO_STYLE_MODE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const lastSyncedPayloadRef = useRef('');
  const updateTitleControls = useCallback((field: keyof TextControls, value: string | number) => {
    setTitleControls((current) => ({
      ...current,
      [field]: ['strokeWidth', 'fontSize', 'mobileScale', 'letterSpacing'].includes(field)
        ? Number(value)
        : value,
    }));
  }, []);
  const updateTickerControls = useCallback((field: keyof TextControls, value: string | number) => {
    setTickerControls((current) => ({
      ...current,
      [field]: ['strokeWidth', 'fontSize', 'mobileScale', 'letterSpacing'].includes(field)
        ? Number(value)
        : value,
    }));
  }, []);
  const updateEventControls = useCallback((field: keyof TextControls, value: string | number) => {
    setEventControls((current) => ({
      ...current,
      [field]: ['strokeWidth', 'fontSize', 'mobileScale', 'letterSpacing'].includes(field)
        ? Number(value)
        : value,
    }));
  }, []);
  const applySavedControls = useCallback((payload: SavedControlsPayload) => {
    if (payload?.titleControls) {
      setTitleControls(normalizeControls(payload.titleControls, DEFAULT_TITLE_CONTROLS));
    }
    if (payload?.tickerControls) {
      setTickerControls(normalizeControls(payload.tickerControls, DEFAULT_TICKER_CONTROLS));
    }
    if (payload?.eventControls) {
      setEventControls(normalizeControls(payload.eventControls, DEFAULT_EVENT_CONTROLS));
    }
    if (payload?.themeColor) {
      setThemeColor(normalizeThemeColor(payload.themeColor, DEFAULT_THEME_COLOR));
    }
    if (payload?.highlightMode) {
      setHighlightMode(normalizeHighlightMode(payload.highlightMode));
    }
    if (payload?.highlightColor) {
      setHighlightColor(normalizeThemeColor(payload.highlightColor, DEFAULT_HIGHLIGHT_COLOR));
    }
    if (typeof payload?.highlightRadius !== 'undefined') {
      setHighlightRadius(normalizeHighlightRadius(payload.highlightRadius));
    }
    if (typeof payload?.overlayBlendMode !== 'undefined') {
      setOverlayBlendMode(normalizeOverlayBlendMode(payload.overlayBlendMode));
    }
    if (typeof payload?.overlayOpacity !== 'undefined') {
      setOverlayOpacity(normalizeOverlayOpacity(payload.overlayOpacity));
    }
    if (typeof payload?.overlayVideo !== 'undefined') {
      setOverlayVideo(normalizeOverlayVideoSource(payload.overlayVideo));
    }
  }, []);

  const currentPayload = useMemo<SavedControlsPayload>(
    () => ({
      titleControls,
      tickerControls,
      eventControls,
      themeColor,
      highlightMode,
      highlightColor,
      highlightRadius,
      overlayBlendMode,
      overlayOpacity,
      overlayVideo,
    }),
    [
      eventControls,
      highlightColor,
      highlightMode,
      highlightRadius,
      overlayBlendMode,
      overlayOpacity,
      overlayVideo,
      themeColor,
      titleControls,
      tickerControls,
    ],
  );

  const syncControls = useCallback(
    async (payload: SavedControlsPayload, showStatus = false) => {
      const serialized = JSON.stringify(payload);
      lastSyncedPayloadRef.current = serialized;
      localStorage.setItem(STORAGE_KEY, serialized);
      window.dispatchEvent(
        new CustomEvent(STORAGE_EVENT, {
          detail: payload,
        }),
      );

      try {
        const response = await fetch(SHARED_SETTINGS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: serialized,
        });

        if (!response.ok) {
          throw new Error('Failed to save shared settings.');
        }

        if (showStatus) {
          setSaveMessage('Published to Presentation');
        }
      } catch {
        if (showStatus) {
          setSaveMessage('Saved Local Only');
        }
      }
    },
    [],
  );

  const saveControls = useCallback(async () => {
    await syncControls(currentPayload, true);
  }, [currentPayload, syncControls]);
  const titleTextStyle = useMemo(() => getTextStyle(titleControls), [titleControls]);
  const tickerTextStyle = useMemo(() => getTextStyle(tickerControls), [tickerControls]);
  const eventTextStyle = useMemo(() => getTextStyle(eventControls), [eventControls]);
  const eventSubTextStyle = useMemo(
    () => ({ ...eventTextStyle, fontSize: `calc(${eventTextStyle.fontSize} * 0.75)` }),
    [eventTextStyle],
  );
  const titleDisplayText = useMemo(
    () => formatDisplayText('RECONNECT:', titleControls.textTransform),
    [titleControls.textTransform],
  );
  const tickerDisplayText = useMemo(
    () => formatDisplayText(MOVEMENT_WORDS[activeWordIndex], tickerControls.textTransform),
    [activeWordIndex, tickerControls.textTransform],
  );
  const eventHeadlineText = useMemo(
    () => formatDisplayText(EVENT_HEADLINE, eventControls.textTransform),
    [eventControls.textTransform],
  );
  const eventSubheadText = useMemo(
    () => formatDisplayText(EVENT_SUBHEAD, eventControls.textTransform),
    [eventControls.textTransform],
  );
  const effectiveThemeColor = useMemo(
    () => (controlsEnabled ? themeColor : presentationThemeOverride ?? themeColor),
    [controlsEnabled, presentationThemeOverride, themeColor],
  );
  const eventHighlightColor = useMemo(
    () => (highlightMode === 'theme' ? effectiveThemeColor : highlightColor),
    [effectiveThemeColor, highlightColor, highlightMode],
  );
  const effectiveHeroStyle = useMemo<HeroStyleMode>(
    () => (controlsEnabled ? 'overlay' : presentationHeroStyle),
    [controlsEnabled, presentationHeroStyle],
  );
  const heroPhotoOpacity = useMemo(
    () => (effectiveHeroStyle === 'graphic' ? 0 : 1),
    [effectiveHeroStyle],
  );
  const heroOverlayStyle = useMemo(
    () => ({
      mixBlendMode: controlsEnabled
        ? overlayBlendMode
        : effectiveHeroStyle === 'overlay'
          ? ('multiply' as const)
          : ('normal' as const),
      opacity: controlsEnabled
        ? isOverlayPlaybackReady
          ? overlayOpacity
          : 0
        : effectiveHeroStyle === 'photo'
          ? 0
          : isOverlayPlaybackReady
            ? 1
            : 0,
      visibility:
        controlsEnabled || effectiveHeroStyle !== 'photo'
          ? isOverlayPlaybackReady
            ? ('visible' as const)
            : ('hidden' as const)
          : ('hidden' as const),
    }),
    [
      controlsEnabled,
      effectiveHeroStyle,
      isOverlayPlaybackReady,
      overlayBlendMode,
      overlayOpacity,
    ],
  );
  const visibleHeroSlide = useMemo(() => {
    if (heroSlides.length === 0) return -1;
    if (loadedHeroSlides.has(heroSlides[activeHeroSlide])) return activeHeroSlide;
    const firstLoaded = heroSlides.findIndex((src) => loadedHeroSlides.has(src));
    return firstLoaded >= 0 ? firstLoaded : 0;
  }, [activeHeroSlide, heroSlides, loadedHeroSlides]);
  const overlayVideoSelectOptions = useMemo(() => {
    const options = new Map<string, string>();
    overlayVideoOptions.forEach((item) => {
      options.set(item.url, item.filename);
    });
    return Array.from(options.entries()).map(([url, filename]) => ({ url, filename }));
  }, [overlayVideoOptions]);
  const selectedOverlayVideoOption = useMemo(
    () =>
      overlayVideoSelectOptions.some((item) => item.url === overlayVideo)
        ? overlayVideo
        : '',
    [overlayVideo, overlayVideoSelectOptions],
  );
  const applyOverlayVideoInput = useCallback(() => {
    setOverlayVideo(normalizeOverlayVideoSource(overlayVideoInput));
  }, [overlayVideoInput]);

  useEffect(() => {
    setHeroSlides(shuffleList(HERO_SLIDES));
    setActiveHeroSlide(0);
    setActiveWordIndex(0);
  }, []);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
      setActiveWordIndex((current) => (current + 1) % MOVEMENT_WORDS.length);
    }, HERO_CYCLE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    let active = true;
    heroSlides.forEach((src) => {
      const image = new window.Image();
      image.decoding = 'async';
      image.src = src;
      const handleLoad = () => {
        if (!active) return;
        setLoadedHeroSlides((current) => {
          if (current.has(src)) return current;
          const next = new Set(current);
          next.add(src);
          return next;
        });
      };
      image.onload = handleLoad;
      if (image.complete) {
        handleLoad();
      }
    });

    return () => {
      active = false;
    };
  }, [heroSlides]);

  useEffect(() => {
    let active = true;

    const loadControls = async () => {
      let loadedPayload: SavedControlsPayload | null = null;
      try {
        try {
          const response = await fetch(SHARED_SETTINGS_ENDPOINT, { cache: 'no-store' });
          if (response.ok) {
            const parsed = (await response.json()) as SavedControlsPayload;
            if (active && hasSavedControls(parsed)) {
              applySavedControls(parsed);
              loadedPayload = parsed;
            }
          }
        } catch {
          // Fallback below.
        }

        if (!loadedPayload) {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved || !active) return;

          try {
            const parsed = JSON.parse(saved) as SavedControlsPayload;
            if (active) {
              applySavedControls(parsed);
              loadedPayload = parsed;
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } finally {
        if (active) {
          lastSyncedPayloadRef.current = JSON.stringify(
            loadedPayload ?? {
              titleControls: DEFAULT_TITLE_CONTROLS,
              tickerControls: DEFAULT_TICKER_CONTROLS,
              eventControls: DEFAULT_EVENT_CONTROLS,
              themeColor: DEFAULT_THEME_COLOR,
              highlightMode: DEFAULT_HIGHLIGHT_MODE,
              highlightColor: DEFAULT_HIGHLIGHT_COLOR,
              highlightRadius: DEFAULT_HIGHLIGHT_RADIUS,
              overlayBlendMode: DEFAULT_OVERLAY_BLEND_MODE,
              overlayOpacity: DEFAULT_OVERLAY_OPACITY,
              overlayVideo: DEFAULT_HERO_OVERLAY_VIDEO,
            },
          );
          setIsHydrated(true);
        }
      }
    };

    void loadControls();

    return () => {
      active = false;
    };
  }, [applySavedControls]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue) as SavedControlsPayload;
        applySavedControls(payload);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    const onCustomUpdate = (event: Event) => {
      const payload = (event as CustomEvent<SavedControlsPayload>).detail;
      if (!payload) return;
      applySavedControls(payload);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_EVENT, onCustomUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_EVENT, onCustomUpdate as EventListener);
    };
  }, [applySavedControls]);

  useEffect(() => {
    if (!controlsEnabled || !isHydrated) return;

    const serialized = JSON.stringify(currentPayload);
    if (serialized === lastSyncedPayloadRef.current) return;

    lastSyncedPayloadRef.current = serialized;
    localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENT, {
        detail: currentPayload,
      }),
    );
  }, [controlsEnabled, currentPayload, isHydrated]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(''), 1500);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    setOverlayVideoInput(overlayVideo);
  }, [overlayVideo]);

  useEffect(() => {
    if (!controlsEnabled || !isControlsOpen) return;
    let cancelled = false;

    const loadOverlayVideos = async () => {
      try {
        const response = await fetch(OVERLAY_VIDEO_OPTIONS_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Unable to load exported videos (${response.status})`);
        }

        const payload = await response.json();
        const items = Array.isArray(payload?.items)
          ? payload.items
              .map((item: unknown) => normalizeOverlayVideoItem(item))
              .filter(Boolean) as OverlayVideoItem[]
          : [];
        const filteredItems = items.filter((item) => isOverlaySourceVideoAllowed(item.filename));

        if (!cancelled) {
          setOverlayVideoOptions(filteredItems);
        }
      } catch {
        if (!cancelled) {
          setOverlayVideoOptions([]);
        }
      }
    };

    void loadOverlayVideos();

    return () => {
      cancelled = true;
    };
  }, [controlsEnabled, isControlsOpen]);

  useEffect(() => {
    const video = overlayVideoRef.current;
    if (!video) return;

    let retryTimer: number | null = null;

    const hardenVideoElement = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = false;
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x-webkit-airplay', 'deny');
      video.setAttribute('disableremoteplayback', 'true');
      video.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback nofullscreen');
    };

    const markOverlayReady = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || !video.paused) {
        setIsOverlayPlaybackReady(true);
      }
    };

    const attemptPlay = () => {
      hardenVideoElement();
      markOverlayReady();
      const maybePromise = video.play();
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise
          .then(() => {
            setIsOverlayPlaybackReady(true);
          })
          .catch(() => {});
      } else if (!video.paused) {
        setIsOverlayPlaybackReady(true);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        attemptPlay();
      }
    };

    const handleLoadedData = () => {
      markOverlayReady();
      attemptPlay();
    };
    const handlePlaying = () => {
      setIsOverlayPlaybackReady(true);
    };

    const handlePause = () => {
      if (document.visibilityState === 'visible') {
        attemptPlay();
      }
    };

    const handleBuffering = () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        setIsOverlayPlaybackReady(false);
      }
    };

    setIsOverlayPlaybackReady(false);
    hardenVideoElement();
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleBuffering);
    video.addEventListener('stalled', handleBuffering);
    video.addEventListener('emptied', handleBuffering);
    document.addEventListener('visibilitychange', handleVisibility);
    attemptPlay();

    retryTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && video.paused) {
        attemptPlay();
      }
    }, 900);

    return () => {
      if (retryTimer !== null) {
        window.clearInterval(retryTimer);
      }
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleBuffering);
      video.removeEventListener('stalled', handleBuffering);
      video.removeEventListener('emptied', handleBuffering);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [overlayVideo]);

  useEffect(() => {
    const root = document.documentElement;
    const rgbTriplet = hexToRgbTriplet(effectiveThemeColor);
    root.style.setProperty('--signal', effectiveThemeColor);
    root.style.setProperty('--signal-rgb', rgbTriplet);
  }, [effectiveThemeColor]);

  return (
    <section
      id="home"
      className="relative w-full border-y border-[rgb(var(--signal-rgb)/1)] text-[var(--signal)]"
      style={{
        backgroundColor: '#000',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {heroSlides.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{ opacity: index === visibleHeroSlide ? heroPhotoOpacity : 0 }}
            onLoad={() =>
              setLoadedHeroSlides((current) => {
                if (current.has(src)) return current;
                const next = new Set(current);
                next.add(src);
                return next;
              })
            }
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            decoding="async"
            draggable={false}
          />
        ))}
        <video
          ref={overlayVideoRef}
          className="hero-overlay-video pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={heroOverlayStyle}
          src={overlayVideo}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
          aria-hidden="true"
          tabIndex={-1}
          preload="auto"
        />
        <div className="absolute inset-0" style={{ backgroundColor: effectiveThemeColor, mixBlendMode: 'multiply' }} />
      </div>

      {controlsEnabled ? (
        <button
          type="button"
          onClick={() => setIsControlsOpen((current) => !current)}
          className="absolute right-3 top-3 z-50 rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--signal)] backdrop-blur-sm"
        >
          {isControlsOpen ? 'Hide Controls' : 'Show Controls'}
        </button>
      ) : null}

      {controlsEnabled && isControlsOpen ? (
        <div className="absolute right-3 top-14 z-50 w-[min(95vw,420px)] rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/70 p-3 text-left text-[var(--signal)] backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.25em]">Text Controls</p>
            <div className="flex items-center gap-2">
              {saveMessage ? <span className="text-[10px] uppercase tracking-[0.2em]">{saveMessage}</span> : null}
              <button
                type="button"
                onClick={saveControls}
                className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em]"
              >
                Save
              </button>
            </div>
          </div>
          <div className="mb-2">
            <ColorSwatchField label="Theme Color" value={themeColor} onChange={setThemeColor} />
          </div>
          <fieldset className="mb-2 rounded border border-[rgb(var(--signal-rgb)/0.45)] p-2">
            <legend className="px-1 text-[10px] uppercase tracking-[0.2em]">Overlay Video</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em] sm:col-span-2">
                Source Video
                <StyledDropdown
                  value={selectedOverlayVideoOption}
                  onChange={(value) => {
                    if (!value) return;
                    setOverlayVideo(normalizeOverlayVideoSource(value));
                  }}
                  options={
                    overlayVideoSelectOptions.length
                      ? overlayVideoSelectOptions.map((item) => ({
                          value: item.url,
                          label: item.filename,
                        }))
                      : [{ value: '', label: 'No 1920 exports found' }]
                  }
                  tone="dark"
                  className="w-full min-w-0"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em] sm:col-span-2">
                Path (in /exports)
                <div className="flex gap-2">
                  <input
                    className="h-8 min-w-0 flex-1 rounded border border-[rgb(var(--signal-rgb)/0.35)] bg-black/80 px-2 text-xs normal-case tracking-normal"
                    type="text"
                    value={overlayVideoInput}
                    onChange={(event) => setOverlayVideoInput(event.target.value)}
                    onBlur={applyOverlayVideoInput}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyOverlayVideoInput();
                      }
                    }}
                    placeholder="/exports/example.mp4"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={applyOverlayVideoInput}
                    className="h-8 rounded border border-[rgb(var(--signal-rgb)/0.4)] bg-black/90 px-2 text-[9px] uppercase tracking-[0.14em]"
                  >
                    Apply
                  </button>
                </div>
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em] sm:col-span-2">
                Blend Mode
                <StyledDropdown
                  value={overlayBlendMode}
                  onChange={(value) => setOverlayBlendMode(normalizeOverlayBlendMode(value))}
                  options={OVERLAY_BLEND_MODES.map((mode) => ({
                    value: mode,
                    label: mode,
                  }))}
                  tone="dark"
                  className="w-full min-w-0"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em] sm:col-span-2">
                Overlay Opacity ({Math.round(overlayOpacity * 100)}%)
                <input
                  className="signal-slider h-8 appearance-none bg-transparent"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={overlayOpacity}
                  style={{ WebkitAppearance: 'none', appearance: 'none' }}
                  onChange={(event) => setOverlayOpacity(normalizeOverlayOpacity(event.target.value))}
                />
              </label>
            </div>
          </fieldset>
          <fieldset className="mb-2 rounded border border-[rgb(var(--signal-rgb)/0.45)] p-2">
            <legend className="px-1 text-[10px] uppercase tracking-[0.2em]">Highlight</legend>
            <div className="mb-2">
              <ToggleField
                label="Tie To Theme Color"
                enabled={highlightMode === 'theme'}
                onToggle={() => setHighlightMode((current) => (current === 'theme' ? 'custom' : 'theme'))}
              />
            </div>
            <ColorSwatchField
              label="Highlight Color"
              value={eventHighlightColor}
              disabled={highlightMode === 'theme'}
              onChange={setHighlightColor}
            />
            <label className="mt-2 flex flex-col gap-1 text-[10px] uppercase tracking-[0.15em]">
              Highlight Rounding ({highlightRadius}px)
              <input
                className="signal-slider h-8 appearance-none bg-transparent"
                type="range"
                min="0"
                max="24"
                step="1"
                value={highlightRadius}
                style={{ WebkitAppearance: 'none', appearance: 'none' }}
                onChange={(event) => setHighlightRadius(normalizeHighlightRadius(event.target.value))}
              />
            </label>
          </fieldset>
          <div className="space-y-2">
            <TextStyleControls
              label="Event Text"
              controls={eventControls}
              onChange={updateEventControls}
            />
            <TextStyleControls
              label="Hero Title"
              controls={titleControls}
              onChange={updateTitleControls}
            />
            <TextStyleControls
              label="Ticker Text"
              controls={tickerControls}
              onChange={updateTickerControls}
            />
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-[85vh] w-full max-w-7xl flex-col items-center justify-center gap-8 px-6 py-16 text-center md:py-20">
        <div className="space-y-2">
          <p className="leading-tight">
            <span
              className="inline-block px-2 py-1"
              style={{ ...eventTextStyle, backgroundColor: eventHighlightColor, borderRadius: `${highlightRadius}px` }}
            >
              {eventHeadlineText}
            </span>
          </p>
          <p className="leading-tight">
            <span
              className="inline-block px-2 py-1"
              style={{ ...eventSubTextStyle, backgroundColor: eventHighlightColor, borderRadius: `${highlightRadius}px` }}
            >
              {eventSubheadText}
            </span>
          </p>
        </div>
        <h1 className="leading-none" style={titleTextStyle}>
          {titleDisplayText}
        </h1>
        <MatrixWordTicker word={tickerDisplayText} textStyle={tickerTextStyle} />
      </div>

      {!controlsEnabled ? (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <div className="rounded border border-[rgb(var(--signal-rgb)/0.6)] bg-black/70 px-2 py-1.5 backdrop-blur-sm">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex items-center gap-1.5">
                {PRESENTATION_THEME_OVERRIDES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setPresentationThemeOverride(color)}
                    className={`h-5 w-5 rounded border ${
                      effectiveThemeColor === color
                        ? 'border-[rgb(var(--signal-rgb)/0.95)]'
                        : 'border-[rgb(var(--signal-rgb)/0.45)]'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Set presentation theme color ${color}`}
                  />
                ))}
              </div>
              <label className="flex min-w-[150px] flex-col gap-1 text-[9px] uppercase tracking-[0.15em] text-[var(--signal)]">
                Hero Style
                <StyledDropdown
                  value={presentationHeroStyle}
                  onChange={(value) => setPresentationHeroStyle(value as HeroStyleMode)}
                  options={HERO_STYLE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  tone="dark"
                  className="min-w-[150px]"
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
