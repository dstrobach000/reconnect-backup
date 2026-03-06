import { NextResponse } from 'next/server';
import { listAllExportedVideos, listExportedVideos, renderExport } from '../../../lib/exportService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const items = scope === 'all' ? await listAllExportedVideos() : await listExportedVideos();
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unable to load exported videos.',
        details: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let lastPercent = -1;

        const result = await renderExport(
          {
            recipe: body?.recipe,
            format: String(body?.format || 'mp4'),
            width: Number(body?.width) || 512,
            height: Number(body?.height) || 512,
            filterResolution: Number(body?.filterResolution) || 512,
            stillTimeSeconds: Number(body?.stillTimeSeconds),
          },
          (fraction) => {
            const percent = Math.floor(fraction * 100);
            if (percent > lastPercent) {
              lastPercent = percent;
              try {
                controller.enqueue(
                  encoder.encode(JSON.stringify({ progress: fraction }) + '\n'),
                );
              } catch {
                // client disconnected
              }
            }
          },
        );

        controller.enqueue(encoder.encode(JSON.stringify(result) + '\n'));
        controller.close();
      } catch (error) {
        try {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: 'Unable to export symbol.',
                details: error instanceof Error ? error.message : 'unknown error',
              }) + '\n',
            ),
          );
          controller.close();
        } catch {
          // stream already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
