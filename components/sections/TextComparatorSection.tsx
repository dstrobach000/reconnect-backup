'use client';

import { useState } from 'react';
import {
  DISPLAY_FONT_OPTIONS,
  SUPPORTING_FONT_OPTIONS,
  getDisplayFontFamily,
  getSupportingFontFamily,
} from '../../lib/fontPicker';
import StyledDropdown from './StyledDropdown';

const COMPARATOR_TEXT = `Reconnect provides an annual opportunity for a focused assessment of the current state of the music trade and its associated art scenes – both within the specific context of the host city of Brno and within a broader European framework, with particular attention to scenes in Eastern Europe and the former “concrete fence” countries.`;
const DEFAULT_LEFT_DISPLAY = 'mekanikal';
const DEFAULT_LEFT_SUPPORTING = 'roobertmono';
const DEFAULT_RIGHT_DISPLAY = 'hofmann';
const DEFAULT_RIGHT_SUPPORTING = 'dazzed';
function getComparatorHeadingClass(displayFontId: string) {
  let mobileSizeClass = 'text-[clamp(2.25rem,11vw,3.5rem)]';
  if (displayFontId === 'hofmann') {
    mobileSizeClass = 'text-[clamp(1.95rem,9.2vw,2.9rem)]';
  } else if (displayFontId === 'ofform') {
    mobileSizeClass = 'text-[clamp(1.7rem,8.2vw,2.6rem)]';
  }
  return `mb-6 max-w-full overflow-hidden whitespace-nowrap leading-[0.92] ${mobileSizeClass} md:text-6xl`;
}

export default function TextComparatorSection({
  selectedDisplayFont,
  selectedSupportingFont,
}: {
  selectedDisplayFont: string;
  selectedSupportingFont: string;
}) {
  const [leftDisplayFont, setLeftDisplayFont] = useState(DEFAULT_LEFT_DISPLAY || selectedDisplayFont);
  const [leftSupportingFont, setLeftSupportingFont] = useState(DEFAULT_LEFT_SUPPORTING || selectedSupportingFont);
  const [rightDisplayFont, setRightDisplayFont] = useState(DEFAULT_RIGHT_DISPLAY || selectedDisplayFont);
  const [rightSupportingFont, setRightSupportingFont] = useState(DEFAULT_RIGHT_SUPPORTING || selectedSupportingFont);

  const leftDisplayFontFamily = getDisplayFontFamily(leftDisplayFont);
  const leftSupportingFontFamily = getSupportingFontFamily(leftSupportingFont);
  const rightDisplayFontFamily = getDisplayFontFamily(rightDisplayFont);
  const rightSupportingFontFamily = getSupportingFontFamily(rightSupportingFont);
  const leftHeadingClass = getComparatorHeadingClass(leftDisplayFont);
  const rightHeadingClass = getComparatorHeadingClass(rightDisplayFont);

  return (
    <section className="w-full border-y border-[rgb(var(--signal-rgb)/0.22)] bg-white text-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl leading-none md:text-4xl" style={{ fontFamily: 'var(--font-mekanikal)' }}>
            Text Comparator
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 overflow-hidden border border-black/20 md:grid-cols-2">
          <div className="bg-white px-6 py-8 text-black md:px-8">
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em]">
                <span>Display Type</span>
                <StyledDropdown
                  value={leftDisplayFont}
                  onChange={setLeftDisplayFont}
                  options={DISPLAY_FONT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
                  tone="light"
                />
              </div>
              <div className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em]">
                <span>Supporting Type</span>
                <StyledDropdown
                  value={leftSupportingFont}
                  onChange={setLeftSupportingFont}
                  options={SUPPORTING_FONT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
                  tone="light"
                />
              </div>
            </div>
            <h3 className={leftHeadingClass} style={{ fontFamily: leftDisplayFontFamily }}>
              RECONNECT:
            </h3>
            <p className="text-[15px] leading-[1.55] md:text-[16px]" style={{ fontFamily: leftSupportingFontFamily }}>
              {COMPARATOR_TEXT}
            </p>
          </div>

          <div className="bg-black px-6 py-8 text-white md:px-8">
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em]">
                <span>Display Type</span>
                <StyledDropdown
                  value={rightDisplayFont}
                  onChange={setRightDisplayFont}
                  options={DISPLAY_FONT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
                  tone="dark"
                />
              </div>
              <div className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em]">
                <span>Supporting Type</span>
                <StyledDropdown
                  value={rightSupportingFont}
                  onChange={setRightSupportingFont}
                  options={SUPPORTING_FONT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
                  tone="dark"
                />
              </div>
            </div>
            <h3 className={rightHeadingClass} style={{ fontFamily: rightDisplayFontFamily }}>
              RECONNECT:
            </h3>
            <p className="text-[15px] leading-[1.55] md:text-[16px]" style={{ fontFamily: rightSupportingFontFamily }}>
              {COMPARATOR_TEXT}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
