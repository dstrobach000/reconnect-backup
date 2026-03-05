import { useEffect, useMemo, useRef } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import SymbolComposerCanvas from '../components/animation/SymbolComposerCanvas';
import { normalizeComposerRecipe } from '../lib/symbolComposer';

type SymbolLoopCompositionProps = {
  recipe: Record<string, unknown>;
  filterResolution?: number;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
};

export default function SymbolLoopComposition({
  recipe,
  filterResolution = 512,
}: SymbolLoopCompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const normalizedRecipe = normalizeComposerRecipe(recipe);
  const fontHandle = useMemo(() => delayRender('Loading Mekanikal font for export'), []);
  const didContinueRef = useRef(false);

  useEffect(() => {
    const continueIfNeeded = () => {
      if (didContinueRef.current) return;
      didContinueRef.current = true;
      continueRender(fontHandle);
    };

    const loadMekanikal = async () => {
      try {
        if (typeof document !== 'undefined' && 'fonts' in document && typeof FontFace !== 'undefined') {
          const src = staticFile('fonts/Mekanikal/Mekanikal-Display-Regular.woff2');
          const font = new FontFace(
            'Mekanikal Display',
            `url("${src}") format("woff2")`,
            { weight: '400', style: 'normal' },
          );
          await font.load();
          document.fonts.add(font);
          await document.fonts.load('400 24px "Mekanikal Display"');
          await document.fonts.ready;
        }
      } catch {
        // Export should still proceed even if the custom font fails to load.
      } finally {
        continueIfNeeded();
      }
    };

    void loadMekanikal();
    return continueIfNeeded;
  }, [fontHandle]);

  return (
    <AbsoluteFill style={{ backgroundColor: normalizedRecipe.backgroundColor }}>
      <SymbolComposerCanvas
        recipe={normalizedRecipe}
        className=""
        style={{ width: '100%', height: '100%', border: 'none' }}
        animate
        fpsCap={60}
        filterResolution={filterResolution}
        forceTimeSeconds={frame / fps}
      />
    </AbsoluteFill>
  );
}
