import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'hero-text-style.json');
const LEGACY_DATA_FILE = path.join(process.cwd(), '.data', 'hero-text-style.json');
const MODE_VALUES = new Set(['fill', 'stroke', 'fill-stroke']);
const TRANSFORM_VALUES = new Set(['none', 'uppercase', 'lowercase', 'capitalize']);
const HIGHLIGHT_MODE_VALUES = new Set(['theme', 'custom']);
const OVERLAY_BLEND_MODE_VALUES = new Set(['screen', 'overlay', 'lighten', 'soft-light', 'multiply', 'normal']);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const OVERLAY_VIDEO_PATH = /^\/exports\/(?!.*\.\.)[^?#]+\.(mp4)$/i;

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function sanitizeControls(input: unknown) {
  if (!input || typeof input !== 'object') return undefined;

  const data = input as Record<string, unknown>;
  const mode = typeof data.mode === 'string' && MODE_VALUES.has(data.mode) ? data.mode : undefined;
  const textTransform =
    typeof data.textTransform === 'string' && TRANSFORM_VALUES.has(data.textTransform)
      ? data.textTransform
      : undefined;

  return {
    fontFamily: typeof data.fontFamily === 'string' ? data.fontFamily : undefined,
    color: typeof data.color === 'string' ? data.color : undefined,
    mode,
    strokeWidth: toFiniteNumber(data.strokeWidth),
    fontSize: toFiniteNumber(data.fontSize),
    mobileScale: toFiniteNumber(data.mobileScale),
    letterSpacing: toFiniteNumber(data.letterSpacing),
    textTransform,
  };
}

function sanitizeThemeColor(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const color = value.trim();
  return HEX_COLOR.test(color) ? color.toLowerCase() : undefined;
}

function sanitizeHighlightMode(value: unknown) {
  if (typeof value !== 'string') return undefined;
  return HIGHLIGHT_MODE_VALUES.has(value) ? value : undefined;
}

function sanitizeOverlayBlendMode(value: unknown) {
  if (typeof value !== 'string') return undefined;
  return OVERLAY_BLEND_MODE_VALUES.has(value) ? value : undefined;
}

function sanitizeOverlayVideo(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const source = value.trim();
  return OVERLAY_VIDEO_PATH.test(source) ? source : undefined;
}

async function readPayload() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    try {
      const rawLegacy = await fs.readFile(LEGACY_DATA_FILE, 'utf8');
      return JSON.parse(rawLegacy);
    } catch (legacyError) {
      if ((legacyError as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw legacyError;
    }
  }
}

export async function GET() {
  try {
    const payload = await readPayload();
    return NextResponse.json(payload ?? {}, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to load hero text style settings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = {
      titleControls: sanitizeControls(body?.titleControls),
      tickerControls: sanitizeControls(body?.tickerControls),
      eventControls: sanitizeControls(body?.eventControls),
      themeColor: sanitizeThemeColor(body?.themeColor),
      highlightMode: sanitizeHighlightMode(body?.highlightMode),
      highlightColor: sanitizeThemeColor(body?.highlightColor),
      highlightRadius: toFiniteNumber(body?.highlightRadius),
      overlayBlendMode: sanitizeOverlayBlendMode(body?.overlayBlendMode),
      overlayOpacity: toFiniteNumber(body?.overlayOpacity),
      overlayVideo: sanitizeOverlayVideo(body?.overlayVideo),
      updatedAt: new Date().toISOString(),
    };

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');

    return NextResponse.json({ ok: true, ...payload }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to save hero text style settings.' }, { status: 500 });
  }
}
