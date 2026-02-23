'use client';

import { useRef } from 'react';
import RadarSvg from '../radar/RadarSvg';
import { useRadarAnimation } from '../radar/useRadarAnimation';
import { splitParagraphs } from '../../lib/sections';

export default function ThreeColTextSection({
  headingFont,
  bodyFont,
  blockA,
  blockB,
  tone,
  glyph,
}) {
  const rootRef = useRef(null);
  const isDark = tone === 'dark';

  useRadarAnimation(rootRef, glyph);

  return (
    <section
      className={`w-full border-y border-[rgb(var(--signal-rgb)/0.22)] ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      <div ref={rootRef} className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(170px,0.8fr)_1fr_1fr] md:gap-12">
          <div className="order-1">
            <div className="aspect-square w-full max-w-[260px]">
              <RadarSvg className="h-full w-full" mono="currentColor" variant={glyph} />
            </div>
          </div>

          <div className="order-2">
            <h2 className="mb-8 text-4xl leading-none tracking-tight md:text-5xl" style={{ fontFamily: headingFont }}>
              RECONNECT
            </h2>

            <div className="space-y-5 text-[15px] leading-[1.45] md:text-[14px]" style={{ fontFamily: bodyFont }}>
              {splitParagraphs(blockA).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="order-3 md:pt-[5.1rem]">
            <div className="space-y-5 text-[15px] leading-[1.45] md:text-[14px]" style={{ fontFamily: bodyFont }}>
              {splitParagraphs(blockB).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
