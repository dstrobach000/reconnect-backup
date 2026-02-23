'use client';

import { SUPPORTING_FONT_OPTIONS, getSupportingFontFamily } from '../../lib/fontPicker';
import StyledDropdown from './StyledDropdown';

const ROOBERT_URL = 'https://displaay.net/typeface/roobert';
const DAZZED_URL = 'https://displaay.net/typeface/dazzed';

export default function SupportingTypeSection({
  selectedSupportingFont,
  onSupportingFontChange,
}: {
  selectedSupportingFont: string;
  onSupportingFontChange: (value: string) => void;
}) {
  const activeFontFamily = getSupportingFontFamily(selectedSupportingFont);
  const linkClass = 'underline underline-offset-2';

  return (
    <section id="details" className="w-full border-y border-[rgb(var(--signal-rgb)/0.22)] bg-white text-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="flex flex-col gap-4">
          <div className="flex w-fit flex-col gap-1 text-[10px] uppercase tracking-[0.16em]">
            <span>Font</span>
            <StyledDropdown
              value={selectedSupportingFont}
              onChange={onSupportingFontChange}
              options={SUPPORTING_FONT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
              tone="light"
            />
          </div>
          <h2 className="text-3xl leading-none md:text-4xl" style={{ fontFamily: 'var(--font-mekanikal)' }}>
            Supporting Type System
          </h2>
        </div>

        <div className="mt-8 max-w-5xl space-y-5 text-[16px] leading-[1.55]" style={{ fontFamily: activeFontFamily }}>
          <p>
            For the supporting text system – the type used for longer reading and informational content – clarity and
            directness are essential. The leading candidates are{' '}
            <a
              href={DAZZED_URL}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Dazzed
            </a>{' '}
            and{' '}
            <a
              href={ROOBERT_URL}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Roobert
            </a>
            , both by Displaay.
          </p>
          <p>
            Roobert is a mono-linear geometric sans with clean horizontal and vertical terminals, smooth stem
            connections, and a distinctive single-story “g”. Originally developed for Moogfest 2017 and named after
            Robert Moog, it balances technical precision with warmth through subtle details such as the bent-pipe
            comma motif, while supporting a broad multilingual character set.
          </p>
          <p>
            <a href={DAZZED_URL} target="_blank" rel="noreferrer" className={linkClass}>
              Dazzed
            </a>
            , by contrast, is narrower and more dynamic. It blends technical sharpness with moments of expressive
            character, creating a tension between precision and personality. This duality makes it adaptable across
            contexts – capable of feeling cinematic and assertive, yet still controlled.
          </p>
          <p>
            Together, these typefaces reinforce the event’s identity as a platform for navigation and pathfinding
            within a complex cultural landscape. The geometry suggests infrastructure and systems; the controlled
            irregularities hint at movement and exchange. The aim is not simply technical coldness, but a visual
            language that reflects circulation, tension and direction.
          </p>
        </div>
      </div>
    </section>
  );
}
