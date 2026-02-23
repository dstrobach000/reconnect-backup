'use client';

import { useEffect, useState } from 'react';
import InlineAutoplayVideo from '../media/InlineAutoplayVideo';
const COMPOSER_EXPORT_API = '/api/composer-export';

type ExportVideoItem = {
  filename: string;
  url: string;
};

function normalizeExportVideoItem(item: any): ExportVideoItem | null {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.filename !== 'string' || !item.filename) return null;
  if (typeof item.url !== 'string' || !item.url) return null;

  return {
    filename: item.filename,
    url: item.url,
  };
}

export default function AnimationReferenceSection() {
  const [exportVideos, setExportVideos] = useState<ExportVideoItem[]>([]);

  const copyColumns = [
    [
      `Rather than relying on a conventional play symbol – familiar but ultimately generic – Reconnect adopts a generative motion system as its core visual language. Replacing a static icon with an active routing structure shifts the emphasis from passive viewing to movement, exchange and participation.`,
      `The motion graphics are procedural in construction: geometric and mechanical in origin, yet fluid in behaviour. Built from signal paths, intersections and looping routes, they establish a coherent visual framework centred on reconnection, navigation and circulation.`,
      `Conceptually, the system reflects the infrastructural realities that shape artistic practice today. Lines connect and disconnect. Paths converge and diverge. Nodes form temporarily before dispersing again. The animation does not simply decorate the event; it echoes the dynamics of transfer, concentration and retention that Reconnect seeks to address.`,
    ],
    [
      `Because the language is rule-based rather than fixed, it can evolve from year to year without losing coherence. The system adapts across contexts – performing equally well in digital environments, which support international reach, and in printed formats, which remain essential for local presence.`,
      `In this way, the visual identity functions less as a logo and more as infrastructure: a flexible framework capable of supporting ongoing exchange.`,
    ],
  ];

  useEffect(() => {
    let cancelled = false;

    const refreshExportVideos = async () => {
      try {
        const response = await fetch(COMPOSER_EXPORT_API, { method: 'GET', cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Unable to load exports (${response.status})`);
        }
        const payload = await response.json();
        const items = Array.isArray(payload?.items)
          ? payload.items.map((item: any) => normalizeExportVideoItem(item)).filter(Boolean) as ExportVideoItem[]
          : [];
        if (!cancelled) {
          setExportVideos(items);
        }
      } catch {
        if (!cancelled) {
          setExportVideos([]);
        }
      }
    };

    void refreshExportVideos();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="program" className="w-full border-y border-[rgb(var(--signal-rgb)/0.22)] bg-white text-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(170px,0.8fr)_1fr_1fr] md:grid-rows-[auto_1fr] md:gap-10">
          <div className="order-1 md:col-span-2 md:col-start-2">
            <h2 className="text-3xl leading-none md:text-4xl" style={{ fontFamily: 'var(--font-mekanikal)' }}>
              Shape Index
            </h2>
          </div>

          <div className="order-2 md:row-span-2">
            <div className="relative aspect-square w-full overflow-hidden bg-black [contain:paint]">
              <InlineAutoplayVideo
                src="/exports/512_cross_03.mp4"
                className="absolute inset-0 block h-full w-full object-cover [backface-visibility:hidden] [transform:translateZ(0)]"
                preload="metadata"
              />
            </div>
          </div>

          {copyColumns.map((paragraphs, columnIndex) => (
            <div
              key={`shape-column-${columnIndex}`}
              className={`space-y-4 text-[15px] leading-[1.5] text-black/80 md:text-[14px] ${columnIndex === 0 ? 'order-3 md:col-start-2' : 'order-4 md:col-start-3'}`}
            >
              {paragraphs.map((paragraph) => (
                <p key={paragraph} style={{ fontFamily: 'var(--font-roobertmono)' }}>
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-10">
          {exportVideos.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
              {exportVideos.map((item) => (
                <div key={item.filename} className="w-full">
                  <div className="relative aspect-square overflow-hidden bg-black [contain:paint]">
                    <InlineAutoplayVideo
                      src={item.url}
                      className="absolute inset-0 block h-full w-full object-cover [backface-visibility:hidden] [transform:translateZ(0)]"
                      preload="metadata"
                    />
                  </div>
                  <p className="mt-2 text-center text-[11px] uppercase tracking-[0.08em] text-black">
                    {item.filename}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black">Folder empty</p>
          )}
        </div>
      </div>
    </section>
  );
}
