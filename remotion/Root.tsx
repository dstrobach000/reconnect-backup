import { Composition } from 'remotion';
import { createDefaultComposerRecipe, normalizeComposerRecipe } from '../lib/symbolComposer';
import SymbolLoopComposition from './SymbolLoopComposition';

type SymbolLoopProps = {
  recipe: Record<string, unknown>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  filterResolution: number;
};

const defaultRecipe = normalizeComposerRecipe(createDefaultComposerRecipe());

export const RemotionRoot = () => {
  return (
    <Composition
      id="SymbolLoop"
      component={SymbolLoopComposition}
      defaultProps={{
        recipe: defaultRecipe,
        width: 512,
        height: 512,
        fps: 25,
        durationInFrames: 200,
        filterResolution: 512,
      }}
      calculateMetadata={({ props }) => {
        const width = Math.max(128, Math.min(4096, Math.round(props.width || 512)));
        const height = Math.max(128, Math.min(4096, Math.round(props.height || 512)));
        const fps = Math.max(12, Math.min(60, Math.round(props.fps || 25)));
        const durationInFrames = Math.max(12, Math.min(60 * 180, Math.round(props.durationInFrames || 200)));
        return { width, height, fps, durationInFrames };
      }}
    />
  );
};
