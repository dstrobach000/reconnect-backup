'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_FONT_PICKER_SETTINGS,
  FONT_PICKER_ENDPOINT,
  FONT_PICKER_STORAGE_KEY,
  normalizeFontPickerSettings,
} from '../../lib/fontPicker';

const FONT_PICKER_EVENT = 'reconnect-font-picker-updated';

function readLocalSettings() {
  const raw = localStorage.getItem(FONT_PICKER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeFontPickerSettings(JSON.parse(raw));
  } catch {
    localStorage.removeItem(FONT_PICKER_STORAGE_KEY);
    return null;
  }
}

function writeLocalSettings(settings) {
  localStorage.setItem(FONT_PICKER_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent(FONT_PICKER_EVENT, {
      detail: settings,
    }),
  );
}

export default function useFontPickerSettings() {
  const [settings, setSettings] = useState(DEFAULT_FONT_PICKER_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const serializedRef = useRef(JSON.stringify(DEFAULT_FONT_PICKER_SETTINGS));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const localSettings = readLocalSettings();
      if (!cancelled && localSettings) {
        setSettings(localSettings);
        serializedRef.current = JSON.stringify(localSettings);
      }

      try {
        const response = await fetch(FONT_PICKER_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) {
          setIsLoaded(true);
          return;
        }

        const payload = await response.json();
        const next = normalizeFontPickerSettings(payload);
        if (!cancelled) {
          setSettings(next);
          serializedRef.current = JSON.stringify(next);
        }
      } catch {
        // Local storage remains fallback.
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    };

    void load();

    const onStorage = (event: StorageEvent) => {
      if (event.key !== FONT_PICKER_STORAGE_KEY || !event.newValue) return;
      try {
        const next = normalizeFontPickerSettings(JSON.parse(event.newValue));
        setSettings((current) => {
          const currentSerialized = JSON.stringify(current);
          const nextSerialized = JSON.stringify(next);
          return currentSerialized === nextSerialized ? current : next;
        });
      } catch {
        localStorage.removeItem(FONT_PICKER_STORAGE_KEY);
      }
    };

    const onCustomUpdate = (event: Event) => {
      const payload = (event as CustomEvent).detail;
      const next = normalizeFontPickerSettings(payload);
      setSettings((current) => {
        const currentSerialized = JSON.stringify(current);
        const nextSerialized = JSON.stringify(next);
        return currentSerialized === nextSerialized ? current : next;
      });
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(FONT_PICKER_EVENT, onCustomUpdate as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(FONT_PICKER_EVENT, onCustomUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const serialized = JSON.stringify(settings);
    if (serializedRef.current === serialized) return;
    serializedRef.current = serialized;

    writeLocalSettings(settings);

    const timeout = window.setTimeout(() => {
      void fetch(FONT_PICKER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      });
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [isLoaded, settings]);

  const setDisplayFont = useCallback((displayFont: string) => {
    setSettings((current) => normalizeFontPickerSettings({ ...current, displayFont }));
  }, []);

  const setSupportingFont = useCallback((supportingFont: string) => {
    setSettings((current) => normalizeFontPickerSettings({ ...current, supportingFont }));
  }, []);

  const setGlyph = useCallback((glyph: string) => {
    setSettings((current) => normalizeFontPickerSettings({ ...current, glyph }));
  }, []);

  return useMemo(
    () => ({
      settings,
      setDisplayFont,
      setSupportingFont,
      setGlyph,
    }),
    [setDisplayFont, setGlyph, setSupportingFont, settings],
  );
}
