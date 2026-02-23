'use client';

import { useCallback } from 'react';

export default function SiteMenu() {
  const scrollToSection = useCallback((sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="fixed left-3 top-3 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={() => scrollToSection('home')}
        className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--signal)] backdrop-blur-sm"
      >
        Home
      </button>
      <button
        type="button"
        onClick={() => scrollToSection('animation-builder')}
        className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--signal)] backdrop-blur-sm"
      >
        Animation Builder
      </button>
      <a
        href="/"
        className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--signal)] backdrop-blur-sm"
      >
        Presentation
      </a>
    </div>
  );
}
