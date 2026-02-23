'use client';

import { useEffect, useRef, useState } from 'react';

type DropdownOption = {
  value: string;
  label: string;
};

export default function StyledDropdown({
  value,
  options,
  onChange,
  tone = 'dark',
  className = '',
}: {
  value: string;
  options: DropdownOption[];
  onChange: (nextValue: string) => void;
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const isDark = tone === 'dark';

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative min-w-[176px] ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-2 rounded border px-3 py-1.5 text-sm normal-case ${
          isDark
            ? 'border-[rgb(var(--signal-rgb)/0.45)] bg-black text-[var(--signal)]'
            : 'border-black/30 bg-white text-black'
        }`}
      >
        <span>{selectedOption?.label ?? ''}</span>
        <svg
          viewBox="0 0 12 12"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            d="M2.25 4.5L6 8.25L9.75 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className={`absolute left-0 top-[calc(100%+6px)] z-40 w-full overflow-hidden rounded border shadow-xl ${
            isDark
              ? 'border-[rgb(var(--signal-rgb)/0.45)] bg-black/95 text-[var(--signal)]'
              : 'border-black/35 bg-white text-black'
          }`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  isSelected
                    ? isDark
                      ? 'bg-[rgb(var(--signal-rgb)/0.18)]'
                      : 'bg-black/10'
                    : isDark
                      ? 'hover:bg-[rgb(var(--signal-rgb)/0.1)]'
                      : 'hover:bg-black/5'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
