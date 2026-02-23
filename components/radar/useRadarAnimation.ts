'use client';

import { useLayoutEffect } from 'react';
import gsap from 'gsap';

export function useRadarAnimation(rootRef: any, variant = 'crosshair', options: any = {}) {
  const { onQuadrantStep } = options;

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      switch (variant) {
        case 'quadrants':
          gsap.set(
            '[data-cell="tl"], [data-cell="tr"], [data-cell="br"], [data-cell="bl"]',
            { x: 0, y: 0 }
          );

          if (onQuadrantStep) {
            onQuadrantStep(0);
          }

          gsap.timeline({ repeat: -1 })
            .call(() => {
              if (onQuadrantStep) {
                onQuadrantStep(0);
              }
            })
            .to('[data-cell="tl"]', {
              x: 35,
              y: 35,
              duration: 0.5,
              ease: 'steps(1)',
            })
            .call(() => {
              if (onQuadrantStep) {
                onQuadrantStep(1);
              }
            })
            .to(
              '[data-cell="tr"]',
              {
                x: -35,
                y: 35,
                duration: 0.5,
                ease: 'steps(1)',
              },
              '>'
            )
            .call(() => {
              if (onQuadrantStep) {
                onQuadrantStep(2);
              }
            })
            .to(
              '[data-cell="br"]',
              {
                x: -35,
                y: -35,
                duration: 0.5,
                ease: 'steps(1)',
              },
              '>'
            )
            .call(() => {
              if (onQuadrantStep) {
                onQuadrantStep(3);
              }
            })
            .to(
              '[data-cell="bl"]',
              {
                x: 35,
                y: -35,
                duration: 0.5,
                ease: 'steps(1)',
              },
              '>'
            )
            .to({}, { duration: 0.5 })
            .set(
              '[data-cell="tl"], [data-cell="tr"], [data-cell="br"], [data-cell="bl"]',
              {
                x: 0,
                y: 0,
              }
            )
            .to({}, { duration: 0.2 });
          break;

        case 'squares':
          gsap.utils.toArray<SVGElement>('[data-zoom-ring]').forEach((ring, index) => {
            const baseScale =
              Number(ring.getAttribute('data-base-scale')) || 0.34 + index * 0.16;

            gsap.set(ring, {
              transformOrigin: '50% 50%',
              scale: baseScale,
              opacity: 1,
            });

            gsap.to(ring, {
              keyframes: [
                {
                  scale: baseScale + 0.7,
                  opacity: 0,
                  duration: 1.45,
                  ease: 'steps(9)',
                },
                {
                  scale: baseScale,
                  opacity: 1,
                  duration: 0.01,
                  ease: 'none',
                },
              ],
              repeat: -1,
              delay: index * 0.24,
              ease: 'none',
            });
          });
          break;

        case 'crosshair':
          gsap.set('[data-cross-grow]', {
            attr: { x2: 300, y2: 300 },
          });

          gsap.to('[data-cross-rotor]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 9.5,
            repeat: -1,
            ease: 'steps(72)',
          });

          gsap.timeline({ repeat: -1 })
            .set('[data-cross-grow]', { attr: { x2: 300, y2: 300 } })
            .to('[data-cross-grow="up"]', {
              attr: { y2: 92 },
              duration: 0.48,
              ease: 'steps(16)',
            })
            .to('[data-cross-grow="right"]', {
              attr: { x2: 508 },
              duration: 0.48,
              ease: 'steps(16)',
            })
            .to('[data-cross-grow="down"]', {
              attr: { y2: 508 },
              duration: 0.48,
              ease: 'steps(16)',
            })
            .to('[data-cross-grow="left"]', {
              attr: { x2: 92 },
              duration: 0.48,
              ease: 'steps(16)',
            })
            .to({}, { duration: 0.45 })
            .to('[data-cross-grow="left"]', {
              attr: { x2: 300 },
              duration: 0.38,
              ease: 'steps(12)',
            })
            .to('[data-cross-grow="down"]', {
              attr: { y2: 300 },
              duration: 0.38,
              ease: 'steps(12)',
            })
            .to('[data-cross-grow="right"]', {
              attr: { x2: 300 },
              duration: 0.38,
              ease: 'steps(12)',
            })
            .to('[data-cross-grow="up"]', {
              attr: { y2: 300 },
              duration: 0.38,
              ease: 'steps(12)',
            })
            .to({}, { duration: 0.2 });

          gsap.utils.toArray<SVGElement>('[data-reticle-ring]').forEach((ring, index) => {
            gsap.to(ring, {
              strokeDashoffset: index % 2 === 0 ? '-=240' : '+=240',
              duration: 2 + index * 0.3,
              repeat: -1,
              ease: 'none',
            });
          });

          gsap.set('[data-reticle-ring]', {
            transformOrigin: '50% 50%',
            scale: 1,
            opacity: 1,
          });

          gsap.set('[data-reticle-center-pulse]', {
            transformOrigin: '50% 50%',
            scale: 0.9,
            opacity: 1,
          });
          gsap.to('[data-reticle-center-pulse]', {
            keyframes: [
              { scale: 0.9, opacity: 1, duration: 0.01, ease: 'none' },
              { scale: 1.25, opacity: 0.55, duration: 0.55, ease: 'steps(6)' },
              { scale: 0.9, opacity: 1, duration: 0.55, ease: 'steps(6)' },
            ],
            repeat: -1,
            ease: 'none',
          });
          break;

        case 'sun':
          gsap.utils.toArray<SVGElement>('[data-circle-zoom]').forEach((ring, index) => {
            const baseScale =
              Number(ring.getAttribute('data-base-scale')) || 0.28 + index * 0.16;

            gsap.set(ring, {
              transformOrigin: '50% 50%',
              scale: baseScale,
            });

            gsap.to(ring, {
              keyframes: [
                {
                  scale: baseScale + 0.8,
                  duration: 1.5,
                  ease: 'steps(9)',
                },
                {
                  scale: baseScale,
                  duration: 0.01,
                  ease: 'none',
                },
              ],
              repeat: -1,
              delay: index * 0.24,
              ease: 'none',
            });
          });
          break;

        case 'diamond':
          gsap.to('[data-sonar-core]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 8.4,
            repeat: -1,
            ease: 'steps(96)',
          });

          gsap.utils.toArray<SVGElement>('[data-sonar-ring]').forEach((ring, index) => {
            gsap.to(ring, {
              strokeDashoffset: index % 2 === 0 ? -180 : 180,
              duration: 2.2 + index * 0.22,
              repeat: -1,
              ease: 'none',
            });
          });

          gsap.to('[data-square-cross]', {
            scale: 1.03,
            transformOrigin: '50% 50%',
            duration: 0.9,
            repeat: -1,
            yoyo: true,
            ease: 'steps(4)',
          });

          gsap.to('[data-cross-block]', {
            opacity: 0.35,
            duration: 0.34,
            repeat: -1,
            yoyo: true,
            ease: 'steps(1)',
            stagger: 0.12,
          });
          break;

        case 'updown':
          gsap.to('[data-up-arrow-rotor]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 8.8,
            repeat: -1,
            ease: 'steps(64)',
          });

          gsap.utils.toArray<SVGElement>('[data-up-arrow-arc]').forEach((arc, index) => {
            gsap.to(arc, {
              strokeDashoffset: index % 2 === 0 ? -120 : 120,
              duration: 1.7 + index * 0.25,
              repeat: -1,
              ease: 'steps(24)',
            });
          });
          break;

        case 'refresh':
          gsap.to('[data-refresh]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 6.4,
            repeat: -1,
            ease: 'steps(48)',
          });
          gsap.to('[data-refresh-a], [data-refresh-b]', {
            strokeDashoffset: -72,
            duration: 1.6,
            repeat: -1,
            ease: 'steps(18)',
          });
          break;

        case 'upload':
          gsap.to('[data-glyph="upload"]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 8.2,
            repeat: -1,
            ease: 'steps(64)',
          });
          gsap.to('[data-upload]', {
            y: -9,
            duration: 1.1,
            repeat: -1,
            yoyo: true,
            ease: 'steps(8)',
          });
          gsap.to('[data-glyph="upload"]', {
            strokeDashoffset: -64,
            duration: 1.5,
            repeat: -1,
            ease: 'steps(16)',
          });
          break;

        case 'sonarWave':
          gsap.utils.toArray<SVGElement>('[data-sonar-wave-ring]').forEach((ring, index) => {
            gsap.to(ring, {
              strokeDashoffset: index % 2 === 0 ? '-=180' : '+=180',
              duration: 1.9 + index * 0.25,
              repeat: -1,
              ease: 'none',
            });
          });
          gsap.to('[data-sonar-wave-beam]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 7.8,
            repeat: -1,
            ease: 'steps(72)',
          });
          break;

        case 'oscilloscope':
          gsap.to('[data-osc-trace]', {
            strokeDashoffset: -180,
            duration: 1.8,
            repeat: -1,
            ease: 'steps(24)',
          });
          gsap.to('[data-osc-scan]', {
            x: 368,
            duration: 1.4,
            repeat: -1,
            yoyo: true,
            ease: 'steps(20)',
          });
          gsap.to('[data-osc-grid]', {
            strokeDashoffset: -56,
            duration: 2.4,
            repeat: -1,
            ease: 'none',
          });
          break;

        case 'reconnectBridge':
          gsap.to('[data-bridge-link]', {
            strokeDashoffset: -120,
            strokeDasharray: '14 10',
            duration: 1.4,
            repeat: -1,
            ease: 'steps(20)',
          });
          gsap.to('[data-bridge-node]', {
            strokeDashoffset: -80,
            duration: 1.6,
            repeat: -1,
            ease: 'none',
          });
          gsap.to('[data-bridge-dash]', {
            strokeDashoffset: -54,
            duration: 1.2,
            repeat: -1,
            ease: 'steps(12)',
          });
          break;

        case 'radarSector':
          gsap.to('[data-sector-rotor]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 8.6,
            repeat: -1,
            ease: 'steps(96)',
          });
          gsap.utils.toArray<SVGElement>('[data-sector-ring]').forEach((ring, index) => {
            gsap.to(ring, {
              strokeDashoffset: index % 2 === 0 ? '-=120' : '+=120',
              duration: 1.9 + index * 0.2,
              repeat: -1,
              ease: 'none',
            });
          });
          break;

        case 'compassGrid':
          gsap.to('[data-compass-needle], [data-compass-tail]', {
            rotate: 360,
            transformOrigin: '50% 50%',
            duration: 9.2,
            repeat: -1,
            ease: 'steps(72)',
          });
          break;

        case 'gpsLock':
          gsap.to('[data-gps-ring]', {
            strokeDashoffset: -180,
            duration: 2.1,
            repeat: -1,
            ease: 'none',
            stagger: 0.2,
          });
          gsap.to('[data-gps-diamond]', {
            scale: 1.28,
            transformOrigin: '50% 50%',
            duration: 1.2,
            repeat: -1,
            yoyo: true,
            ease: 'steps(8)',
          });
          break;

        case 'matrixGrid':
          gsap.to('[data-matrix-lines]', {
            strokeDashoffset: -48,
            duration: 1.7,
            repeat: -1,
            ease: 'steps(18)',
          });
          gsap.to('[data-matrix-nodes]', {
            scale: 1.22,
            transformOrigin: '50% 50%',
            duration: 0.9,
            repeat: -1,
            yoyo: true,
            ease: 'steps(6)',
          });
          break;

        case 'networkMesh':
          gsap.to('[data-network-links]', {
            strokeDashoffset: -160,
            duration: 2,
            repeat: -1,
            ease: 'none',
          });
          gsap.to('[data-network-nodes]', {
            scale: 1.22,
            transformOrigin: '50% 50%',
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: 'steps(6)',
          });
          break;

        default:
          break;
      }
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [rootRef, variant, onQuadrantStep]);
}
