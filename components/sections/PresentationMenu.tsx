'use client';

import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { label: 'Home', href: '#home' },
  { label: 'program', href: '#program' },
  { label: 'panels', href: '#panels' },
  { label: 'details', href: '#details' },
  { label: 'SwapCard', href: '#swapcard' },
  { label: 'partners', href: '#partners' },
  { label: 'contact', href: '#contact' },
  { label: 'tickets', href: '#tickets' },
];

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.6.4-1 1-1Z" />
    </svg>
  );
}

export default function PresentationMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="fixed inset-x-0 top-3 z-40 px-3" aria-label="Mock site menu">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--signal)] transition-colors hover:bg-black"
            aria-expanded={isMenuOpen}
            aria-controls="presentation-menu-overlay"
          >
            Menu
          </button>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="#instagram"
              aria-label="Instagram"
              className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black p-2 text-[var(--signal)] transition-colors hover:bg-black"
            >
              <InstagramIcon />
            </a>
            <a
              href="#facebook"
              aria-label="Facebook"
              className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black p-2 text-[var(--signal)] transition-colors hover:bg-black"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>
      </nav>

      {isMenuOpen ? (
        <div
          id="presentation-menu-overlay"
          className="fixed inset-0 z-50 flex min-h-screen flex-col bg-black/95 px-5 py-4 text-[var(--signal)] backdrop-blur-md"
        >
          <div className="mx-auto flex w-full max-w-7xl justify-end">
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--signal)] transition-colors hover:bg-black"
            >
              Close
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-7xl flex-1 items-center">
            <div className="grid gap-4">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-fit text-[clamp(2rem,8vw,6rem)] uppercase leading-[0.9] tracking-[0.05em] transition-opacity hover:opacity-75"
                  style={{ fontFamily: 'var(--font-mekanikal)' }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
