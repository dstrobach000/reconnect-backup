'use client';

import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { normalizeBuilderConfig } from '../../lib/animationBuilder';

function resolveStrokeDasharray(config, completionPercent) {
  if (completionPercent < 100) {
    return `${completionPercent} ${Math.max(0, 100 - completionPercent)}`;
  }
  if (config.strokeStyle === 'dashed') {
    return '6 6';
  }
  return undefined;
}

function buildCompletionMaskPath(cx, cy, radius, completionPercent) {
  if (completionPercent <= 0) {
    return `M ${cx} ${cy} Z`;
  }

  if (completionPercent >= 100) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${
      cy + radius
    } A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`;
  }

  const endAngle = (-90 + completionPercent * 3.6) * (Math.PI / 180);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArc = completionPercent > 50 ? 1 : 0;

  return `M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function applyDasharray(elements, dasharray) {
  elements.forEach((element) => {
    if (dasharray) {
      element.setAttribute('stroke-dasharray', dasharray);
    } else {
      element.removeAttribute('stroke-dasharray');
    }
  });
}

function applyCompletionMask(paths, completionPercent) {
  paths.forEach((pathNode) => {
    const cx = Number(pathNode.getAttribute('data-mask-cx'));
    const cy = Number(pathNode.getAttribute('data-mask-cy'));
    const radius = Number(pathNode.getAttribute('data-mask-radius'));
    pathNode.setAttribute('d', buildCompletionMaskPath(cx, cy, radius, completionPercent));
  });
}

function getCompletionMaskRadius(shape, size) {
  if (shape === 'circle') return size;
  if (shape === 'line') return size;
  return size * 1.45;
}

function ShapePrimitive({ shape, cx, cy, size, rotation = 0, shapeProps }) {
  if (shape === 'line') {
    return (
      <line
        x1={cx - size}
        y1={cy}
        x2={cx + size}
        y2={cy}
        pathLength={100}
        transform={`rotate(${rotation} ${cx} ${cy})`}
        {...shapeProps}
      />
    );
  }

  if (shape === 'square') {
    return (
      <rect
        x={cx - size}
        y={cy - size}
        width={size * 2}
        height={size * 2}
        pathLength={100}
        {...shapeProps}
      />
    );
  }

  return <circle cx={cx} cy={cy} r={size} pathLength={100} {...shapeProps} />;
}

function createRadialPositions(config) {
  if (config.shapeLayout === 'stacked') {
    return Array.from({ length: config.numberOfShapes }, () => ({ cx: 50, cy: 50 }));
  }

  if (config.numberOfShapes <= 1) {
    return [{ cx: 50, cy: 50 }];
  }

  const radiusByPlacement = {
    inside: 18,
    on: 28,
    outside: 36,
  };
  const radius =
    config.buildOnShape === 'none'
      ? 30
      : radiusByPlacement[config.basePlacement] ?? radiusByPlacement.on;
  const distanceScale = config.shapeDistance / 100;
  const finalRadius = Math.min(46, radius * distanceScale);

  return Array.from({ length: config.numberOfShapes }, (_, index) => {
    const angle = (Math.PI * 2 * index) / config.numberOfShapes - Math.PI / 2;
    return {
      cx: 50 + Math.cos(angle) * finalRadius,
      cy: 50 + Math.sin(angle) * finalRadius,
    };
  });
}

function createGridPositions(config) {
  const rowCount = Math.max(1, config.gridRows);
  const colCount = Math.max(1, config.gridCols);
  const totalCells = rowCount * colCount;
  const targetCount = Math.min(config.numberOfShapes, totalCells);
  const xStep = colCount === 1 ? 0 : 64 / (colCount - 1);
  const yStep = rowCount === 1 ? 0 : 64 / (rowCount - 1);
  const distanceScale = config.shapeDistance / 100;

  return Array.from({ length: targetCount }, (_, index) => {
    const row = Math.floor(index / colCount);
    const col = index % colCount;
    const baseX = 18 + col * xStep;
    const baseY = 18 + row * yStep;
    return {
      cx: 50 + (baseX - 50) * distanceScale,
      cy: 50 + (baseY - 50) * distanceScale,
    };
  });
}

export default function BuilderCanvas({ config, className = 'aspect-square w-full' }) {
  const rootRef = useRef(null);
  const idPrefix = useId().replaceAll(':', '');
  const normalizedConfig = useMemo(() => normalizeBuilderConfig(config), [config]);
  const completionPercent = useMemo(
    () => (normalizedConfig.shapeCompletion / 360) * 100,
    [normalizedConfig.shapeCompletion],
  );
  const completionStartPercent = useMemo(
    () => (normalizedConfig.completionStart / 360) * 100,
    [normalizedConfig.completionStart],
  );
  const initialCompletionPercent = normalizedConfig.animateCompletion
    ? completionStartPercent
    : completionPercent;
  const strokeDasharray = useMemo(
    () => resolveStrokeDasharray(normalizedConfig, initialCompletionPercent),
    [initialCompletionPercent, normalizedConfig],
  );
  const showFill = normalizedConfig.fillMode !== 'stroke';
  const showStroke = normalizedConfig.fillMode !== 'fill' && normalizedConfig.strokeWidth > 0;

  const positions = useMemo(
    () => (normalizedConfig.formGrid ? createGridPositions(normalizedConfig) : createRadialPositions(normalizedConfig)),
    [normalizedConfig],
  );
  const sourceShapeSize = useMemo(
    () => {
      const noBaseShape = normalizedConfig.buildOnShape === 'none' && !normalizedConfig.formGrid;

      if (normalizedConfig.sourceShape === 'line') {
        const baseLineSize = normalizedConfig.lineLength / 2;
        if (!noBaseShape) return baseLineSize;
        if (normalizedConfig.numberOfShapes === 1) return Math.max(baseLineSize, 38);
        if (normalizedConfig.shapeLayout === 'stacked') return Math.max(baseLineSize, 30);
        return Math.max(baseLineSize, 16);
      }

      if (normalizedConfig.formGrid) {
        return 6.7;
      }

      if (noBaseShape) {
        if (normalizedConfig.numberOfShapes === 1) return 27;
        if (normalizedConfig.shapeLayout === 'stacked') return 18;
        return 11.5;
      }

      return 5.8;
    },
    [
      normalizedConfig.buildOnShape,
      normalizedConfig.formGrid,
      normalizedConfig.lineLength,
      normalizedConfig.numberOfShapes,
      normalizedConfig.shapeLayout,
      normalizedConfig.sourceShape,
    ],
  );

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const duration = Math.max(0.6, normalizedConfig.animationLength);
    const feedbackLayers = Math.max(1, normalizedConfig.feedback + 1);
    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<SVGElement>('[data-feedback-layer]');
      layers.forEach((layer, index) => {
        const delay = (duration / feedbackLayers) * index;
        const baseScale = 1 + index * 0.055;
        const baseOpacity = Math.max(0.12, 1 - index * 0.16);
        gsap.set(layer, {
          transformOrigin: '50% 50%',
          scale: baseScale,
          opacity: baseOpacity,
        });

        if (normalizedConfig.feedback > 0) {
          gsap.to(layer, {
            scale: baseScale + 0.42,
            opacity: 0,
            duration,
            delay,
            repeat: -1,
            ease: 'none',
          });
        }
      });

      switch (normalizedConfig.movementType) {
        case 'none':
          break;
        case 'pulse':
          gsap.to('[data-motion-group]', {
            scale: 1.08,
            transformOrigin: '50% 50%',
            duration: duration * 0.45,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          });
          break;
        case 'orbit':
          gsap.to('[data-shape-group]', {
            rotate: -360,
            transformOrigin: '50% 50%',
            duration,
            repeat: -1,
            ease: 'none',
          });
          break;
        case 'drift':
          gsap.to('[data-motion-group]', {
            x: 4,
            y: -4,
            transformOrigin: '50% 50%',
            duration: duration * 0.55,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
          break;
        case 'wave':
          gsap.to('[data-builder-shape]', {
            opacity: 0.25,
            duration: duration * 0.32,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            stagger: 0.08,
          });
          break;
        case 'zoom':
          gsap.to('[data-motion-group]', {
            scale: 1.24,
            transformOrigin: '50% 50%',
            duration: duration * 0.6,
            yoyo: true,
            repeat: -1,
            ease: 'none',
          });
          break;
        case 'rotate':
        default:
          gsap.to('[data-motion-group]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration,
            repeat: -1,
            ease: 'none',
          });
          break;
      }

      gsap.to('[data-builder-shape], [data-builder-base], [data-grid-overlay]', {
        strokeDashoffset: -100,
        duration: duration * 1.25,
        repeat: -1,
        ease: 'none',
      });

      const completableStrokeElements = gsap.utils.toArray<SVGElement>('[data-completable-stroke]');
      const completionMaskPaths = gsap.utils.toArray<SVGPathElement>('[data-completion-mask-path]');

      const updateCompletion = (percent) => {
        const nextDasharray = resolveStrokeDasharray(normalizedConfig, percent);
        applyDasharray(completableStrokeElements, nextDasharray);
        applyCompletionMask(completionMaskPaths, percent);
      };

      if (normalizedConfig.animateCompletion) {
        const state = { percent: completionStartPercent };
        updateCompletion(state.percent);
        gsap.to(state, {
          percent: completionPercent,
          duration,
          repeat: -1,
          yoyo: true,
          ease: 'none',
          onUpdate: () => updateCompletion(state.percent),
        });
      } else {
        updateCompletion(completionPercent);
      }
    }, rootRef);

    return () => ctx.revert();
  }, [completionPercent, completionStartPercent, normalizedConfig]);

  const layerCount = Math.max(1, normalizedConfig.feedback + 1);
  const shouldRenderStrokeForSource = showStroke || normalizedConfig.sourceShape === 'line';

  return (
    <div
      ref={rootRef}
      className={`border border-[rgb(var(--signal-rgb)/0.45)] ${className}`}
      style={{ backgroundColor: normalizedConfig.backgroundColor }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden="true">
        {Array.from({ length: layerCount }, (_, layerIndex) => (
          <g data-feedback-layer key={`layer-${layerIndex}`}>
            <defs>
              {showFill && normalizedConfig.buildOnShape !== 'none' && normalizedConfig.buildOnShape !== 'line' ? (
                <clipPath id={`${idPrefix}-base-${layerIndex}`}>
                  <path
                    data-completion-mask-path
                    data-mask-cx="50"
                    data-mask-cy="50"
                    data-mask-radius={getCompletionMaskRadius(normalizedConfig.buildOnShape, 27)}
                    d={buildCompletionMaskPath(
                      50,
                      50,
                      getCompletionMaskRadius(normalizedConfig.buildOnShape, 27),
                      initialCompletionPercent,
                    )}
                  />
                </clipPath>
              ) : null}

              {showFill && normalizedConfig.sourceShape !== 'line'
                ? positions.map((position, index) => (
                    <clipPath key={`shape-clip-${layerIndex}-${index}`} id={`${idPrefix}-shape-${layerIndex}-${index}`}>
                      <path
                        data-completion-mask-path
                        data-mask-cx={position.cx}
                        data-mask-cy={position.cy}
                        data-mask-radius={getCompletionMaskRadius(normalizedConfig.sourceShape, sourceShapeSize)}
                        d={buildCompletionMaskPath(
                          position.cx,
                          position.cy,
                          getCompletionMaskRadius(normalizedConfig.sourceShape, sourceShapeSize),
                          initialCompletionPercent,
                        )}
                      />
                    </clipPath>
                  ))
                : null}
            </defs>

            <g data-motion-group>
              {normalizedConfig.formGrid && normalizedConfig.gridStroke ? (
                <path
                  data-grid-overlay
                  d={`M18 18H82V82H18Z ${
                    Array.from({ length: normalizedConfig.gridCols - 1 }, (_, index) => {
                      const x = 18 + ((index + 1) * 64) / normalizedConfig.gridCols;
                      return `M${x} 18V82`;
                    }).join(' ')
                  } ${
                    Array.from({ length: normalizedConfig.gridRows - 1 }, (_, index) => {
                      const y = 18 + ((index + 1) * 64) / normalizedConfig.gridRows;
                      return `M18 ${y}H82`;
                    }).join(' ')
                  }`}
                  stroke={normalizedConfig.strokeColor}
                  strokeWidth={Math.max(0.6, normalizedConfig.strokeWidth * 0.45)}
                  strokeDasharray={normalizedConfig.strokeStyle === 'dashed' ? '2 3' : undefined}
                  opacity={0.5}
                />
              ) : null}

              {normalizedConfig.buildOnShape !== 'none' ? (
                <>
                  {showFill && normalizedConfig.buildOnShape !== 'line' ? (
                    <ShapePrimitive
                      shape={normalizedConfig.buildOnShape}
                      cx={50}
                      cy={50}
                      size={27}
                      shapeProps={{
                        'data-builder-base': true,
                        fill: normalizedConfig.fillColor,
                        stroke: 'none',
                        clipPath: `url(#${idPrefix}-base-${layerIndex})`,
                      }}
                    />
                  ) : null}
                  {showStroke ? (
                    <ShapePrimitive
                      shape={normalizedConfig.buildOnShape}
                      cx={50}
                      cy={50}
                      size={27}
                      shapeProps={{
                        'data-builder-base': true,
                        'data-completable-stroke': true,
                        fill: 'none',
                        stroke: normalizedConfig.strokeColor,
                        strokeWidth: normalizedConfig.strokeWidth,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeDasharray,
                      }}
                    />
                  ) : null}
                </>
              ) : null}

              <g data-shape-group>
                {positions.map((position, index) => {
                  const rotation =
                    normalizedConfig.sourceShape === 'line'
                      ? normalizedConfig.lineAngle + index * normalizedConfig.lineAngleStep
                      : 0;

                  return (
                    <g key={`shape-${layerIndex}-${index}`}>
                      {showFill && normalizedConfig.sourceShape !== 'line' ? (
                        <ShapePrimitive
                          shape={normalizedConfig.sourceShape}
                          cx={position.cx}
                          cy={position.cy}
                          size={sourceShapeSize}
                          rotation={rotation}
                          shapeProps={{
                            'data-builder-shape': true,
                            fill: normalizedConfig.fillColor,
                            stroke: 'none',
                            clipPath: `url(#${idPrefix}-shape-${layerIndex}-${index})`,
                          }}
                        />
                      ) : null}

                      {shouldRenderStrokeForSource ? (
                        <ShapePrimitive
                          shape={normalizedConfig.sourceShape}
                          cx={position.cx}
                          cy={position.cy}
                          size={sourceShapeSize}
                          rotation={rotation}
                          shapeProps={{
                            'data-builder-shape': true,
                            'data-completable-stroke': true,
                            fill: 'none',
                            stroke: normalizedConfig.strokeColor,
                            strokeWidth: normalizedConfig.strokeWidth,
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeDasharray,
                          }}
                        />
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
