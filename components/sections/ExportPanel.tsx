'use client';

import { useCallback, useEffect, useState } from 'react';
import StyledDropdown from './StyledDropdown';

const COMPOSER_EXPORT_API = '/api/composer-export';
const RESOLUTION_PRESETS = [
  { value: '512', label: '512 px' },
  { value: '720', label: '720 px' },
  { value: '1080', label: '1080 px' },
  { value: '1920', label: '1920 px' },
  { value: '3508', label: '3508 px (PNG)' },
];

type ExportPanelProps = {
  recipe: Record<string, unknown>;
  stillTimeSeconds?: number;
};

function computeTimeoutMs(resolution: number, loopSeconds: number): number {
  const pixelFactor = (resolution * resolution) / (512 * 512);
  const loopFactor = Math.max(1, loopSeconds / 8);
  return Math.round(
    Math.min(900_000, Math.max(120_000, 120_000 + pixelFactor * 40_000 + loopFactor * 30_000)),
  );
}

async function readNdjsonStream(
  response: Response,
  onProgress: (fraction: number) => void,
): Promise<Record<string, unknown>> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: Record<string, unknown> | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if ('progress' in parsed) {
          onProgress(parsed.progress);
        } else {
          result = parsed;
        }
      } catch {
        // malformed line, skip
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if ('progress' in parsed) {
        onProgress(parsed.progress);
      } else {
        result = parsed;
      }
    } catch {
      // malformed trailing data
    }
  }

  if (!result) throw new Error('No result received from server');
  return result;
}

export default function ExportPanel({
  recipe,
  stillTimeSeconds = 0,
}: ExportPanelProps) {
  const [resolution, setResolution] = useState('512');
  const [formatInFlight, setFormatInFlight] = useState<null | 'mp4' | 'png'>(
    null,
  );
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const isPrintStillResolution = resolution === '3508';

  useEffect(() => {
    if (!statusMessage || formatInFlight) return;
    if (/failed/i.test(statusMessage)) return;
    const timer = setTimeout(() => setStatusMessage(''), 12000);
    return () => clearTimeout(timer);
  }, [statusMessage, formatInFlight]);

  const exportSymbol = useCallback(
    async (format: 'mp4' | 'png') => {
      if (formatInFlight) return;
      setFormatInFlight(format);
      setProgress(0);
      setStatusMessage('');

      const res = Number(resolution);
      const loopSeconds = Number(recipe?.loopSeconds) || 8;
      const timeoutMs = computeTimeoutMs(res, loopSeconds);

      if (format === 'mp4' && res > 1920) {
        setFormatInFlight(null);
        setStatusMessage('3508 export is PNG only');
        return;
      }

      let didTimeout = false;
      let timeoutId: number | null = null;

      try {
        const controller = new AbortController();
        timeoutId = window.setTimeout(() => {
          didTimeout = true;
          controller.abort();
        }, timeoutMs);

        const response = await fetch(COMPOSER_EXPORT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            format,
            recipe,
            width: res,
            height: res,
            filterResolution: Math.min(res, 4096),
            stillTimeSeconds: format === 'png' ? stillTimeSeconds : undefined,
          }),
        });

        window.clearTimeout(timeoutId);
        timeoutId = null;

        if (!response.ok || !response.body) {
          const text = await response.text();
          let details = 'Export failed';
          try {
            const parsed = JSON.parse(text);
            details = parsed?.details || parsed?.error || details;
          } catch {
            // not JSON
          }
          throw new Error(details);
        }

        const payload = await readNdjsonStream(response, (fraction) => {
          setProgress(fraction);
        });

        if (payload.error) {
          throw new Error(
            (payload.details as string) ||
              (payload.error as string) ||
              'Export failed',
          );
        }

        if (!payload.url) {
          throw new Error('Export completed but no URL returned');
        }

        setProgress(1);

        const downloadLink = document.createElement('a');
        downloadLink.href = payload.url as string;
        downloadLink.download =
          (payload.url as string).split('/').pop() || `symbol.${format}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        const exportedSeconds =
          Number(payload.durationInFrames) > 0 && Number(payload.fps) > 0
            ? Number(payload.durationInFrames) / Number(payload.fps)
            : loopSeconds;
        setStatusMessage(
          `${format.toUpperCase()} exported (${exportedSeconds.toFixed(2)}s @ ${payload.fps}fps)`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        if (didTimeout) {
          setStatusMessage(
            `Export ${format.toUpperCase()} failed: timed out after ${Math.round(timeoutMs / 1000)}s. Try lower resolution.`,
          );
        } else {
          setStatusMessage(
            `Export ${format.toUpperCase()} failed: ${message}`,
          );
        }
      } finally {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        setFormatInFlight(null);
        setProgress(0);
      }
    },
    [formatInFlight, recipe, resolution, stillTimeSeconds],
  );

  const statusLabel = formatInFlight
    ? `Exporting ${formatInFlight.toUpperCase()}... ${Math.round(progress * 100)}%`
    : statusMessage;

  return (
    <div className="rounded border border-[rgb(var(--signal-rgb)/0.3)] p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em]">Export</p>
        {statusLabel ? (
          <span className="text-[10px] uppercase tracking-[0.18em]">
            {statusLabel}
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em]">
          <span>Resolution</span>
          <StyledDropdown
            value={resolution}
            onChange={setResolution}
            options={RESOLUTION_PRESETS}
            tone="dark"
            className="w-full min-w-0"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => exportSymbol('mp4')}
            className="flex-1 rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-2 text-[10px] uppercase tracking-[0.18em] disabled:opacity-45"
            disabled={formatInFlight !== null || isPrintStillResolution}
          >
            {formatInFlight === 'mp4' ? 'Exporting...' : 'Export MP4'}
          </button>
          <button
            type="button"
            onClick={() => exportSymbol('png')}
            className="flex-1 rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-2 text-[10px] uppercase tracking-[0.18em] disabled:opacity-45"
            disabled={formatInFlight !== null}
          >
            {formatInFlight === 'png' ? 'Exporting...' : 'Export PNG'}
          </button>
        </div>
      </div>
      {isPrintStillResolution ? (
        <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-[rgb(var(--signal-rgb)/0.72)]">
          3508 is enabled for static PNG export only.
        </p>
      ) : null}
      <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-[rgb(var(--signal-rgb)/0.72)]">
        PNG exports use the current preview time.
      </p>
    </div>
  );
}
