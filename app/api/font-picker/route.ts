import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { normalizeFontPickerSettings } from '../../../lib/fontPicker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'font-picker.json');

async function readPayload() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function GET() {
  try {
    const payload = await readPayload();
    return NextResponse.json(payload ?? {}, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to load font picker settings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalized = normalizeFontPickerSettings(body);
    const payload = {
      ...normalized,
      updatedAt: new Date().toISOString(),
    };

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to save font picker settings.' }, { status: 500 });
  }
}
