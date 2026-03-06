'use client';
import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { normalizeComposerRecipe } from '../../lib/symbolComposer';
import { SymbolRenderer } from '../../lib/webgl/SymbolRenderer';
import SymbolComposerCanvas from './SymbolComposerCanvas';

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
  const [fallbackToSvg, setFallbackToSvg] = useState(false);
  const normalizedRecipe = useMemo(() => normalizeComposerRecipe(recipe), [recipe]);
  const hasSvgOnlyLayer = useMemo(
    () => normalizedRecipe.layers.some(
      (layer) => layer.enabled && (layer.type === 'text' || layer.type === 'image'),
    ),
    [normalizedRecipe.layers],
  );
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
      try {
        renderer.renderFrame(normalizedRecipe, t);
      } catch {
        setFallbackToSvg(true);
      }
    },
    [normalizedRecipe, renderSize],
  );

  useEffect(() => {
    if (fallbackToSvg || hasSvgOnlyLayer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      rendererRef.current = new SymbolRenderer(canvas);
    } catch {
      setFallbackToSvg(true);
      return;
    }
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [fallbackToSvg, hasSvgOnlyLayer]);

  // forced time mode (Remotion export)
  useEffect(() => {
    if (hasSvgOnlyLayer) return;
    if (!isForcedTime || !rendererRef.current) return;
    renderOneFrame(rendererRef.current, forceTimeSeconds!);
  }, [isForcedTime, forceTimeSeconds, renderOneFrame, hasSvgOnlyLayer]);

  // static preview (no animation, no forced time)
  useEffect(() => {
    if (hasSvgOnlyLayer) return;
    if (isForcedTime || animate) return;
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderOneFrame(renderer, 0);
  }, [isForcedTime, animate, renderOneFrame, hasSvgOnlyLayer]);

  // preview animation loop
  useEffect(() => {
    if (fallbackToSvg || hasSvgOnlyLayer) return;
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
  }, [isForcedTime, animate, fpsCap, renderOneFrame, fallbackToSvg, hasSvgOnlyLayer]);

  if (fallbackToSvg || hasSvgOnlyLayer) {
    return (
      <SymbolComposerCanvas
        recipe={normalizedRecipe}
        className={className}
        animate={animate}
        fpsCap={fpsCap}
        forceTimeSeconds={forceTimeSeconds}
        style={style}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={renderSize.w}
      height={renderSize.h}
      className={`border border-[rgb(var(--signal-rgb)/0.45)] ${className}`}
      style={{
        backgroundColor: normalizedRecipe.backgroundColor,
        ...style,
      }}
    />
  );
}
