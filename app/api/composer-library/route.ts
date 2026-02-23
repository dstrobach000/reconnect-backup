import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { normalizeComposerRecipe } from '../../../lib/symbolComposer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'composer-library.json');

type SavedComposerItem = {
  id: string;
  createdAt: number;
  recipe: ReturnType<typeof normalizeComposerRecipe>;
};

function normalizeSavedItem(input: unknown): SavedComposerItem | null {
  if (!input || typeof input !== 'object') return null;
  const data = input as Record<string, unknown>;
  if (!data.recipe) return null;

  return {
    id: typeof data.id === 'string' && data.id ? data.id : `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: Number(data.createdAt) || Date.now(),
    recipe: normalizeComposerRecipe(data.recipe),
  };
}

function mergeItems(primaryItems: SavedComposerItem[], secondaryItems: SavedComposerItem[] = []): SavedComposerItem[] {
  const byId = new Map<string, SavedComposerItem>();
  [...primaryItems, ...secondaryItems].forEach((item) => {
    const normalized = normalizeSavedItem(item);
    if (!normalized) return;
    byId.set(normalized.id, normalized);
  });
  return Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt);
}

async function readItems(): Promise<SavedComposerItem[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return mergeItems(parsed as SavedComposerItem[]);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeItems(items: SavedComposerItem[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function removeItemsByIds(items: SavedComposerItem[], ids: string[]) {
  if (!ids.length) return items;
  const idSet = new Set(ids);
  return items.filter((item) => !idSet.has(item.id));
}

export async function GET() {
  try {
    const items = await readItems();
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to load composer library.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await readItems();

    const submitted = Array.isArray(body?.items) ? body.items : [body];
    const incoming = submitted
      .map((item: unknown) => normalizeSavedItem(item))
      .filter(Boolean) as SavedComposerItem[];
    const next = mergeItems(existing, incoming);

    await writeItems(next);

    return NextResponse.json(
      {
        ok: true,
        item: incoming[incoming.length - 1] || null,
        items: next,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to save composer library item.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const submitted = Array.isArray(body?.items) ? body.items : [];
    const items = mergeItems(submitted as SavedComposerItem[]);
    await writeItems(items);

    return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to replace composer library.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const queryId = url.searchParams.get('id');

    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body?.ids)) {
        bodyIds = body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
      }
    } catch {
      bodyIds = [];
    }

    const ids = Array.from(new Set([...(queryId ? [queryId] : []), ...bodyIds]));
    if (!ids.length) {
      return NextResponse.json({ error: 'Missing id(s) to delete.' }, { status: 400 });
    }

    const existing = await readItems();
    const next = removeItemsByIds(existing, ids);
    await writeItems(next);

    return NextResponse.json(
      {
        ok: true,
        deletedIds: ids,
        items: next,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to delete composer library item.' }, { status: 500 });
  }
}
