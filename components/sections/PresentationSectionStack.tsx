'use client';

import HeroRadar from './HeroRadar';
import AnimationReferenceSection from './AnimationReferenceSection';
import DisplayTypeSection from './DisplayTypeSection';
import SupportingTypeSection from './SupportingTypeSection';
import TextComparatorSection from './TextComparatorSection';
import ReconnectClosingSection from './ReconnectClosingSection';
import PresentationMenu from './PresentationMenu';
import useFontPickerSettings from './useFontPickerSettings';

export default function PresentationSectionStack() {
  const { settings, setDisplayFont, setSupportingFont } = useFontPickerSettings();

  return (
    <>
      <PresentationMenu />
      <HeroRadar controlsEnabled={false} />
      <AnimationReferenceSection />
      <DisplayTypeSection selectedDisplayFont={settings.displayFont} onDisplayFontChange={setDisplayFont} />
      <SupportingTypeSection
        selectedSupportingFont={settings.supportingFont}
        onSupportingFontChange={setSupportingFont}
      />
      <TextComparatorSection
        selectedDisplayFont={settings.displayFont}
        selectedSupportingFont={settings.supportingFont}
      />
      <ReconnectClosingSection
        selectedDisplayFont={settings.displayFont}
        selectedSupportingFont={settings.supportingFont}
        selectedGlyph={settings.glyph}
      />
    </>
  );
}
