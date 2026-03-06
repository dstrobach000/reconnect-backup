import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { normalizeComposerRecipe } from './symbolComposer';

const REMOTION_ENTRY = path.join(process.cwd(), 'remotion', 'index.ts');
const EXPORT_DIR = path.join(process.cwd(), 'public', 'exports');
const EXPORT_FPS = 25;
const VALID_RESOLUTIONS = [512, 720, 1080, 1920, 3508] as const;
const GRID_VIDEO_RESOLUTION = 512;
const GRID_VIDEO_LIMIT = 512;
const GRID_VIDEO_NAME_PATTERN = new RegExp(`^${GRID_VIDEO_RESOLUTION}_.+\\.mp4$`, 'i');
const ANY_EXPORT_VIDEO_PATTERN = /\.mp4$/i;
const ALL_VIDEO_LIMIT = 2048;

type ExportFormat = 'mp4' | 'png';
type ExportResolution = (typeof VALID_RESOLUTIONS)[number];

let bundlePromise: Promise<string> | null = null;

function sanitizeNameSegment(value: unknown): string {
  if (typeof value !== 'string') return 'symbol';
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized || 'symbol';
}

function getExportPrefix(recipe: ReturnType<typeof normalizeComposerRecipe>): string {
  const firstLayerType =
    Array.isArray(recipe?.layers) && recipe.layers.length
      ? recipe.layers[0]?.type
      : 'symbol';
  return sanitizeNameSegment(firstLayerType);
}

async function getServeUrl(): Promise<string> {
  const shouldCacheBundle = process.env.NODE_ENV === 'production';

  if (!shouldCacheBundle) {
    const { bundle } = await import('@remotion/bundler');
    return bundle({
      entryPoint: REMOTION_ENTRY,
      onProgress: () => undefined,
    });
  }

  if (!bundlePromise) {
    const { bundle } = await import('@remotion/bundler');
    bundlePromise = bundle({
      entryPoint: REMOTION_ENTRY,
      onProgress: () => undefined,
    });
  }
  return bundlePromise;
}

async function createExportName(
  resolution: number,
  prefix: string,
  extension: 'mp4' | 'png',
): Promise<string> {
  const entries = await fs
    .readdir(EXPORT_DIR, { withFileTypes: true })
    .catch((error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    });

  let maxSequence = 0;
  const matcher = new RegExp(`^${resolution}_${prefix}_(\\d+)\\.[a-z0-9]+$`);

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(matcher);
    if (!match) continue;
    const parsed = Number.parseInt(match[1] ?? '', 10);
    if (Number.isFinite(parsed)) {
      maxSequence = Math.max(maxSequence, parsed);
    }
  }

  let candidate = maxSequence + 1;
  while (true) {
    const suffix = String(candidate).padStart(2, '0');
    const filename = `${resolution}_${prefix}_${suffix}.${extension}`;
    try {
      await fs.access(path.join(EXPORT_DIR, filename));
      candidate += 1;
    } catch {
      return filename;
    }
  }
}

function validateResolution(value: unknown): ExportResolution {
  const n = Number(value);
  if ((VALID_RESOLUTIONS as readonly number[]).includes(n)) return n as ExportResolution;
  return 512;
}

export type ExportRequest = {
  recipe: unknown;
  format: string;
  width: number;
  height: number;
  filterResolution?: number;
  stillTimeSeconds?: number;
};

export type ExportResult = {
  ok: true;
  format: ExportFormat;
  url: string;
  durationInFrames: number;
  fps: number;
  loopSeconds: number;
};

function getEncodingSettings(resolution: number) {
  if (resolution >= 1920) {
    return {
      x264Preset: 'slow' as const,
      videoBitrate: '1200K' as const,
      encodingMaxRate: '2000K' as const,
      encodingBufferSize: '2500K' as const,
    };
  }
  if (resolution >= 1080) {
    return {
      x264Preset: 'slow' as const,
      videoBitrate: '1000K' as const,
      encodingMaxRate: '1500K' as const,
      encodingBufferSize: '2000K' as const,
    };
  }
  if (resolution >= 720) {
    return {
      x264Preset: 'slow' as const,
      videoBitrate: '600K' as const,
      encodingMaxRate: '1000K' as const,
      encodingBufferSize: '1200K' as const,
    };
  }
  return {
    x264Preset: 'slow' as const,
    videoBitrate: '400K' as const,
    encodingMaxRate: '700K' as const,
    encodingBufferSize: '800K' as const,
  };
}

