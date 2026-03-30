'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import InlineAutoplayVideo from '../media/InlineAutoplayVideo';

const LOGO_VIDEOS = [
  '/new_assets/video/logo/SVGLogo_Float_White.mp4',
  '/new_assets/video/logo/3DLogoReveal_glass.mp4',
  '/new_assets/video/logo/SVGLogo_Strobe_Black.mp4',
  '/new_assets/video/logo/3DLogoRotation_black.mp4',
  '/new_assets/video/logo/SVGLogo_Strobe_White.mp4',
  '/new_assets/video/logo/3DLogoRotation_silver.mp4',
  '/new_assets/video/logo/SVGLogo_Stroke_Orange.mp4',
  '/new_assets/video/logo/3DLogoSweep_orangeglass.mp4',
  '/new_assets/video/logo/SVGLogo_Stroke_White.mp4',
] as const;

const INSTAGRAM_VIDEOS = [
  '/new_assets/video/instagram/graphics-instagram-portrait_1.mp4',
  '/new_assets/video/instagram/graphics-instagram-portrait_2.mp4',
  '/new_assets/video/instagram/graphics-instagram-portrait_3.mp4',
  '/new_assets/video/instagram/graphics-instagram-portrait_4.mp4',
  '/new_assets/video/instagram/graphics-instagram-portrait_5.mp4',
] as const;

const PRINT_IMAGES = [
  '/new_assets/images/mockups/A_stand.jpg',
  '/new_assets/images/mockups/citylight_1.jpg',
  '/new_assets/images/mockups/citylight_2.jpg',
  '/new_assets/images/mockups/citylight_3.jpg',
  '/new_assets/images/mockups/poster_frame.jpg',
  '/new_assets/images/mockups/poster_frame_2.jpg',
  '/new_assets/images/mockups/posters_bridge_1.jpg',
  '/new_assets/images/mockups/posters_bridge_2.jpg',
  '/new_assets/images/mockups/posters_wall.jpg',
] as const;

const HEADER_VENUES = ['Fleda', 'Kabinet múz', 'ArtBar', 'Sibiř', 'Kafara', 'Melodka', 'Music Lab'] as const;
const COLOR_SWATCHES = [
  { name: 'Reflex Orange', value: '#eb5e28', textColor: '#fffcf2' },
  { name: 'Off White', value: '#fffcf2', textColor: '#403d39' },
  { name: 'Silver', value: '#ccc5b9', textColor: '#403d39' },
  { name: 'Black', value: '#252422', textColor: '#eb5e28' },
  { name: 'Grey', value: '#403d39', textColor: '#fffcf2' },
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="reconnect-section">
      <div className="reconnect-section-copy">
        <h2 className="reconnect-section-title">{title}</h2>
        <p className="reconnect-section-description">{description}</p>
      </div>
      {children}
    </section>
  );
}

function MediaGrid({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`reconnect-media-grid ${className}`.trim()}>{children}</div>;
}

