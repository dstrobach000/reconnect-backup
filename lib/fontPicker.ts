export const FONT_PICKER_STORAGE_KEY = 'reconnect-font-picker-v1';
export const FONT_PICKER_ENDPOINT = '/api/font-picker';

export const DISPLAY_FONT_OPTIONS = [
  { id: 'mekanikal', label: 'Mekanikal', fontFamily: 'var(--font-mekanikal)' },
  { id: 'hofmann', label: 'Hofmann', fontFamily: 'var(--font-hofmann)' },
  { id: 'ofform', label: 'Ofform', fontFamily: 'var(--font-ofform)' },
] as const;

export const SUPPORTING_FONT_OPTIONS = [
  { id: 'documan', label: 'Documan', fontFamily: 'var(--font-documan)' },
  { id: 'dazzed', label: 'Dazzed', fontFamily: 'var(--font-dazzed)' },
  { id: 'lazzer', label: 'Lazzer', fontFamily: 'var(--font-lazzer)' },
  { id: 'newedge666', label: 'NewEdge666', fontFamily: 'var(--font-newedge666)' },
  { id: 'roobertmono', label: 'Roobert Mono', fontFamily: 'var(--font-roobertmono)' },
] as const;

export const RADAR_GLYPH_OPTIONS = [
  { id: 'crosshair', label: 'Crosshair' },
  { id: 'squares', label: 'Squares' },
  { id: 'sonarWave', label: 'Sonar Wave' },
  { id: 'compassGrid', label: 'Compass Grid' },
  { id: 'radarSector', label: 'Radar Sector' },
  { id: 'matrixGrid', label: 'Matrix Grid' },
  { id: 'networkMesh', label: 'Network Mesh' },
  { id: 'reconnectBridge', label: 'Reconnect Bridge' },
  { id: 'updown', label: 'Up / Down' },
  { id: 'sun', label: 'Sun' },
] as const;

export type FontPickerSettings = {
  displayFont: string;
  supportingFont: string;
  glyph: string;
};

export const DEFAULT_FONT_PICKER_SETTINGS: FontPickerSettings = {
  displayFont: 'mekanikal',
  supportingFont: 'roobertmono',
  glyph: 'crosshair',
};

const DISPLAY_FONT_IDS = new Set<string>(DISPLAY_FONT_OPTIONS.map((option) => option.id));
const SUPPORTING_FONT_IDS = new Set<string>(SUPPORTING_FONT_OPTIONS.map((option) => option.id));
const RADAR_GLYPH_IDS = new Set<string>(RADAR_GLYPH_OPTIONS.map((option) => option.id));

type RawSettings = {
  displayFont?: unknown;
  supportingFont?: unknown;
  glyph?: unknown;
};

export function normalizeFontPickerSettings(raw: RawSettings | null | undefined): FontPickerSettings {
  const displayFont =
    typeof raw?.displayFont === 'string' && DISPLAY_FONT_IDS.has(raw.displayFont)
      ? raw.displayFont
      : DEFAULT_FONT_PICKER_SETTINGS.displayFont;
  const supportingFont =
    typeof raw?.supportingFont === 'string' && SUPPORTING_FONT_IDS.has(raw.supportingFont)
      ? raw.supportingFont
      : DEFAULT_FONT_PICKER_SETTINGS.supportingFont;
  const glyph =
    typeof raw?.glyph === 'string' && RADAR_GLYPH_IDS.has(raw.glyph)
      ? raw.glyph
      : DEFAULT_FONT_PICKER_SETTINGS.glyph;

  return {
    displayFont,
    supportingFont,
    glyph,
  };
}

export function getDisplayFontFamily(displayFontId: string) {
  return (
    DISPLAY_FONT_OPTIONS.find((option) => option.id === displayFontId)?.fontFamily ||
    DISPLAY_FONT_OPTIONS[0].fontFamily
  );
}

export function getSupportingFontFamily(supportingFontId: string) {
  return (
    SUPPORTING_FONT_OPTIONS.find((option) => option.id === supportingFontId)?.fontFamily ||
    SUPPORTING_FONT_OPTIONS[0].fontFamily
  );
}