export async function renderExport(
  input: ExportRequest,
  onProgress?: (fraction: number) => void,
): Promise<ExportResult> {
  const normalizedRecipe = normalizeComposerRecipe(input.recipe);
  const format: ExportFormat = input.format === 'png' ? 'png' : 'mp4';
  const resolution = validateResolution(input.width);
  if (format === 'mp4' && resolution > 1920) {
    throw new Error('3508 exports are available for PNG only.');
  }
  const width = resolution;
  const height = resolution;
  const fps = EXPORT_FPS;
  const filterResolution = Math.round(
    Math.min(4096, Math.max(128, Number(input.filterResolution) || resolution)),
  );
  const exportPrefix = getExportPrefix(normalizedRecipe);
  const durationInFrames = Math.max(
    12,
    Math.min(60 * 180, Math.round(normalizedRecipe.loopSeconds * fps)),
  );

  await fs.mkdir(EXPORT_DIR, { recursive: true });
  const serveUrl = await getServeUrl();
  const { renderMedia, renderStill, selectComposition } = await import(
    '@remotion/renderer'
  );

  const inputProps = {
    recipe: normalizedRecipe,
    width,
    height,
    fps,
    durationInFrames,
    filterResolution,
  };

  const composition = await selectComposition({
    serveUrl,
    id: 'SymbolLoop',
    inputProps,
  });

  if (format === 'png') {
    const filename = await createExportName(resolution, exportPrefix, 'png');
    const outputPath = path.join(EXPORT_DIR, filename);
    const loopSeconds = Math.max(0.1, Number(normalizedRecipe.loopSeconds) || durationInFrames / fps);
    const requestedStillTime = Number(input.stillTimeSeconds);
    const wrappedStillTime = Number.isFinite(requestedStillTime)
      ? ((requestedStillTime % loopSeconds) + loopSeconds) % loopSeconds
      : loopSeconds * 0.5;
    const stillFrame = Math.max(
      0,
      Math.min(durationInFrames - 1, Math.round(wrappedStillTime * fps)),
    );

    await renderStill({
      serveUrl,
      composition,
      inputProps,
      output: outputPath,
      frame: stillFrame,
      imageFormat: 'png',
      chromiumOptions: { gl: 'angle' },
    });

    return {
      ok: true,
      format: 'png',
      url: `/exports/${filename}`,
      durationInFrames,
      fps,
      loopSeconds: normalizedRecipe.loopSeconds,
    };
  }

  const filename = await createExportName(resolution, exportPrefix, 'mp4');
  const outputPath = path.join(EXPORT_DIR, filename);
  const cpuConcurrency = Math.max(1, (os.cpus()?.length || 4) - 1);

  const encodingForResolution = getEncodingSettings(resolution);

  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    outputLocation: outputPath,
    ...encodingForResolution,
    pixelFormat: 'yuv420p',
    imageFormat: 'jpeg',
    jpegQuality: 80,
    concurrency: cpuConcurrency,
    muted: true,
    chromiumOptions: { gl: 'angle' },
    onProgress: ({ progress }) => {
      onProgress?.(progress);
    },
  });

  return {
    ok: true,
    format: 'mp4',
    url: `/exports/${filename}`,
    durationInFrames,
    fps,
    loopSeconds: normalizedRecipe.loopSeconds,
  };
}

async function listVideosByPattern(namePattern: RegExp, limit: number) {
  const entries = await fs
    .readdir(EXPORT_DIR, { withFileTypes: true })
    .catch((error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    });

  const files = entries
    .filter((entry) => entry.isFile() && namePattern.test(entry.name))
    .map((entry) => entry.name);

  const filesWithMeta = (
    await Promise.all(
      files.map(async (filename) => {
        try {
          const stats = await fs.stat(path.join(EXPORT_DIR, filename));
          return {
            filename,
            url: `/exports/${encodeURIComponent(filename)}`,
            modifiedAt: stats.mtimeMs,
          };
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean) as Array<{
    filename: string;
    url: string;
    modifiedAt: number;
  }>;

  return filesWithMeta
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
    .slice(0, limit)
    .map(({ filename, url }) => ({ filename, url }));
}

export async function listExportedVideos() {
  return listVideosByPattern(GRID_VIDEO_NAME_PATTERN, GRID_VIDEO_LIMIT);
}

export async function listAllExportedVideos() {
  return listVideosByPattern(ANY_EXPORT_VIDEO_PATTERN, ALL_VIDEO_LIMIT);
}