export default function ReconnectHomepage() {
  const [venueIndex, setVenueIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setVenueIndex((currentIndex) => (currentIndex + 1) % HEADER_VENUES.length);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="reconnect-homepage">
      <div className="reconnect-shell">
        <header className="reconnect-header">
          <div className="reconnect-header-column">
            <div className="reconnect-header-title">Reconnect</div>
            <div className="reconnect-header-title">Brno</div>
          </div>
          <div className="reconnect-header-column reconnect-header-column-right">
            <div className="reconnect-header-title">1.-.3. 10. 2026</div>
            <div className="reconnect-header-title">{HEADER_VENUES[venueIndex]}</div>
          </div>
        </header>

        <Section
          title="Logo"
          description="I redrew the original logo, adjusted the proportions of the circle and play symbol for a more balanced shape overall, and refined the connection points to make the mark feel more organic. These are some quick, raw animation ideas, both 2D and 3D, that we can keep refining and expanding."
        >
          <MediaGrid className="reconnect-media-grid-three">
            {LOGO_VIDEOS.map((src) => (
              <div key={src} className="reconnect-media-card reconnect-media-card-logo">
                <InlineAutoplayVideo
                  src={src}
                  loop
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </MediaGrid>
        </Section>

        <Section
          title="Instagram"
          description="Since the algorithm strongly favors video content these days, I would focus on motion design as the primary direction for social networks. Below are some title-card ideas for announcement posts, combining photos from previous years with bold type and logo geometry."
        >
          <MediaGrid className="reconnect-media-grid-three">
            {INSTAGRAM_VIDEOS.map((src) => (
              <div key={src} className="reconnect-media-card reconnect-media-card-instagram">
                <InlineAutoplayVideo
                  src={src}
                  loop
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </MediaGrid>
        </Section>

        <Section
          title="Print"
          description="Below are a few applications of the main design elements in print. The QR code works both as a strong visual element and as a way to draw the audience in, keep it engaged, and stay connected."
        >
          <MediaGrid className="reconnect-media-grid-print">
            {PRINT_IMAGES.map((src) => (
              <div key={src} className="reconnect-media-card reconnect-media-card-print">
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="reconnect-image"
                />
              </div>
            ))}
          </MediaGrid>
        </Section>

        <Section
          title="Display Font"
          description="I chose Panell Extended as the primary typeface for the logo and headlines. It is a high-impact geometric font with a few playful, rounded, organic details that match the character of the logotype."
        >
          <div className="reconnect-type-specimen reconnect-type-specimen-display">PANELL EXTENDED</div>
        </Section>

        <Section
          title="Body Font"
          description="For longer texts, I went with Dazzed, which echoes Panell's geometric structure while introducing the occasional playful twist. It stays readable and compact even at smaller sizes."
        >
          <div className="reconnect-type-specimen reconnect-type-specimen-body">DAZZED</div>
        </Section>

        <Section
          title="Color Palette"
          description="I used the original color palette as the starting point and selected five core colors that we can expand later with additional highlights. You can already see some of those directions in the print mockups above, especially the green and yellow. Reflex orange is the primary color, supported by off-white and three shades of grey."
        >
          <div className="reconnect-palette-grid" aria-label="Reconnect color palette">
            {COLOR_SWATCHES.map((swatch) => (
              <div key={swatch.name} className="reconnect-palette-card">
                <div
                  className="reconnect-palette-swatch"
                  style={{ background: swatch.value, color: swatch.textColor }}
                >
                  <span className="reconnect-palette-label">{swatch.name}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <style jsx global>{`
        .reconnect-homepage {
          min-height: 100vh;
          background: #fffcf2;
          color: #403d39;
          font-family: var(--font-dazzed-semibold), sans-serif;
        }

        .reconnect-shell {
          width: 100%;
          padding: 25px;
          display: flex;
          flex-direction: column;
          gap: 88px;
        }

        .reconnect-header {
          height: 200px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
          gap: 24px;
        }

        .reconnect-header-column {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .reconnect-header-title,
        .reconnect-section-title {
          font-family: var(--font-panell-extended), sans-serif;
          font-size: clamp(1.6rem, 4vw, 3.8rem);
          line-height: 0.92;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          margin: 0;
          white-space: nowrap;
        }

        .reconnect-header-column-right {
          align-items: flex-end;
        }

        .reconnect-header-column-right .reconnect-header-title {
          text-align: right;
        }

        .reconnect-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .reconnect-section-copy {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 640px;
        }

        .reconnect-section-title {
          font-size: clamp(1.5rem, 3vw, 2.625rem);
        }

        .reconnect-section-description {
          margin: 0;
          font-size: 1rem;
          line-height: 1.4;
          font-weight: 600;
        }

        .reconnect-media-grid {
          display: grid;
          width: 100%;
          grid-template-columns: repeat(5, minmax(0, calc((100% - 64px) / 5)));
          gap: 16px;
          align-items: start;
        }

        .reconnect-media-grid-three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .reconnect-media-grid-print {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .reconnect-media-grid-print .reconnect-media-card {
          max-width: none;
        }

        .reconnect-media-card {
          position: relative;
          overflow: hidden;
          background: #ccc5b9;
          width: 100%;
          max-width: 500px;
          justify-self: stretch;
        }

        .reconnect-media-card-logo {
          aspect-ratio: 1 / 1;
        }

        .reconnect-media-card-instagram,
        .reconnect-media-card-print {
          aspect-ratio: 4 / 5;
        }

        .reconnect-media-card-print {
          aspect-ratio: auto;
          background: transparent;
        }

        .reconnect-type-specimen {
          width: 100%;
          font-size: clamp(2.5rem, 8vw, 6.5rem);
          line-height: 0.95;
          text-transform: uppercase;
          word-break: break-word;
        }

        .reconnect-type-specimen-display {
          font-family: var(--font-panell-extended), sans-serif;
          font-weight: 600;
        }

        .reconnect-type-specimen-body {
          font-family: var(--font-dazzed-semibold), sans-serif;
          font-weight: 600;
        }

        .reconnect-palette-grid {
          display: grid;
          width: 100%;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        .reconnect-palette-card {
          width: 100%;
        }

        .reconnect-palette-swatch {
          width: 100%;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 16px;
        }

        .reconnect-palette-label {
          font-family: var(--font-panell-extended), sans-serif;
          font-size: clamp(1rem, 1.7vw, 1.5rem);
          line-height: 1;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .reconnect-image {
          display: block;
          width: 100%;
          height: auto;
        }

        @media (max-width: 800px) {
          .reconnect-shell {
            gap: 64px;
          }

          .reconnect-header {
            height: auto;
            grid-template-columns: 1fr;
          }

          .reconnect-header-column-right {
            align-items: flex-start;
          }

          .reconnect-header-column-right .reconnect-header-title {
            text-align: left;
          }

          .reconnect-media-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .reconnect-media-grid-print {
            grid-template-columns: 1fr;
          }

          .reconnect-palette-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .reconnect-media-grid {
            grid-template-columns: 1fr;
          }

          .reconnect-palette-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
