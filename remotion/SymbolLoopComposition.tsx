import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
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
