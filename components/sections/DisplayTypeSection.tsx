'use client';

import { DISPLAY_FONT_OPTIONS, getDisplayFontFamily } from '../../lib/fontPicker';
import StyledDropdown from './StyledDropdown';

const DISPLAY_COPY = `For the primary logotype and display text, I selected three geometric, technically oriented typefaces. My preferred direction is Mekanikal by Chisaokwu Joboson. For comparison, this preview also includes Hofmann by Nguyen Gobber – which introduces a slightly softer, more organic tone – and Ofform by Displaay Type Foundry, which pushes the geometry further toward an almost rigid abstraction.`;

export default function DisplayTypeSection({
  selectedDisplayFont,
  onDisplayFontChange,
}: {
  selectedDisplayFont: string;
  onDisplayFontChange: (value: string) => void;
}) {
  return (
    <section id="panels" className="w-full border-y border-[rgb(var(--signal-rgb)/0.22)] bg-black text-[var(--signal)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="flex flex-col gap-4">
          <div className="flex w-fit flex-col gap-1 text-[10px] uppercase tracking-[0.16em]">
            <span>Font</span>
            <StyledDropdown
              value={selectedDisplayFont}
              onChange={onDisplayFontChange}
              options={DISPLAY_FONT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
              tone="dark"
            />
          </div>
          <h2 className="text-3xl leading-none md:text-4xl" style={{ fontFamily: 'var(--font-mekanikal)' }}>
            Logo and Display Type
          </h2>
        </div>

        <h3
          className="mt-8 max-w-full overflow-hidden text-[clamp(2.2rem,9.2vw,6rem)] leading-[0.92] [overflow-wrap:anywhere]"
          style={{ fontFamily: getDisplayFontFamily(selectedDisplayFont) }}
        >
          RECONNECT:
        </h3>

        <p className="mt-8 max-w-4xl text-[15px] leading-[1.55] text-[rgb(var(--signal-rgb)/0.8)] md:text-[16px]" style={{ fontFamily: 'var(--font-roobertmono)' }}>
          {DISPLAY_COPY}
        </p>
      </div>
    </section>
  );
}
