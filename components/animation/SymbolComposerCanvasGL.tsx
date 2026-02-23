'use client';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { normalizeComposerRecipe } from '../../lib/symbolComposer';
import { SymbolRenderer } from '../../lib/webgl/SymbolRenderer';

interface Props {
  recipe: unknown;
  className?: string;
  animate?: boolean;
  fpsCap?: number;
  forceTimeSeconds?: number | null;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

export default function SymbolComposerCanvasGL({
  recipe,
  className = 'aspect-square w-full',
  animate = true,
  fpsCap = 30,
  forceTimeSeconds = null,
  style,
  width,
  height,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SymbolRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const normalizedRecipe = useMemo(() => normalizeComposerRecipe(recipe), [recipe]);
  const isForcedTime =
    typeof forceTimeSeconds === 'number' && Number.isFinite(forceTimeSeconds);

  const renderSize = useMemo(() => {
    const w = width || 512;
    const h = height || w;
    return { w, h };
  }, [width, height]);

  const renderOneFrame = useCallback(
    (renderer: SymbolRenderer, t: number) => {
      renderer.resize(renderSize.w, renderSize.h);
      renderer.renderFrame(normalizedRecipe, t);
    },
    [normalizedRecipe, renderSize],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      rendererRef.current = new SymbolRenderer(canvas);
    } catch {
      return;
    }
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  // forced time mode (Remotion export)
  useEffect(() => {
    if (!isForcedTime || !rendererRef.current) return;
    renderOneFrame(rendererRef.current, forceTimeSeconds!);
  }, [isForcedTime, forceTimeSeconds, renderOneFrame]);

  // static preview (no animation, no forced time)
  useEffect(() => {
    if (isForcedTime || animate) return;
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderOneFrame(renderer, 0);
  }, [isForcedTime, animate, renderOneFrame]);

  // preview animation loop
  useEffect(() => {
    if (isForcedTime || !animate) return;
    const renderer = rendererRef.current;
    if (!renderer) return;

    const safeFps = Math.min(60, Math.max(12, fpsCap));
    const frameInterval = 1000 / safeFps;
    let lastFrameTime = 0;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;

      const t =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      renderOneFrame(renderer, t);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isForcedTime, animate, fpsCap, renderOneFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={renderSize.w}
      height={renderSize.h}
      className={className}
      style={{
        backgroundColor: normalizedRecipe.backgroundColor,
        ...style,
      }}
    />
  );
}
