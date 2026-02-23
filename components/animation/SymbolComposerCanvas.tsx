'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { normalizeComposerRecipe } from '../../lib/symbolComposer';

function polar(radius, angleDeg) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  };
}

function describeArcPath(radius, startAngle, sweepAngle) {
  if (sweepAngle <= 0) {
    return '';
  }

  if (sweepAngle >= 360) {
    return `M 0 ${-radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 ${-radius}`;
  }

  const start = polar(radius, startAngle);
  const end = polar(radius, startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function describeSectorPath(radius, startAngle, sweepAngle) {
  if (sweepAngle <= 0) {
    return 'M 0 0 Z';
  }

  if (sweepAngle >= 360) {
    return `M 0 ${-radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 ${-radius} Z`;
  }

  const start = polar(radius, startAngle);
  const end = polar(radius, startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  return `M 0 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function getRepeatPosition(layer, index) {
  if (layer.repeatCount <= 1 || layer.repeatRadius <= 0) {
    return { x: 50, y: 50 };
  }

  const step = layer.repeatCount === 1 ? 0 : layer.repeatSpread / layer.repeatCount;
  const angle = layer.repeatOffset + step * index;
  const offset = polar(layer.repeatRadius, angle);
  return {
    x: 50 + offset.x,
    y: 50 + offset.y,
  };
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getLayerMotionModes(layer) {
  const motions = [];

  if (layer.motion && layer.motion !== 'none') {
    motions.push(layer.motion);
  }
  if (
    layer.motionSecondary
    && layer.motionSecondary !== 'none'
    && !motions.includes(layer.motionSecondary)
  ) {
    motions.push(layer.motionSecondary);
  }

  return motions;
}

function getLoopSyncedDuration(loopSeconds, desiredDuration, minDuration = 0.04) {
  const safeLoop = Math.max(0.1, Number.isFinite(loopSeconds) ? loopSeconds : 0.1);
  const safeDesired = Math.max(
    minDuration,
    Number.isFinite(desiredDuration) ? desiredDuration : safeLoop,
  );
  const cycleCount = Math.max(1, Math.round(safeLoop / safeDesired));
  return safeLoop / cycleCount;
}

function getLoopSyncedDurationFromSpeed(loopSeconds, speed) {
  const safeSpeed = clampNumber(speed, 1, 24);
  const rawDuration = loopSeconds / safeSpeed;
  return getLoopSyncedDuration(loopSeconds, rawDuration);
}

function getLoopSyncedYoyoHalfDuration(loopSeconds, desiredHalfDuration, minHalfDuration = 0.02) {
  const fullDuration = getLoopSyncedDuration(
    loopSeconds,
    Math.max(minHalfDuration, desiredHalfDuration) * 2,
    minHalfDuration * 2,
  );
  return fullDuration * 0.5;
}

function getLoopPhase01(timeSeconds, cycleDuration) {
  if (!(cycleDuration > 0) || !Number.isFinite(timeSeconds)) return 0;
  const wrapped = ((timeSeconds % cycleDuration) + cycleDuration) % cycleDuration;
  return wrapped / cycleDuration;
}

function getTrianglePhase01(phase01) {
  if (phase01 < 0.5) return phase01 * 2;
  return (1 - phase01) * 2;
}

function getForcedMasterMotionTransform(recipe, timeSeconds, globalMotionSpeed) {
  const duration = getLoopSyncedDurationFromSpeed(
    recipe.loopSeconds,
    recipe.masterMotionSpeed * globalMotionSpeed,
  );
  const phase = getLoopPhase01(timeSeconds, duration);
  const tri = getTrianglePhase01(phase);
  let rotate = 0;
  let scale = 1;

  if (recipe.masterMotion === 'rotate') {
    rotate = phase * 360;
  } else if (recipe.masterMotion === 'counter-rotate') {
    rotate = -phase * 360;
  } else if (recipe.masterMotion === 'pulse') {
    scale = 1 + 0.07 * tri;
  } else if (recipe.masterMotion === 'sweep') {
    rotate = 24 * tri;
  } else if (recipe.masterMotion === 'infinite-zoom') {
    scale = 1 + 0.22 * phase;
  }

  if (Math.abs(rotate) < 0.0001 && Math.abs(scale - 1) < 0.0001) {
    return undefined;
  }

  return `translate(50 50) rotate(${rotate}) scale(${scale}) translate(-50 -50)`;
}

function getForcedLayerMotionState(layer, timeSeconds, loopSeconds, globalMotionSpeed) {
  const motionModes = getLayerMotionModes(layer);
  const duration = getLoopSyncedDurationFromSpeed(
    loopSeconds,
    layer.motionSpeed * globalMotionSpeed,
  );
  const phase = getLoopPhase01(timeSeconds, duration);
  const tri = getTrianglePhase01(phase);
  let rotate = 0;
  let scale = 1;
  let opacity = 1;
  let instanceScale = 1;
  let instanceOpacity = 1;
  let overrideArmGap = layer.armGap;
  let overrideArmLength = layer.armLength;

  motionModes.forEach((motion) => {
    if (motion === 'rotate') {
      rotate += phase * 360;
      return;
    }
    if (motion === 'counter-rotate') {
      rotate -= phase * 360;
      return;
    }
    if (motion === 'pulse') {
      scale *= 1 + 0.14 * tri;
      return;
    }
    if (motion === 'sweep') {
      rotate += 42 * tri;
      return;
    }
    if (motion === 'blink') {
      opacity *= phase < 0.5 ? 1 : 0.2;
      return;
    }
    if (motion === 'infinite-zoom') {
      const minScale = 0.54;
      const maxScale = 1.08;
      instanceScale *= minScale + (maxScale - minScale) * phase;
      instanceOpacity *= 1 - phase;
      return;
    }
    if (layer.type === 'cross' && motion === 'cross-arm-gap') {
      const minGap = 0;
      const maxGap = Math.max(0, layer.armLength - 1);
      const minAnimatedGap = clampNumber(layer.armGap * 0.22, minGap, maxGap);
      const maxAnimatedGap = clampNumber(Math.max(layer.armGap * 1.85, layer.armGap + 3), minGap, maxGap);
      overrideArmGap = minAnimatedGap + (maxAnimatedGap - minAnimatedGap) * phase;
      return;
    }
    if (layer.type === 'cross' && motion === 'cross-arm-length') {
      const minLength = Math.max(layer.armGap + 1, layer.armLength * 0.35, 2);
      const maxLength = Math.max(minLength + 0.5, Math.min(44, layer.armLength * 1.5));
      const minAnimatedLength = clampNumber(Math.max(layer.armLength * 0.45, layer.armGap + 1), minLength, maxLength);
      const maxAnimatedLength = clampNumber(Math.max(layer.armLength * 1.45, minAnimatedLength + 1), minLength, maxLength);
      overrideArmLength = minAnimatedLength + (maxAnimatedLength - minAnimatedLength) * phase;
      return;
    }
    if (layer.type === 'cross' && motion === 'cross-arm-morph') {
      const minGap = 0;
      const maxGap = Math.max(0, layer.armLength - 1);
      const minLength = Math.max(layer.armGap + 1, layer.armLength * 0.35, 2);
      const maxLength = Math.max(minLength + 0.5, Math.min(44, layer.armLength * 1.5));
      const minAnimatedGap = clampNumber(layer.armGap * 0.24, minGap, maxGap);
      const maxAnimatedGap = clampNumber(Math.max(layer.armGap * 1.75, layer.armGap + 2.5), minGap, maxGap);
      const minAnimatedLength = clampNumber(Math.max(layer.armLength * 0.48, layer.armGap + 1), minLength, maxLength);
      const maxAnimatedLength = clampNumber(Math.max(layer.armLength * 1.35, minAnimatedLength + 1), minLength, maxLength);
      overrideArmGap = minAnimatedGap + (maxAnimatedGap - minAnimatedGap) * tri;
      overrideArmLength = maxAnimatedLength + (minAnimatedLength - maxAnimatedLength) * tri;
    }
  });

  instanceScale = clampNumber(instanceScale, 0.1, 8);
  instanceOpacity = clampNumber(instanceOpacity, 0, 1);
  opacity = clampNumber(opacity, 0, 1);

  if (!motionModes.length) {
    return {
      layerTransform: undefined,
      layerOpacity: undefined,
      instanceTransform: undefined,
      instanceMotionOpacity: undefined,
      layerForGlyph: layer,
    };
  }

  const layerTransform = Math.abs(rotate) < 0.0001 && Math.abs(scale - 1) < 0.0001
    ? undefined
    : `translate(50 50) rotate(${rotate}) scale(${scale}) translate(-50 -50)`;
  const layerOpacity = Math.abs(opacity - 1) < 0.0001 ? undefined : opacity;
  const instanceTransform = Math.abs(instanceScale - 1) < 0.0001 ? undefined : `scale(${instanceScale})`;
  const instanceMotionOpacity = Math.abs(instanceOpacity - 1) < 0.0001 ? undefined : instanceOpacity;

  return {
    layerTransform,
    layerOpacity,
    instanceTransform,
    instanceMotionOpacity,
    layerForGlyph: (
      overrideArmGap !== layer.armGap || overrideArmLength !== layer.armLength
    ) ? {
      ...layer,
      armGap: overrideArmGap,
      armLength: overrideArmLength,
    } : layer,
  };
}

function getLayerSizeScale(layerIndex, totalLayers, layerSizeRatio) {
  if (totalLayers <= 1) return 1;
  const pivot = (totalLayers - 1) * 0.5;
  const exponent = layerIndex - pivot;
  const scaled = Math.pow(layerSizeRatio, exponent);
  return clampNumber(scaled, 0.2, 4);
}

function getRepeatInstanceScale(layer, repeatIndex) {
  if (layer.repeatCount <= 1) return 1;
  return clampNumber(Math.pow(layer.repeatSizeRatio, repeatIndex), 0.1, 8);
}

function getLayerExtent(layer, masterStrokeWidth) {
  const strokePadding = Math.max(0, masterStrokeWidth) * 0.5;
  const repeatScaleMax = layer.repeatCount > 1 && layer.repeatSizeRatio > 1
    ? Math.pow(layer.repeatSizeRatio, layer.repeatCount - 1)
    : 1;

  if (layer.type === 'ring') {
    return (layer.radius + strokePadding) * repeatScaleMax + layer.repeatRadius;
  }

  if (layer.type === 'cross') {
    return (layer.armLength + strokePadding) * repeatScaleMax + layer.repeatRadius;
  }

  if (layer.type === 'dot') {
    return (layer.radius + strokePadding) * repeatScaleMax + layer.repeatRadius;
  }

  if (layer.type === 'ticks') {
    return (layer.tickRadius + layer.tickLength + strokePadding) * repeatScaleMax + layer.repeatRadius;
  }

  if (layer.type === 'square') {
    return (layer.squareSize * 0.5 + strokePadding) * repeatScaleMax + layer.repeatRadius;
  }

  if (layer.type === 'grid') {
    return (layer.gridSize * 0.5 + strokePadding) * repeatScaleMax + layer.repeatRadius;
  }

  if (layer.type === 'line') {
    return (Math.abs(layer.lineOffset) + layer.lineLength * 0.5 + strokePadding) * repeatScaleMax + layer.repeatRadius;
  }

  return 1;
}

function getCrossArmCoordinates(direction, armGap, armLength) {
  if (direction === 'north') {
    return { x1: 0, y1: -armGap, x2: 0, y2: -armLength };
  }
  if (direction === 'east') {
    return { x1: armGap, y1: 0, x2: armLength, y2: 0 };
  }
  if (direction === 'south') {
    return { x1: 0, y1: armGap, x2: 0, y2: armLength };
  }
  return { x1: -armGap, y1: 0, x2: -armLength, y2: 0 };
}

function hasFill(fillMode) {
  return fillMode === 'fill' || fillMode === 'fill-stroke' || fillMode === 'noise' || fillMode === 'noise-stroke';
}

function hasStroke(fillMode) {
  return fillMode === 'stroke' || fillMode === 'fill-stroke' || fillMode === 'noise-stroke';
}

function hasNoiseFill(fillMode) {
  return fillMode === 'noise' || fillMode === 'noise-stroke';
}

function getSweepStateAtTime({
  timeSeconds,
  loopSeconds,
  motionSpeed,
  masterSpeed,
  startAngle,
  maxSweep,
}) {
  if (!Number.isFinite(timeSeconds)) return null;
  const cycleDuration = getLoopSyncedDurationFromSpeed(
    loopSeconds,
    motionSpeed * masterSpeed,
  );
  if (!(cycleDuration > 0)) return null;

  const wrapped = ((timeSeconds % cycleDuration) + cycleDuration) % cycleDuration;
  const phase = (wrapped / cycleDuration) * 2;
  const localPhase = phase < 1 ? phase : phase - 1;
  const filling = phase < 1;

  return {
    startAngle: filling ? startAngle : startAngle + localPhase * maxSweep,
    sweep: filling ? maxSweep * localPhase : maxSweep * (1 - localPhase),
  };
}

function LayerGlyph({
  layer,
  masterStrokeWidth,
  layerColor,
  noiseFillId,
  forceTimeSeconds = null,
  loopSeconds = 8,
  masterSpeed = 1,
}) {
  const showFill = hasFill(layer.fillMode);
  const showStroke = hasStroke(layer.fillMode) && masterStrokeWidth > 0;
  const useNoiseFill = hasNoiseFill(layer.fillMode);
  const fillPaint = useNoiseFill && noiseFillId ? `url(#${noiseFillId})` : layerColor;
  const dashArray = layer.dashStyle === 'dashed' ? '4 4' : undefined;

  if (layer.type === 'ring') {
    const animateSweep = getLayerMotionModes(layer).includes('sweep-angle');
    const maxSweep = clampNumber(layer.sweepAngle, 0, 360);
    const forcedSweepState = animateSweep
      ? getSweepStateAtTime({
        timeSeconds: forceTimeSeconds,
        loopSeconds,
        motionSpeed: layer.motionSpeed,
        masterSpeed,
        startAngle: layer.startAngle,
        maxSweep,
      })
      : null;
    const ringStartAngle = forcedSweepState ? forcedSweepState.startAngle : layer.startAngle;
    const ringSweep = forcedSweepState ? forcedSweepState.sweep : animateSweep ? maxSweep : layer.sweepAngle;
    const renderAsCircle = !animateSweep && ringSweep >= 360;

    return (
      <>
        {showFill ? (
          renderAsCircle ? (
            <circle r={layer.radius} fill={fillPaint} />
          ) : (
            <path
              d={describeSectorPath(layer.radius, ringStartAngle, ringSweep)}
              fill={fillPaint}
              data-sweep-path={animateSweep && !forcedSweepState ? 'true' : undefined}
              data-path-kind={animateSweep && !forcedSweepState ? 'sector' : undefined}
              data-radius={animateSweep && !forcedSweepState ? layer.radius : undefined}
              data-start-angle={animateSweep && !forcedSweepState ? layer.startAngle : undefined}
              data-max-sweep={animateSweep && !forcedSweepState ? maxSweep : undefined}
            />
          )
        ) : null}
        {showStroke ? (
          renderAsCircle ? (
            <circle
              r={layer.radius}
              fill="none"
              stroke={layerColor}
              strokeWidth={masterStrokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="butt"
            />
          ) : (
            <path
              d={describeArcPath(layer.radius, ringStartAngle, ringSweep)}
              fill="none"
              stroke={layerColor}
              strokeWidth={masterStrokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="butt"
              data-sweep-path={animateSweep && !forcedSweepState ? 'true' : undefined}
              data-path-kind={animateSweep && !forcedSweepState ? 'arc' : undefined}
              data-radius={animateSweep && !forcedSweepState ? layer.radius : undefined}
              data-start-angle={animateSweep && !forcedSweepState ? layer.startAngle : undefined}
              data-max-sweep={animateSweep && !forcedSweepState ? maxSweep : undefined}
            />
          )
        ) : null}
      </>
    );
  }

  if (layer.type === 'cross') {
    const north = getCrossArmCoordinates('north', layer.armGap, layer.armLength);
    const east = getCrossArmCoordinates('east', layer.armGap, layer.armLength);
    const south = getCrossArmCoordinates('south', layer.armGap, layer.armLength);
    const west = getCrossArmCoordinates('west', layer.armGap, layer.armLength);

    return (
      <g
        fill="none"
        stroke={layerColor}
        strokeWidth={masterStrokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      >
        <line data-cross-arm data-cross-direction="north" x1={north.x1} y1={north.y1} x2={north.x2} y2={north.y2} />
        <line data-cross-arm data-cross-direction="east" x1={east.x1} y1={east.y1} x2={east.x2} y2={east.y2} />
        <line data-cross-arm data-cross-direction="south" x1={south.x1} y1={south.y1} x2={south.x2} y2={south.y2} />
        <line data-cross-arm data-cross-direction="west" x1={west.x1} y1={west.y1} x2={west.x2} y2={west.y2} />
      </g>
    );
  }

  if (layer.type === 'ticks') {
    return (
      <g
        stroke={layerColor}
        strokeWidth={masterStrokeWidth}
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeDasharray={dashArray}
      >
        {Array.from({ length: layer.tickCount }, (_, index) => {
          const angle = layer.tickOffset + (360 / layer.tickCount) * index;
          return (
            <line
              key={`tick-${index}`}
              x1="0"
              y1={-layer.tickRadius}
              x2="0"
              y2={-(layer.tickRadius + layer.tickLength)}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>
    );
  }

  if (layer.type === 'dot') {
    const animateSweep = getLayerMotionModes(layer).includes('sweep-angle');
    const maxSweep = clampNumber(layer.sweepAngle, 0, 360);
    const forcedSweepState = animateSweep
      ? getSweepStateAtTime({
        timeSeconds: forceTimeSeconds,
        loopSeconds,
        motionSpeed: layer.motionSpeed,
        masterSpeed,
        startAngle: layer.startAngle,
        maxSweep,
      })
      : null;
    const dotStartAngle = forcedSweepState ? forcedSweepState.startAngle : layer.startAngle;
    const dotSweep = forcedSweepState ? forcedSweepState.sweep : animateSweep ? maxSweep : layer.sweepAngle;
    const renderAsCircle = !animateSweep && dotSweep >= 360;

    return (
      <>
        {showFill ? (
          renderAsCircle ? (
            <circle r={layer.radius} fill={fillPaint} />
          ) : (
            <path
              d={describeSectorPath(layer.radius, dotStartAngle, dotSweep)}
              fill={fillPaint}
              data-sweep-path={animateSweep && !forcedSweepState ? 'true' : undefined}
              data-path-kind={animateSweep && !forcedSweepState ? 'sector' : undefined}
              data-radius={animateSweep && !forcedSweepState ? layer.radius : undefined}
              data-start-angle={animateSweep && !forcedSweepState ? layer.startAngle : undefined}
              data-max-sweep={animateSweep && !forcedSweepState ? maxSweep : undefined}
            />
          )
        ) : null}
        {showStroke ? (
          renderAsCircle ? (
            <circle
              r={layer.radius}
              fill="none"
              stroke={layerColor}
              strokeWidth={masterStrokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="butt"
            />
          ) : (
            <path
              d={describeArcPath(layer.radius, dotStartAngle, dotSweep)}
              fill="none"
              stroke={layerColor}
              strokeWidth={masterStrokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="butt"
              data-sweep-path={animateSweep && !forcedSweepState ? 'true' : undefined}
              data-path-kind={animateSweep && !forcedSweepState ? 'arc' : undefined}
              data-radius={animateSweep && !forcedSweepState ? layer.radius : undefined}
              data-start-angle={animateSweep && !forcedSweepState ? layer.startAngle : undefined}
              data-max-sweep={animateSweep && !forcedSweepState ? maxSweep : undefined}
            />
          )
        ) : null}
      </>
    );
  }

  if (layer.type === 'square') {
    const half = layer.squareSize / 2;
    const cornerRadius = Math.max(0, Math.min(layer.squareRadius, half));
    return (
      <rect
        x={-half}
        y={-half}
        width={layer.squareSize}
        height={layer.squareSize}
        rx={cornerRadius}
        ry={cornerRadius}
        fill={showFill ? fillPaint : 'none'}
        stroke={showStroke ? layerColor : 'none'}
        strokeWidth={masterStrokeWidth}
        strokeDasharray={dashArray}
      />
    );
  }

  if (layer.type === 'grid') {
    const half = layer.gridSize / 2;
    const divisions = Math.max(2, layer.gridDivisions);
    const step = layer.gridSize / divisions;
    return (
      <g stroke={showStroke ? layerColor : 'none'} strokeWidth={masterStrokeWidth} strokeDasharray={dashArray}>
        {layer.gridOuterFrame ? (
          <rect x={-half} y={-half} width={layer.gridSize} height={layer.gridSize} fill={showFill ? fillPaint : 'none'} />
        ) : null}
        {Array.from({ length: divisions - 1 }, (_, index) => {
          const offset = -half + step * (index + 1);
          return (
            <g key={`grid-${index}`}>
              <line x1={-half} y1={offset} x2={half} y2={offset} />
              <line x1={offset} y1={-half} x2={offset} y2={half} />
            </g>
          );
        })}
      </g>
    );
  }

  if (layer.type === 'line') {
    const halfLength = layer.lineLength / 2;
    const y1 = -(layer.lineOffset + halfLength);
    const y2 = -(layer.lineOffset - halfLength);
    return (
      <line
        x1="0"
        y1={y1}
        x2="0"
        y2={y2}
        stroke={showStroke ? layerColor : 'none'}
        strokeWidth={masterStrokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    );
  }

  return null;
}

export default function SymbolComposerCanvas({
  recipe,
  className = 'aspect-square w-full',
  animate = true,
  fpsCap = 30,
  filterResolution = 512,
  transparentBackground = false,
  forceTimeSeconds = null,
  style = undefined,
}) {
  const rootRef = useRef(null);
  const scopedAnimationsRef = useRef<gsap.core.Animation[]>([]);
  const idPrefix = useId().replace(/:/g, '');
  const normalizedRecipe = useMemo(() => normalizeComposerRecipe(recipe), [recipe]);
  const [hasMounted, setHasMounted] = useState(false);
  const safeFpsCap = clampNumber(fpsCap, 12, 60);
  const safeFilterResolution = Math.round(clampNumber(filterResolution, 128, 2048));
  const isForcedTimeMode = typeof forceTimeSeconds === 'number' && Number.isFinite(forceTimeSeconds);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const filterProps = useMemo(
    () => (hasMounted ? { filterRes: String(safeFilterResolution) } : {}),
    [hasMounted, safeFilterResolution],
  );
  const totalLayers = normalizedRecipe.layers.length;
  const layerColor = normalizedRecipe.inverted ? '#000000' : '#ffffff';
  const primaryEffectStrength = normalizedRecipe.masterRenderStrength;
  const primaryEffectDetail = normalizedRecipe.masterRenderDetail;
  const secondaryEffectStrength = normalizedRecipe.masterRenderStrengthSecondary;
  const secondaryEffectDetail = normalizedRecipe.masterRenderDetailSecondary;
  const particlesStrength = normalizedRecipe.masterParticlesStrength;
  const particlesDetail = normalizedRecipe.masterParticlesDetail;
  const grainStrength = normalizedRecipe.masterGrainStrength;
  const grainDetail = normalizedRecipe.masterGrainDetail;
  const buildThresholdTable = (strength, detail) => {
    const steps = 24;
    const cutoff = clampNumber(0.1 + strength * 0.8, 0.05, 0.95);
    const softness = clampNumber((1 - detail) * 0.22, 0, 0.25);
    return Array.from({ length: steps }, (_, index) => {
      const t = index / (steps - 1);
      if (t <= cutoff - softness) return '0';
      if (t >= cutoff + softness) return '1';
      const normalized = (t - (cutoff - softness)) / Math.max(0.0001, softness * 2);
      return normalized.toFixed(3);
    }).join(' ');
  };
  const thresholdTableA = buildThresholdTable(primaryEffectStrength, primaryEffectDetail);
  const thresholdTableB = buildThresholdTable(secondaryEffectStrength, secondaryEffectDetail);
  const posterizeStepsA = Math.max(2, Math.round(2 + primaryEffectDetail * 14));
  const posterizeTableA = Array.from({ length: posterizeStepsA }, (_, index) =>
    (index / Math.max(1, posterizeStepsA - 1)).toFixed(3),
  ).join(' ');
  const posterizeStepsB = Math.max(2, Math.round(2 + secondaryEffectDetail * 14));
  const posterizeTableB = Array.from({ length: posterizeStepsB }, (_, index) =>
    (index / Math.max(1, posterizeStepsB - 1)).toFixed(3),
  ).join(' ');
  const pixelRadiusA = (0.12 + primaryEffectStrength * (0.9 + primaryEffectDetail * 2.2)).toFixed(2);
  const pixelRadiusB = (0.12 + secondaryEffectStrength * (0.9 + secondaryEffectDetail * 2.2)).toFixed(2);
  const glowBlurA = (0.08 + primaryEffectStrength * (0.8 + primaryEffectDetail * 2.4)).toFixed(2);
  const glowBlurB = (0.08 + secondaryEffectStrength * (0.8 + secondaryEffectDetail * 2.4)).toFixed(2);
  const blurStdDevA = (0.08 + primaryEffectStrength * (1.2 + primaryEffectDetail * 4)).toFixed(2);
  const blurStdDevB = (0.08 + secondaryEffectStrength * (1.2 + secondaryEffectDetail * 4)).toFixed(2);
  const grainAmount = (0.05 + grainStrength * (0.18 + grainDetail * 0.42)).toFixed(3);
  const grainFrequency = clampNumber(0.9 + grainDetail * 4.4, 0.6, 5.6).toFixed(3);
  const buildParticleTable = (strength, detail) => {
    const steps = 20;
    const coverage = clampNumber(0.05 + strength * (0.2 + detail * 0.42), 0.04, 0.72);
    const whiteCount = Math.max(1, Math.round(coverage * steps));
    return Array.from({ length: steps }, (_, index) => (index >= steps - whiteCount ? '1' : '0')).join(' ');
  };
  const particleTable = buildParticleTable(particlesStrength, particlesDetail);
  const particleFrequency = clampNumber(0.8 + particlesDetail * 3.6, 0.4, 6).toFixed(3);
  const particleRadius = (0.06 + particlesStrength * (0.45 + particlesDetail * 1.15)).toFixed(2);
  const particleCircleBlur = (0.15 + Number(particleRadius) * 0.7).toFixed(2);
  const particleCircleGamma = (0.58 + (1 - particlesDetail) * 0.28).toFixed(2);
  const noiseBaseFrequency = clampNumber(0.9 / normalizedRecipe.masterNoiseScale, 0.08, 2).toFixed(3);
  const noiseTileSize = clampNumber(16 * normalizedRecipe.masterNoiseScale, 6, 72).toFixed(1);
  const noiseFilterId = `${idPrefix}-noise-fill-filter`;
  const noisePatternId = `${idPrefix}-noise-fill-pattern`;
  const thresholdFilterAId = `${idPrefix}-fxa-threshold`;
  const posterizeFilterAId = `${idPrefix}-fxa-posterize`;
  const pixelateFilterAId = `${idPrefix}-fxa-pixelate`;
  const glowFilterAId = `${idPrefix}-fxa-glow`;
  const blurFilterAId = `${idPrefix}-fxa-blur`;
  const grainFilterPreId = `${idPrefix}-fx-pre-grain`;
  const particlesFilterPreId = `${idPrefix}-fx-pre-particles`;
  const thresholdFilterBId = `${idPrefix}-fxb-threshold`;
  const posterizeFilterBId = `${idPrefix}-fxb-posterize`;
  const pixelateFilterBId = `${idPrefix}-fxb-pixelate`;
  const glowFilterBId = `${idPrefix}-fxb-glow`;
  const blurFilterBId = `${idPrefix}-fxb-blur`;

  const getRenderFilterId = (effect, slot) => {
    if (effect === 'threshold') return slot === 'a' ? thresholdFilterAId : thresholdFilterBId;
    if (effect === 'posterize') return slot === 'a' ? posterizeFilterAId : posterizeFilterBId;
    if (effect === 'pixelate') return slot === 'a' ? pixelateFilterAId : pixelateFilterBId;
    if (effect === 'glow') return slot === 'a' ? glowFilterAId : glowFilterBId;
    if (effect === 'blur') return slot === 'a' ? blurFilterAId : blurFilterBId;
    return null;
  };

  const primaryRenderFilterId = getRenderFilterId(normalizedRecipe.masterRenderEffect, 'a');
  const secondaryRenderFilterId = getRenderFilterId(normalizedRecipe.masterRenderEffectSecondary, 'b');
  const particlesRenderFilterId = normalizedRecipe.masterParticlesEnabled ? particlesFilterPreId : null;
  const grainRenderFilterId = normalizedRecipe.masterGrainEnabled ? grainFilterPreId : null;
  const isGrainPrepassFirst = normalizedRecipe.renderPrepassOrder === 'grain-first';
  const prepassFirstFilterId = isGrainPrepassFirst ? grainRenderFilterId : particlesRenderFilterId;
  const prepassSecondFilterId = isGrainPrepassFirst ? particlesRenderFilterId : grainRenderFilterId;
  const prepassFirstLabel = isGrainPrepassFirst ? 'grain' : 'particles';
  const prepassSecondLabel = isGrainPrepassFirst ? 'particles' : 'grain';
  const frameStrokeWidth = normalizedRecipe.masterFrameStrokeWidth;
  const frameInset = Math.max(1, frameStrokeWidth);
  const frameSize = 100 - frameInset * 2;
  const frameRadius = 50 - frameInset;
  const sceneClipPathId = `${idPrefix}-scene-clip`;
  const clipInset = clampNumber(frameInset + frameStrokeWidth * 0.5, 0, 49.5);
  const clipSize = Math.max(0, 100 - clipInset * 2);
  const clipRadius = Math.max(0, 50 - clipInset);
  const sceneClipPath = normalizedRecipe.masterFrameShape === 'none' ? undefined : `url(#${sceneClipPathId})`;
  const layerSizeRatioFit = clampNumber(
    normalizedRecipe.layerSizeRatio + (normalizedRecipe.layerSizeRatioLfoEnabled ? normalizedRecipe.layerSizeRatioLfoDepth * 0.5 : 0),
    0.4,
    1.8,
  );

  const sceneScale = useMemo(() => {
    let maxExtent = 1;

    normalizedRecipe.layers.forEach((layer, layerIndex) => {
      if (!layer.enabled) return;
      const layerScale = getLayerSizeScale(layerIndex, totalLayers, layerSizeRatioFit);
      const layerExtent = getLayerExtent(layer, normalizedRecipe.masterStrokeWidth) * layerScale;
      maxExtent = Math.max(maxExtent, layerExtent);
    });

    const fitScale = 48 / Math.max(1, maxExtent);
    return clampNumber(fitScale * normalizedRecipe.masterSize, 0.1, 12);
  }, [normalizedRecipe, totalLayers, layerSizeRatioFit]);
  const globalMotionSpeed = clampNumber(normalizedRecipe.masterSpeed, 1, 24);
  const forcedTimeSecondsSafe = Math.max(0, forceTimeSeconds || 0);
  const forcedMasterMotionTransform = isForcedTimeMode
    ? getForcedMasterMotionTransform(
      normalizedRecipe,
      forcedTimeSecondsSafe,
      globalMotionSpeed,
    )
    : undefined;
  const forcedLayerSizeRatio = useMemo(() => {
    if (!isForcedTimeMode || !normalizedRecipe.layerSizeRatioLfoEnabled) {
      return normalizedRecipe.layerSizeRatio;
    }

    const cycle = getLoopSyncedDuration(
      normalizedRecipe.loopSeconds,
      normalizedRecipe.layerSizeRatioLfoCycleSeconds,
      0.08,
    );
    const phase = getLoopPhase01(forcedTimeSecondsSafe, cycle);
    const wave = Math.sin(phase * Math.PI * 2);
    return clampNumber(
      normalizedRecipe.layerSizeRatio + wave * normalizedRecipe.layerSizeRatioLfoDepth * 0.5,
      0.4,
      1.8,
    );
  }, [
    isForcedTimeMode,
    normalizedRecipe.layerSizeRatioLfoEnabled,
    normalizedRecipe.layerSizeRatio,
    normalizedRecipe.layerSizeRatioLfoDepth,
    normalizedRecipe.layerSizeRatioLfoCycleSeconds,
    normalizedRecipe.loopSeconds,
    forcedTimeSecondsSafe,
  ]);

  useLayoutEffect(() => {
    if (!animate || !rootRef.current || isForcedTimeMode) {
      return;
    }

    let restoreFps = false;
    const previousFps = (gsap.ticker as any).fps();
    if (!isForcedTimeMode && safeFpsCap < 60) {
      gsap.ticker.fps(safeFpsCap);
      restoreFps = true;
    }

    const ctx = gsap.context(() => {
      const masterCycleDuration = getLoopSyncedDurationFromSpeed(
        normalizedRecipe.loopSeconds,
        normalizedRecipe.masterMotionSpeed * globalMotionSpeed,
      );
      const masterTarget = '[data-master-motion]';

      if (normalizedRecipe.masterMotion === 'rotate') {
        gsap.to(masterTarget, {
          rotate: 360,
          duration: masterCycleDuration,
          repeat: -1,
          ease: 'none',
          svgOrigin: '50 50',
        });
      } else if (normalizedRecipe.masterMotion === 'counter-rotate') {
        gsap.to(masterTarget, {
          rotate: -360,
          duration: masterCycleDuration,
          repeat: -1,
          ease: 'none',
          svgOrigin: '50 50',
        });
      } else if (normalizedRecipe.masterMotion === 'pulse') {
        const halfCycleDuration = getLoopSyncedYoyoHalfDuration(
          normalizedRecipe.loopSeconds,
          masterCycleDuration * 0.5,
        );
        gsap.to(masterTarget, {
          scale: 1.07,
          duration: halfCycleDuration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          svgOrigin: '50 50',
        });
      } else if (normalizedRecipe.masterMotion === 'sweep') {
        const halfCycleDuration = getLoopSyncedYoyoHalfDuration(
          normalizedRecipe.loopSeconds,
          masterCycleDuration * 0.5,
        );
        gsap.to(masterTarget, {
          rotate: 24,
          duration: halfCycleDuration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          svgOrigin: '50 50',
        });
      } else if (normalizedRecipe.masterMotion === 'infinite-zoom') {
        gsap.set(masterTarget, {
          svgOrigin: '50 50',
          scale: 1,
        });
        gsap.fromTo(masterTarget, {
          scale: 1,
        }, {
          scale: 1.22,
          duration: masterCycleDuration,
          repeat: -1,
          ease: 'none',
        });
      }

      if (normalizedRecipe.feedbackLfoEnabled && normalizedRecipe.masterFeedback > 0) {
        const feedbackTargets = gsap.utils.toArray<SVGGElement>('[data-feedback-layer]');
        const cycle = getLoopSyncedDuration(
          normalizedRecipe.loopSeconds,
          normalizedRecipe.feedbackLfoCycleSeconds,
          0.08,
        );
        const depth = normalizedRecipe.feedbackLfoDepth;

        feedbackTargets.forEach((node) => {
          const feedbackIndex = Number(node.getAttribute('data-feedback-index')) || 0;
          if (feedbackIndex <= 0) return;

          const baseScale = Number(node.getAttribute('data-feedback-base-scale')) || 1;
          const baseOpacity = Number(node.getAttribute('data-feedback-base-opacity')) || 1;
          const feedbackWeight = feedbackIndex / Math.max(1, normalizedRecipe.masterFeedback);
          const scaleDelta = depth * 0.34 * feedbackWeight;
          const trailOpacity = clampNumber(baseOpacity * (0.8 + depth * 0.45), 0.03, 1);
          const resetDuration = clampNumber(
            cycle * (0.1 + feedbackWeight * 0.08),
            0.01,
            Math.max(0.01, cycle * 0.45),
          );
          const fadeDuration = Math.max(0.01, cycle - resetDuration);
          const phaseDelay = cycle * 0.55 * feedbackWeight;

          gsap.set(node, {
            scale: baseScale,
            opacity: trailOpacity,
            svgOrigin: '50 50',
          });

          gsap.to(node, {
            keyframes: [
              {
                scale: baseScale + scaleDelta,
                opacity: 0,
                duration: fadeDuration,
                ease: 'sine.out',
              },
              {
                scale: baseScale,
                opacity: trailOpacity,
                duration: resetDuration,
                ease: 'none',
              },
            ],
            repeat: -1,
            delay: phaseDelay,
            ease: 'none',
          });
        });
      }

      if (normalizedRecipe.layerSizeRatioLfoEnabled) {
        const layerSizeTargets = gsap.utils.toArray<SVGGElement>('[data-layer-size-index]');
        if (layerSizeTargets.length) {
          const cycle = getLoopSyncedDuration(
            normalizedRecipe.loopSeconds,
            normalizedRecipe.layerSizeRatioLfoCycleSeconds,
            0.08,
          );
          const depth = normalizedRecipe.layerSizeRatioLfoDepth;
          const lfoState = { phase: 0 };

          const updateLayerSize = () => {
            const wave = Math.sin(lfoState.phase * Math.PI * 2);
            const animatedRatio = clampNumber(normalizedRecipe.layerSizeRatio + wave * depth * 0.5, 0.4, 1.8);

            layerSizeTargets.forEach((node) => {
              const layerIndex = Number(node.getAttribute('data-layer-size-index')) || 0;
              const nextScale = getLayerSizeScale(layerIndex, totalLayers, animatedRatio);
              node.setAttribute('transform', `scale(${nextScale})`);
            });
          };

          updateLayerSize();
          gsap.to(lfoState, {
            phase: 1,
            duration: cycle,
            repeat: -1,
            ease: 'none',
            onUpdate: updateLayerSize,
          });
        }
      }

      normalizedRecipe.layers.forEach((layer, layerIndex) => {
        const motionModes = getLayerMotionModes(layer);
        if (!layer.enabled || !motionModes.length) return;

        const target = `[data-layer-index="${layerIndex}"]`;
        const layerCycleDuration = getLoopSyncedDurationFromSpeed(
          normalizedRecipe.loopSeconds,
          layer.motionSpeed * globalMotionSpeed,
        );

        const hasCrossGapMotion = layer.type === 'cross' && motionModes.includes('cross-arm-gap');
        const hasCrossLengthMotion = layer.type === 'cross' && motionModes.includes('cross-arm-length');
        const hasCrossMorphMotion = layer.type === 'cross' && motionModes.includes('cross-arm-morph');

        if (layer.type === 'cross' && (hasCrossGapMotion || hasCrossLengthMotion || hasCrossMorphMotion)) {
          const armTargets = gsap.utils.toArray<SVGLineElement>(`${target} [data-cross-arm]`);
          if (!armTargets.length) return;

          const minGap = 0;
          const maxGap = Math.max(0, layer.armLength - 1);
          const minLength = Math.max(layer.armGap + 1, layer.armLength * 0.35, 2);
          const maxLength = Math.max(minLength + 0.5, Math.min(44, layer.armLength * 1.5));
          const state = {
            gap: layer.armGap,
            length: layer.armLength,
          };

          const updateCrossArms = () => {
            armTargets.forEach((line) => {
              const direction = line.getAttribute('data-cross-direction') || 'north';
              const nextCoords = getCrossArmCoordinates(direction, state.gap, state.length);
              line.setAttribute('x1', String(nextCoords.x1));
              line.setAttribute('y1', String(nextCoords.y1));
              line.setAttribute('x2', String(nextCoords.x2));
              line.setAttribute('y2', String(nextCoords.y2));
            });
          };

          updateCrossArms();

          if (hasCrossMorphMotion) {
            const minAnimatedGap = clampNumber(layer.armGap * 0.24, minGap, maxGap);
            const maxAnimatedGap = clampNumber(Math.max(layer.armGap * 1.75, layer.armGap + 2.5), minGap, maxGap);
            const minAnimatedLength = clampNumber(Math.max(layer.armLength * 0.48, layer.armGap + 1), minLength, maxLength);
            const maxAnimatedLength = clampNumber(Math.max(layer.armLength * 1.35, minAnimatedLength + 1), minLength, maxLength);
            const morphHalfDuration = getLoopSyncedYoyoHalfDuration(
              normalizedRecipe.loopSeconds,
              layerCycleDuration * 0.65,
            );

            gsap.fromTo(state, {
              gap: minAnimatedGap,
              length: maxAnimatedLength,
            }, {
              gap: maxAnimatedGap,
              length: minAnimatedLength,
              duration: morphHalfDuration,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              onUpdate: updateCrossArms,
            });
          } else {
            const minAnimatedGap = clampNumber(layer.armGap * 0.22, minGap, maxGap);
            const maxAnimatedGap = clampNumber(Math.max(layer.armGap * 1.85, layer.armGap + 3), minGap, maxGap);
            const minAnimatedLength = clampNumber(Math.max(layer.armLength * 0.45, layer.armGap + 1), minLength, maxLength);
            const maxAnimatedLength = clampNumber(Math.max(layer.armLength * 1.45, minAnimatedLength + 1), minLength, maxLength);
            const duration = getLoopSyncedDuration(
              normalizedRecipe.loopSeconds,
              layerCycleDuration * 0.62,
            );

            gsap.fromTo(state, {
              gap: hasCrossGapMotion ? minAnimatedGap : layer.armGap,
              length: hasCrossLengthMotion ? minAnimatedLength : layer.armLength,
            }, {
              gap: hasCrossGapMotion ? maxAnimatedGap : layer.armGap,
              length: hasCrossLengthMotion ? maxAnimatedLength : layer.armLength,
              duration,
              repeat: -1,
              ease: 'sine.inOut',
              onUpdate: updateCrossArms,
            });
          }
        }

        if (
          !isForcedTimeMode
          && motionModes.includes('sweep-angle')
          && (layer.type === 'ring' || layer.type === 'dot')
        ) {
          const sweepTargets = gsap.utils.toArray<SVGPathElement>(`${target} [data-sweep-path]`);
          sweepTargets.forEach((pathNode) => {
            const kind = pathNode.getAttribute('data-path-kind');
            const radius = Number(pathNode.getAttribute('data-radius')) || layer.radius;
            const baseStartAngle = Number(pathNode.getAttribute('data-start-angle')) || layer.startAngle;
            const maxSweep = clampNumber(
              Number(pathNode.getAttribute('data-max-sweep')),
              0,
              360,
            ) || clampNumber(layer.sweepAngle, 0, 360);
            const sweepState = { phase: 0 };

            const updatePath = () => {
              const localPhase = sweepState.phase < 1 ? sweepState.phase : sweepState.phase - 1;
              const filling = sweepState.phase < 1;
              const currentStartAngle = filling
                ? baseStartAngle
                : baseStartAngle + localPhase * maxSweep;
              const currentSweep = filling
                ? maxSweep * localPhase
                : maxSweep * (1 - localPhase);

              if (kind === 'sector') {
                pathNode.setAttribute('d', describeSectorPath(radius, currentStartAngle, currentSweep));
                return;
              }
              pathNode.setAttribute('d', describeArcPath(radius, currentStartAngle, currentSweep));
            };

            updatePath();
            gsap.fromTo(sweepState, {
              phase: 0,
            }, {
              phase: 2,
              duration: layerCycleDuration,
              repeat: -1,
              ease: 'none',
              onUpdate: updatePath,
            });
          });
        }

        let hasLayerRotateMotion = false;

        motionModes.forEach((motion) => {
          if (motion === 'rotate' && !hasLayerRotateMotion) {
            hasLayerRotateMotion = true;
            gsap.to(target, {
              rotate: 360,
              duration: layerCycleDuration,
              repeat: -1,
              ease: 'none',
              svgOrigin: '50 50',
            });
            return;
          }

          if (motion === 'counter-rotate' && !hasLayerRotateMotion) {
            hasLayerRotateMotion = true;
            gsap.to(target, {
              rotate: -360,
              duration: layerCycleDuration,
              repeat: -1,
              ease: 'none',
              svgOrigin: '50 50',
            });
            return;
          }

          if (motion === 'pulse') {
            const halfCycleDuration = getLoopSyncedYoyoHalfDuration(
              normalizedRecipe.loopSeconds,
              layerCycleDuration * 0.5,
            );
            gsap.to(target, {
              scale: 1.14,
              duration: halfCycleDuration,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              svgOrigin: '50 50',
            });
            return;
          }

          if (motion === 'sweep' && !hasLayerRotateMotion) {
            hasLayerRotateMotion = true;
            const halfCycleDuration = getLoopSyncedYoyoHalfDuration(
              normalizedRecipe.loopSeconds,
              layerCycleDuration * 0.5,
            );
            gsap.to(target, {
              rotate: 42,
              duration: halfCycleDuration,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              svgOrigin: '50 50',
            });
            return;
          }

          if (motion === 'blink') {
            const blinkHalfDuration = getLoopSyncedYoyoHalfDuration(
              normalizedRecipe.loopSeconds,
              layerCycleDuration * 0.2,
              0.015,
            );
            gsap.to(target, {
              opacity: 0.2,
              duration: blinkHalfDuration,
              repeat: -1,
              yoyo: true,
              ease: 'steps(2)',
            });
            return;
          }

          if (motion === 'infinite-zoom') {
            const zoomCycleDuration = getLoopSyncedDuration(
              normalizedRecipe.loopSeconds,
              layerCycleDuration,
            );
            const zoomTargets = gsap.utils.toArray<SVGElement>(`${target} [data-instance-motion]`);
            zoomTargets.forEach((node) => {
              const minScale = 0.54;
              const maxScale = 1.08;

              gsap.set(node, {
                svgOrigin: '0 0',
                scale: minScale,
                opacity: 1,
              });
              gsap.fromTo(node, {
                scale: minScale,
                opacity: 1,
              }, {
                scale: maxScale,
                opacity: 0,
                duration: zoomCycleDuration,
                repeat: -1,
                ease: 'none',
              });
            });
          }
        });
      });
    }, rootRef);

    const scopedTweens = (ctx as any).getTweens?.() ?? [];
    scopedAnimationsRef.current = scopedTweens;
    let syncToClock: (() => void) | null = null;
    // Keep multiple live canvases frame-identical by hard-syncing to one clock.
    syncToClock = () => {
      const globalTimeSeconds = (
        typeof performance !== 'undefined' ? performance.now() : Date.now()
      ) / 1000;
      scopedTweens.forEach((animation: gsap.core.Animation) => {
        animation.pause();
        animation.totalTime(globalTimeSeconds);
      });
    };
    syncToClock();
    gsap.ticker.add(syncToClock);

    return () => {
      if (syncToClock) {
        gsap.ticker.remove(syncToClock);
      }
      scopedAnimationsRef.current = [];
      ctx.revert();
      if (restoreFps) {
        gsap.ticker.fps(previousFps);
      }
    };
  }, [animate, normalizedRecipe, safeFpsCap, isForcedTimeMode]);

  return (
    <div
      ref={rootRef}
      className={`border border-[rgb(var(--signal-rgb)/0.45)] ${className}`}
      style={{ backgroundColor: transparentBackground ? 'transparent' : normalizedRecipe.backgroundColor, ...style }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" style={{ width: '100%', height: '100%' }} fill="none" aria-hidden="true">
        <defs>
          <filter {...filterProps} id={noiseFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type={normalizedRecipe.masterNoiseType}
              baseFrequency={noiseBaseFrequency}
              numOctaves="2"
              seed={normalizedRecipe.masterNoiseSeed}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono" result="bw">
              <feFuncR type="discrete" tableValues="0 1" />
              <feFuncG type="discrete" tableValues="0 1" />
              <feFuncB type="discrete" tableValues="0 1" />
            </feComponentTransfer>
          </filter>
          <pattern id={noisePatternId} patternUnits="userSpaceOnUse" width={noiseTileSize} height={noiseTileSize}>
            <rect width={noiseTileSize} height={noiseTileSize} fill={normalizedRecipe.inverted ? '#ffffff' : '#000000'} />
            <rect
              width={noiseTileSize}
              height={noiseTileSize}
              fill={normalizedRecipe.inverted ? '#000000' : '#ffffff'}
              filter={`url(#${noiseFilterId})`}
            />
          </pattern>
          <filter {...filterProps} id={thresholdFilterAId} x="-12%" y="-12%" width="124%" height="124%">
            <feColorMatrix type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono">
              <feFuncR type="discrete" tableValues={thresholdTableA} />
              <feFuncG type="discrete" tableValues={thresholdTableA} />
              <feFuncB type="discrete" tableValues={thresholdTableA} />
              <feFuncA type="discrete" tableValues={thresholdTableA} />
            </feComponentTransfer>
          </filter>
          <filter {...filterProps} id={posterizeFilterAId} x="-12%" y="-12%" width="124%" height="124%">
            <feColorMatrix type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono">
              <feFuncR type="discrete" tableValues={posterizeTableA} />
              <feFuncG type="discrete" tableValues={posterizeTableA} />
              <feFuncB type="discrete" tableValues={posterizeTableA} />
            </feComponentTransfer>
          </filter>
          <filter {...filterProps} id={pixelateFilterAId} x="-14%" y="-14%" width="128%" height="128%">
            <feMorphology in="SourceGraphic" operator="dilate" radius={pixelRadiusA} result="chunkA" />
            <feMorphology in="chunkA" operator="erode" radius={pixelRadiusA} result="pixelA" />
            <feComponentTransfer in="pixelA">
              <feFuncA type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            </feComponentTransfer>
          </filter>
          <filter {...filterProps} id={glowFilterAId} x="-22%" y="-22%" width="144%" height="144%">
            <feGaussianBlur stdDeviation={glowBlurA} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter {...filterProps} id={blurFilterAId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={blurStdDevA} />
          </filter>
          <filter {...filterProps} id={particlesFilterPreId} x="-18%" y="-18%" width="136%" height="136%">
            <feTurbulence
              type="turbulence"
              baseFrequency={particleFrequency}
              numOctaves="2"
              seed={normalizedRecipe.masterNoiseSeed + 11}
              stitchTiles="stitch"
              result="particleNoise"
            />
            <feColorMatrix in="particleNoise" type="saturate" values="0" result="particleMono" />
            <feComponentTransfer in="particleMono" result="particleMask">
              <feFuncR type="discrete" tableValues={particleTable} />
              <feFuncG type="discrete" tableValues={particleTable} />
              <feFuncB type="discrete" tableValues={particleTable} />
              <feFuncA type="discrete" tableValues={particleTable} />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="particleMask" operator="in" result="particleCut" />
            {normalizedRecipe.masterParticleShape === 'circle' ? (
              <>
                <feMorphology in="particleCut" operator="dilate" radius={particleRadius} result="particleSeed" />
                <feGaussianBlur in="particleSeed" stdDeviation={particleCircleBlur} result="particleBlur" />
                <feComponentTransfer in="particleBlur">
                  <feFuncA type="gamma" amplitude="1" exponent={particleCircleGamma} offset="0" />
                </feComponentTransfer>
              </>
            ) : (
              <feMorphology in="particleCut" operator="dilate" radius={particleRadius} />
            )}
          </filter>
          <filter {...filterProps} id={grainFilterPreId} x="-16%" y="-16%" width="132%" height="132%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={grainFrequency}
              numOctaves="1"
              seed={normalizedRecipe.masterNoiseSeed}
              stitchTiles="stitch"
              result="grainNoise"
            />
            <feColorMatrix in="grainNoise" type="saturate" values="0" result="grainMono" />
            <feComponentTransfer in="grainMono" result="grainAlpha">
              <feFuncA type="linear" slope={grainAmount} />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="grainAlpha" mode="screen" />
          </filter>
          <filter {...filterProps} id={thresholdFilterBId} x="-12%" y="-12%" width="124%" height="124%">
            <feColorMatrix type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono">
              <feFuncR type="discrete" tableValues={thresholdTableB} />
              <feFuncG type="discrete" tableValues={thresholdTableB} />
              <feFuncB type="discrete" tableValues={thresholdTableB} />
              <feFuncA type="discrete" tableValues={thresholdTableB} />
            </feComponentTransfer>
          </filter>
          <filter {...filterProps} id={posterizeFilterBId} x="-12%" y="-12%" width="124%" height="124%">
            <feColorMatrix type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono">
              <feFuncR type="discrete" tableValues={posterizeTableB} />
              <feFuncG type="discrete" tableValues={posterizeTableB} />
              <feFuncB type="discrete" tableValues={posterizeTableB} />
            </feComponentTransfer>
          </filter>
          <filter {...filterProps} id={pixelateFilterBId} x="-14%" y="-14%" width="128%" height="128%">
            <feMorphology in="SourceGraphic" operator="dilate" radius={pixelRadiusB} result="chunkB" />
            <feMorphology in="chunkB" operator="erode" radius={pixelRadiusB} result="pixelB" />
            <feComponentTransfer in="pixelB">
              <feFuncA type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            </feComponentTransfer>
          </filter>
          <filter {...filterProps} id={glowFilterBId} x="-22%" y="-22%" width="144%" height="144%">
            <feGaussianBlur stdDeviation={glowBlurB} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter {...filterProps} id={blurFilterBId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={blurStdDevB} />
          </filter>
          {normalizedRecipe.masterFrameShape !== 'none' ? (
            <clipPath id={sceneClipPathId} clipPathUnits="userSpaceOnUse">
              {normalizedRecipe.masterFrameShape === 'circle' ? (
                <circle cx="50" cy="50" r={clipRadius} />
              ) : (
                <rect x={clipInset} y={clipInset} width={clipSize} height={clipSize} />
              )}
            </clipPath>
          ) : null}
        </defs>
        <g clipPath={sceneClipPath}>
          <g data-master-scene transform={`translate(50 50) scale(${sceneScale}) translate(-50 -50)`}>
            <g data-master-motion transform={forcedMasterMotionTransform}>
              <g
                data-render-scene-secondary
                filter={secondaryRenderFilterId ? `url(#${secondaryRenderFilterId})` : undefined}
              >
                <g
                  data-render-scene-primary
                  filter={primaryRenderFilterId ? `url(#${primaryRenderFilterId})` : undefined}
                >
                  <g
                    data-render-scene-prepass-primary={prepassFirstLabel}
                    filter={prepassFirstFilterId ? `url(#${prepassFirstFilterId})` : undefined}
                  >
                    <g
                      data-render-scene-prepass-secondary={prepassSecondLabel}
                      filter={prepassSecondFilterId ? `url(#${prepassSecondFilterId})` : undefined}
                    >
                      {Array.from({ length: normalizedRecipe.masterFeedback + 1 }, (_, index) => normalizedRecipe.masterFeedback - index).map((feedbackIndex) => {
                        const feedbackScale = 1 + feedbackIndex * 0.08;
                        const feedbackOpacity = feedbackIndex === 0 ? 1 : Math.max(0.06, 0.25 / (feedbackIndex + 1));
                        let feedbackScaleRuntime = feedbackScale;
                        let feedbackOpacityRuntime = feedbackOpacity;

                        if (
                          isForcedTimeMode
                          && normalizedRecipe.feedbackLfoEnabled
                          && normalizedRecipe.masterFeedback > 0
                          && feedbackIndex > 0
                        ) {
                          const cycle = getLoopSyncedDuration(
                            normalizedRecipe.loopSeconds,
                            normalizedRecipe.feedbackLfoCycleSeconds,
                            0.08,
                          );
                          const depth = normalizedRecipe.feedbackLfoDepth;
                          const feedbackWeight = feedbackIndex / Math.max(1, normalizedRecipe.masterFeedback);
                          const scaleDelta = depth * 0.34 * feedbackWeight;
                          const trailOpacity = clampNumber(feedbackOpacity * (0.8 + depth * 0.45), 0.03, 1);
                          const resetDuration = clampNumber(
                            cycle * (0.1 + feedbackWeight * 0.08),
                            0.01,
                            Math.max(0.01, cycle * 0.45),
                          );
                          const fadeDuration = Math.max(0.01, cycle - resetDuration);
                          const phaseDelay = cycle * 0.55 * feedbackWeight;
                          const localTime = ((forcedTimeSecondsSafe - phaseDelay) % cycle + cycle) % cycle;

                          if (localTime <= fadeDuration) {
                            const p = localTime / fadeDuration;
                            feedbackScaleRuntime = feedbackScale + scaleDelta * p;
                            feedbackOpacityRuntime = trailOpacity * (1 - p);
                          } else {
                            const p = (localTime - fadeDuration) / resetDuration;
                            feedbackScaleRuntime = (feedbackScale + scaleDelta) + (feedbackScale - (feedbackScale + scaleDelta)) * p;
                            feedbackOpacityRuntime = trailOpacity * p;
                          }
                        }

                        return (
                          <g
                            key={`feedback-${feedbackIndex}`}
                            data-feedback-layer
                            data-feedback-index={feedbackIndex}
                            data-feedback-base-scale={feedbackScale}
                            data-feedback-base-opacity={feedbackOpacity}
                            opacity={feedbackOpacityRuntime}
                            transform={`translate(50 50) scale(${feedbackScaleRuntime}) translate(-50 -50)`}
                          >
                            {normalizedRecipe.layers.map((layer, layerIndex) => {
                              if (!layer.enabled) return null;
                              const forcedLayerMotion = isForcedTimeMode
                                ? getForcedLayerMotionState(
                                  layer,
                                  forcedTimeSecondsSafe,
                                  normalizedRecipe.loopSeconds,
                                  globalMotionSpeed,
                                )
                                : null;
                              const layerForGlyph = forcedLayerMotion?.layerForGlyph || layer;
                              const layerSizeScale = getLayerSizeScale(layerIndex, totalLayers, forcedLayerSizeRatio);

                              return (
                                <g
                                  key={`${layer.id}-f${feedbackIndex}`}
                                  data-layer-index={layerIndex}
                                  transform={forcedLayerMotion?.layerTransform}
                                  opacity={forcedLayerMotion?.layerOpacity}
                                >
                                  {Array.from({ length: layer.repeatCount }, (_, index) => {
                                    const position = getRepeatPosition(layer, index);
                                    const repeatInstanceScale = getRepeatInstanceScale(layer, index);
                                    return (
                                      <g
                                        key={`${layer.id}-${feedbackIndex}-${index}`}
                                        data-instance
                                        transform={`translate(${position.x} ${position.y}) rotate(${layer.rotation})`}
                                      >
                                        <g
                                          data-instance-motion
                                          transform={forcedLayerMotion?.instanceTransform}
                                          opacity={forcedLayerMotion?.instanceMotionOpacity}
                                        >
                                          <g transform={`scale(${repeatInstanceScale})`}>
                                            <g data-layer-size-index={layerIndex} transform={`scale(${layerSizeScale})`}>
                                              <LayerGlyph
                                                layer={layerForGlyph}
                                                masterStrokeWidth={normalizedRecipe.masterStrokeWidth}
                                                layerColor={layerColor}
                                                noiseFillId={noisePatternId}
                                                forceTimeSeconds={forceTimeSeconds}
                                                loopSeconds={normalizedRecipe.loopSeconds}
                                                masterSpeed={globalMotionSpeed}
                                              />
                                            </g>
                                          </g>
                                        </g>
                                      </g>
                                    );
                                  })}
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
        {normalizedRecipe.masterFrameShape === 'circle' ? (
          <circle
            cx="50"
            cy="50"
            r={frameRadius}
            fill="none"
            stroke={layerColor}
            strokeWidth={frameStrokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            pointerEvents="none"
          />
        ) : null}
        {normalizedRecipe.masterFrameShape === 'square' ? (
          <rect
            x={frameInset}
            y={frameInset}
            width={frameSize}
            height={frameSize}
            fill="none"
            stroke={layerColor}
            strokeWidth={frameStrokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            pointerEvents="none"
          />
        ) : null}
      </svg>
    </div>
  );
}
