'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SymbolComposerCanvas from '../animation/SymbolComposerCanvasGL';
import ExportPanel from './ExportPanel';
import StyledDropdown from './StyledDropdown';
import { BUILDER_STORAGE_KEY } from '../../lib/animationBuilder';
import {
  DASH_STYLE_OPTIONS,
  FILL_MODE_OPTIONS,
  LAYER_TYPE_OPTIONS,
  MASTER_FRAME_SHAPE_OPTIONS,
  MASTER_MOTION_OPTIONS,
  MASTER_RENDER_EFFECT_OPTIONS,
  MOTION_TYPE_OPTIONS,
  NOISE_TYPE_OPTIONS,
  PARTICLE_SHAPE_OPTIONS,
  RENDER_PREPASS_ORDER_OPTIONS,
  RANDOMIZER_DEFAULTS,
  VARIATION_COUNT_OPTIONS,
  createDefaultComposerRecipe,
  createLayer,
  createRandomComposerRecipe,
  generateRecipeVariations,
  normalizeComposerRecipe,
  summarizeComposerRecipe,
} from '../../lib/symbolComposer';

const COMPOSER_LIBRARY_API = '/api/composer-library';
const RENDER_PRESETS_STORAGE_KEY = 'reconnect-render-presets-v1';

function TickBox({ enabled, sizeClass = 'h-4 w-4', markClass = 'h-2.5 w-2.5' }) {
  return (
    <span
      className={`relative flex ${sizeClass} items-center justify-center border border-[rgb(var(--signal-rgb)/0.7)] ${
        enabled ? 'bg-[rgb(var(--signal-rgb)/0.18)]' : 'bg-black'
      }`}
      aria-hidden="true"
    >
      {enabled ? (
        <svg viewBox="0 0 10 10" className={`${markClass} overflow-visible text-[var(--signal)]`}>
          <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.25" />
          <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      ) : null}
    </span>
  );
}

function ToggleField({ label, enabled, onToggle }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={enabled}
      onClick={onToggle}
      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em]"
    >
      <TickBox enabled={enabled} />
      <span>{label}</span>
    </button>
  );
}

function SelectField({ label, value, options, onChange }) {
  const mappedOptions = options.map((option) => ({
    value: String(option.value),
    label: option.label,
  }));

  return (
    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em]">
      <span>{label}</span>
      <StyledDropdown
        value={String(value)}
        onChange={onChange}
        options={mappedOptions}
        tone="dark"
        className="w-full min-w-0"
      />
    </label>
  );
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function formatSpeedSnapNote(loopSeconds, speed) {
  const safeLoop = Math.max(0.1, Number.isFinite(loopSeconds) ? loopSeconds : 0.1);
  const snappedDuration = getLoopSyncedDurationFromSpeed(safeLoop, speed);
  const cycles = Math.max(1, Math.round(safeLoop / snappedDuration));
  const cycleWord = cycles === 1 ? 'cycle' : 'cycles';
  return `snaps to ${cycles} ${cycleWord}/loop (${snappedDuration.toFixed(2)}s each). Increase Loop Length for slower motion.`;
}

function RangeField({ label, value, min, max, step, onChange, suffix = '', note = '' }) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  const baseStep = Number.isFinite(step) && step > 0 ? step : 1;
  const shouldKeepTenthStep = baseStep < 1 && max - min <= 2;
  const effectiveStep = baseStep >= 1 ? baseStep : shouldKeepTenthStep ? 0.1 : 1;
  const displayValue = effectiveStep >= 1
    ? Math.round(numericValue)
    : Number(numericValue.toFixed(1));

  return (
    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em]">
      <span>
        {label} ({displayValue}
        {suffix})
      </span>
      <input
        className="signal-slider h-8 appearance-none bg-transparent"
        type="range"
        min={min}
        max={max}
        step={effectiveStep}
        value={value}
        style={{ WebkitAppearance: 'none', appearance: 'none' }}
        onChange={(event) => {
          const rawValue = Number(event.target.value);
          const snappedValue = Math.round(rawValue / effectiveStep) * effectiveStep;
          const normalizedValue = effectiveStep >= 1
            ? Math.round(snappedValue)
            : Number(snappedValue.toFixed(1));
          onChange(clampNumber(normalizedValue, min, max));
        }}
      />
      {note ? (
        <span className="text-[9px] uppercase tracking-[0.14em] text-[rgb(var(--signal-rgb)/0.72)]">
          {note}
        </span>
      ) : null}
    </label>
  );
}

function buildRenderPresetPatch(recipe) {
  return {
    masterParticlesEnabled: recipe.masterParticlesEnabled,
    masterParticlesStrength: recipe.masterParticlesStrength,
    masterParticlesDetail: recipe.masterParticlesDetail,
    masterParticleShape: recipe.masterParticleShape,
    masterGrainEnabled: recipe.masterGrainEnabled,
    masterGrainStrength: recipe.masterGrainStrength,
    masterGrainDetail: recipe.masterGrainDetail,
    renderPrepassOrder: recipe.renderPrepassOrder,
    masterRenderEffect: recipe.masterRenderEffect,
    masterRenderStrength: recipe.masterRenderStrength,
    masterRenderDetail: recipe.masterRenderDetail,
    masterRenderEffectSecondary: recipe.masterRenderEffectSecondary,
    masterRenderStrengthSecondary: recipe.masterRenderStrengthSecondary,
    masterRenderDetailSecondary: recipe.masterRenderDetailSecondary,
    masterNoiseType: recipe.masterNoiseType,
    masterNoiseScale: recipe.masterNoiseScale,
    masterNoiseSeed: recipe.masterNoiseSeed,
  };
}

function normalizeRenderPresetItem(item) {
  if (!item?.id || typeof item?.name !== 'string') return null;
  const trimmedName = item.name.trim();
  if (!trimmedName) return null;
  const safeRecipe = normalizeComposerRecipe({
    ...createDefaultComposerRecipe(),
    ...(item.patch ?? {}),
  });
  return {
    id: String(item.id),
    name: trimmedName,
    createdAt: Number(item.createdAt) || Date.now(),
    patch: buildRenderPresetPatch(safeRecipe),
  };
}

function sortRenderPresetItems(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function loadRenderPresetItems() {
  const raw = localStorage.getItem(RENDER_PRESETS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .map((item) => normalizeRenderPresetItem(item))
      .filter(Boolean);
    return sortRenderPresetItems(normalized);
  } catch {
    return [];
  }
}

function writeRenderPresetItems(items) {
  localStorage.setItem(RENDER_PRESETS_STORAGE_KEY, JSON.stringify(items));
}

function normalizeSavedComposerItem(item) {
  if (!item?.id || !item?.recipe) return null;
  return {
    id: String(item.id),
    createdAt: Number(item.createdAt) || Date.now(),
    recipe: normalizeComposerRecipe(item.recipe),
  };
}

function sortComposerItems(items) {
  return [...items].sort((a, b) => a.createdAt - b.createdAt);
}

function mergeComposerItems(primaryItems, secondaryItems = []) {
  const byId = new Map();
  [...primaryItems, ...secondaryItems].forEach((item) => {
    const normalized = normalizeSavedComposerItem(item);
    if (!normalized) return;
    byId.set(normalized.id, normalized);
  });
  return sortComposerItems(Array.from(byId.values()));
}

function dispatchSavedItemsEvent(items) {
  window.dispatchEvent(
    new CustomEvent('reconnect-builder-saves-updated', {
      detail: { saves: items },
    }),
  );
}

function loadSavedComposerItems() {
  const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return mergeComposerItems(parsed);
  } catch {
    return [];
  }
}

function writeSavedComposerItems(nextItems) {
  localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(nextItems));
  dispatchSavedItemsEvent(nextItems);
}

async function fetchPersistentComposerItems() {
  const response = await fetch(COMPOSER_LIBRARY_API, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) return [];

  const payload = await response.json();
  if (!Array.isArray(payload?.items)) return [];
  return mergeComposerItems(payload.items);
}

async function replacePersistentComposerItems(items) {
  const response = await fetch(COMPOSER_LIBRARY_API, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) {
    throw new Error('Unable to replace persistent composer library');
  }
}

async function appendPersistentComposerItem(item) {
  const response = await fetch(COMPOSER_LIBRARY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error('Unable to append persistent composer item');
  }
}

async function deletePersistentComposerItem(itemId) {
  const response = await fetch(`${COMPOSER_LIBRARY_API}?id=${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Unable to delete persistent composer item');
  }
}

export default function AnimationBuilderSection() {
  const [recipe, setRecipe] = useState(() => createDefaultComposerRecipe());
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [newLayerType, setNewLayerType] = useState(LAYER_TYPE_OPTIONS[0].value);
  const [variationCount, setVariationCount] = useState(VARIATION_COUNT_OPTIONS[1].value);
  const [variations, setVariations] = useState([]);
  const [savedSymbols, setSavedSymbols] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [previewFpsCap, setPreviewFpsCap] = useState(30);
  const [previewTimeSeconds, setPreviewTimeSeconds] = useState(0);
  const [previewClockResetToken, setPreviewClockResetToken] = useState(0);
  const [renderPresetName, setRenderPresetName] = useState('');
  const [renderPresets, setRenderPresets] = useState([]);
  const [selectedRenderPresetId, setSelectedRenderPresetId] = useState('');
  const [randomizer, setRandomizer] = useState(() => ({
    layerCount: RANDOMIZER_DEFAULTS.layerCount,
    complexity: RANDOMIZER_DEFAULTS.complexity,
    includeMotion: RANDOMIZER_DEFAULTS.includeMotion,
    includeFill: RANDOMIZER_DEFAULTS.includeFill,
    includeRepeats: RANDOMIZER_DEFAULTS.includeRepeats,
    includeDashed: RANDOMIZER_DEFAULTS.includeDashed,
    allowedTypes: [...RANDOMIZER_DEFAULTS.allowedTypes],
  }));

  const normalizedRecipe = useMemo(() => normalizeComposerRecipe(recipe), [recipe]);
  const selectedLayer = useMemo(
    () => normalizedRecipe.layers.find((layer) => layer.id === selectedLayerId) || null,
    [normalizedRecipe.layers, selectedLayerId],
  );
  const masterSpeedNote = 'multiplies master and layer motion speeds';
  const masterMotionSpeedNote = useMemo(
    () => formatSpeedSnapNote(
      normalizedRecipe.loopSeconds,
      normalizedRecipe.masterMotionSpeed * normalizedRecipe.masterSpeed,
    ),
    [normalizedRecipe.loopSeconds, normalizedRecipe.masterMotionSpeed, normalizedRecipe.masterSpeed],
  );
  const layerMotionSpeedNote = useMemo(() => {
    if (!selectedLayer) return '';
    return formatSpeedSnapNote(
      normalizedRecipe.loopSeconds,
      selectedLayer.motionSpeed * normalizedRecipe.masterSpeed,
    );
  }, [normalizedRecipe.loopSeconds, normalizedRecipe.masterSpeed, selectedLayer]);
  const selectedRenderPreset = useMemo(
    () => renderPresets.find((item) => item.id === selectedRenderPresetId) || null,
    [renderPresets, selectedRenderPresetId],
  );
  const prepassOrderSummary = normalizedRecipe.renderPrepassOrder === 'grain-first'
    ? 'Grain, then Particles'
    : 'Particles, then Grain';

  useEffect(() => {
    if (!normalizedRecipe.layers.length) {
      setSelectedLayerId(null);
      return;
    }

    if (!selectedLayerId || !normalizedRecipe.layers.some((layer) => layer.id === selectedLayerId)) {
      setSelectedLayerId(normalizedRecipe.layers[0].id);
    }
  }, [normalizedRecipe.layers, selectedLayerId]);

  useEffect(() => {
    let cancelled = false;

    const hydrateSaves = async () => {
      const localItems = loadSavedComposerItems();
      setSavedSymbols(localItems);

      try {
        const persistentItems = await fetchPersistentComposerItems();
        if (cancelled) return;

        if (!persistentItems.length && localItems.length) {
          await replacePersistentComposerItems(localItems);
          if (cancelled) return;
          setSavedSymbols(localItems);
          writeSavedComposerItems(localItems);
          return;
        }

        setSavedSymbols(persistentItems);
        writeSavedComposerItems(persistentItems);
      } catch {
        if (!cancelled) {
          setSavedSymbols(localItems);
        }
      }
    };

    void hydrateSaves();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const presets = loadRenderPresetItems();
    setRenderPresets(presets);
    setSelectedRenderPresetId(presets[0]?.id || '');
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    if (/failed/i.test(statusMessage)) return;
    const timer = setTimeout(() => setStatusMessage(''), 12000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    let rafId = 0;
    const frameMs = 1000 / Math.max(1, previewFpsCap);
    const clockStart = performance.now();
    let lastFrame = -1;

    const tick = (now: number) => {
      const elapsedMs = now - clockStart;
      const frame = Math.floor(elapsedMs / frameMs);
      if (frame !== lastFrame) {
        lastFrame = frame;
        setPreviewTimeSeconds((frame * frameMs) / 1000);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [previewFpsCap, previewClockResetToken]);

  const resetPreviewClock = useCallback(() => {
    setPreviewTimeSeconds(0);
    setPreviewClockResetToken((value) => value + 1);
  }, []);

  const patchRecipe = useCallback((patch) => {
    setRecipe((current) =>
      normalizeComposerRecipe({
        ...current,
        ...patch,
      }),
    );
  }, []);

  const patchLayer = useCallback((layerId, patch) => {
    setRecipe((current) =>
      normalizeComposerRecipe({
        ...current,
        layers: current.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...patch } : layer,
        ),
      }),
    );
  }, []);

  const patchRandomizer = useCallback((patch) => {
    setRandomizer((current) => ({ ...current, ...patch }));
  }, []);

  const toggleRandomizerType = useCallback((type) => {
    setRandomizer((current) => {
      const hasType = current.allowedTypes.includes(type);
      const nextAllowed = hasType
        ? current.allowedTypes.filter((item) => item !== type)
        : [...current.allowedTypes, type];
      return {
        ...current,
        allowedTypes: nextAllowed.length ? nextAllowed : [type],
      };
    });
  }, []);

  const addLayer = useCallback(() => {
    const created = createLayer(newLayerType);
    setRecipe((current) =>
      normalizeComposerRecipe({
        ...current,
        layers: [...current.layers, created],
      }),
    );
    setSelectedLayerId(created.id);
    setStatusMessage(`Added ${newLayerType}`);
  }, [newLayerType]);

  const removeLayer = useCallback((layerId) => {
    setRecipe((current) =>
      normalizeComposerRecipe({
        ...current,
        layers: current.layers.filter((layer) => layer.id !== layerId),
      }),
    );
  }, []);

  const moveLayer = useCallback((layerId, direction) => {
    setRecipe((current) => {
      const layers = [...current.layers];
      const index = layers.findIndex((layer) => layer.id === layerId);
      if (index < 0) return current;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= layers.length) return current;
      const [layer] = layers.splice(index, 1);
      layers.splice(nextIndex, 0, layer);

      return normalizeComposerRecipe({
        ...current,
        layers,
      });
    });
  }, []);

  const changeLayerType = useCallback((layerId, nextType) => {
    setRecipe((current) =>
      normalizeComposerRecipe({
        ...current,
        layers: current.layers.map((layer) => {
          if (layer.id !== layerId) return layer;

          return createLayer(nextType, {
            id: layer.id,
            enabled: layer.enabled,
            fillMode: layer.fillMode,
            dashStyle: layer.dashStyle,
            rotation: layer.rotation,
            motion: layer.motion,
            motionSecondary: layer.motionSecondary,
            motionSpeed: layer.motionSpeed,
            repeatCount: layer.repeatCount,
            repeatRadius: layer.repeatRadius,
            repeatSpread: layer.repeatSpread,
            repeatOffset: layer.repeatOffset,
            repeatSizeRatio: layer.repeatSizeRatio,
          });
        }),
      }),
    );
  }, []);

  const generateVariations = useCallback(() => {
    const nextVariations = generateRecipeVariations(normalizedRecipe, Number(variationCount));
    setVariations(nextVariations);
    setStatusMessage(`${nextVariations.length} variations`);
  }, [normalizedRecipe, variationCount]);

  const randomizeSymbol = useCallback(() => {
    const nextRecipe = createRandomComposerRecipe(randomizer, normalizedRecipe);
    setRecipe(nextRecipe);
    setSelectedLayerId(nextRecipe.layers[0]?.id || null);
    setStatusMessage('Randomized');
  }, [normalizedRecipe, randomizer]);

  const randomizeRender = useCallback(() => {
    const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
    const effectValues = MASTER_RENDER_EFFECT_OPTIONS.map((option) => option.value);
    const effectValuesWithoutNone = effectValues.filter((value) => value !== 'none');
    const particleShapeValues = PARTICLE_SHAPE_OPTIONS.map((option) => option.value);
    const noiseTypeValues = NOISE_TYPE_OPTIONS.map((option) => option.value);

    const effectPrimary = Math.random() < 0.82 ? pick(effectValuesWithoutNone) : 'none';
    const secondaryPool = effectValues.filter((value) => value !== effectPrimary);
    const effectSecondary = Math.random() < 0.62 ? pick(secondaryPool) : 'none';

    patchRecipe({
      masterParticlesEnabled: Math.random() < 0.52,
      masterParticlesStrength: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      masterParticlesDetail: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      masterParticleShape: pick(particleShapeValues),
      masterGrainEnabled: Math.random() < 0.48,
      masterGrainStrength: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      masterGrainDetail: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      renderPrepassOrder: Math.random() < 0.5 ? 'particles-first' : 'grain-first',
      masterRenderEffect: effectPrimary,
      masterRenderStrength: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      masterRenderDetail: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      masterRenderEffectSecondary: effectSecondary,
      masterRenderStrengthSecondary: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      masterRenderDetailSecondary: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      masterNoiseType: pick(noiseTypeValues),
      masterNoiseScale: Number((0.2 + Math.random() * 3.8).toFixed(2)),
      masterNoiseSeed: Math.floor(1 + Math.random() * 999),
    });

    setStatusMessage('Render randomized');
  }, [patchRecipe]);

  const resetRender = useCallback(() => {
    const defaults = createDefaultComposerRecipe();
    patchRecipe({
      masterParticlesEnabled: defaults.masterParticlesEnabled,
      masterParticlesStrength: defaults.masterParticlesStrength,
      masterParticlesDetail: defaults.masterParticlesDetail,
      masterParticleShape: defaults.masterParticleShape,
      masterGrainEnabled: defaults.masterGrainEnabled,
      masterGrainStrength: defaults.masterGrainStrength,
      masterGrainDetail: defaults.masterGrainDetail,
      masterRenderEffect: defaults.masterRenderEffect,
      masterRenderStrength: defaults.masterRenderStrength,
      masterRenderDetail: defaults.masterRenderDetail,
      masterRenderEffectSecondary: defaults.masterRenderEffectSecondary,
      masterRenderStrengthSecondary: defaults.masterRenderStrengthSecondary,
      masterRenderDetailSecondary: defaults.masterRenderDetailSecondary,
      masterNoiseType: defaults.masterNoiseType,
      masterNoiseScale: defaults.masterNoiseScale,
      masterNoiseSeed: defaults.masterNoiseSeed,
      renderPrepassOrder: defaults.renderPrepassOrder,
    });

    setStatusMessage('Render reset');
  }, [patchRecipe]);

  const saveRenderPreset = useCallback(() => {
    const trimmedName = renderPresetName.trim();
    if (!trimmedName) {
      setStatusMessage('Name the render preset first');
      return;
    }

    const nextPatch = buildRenderPresetPatch(normalizedRecipe);

    setRenderPresets((current) => {
      const existingIndex = current.findIndex(
        (item) => item.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      const nextItems = [...current];

      if (existingIndex >= 0) {
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          name: trimmedName,
          patch: nextPatch,
        };
      } else {
        nextItems.push({
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          name: trimmedName,
          createdAt: Date.now(),
          patch: nextPatch,
        });
      }

      const sorted = sortRenderPresetItems(nextItems);
      writeRenderPresetItems(sorted);
      const selected = sorted.find((item) => item.name.toLowerCase() === trimmedName.toLowerCase());
      setSelectedRenderPresetId(selected?.id || '');
      return sorted;
    });

    setRenderPresetName(trimmedName);
    setStatusMessage('Render preset saved');
  }, [normalizedRecipe, renderPresetName]);

  const loadRenderPreset = useCallback(() => {
    if (!selectedRenderPreset) {
      setStatusMessage('Select a render preset first');
      return;
    }

    patchRecipe(selectedRenderPreset.patch);
    setRenderPresetName(selectedRenderPreset.name);
    setStatusMessage(`Loaded render preset "${selectedRenderPreset.name}"`);
  }, [patchRecipe, selectedRenderPreset]);

  const deleteRenderPreset = useCallback(() => {
    if (!selectedRenderPreset) {
      setStatusMessage('Select a render preset first');
      return;
    }

    const deletedName = selectedRenderPreset.name;
    setRenderPresets((current) => {
      const filtered = current.filter((item) => item.id !== selectedRenderPreset.id);
      const sorted = sortRenderPresetItems(filtered);
      writeRenderPresetItems(sorted);
      setSelectedRenderPresetId(sorted[0]?.id || '');
      return sorted;
    });
    setStatusMessage(`Deleted render preset "${deletedName}"`);
  }, [selectedRenderPreset]);

  const applyVariation = useCallback((nextRecipe) => {
    const normalized = normalizeComposerRecipe(nextRecipe);
    setRecipe(normalized);
    setSelectedLayerId(normalized.layers[0]?.id || null);
    setStatusMessage('Variation loaded');
  }, []);

  const saveSymbol = useCallback(async () => {
    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      createdAt: Date.now(),
      recipe: normalizeComposerRecipe(normalizedRecipe),
    };
    const localNextItems = mergeComposerItems(savedSymbols, [nextEntry]);
    setSavedSymbols(localNextItems);
    writeSavedComposerItems(localNextItems);

    try {
      await appendPersistentComposerItem(nextEntry);
      const persistentItems = await fetchPersistentComposerItems();
      const mergedItems = mergeComposerItems(persistentItems, localNextItems);
      setSavedSymbols(mergedItems);
      writeSavedComposerItems(mergedItems);
      setStatusMessage('Saved');
    } catch {
      setStatusMessage('Saved local');
    }
  }, [normalizedRecipe, savedSymbols]);

  const deleteSavedSymbol = useCallback(async (itemId) => {
    const nextLocalItems = savedSymbols.filter((item) => item.id !== itemId);
    setSavedSymbols(nextLocalItems);
    writeSavedComposerItems(nextLocalItems);

    try {
      await deletePersistentComposerItem(itemId);
      const persistentItems = await fetchPersistentComposerItems();
      setSavedSymbols(persistentItems);
      writeSavedComposerItems(persistentItems);
      setStatusMessage('Deleted');
    } catch {
      setStatusMessage('Deleted local');
    }
  }, [savedSymbols]);

  return (
    <section
      id="animation-builder"
      className="w-full border-y border-[rgb(var(--signal-rgb)/0.28)] bg-black text-[var(--signal)]"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <h2 className="text-3xl leading-none md:text-4xl" style={{ fontFamily: 'var(--font-mekanikal)' }}>
          Animation Builder
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[rgb(var(--signal-rgb)/0.78)]">
          Layer-based symbol composer for radar and crosshair motifs. Build with ring/cross/dot/ticks/square/grid/line modules,
          then generate variation sheets and save winners.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(260px,420px)_1fr] lg:items-start">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SymbolComposerCanvas
              recipe={normalizedRecipe}
              className="aspect-square w-full max-w-[420px]"
              fpsCap={previewFpsCap}
              forceTimeSeconds={previewTimeSeconds}
            />
          </div>

          <div className="flex flex-col gap-4 rounded border border-[rgb(var(--signal-rgb)/0.45)] bg-black/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.25em]">Composer Controls</p>
              <div className="flex flex-wrap items-center gap-2">
                {statusMessage ? (
                  <span className="text-[10px] uppercase tracking-[0.18em]">{statusMessage}</span>
                ) : null}
                <button
                  type="button"
                  onClick={randomizeSymbol}
                  className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
                >
                  Randomize
                </button>
                <button
                  type="button"
                  onClick={saveSymbol}
                  className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="order-6">
              <ExportPanel
                recipe={normalizedRecipe}
                onResetClock={resetPreviewClock}
              />
            </div>

            <div className="order-5 rounded border border-[rgb(var(--signal-rgb)/0.35)] p-2">
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em]">Master Controls</p>
              <div className="space-y-3">
                <div className="rounded border border-[rgb(var(--signal-rgb)/0.25)] p-2">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[rgb(var(--signal-rgb)/0.85)]">Scene</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RangeField
                      label="Loop Length"
                      value={normalizedRecipe.loopSeconds}
                      min={0.6}
                      max={180}
                      step={0.1}
                      suffix="s"
                      onChange={(value) => patchRecipe({ loopSeconds: value })}
                    />
                    <RangeField
                      label="Master Stroke Width"
                      value={normalizedRecipe.masterStrokeWidth}
                      min={0.2}
                      max={8}
                      step={0.1}
                      suffix="px"
                      onChange={(value) => patchRecipe({ masterStrokeWidth: value })}
                    />
                    <RangeField
                      label="Size"
                      value={normalizedRecipe.masterSize}
                      min={0.1}
                      max={1}
                      step={0.01}
                      onChange={(value) => patchRecipe({ masterSize: value })}
                    />
                    <RangeField
                      label="Layer Size Ratio"
                      value={normalizedRecipe.layerSizeRatio}
                      min={0.4}
                      max={1.8}
                      step={0.01}
                      onChange={(value) => patchRecipe({ layerSizeRatio: value })}
                    />
                    <ToggleField
                      label="Layer Size Ratio LFO"
                      enabled={normalizedRecipe.layerSizeRatioLfoEnabled}
                      onToggle={() => patchRecipe({ layerSizeRatioLfoEnabled: !normalizedRecipe.layerSizeRatioLfoEnabled })}
                    />
                    <RangeField
                      label="Ratio LFO Cycle"
                      value={normalizedRecipe.layerSizeRatioLfoCycleSeconds}
                      min={0.4}
                      max={16}
                      step={0.1}
                      suffix="s"
                      onChange={(value) => patchRecipe({ layerSizeRatioLfoCycleSeconds: value })}
                    />
                    <RangeField
                      label="Ratio LFO Depth"
                      value={normalizedRecipe.layerSizeRatioLfoDepth}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => patchRecipe({ layerSizeRatioLfoDepth: value })}
                    />
                    <SelectField
                      label="Master Shape"
                      value={normalizedRecipe.masterFrameShape}
                      options={MASTER_FRAME_SHAPE_OPTIONS}
                      onChange={(value) => patchRecipe({ masterFrameShape: value })}
                    />
                    <RangeField
                      label="Master Shape Stroke"
                      value={normalizedRecipe.masterFrameStrokeWidth}
                      min={0.2}
                      max={8}
                      step={0.1}
                      suffix="px"
                      onChange={(value) => patchRecipe({ masterFrameStrokeWidth: value })}
                    />
                    <RangeField
                      label="Preview FPS Cap"
                      value={previewFpsCap}
                      min={12}
                      max={60}
                      step={1}
                      onChange={(value) => setPreviewFpsCap(value)}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => patchRecipe({ inverted: !normalizedRecipe.inverted })}
                        className="w-full rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-2 text-[10px] uppercase tracking-[0.18em]"
                      >
                        Invert ({normalizedRecipe.inverted ? 'on' : 'off'})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-[rgb(var(--signal-rgb)/0.25)] p-2">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[rgb(var(--signal-rgb)/0.85)]">Motion</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RangeField
                      label="Master Speed"
                      value={normalizedRecipe.masterSpeed}
                      min={1}
                      max={24}
                      step={0.1}
                      note={masterSpeedNote}
                      onChange={(value) => patchRecipe({ masterSpeed: value })}
                    />
                    <span aria-hidden="true" />
                    <SelectField
                      label="Master Motion"
                      value={normalizedRecipe.masterMotion}
                      options={MASTER_MOTION_OPTIONS}
                      onChange={(value) => patchRecipe({ masterMotion: value })}
                    />
                    <RangeField
                      label="Master Motion Speed"
                      value={normalizedRecipe.masterMotionSpeed}
                      min={1}
                      max={24}
                      step={0.1}
                      note={masterMotionSpeedNote}
                      onChange={(value) => patchRecipe({ masterMotionSpeed: value })}
                    />
                  </div>
                </div>

                <div className="rounded border border-[rgb(var(--signal-rgb)/0.25)] p-2">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[rgb(var(--signal-rgb)/0.85)]">Noise</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Noise Type"
                      value={normalizedRecipe.masterNoiseType}
                      options={NOISE_TYPE_OPTIONS}
                      onChange={(value) => patchRecipe({ masterNoiseType: value })}
                    />
                    <RangeField
                      label="Noise Scale"
                      value={normalizedRecipe.masterNoiseScale}
                      min={0.2}
                      max={4}
                      step={0.01}
                      onChange={(value) => patchRecipe({ masterNoiseScale: value })}
                    />
                    <RangeField
                      label="Noise Seed"
                      value={normalizedRecipe.masterNoiseSeed}
                      min={1}
                      max={999}
                      step={1}
                      onChange={(value) => patchRecipe({ masterNoiseSeed: value })}
                    />
                  </div>
                </div>

                <div className="rounded border border-[rgb(var(--signal-rgb)/0.25)] p-2">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[rgb(var(--signal-rgb)/0.85)]">Feedback</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RangeField
                      label="Feedback"
                      value={normalizedRecipe.masterFeedback}
                      min={0}
                      max={10}
                      step={1}
                      onChange={(value) => patchRecipe({ masterFeedback: value })}
                    />
                    <ToggleField
                      label="Feedback LFO"
                      enabled={normalizedRecipe.feedbackLfoEnabled}
                      onToggle={() => patchRecipe({ feedbackLfoEnabled: !normalizedRecipe.feedbackLfoEnabled })}
                    />
                    <RangeField
                      label="LFO Cycle"
                      value={normalizedRecipe.feedbackLfoCycleSeconds}
                      min={0.4}
                      max={16}
                      step={0.1}
                      suffix="s"
                      onChange={(value) => patchRecipe({ feedbackLfoCycleSeconds: value })}
                    />
                    <RangeField
                      label="LFO Depth"
                      value={normalizedRecipe.feedbackLfoDepth}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => patchRecipe({ feedbackLfoDepth: value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 rounded border border-[rgb(var(--signal-rgb)/0.35)] p-2">
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em]">Randomizer</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <RangeField
                  label="Layer Count"
                  value={randomizer.layerCount}
                  min={1}
                  max={12}
                  step={1}
                  onChange={(value) => patchRandomizer({ layerCount: value })}
                />
                <RangeField
                  label="Complexity"
                  value={randomizer.complexity}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(value) => patchRandomizer({ complexity: value })}
                />
                <ToggleField
                  label="Include Motion"
                  enabled={randomizer.includeMotion}
                  onToggle={() => patchRandomizer({ includeMotion: !randomizer.includeMotion })}
                />
                <ToggleField
                  label="Include Fill"
                  enabled={randomizer.includeFill}
                  onToggle={() => patchRandomizer({ includeFill: !randomizer.includeFill })}
                />
                <ToggleField
                  label="Include Repeats"
                  enabled={randomizer.includeRepeats}
                  onToggle={() => patchRandomizer({ includeRepeats: !randomizer.includeRepeats })}
                />
                <ToggleField
                  label="Include Dashed"
                  enabled={randomizer.includeDashed}
                  onToggle={() => patchRandomizer({ includeDashed: !randomizer.includeDashed })}
                />
              </div>
              <div className="mt-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em]">Shape Pool</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {LAYER_TYPE_OPTIONS.map((option) => (
                    <ToggleField
                      key={option.value}
                      label={option.label}
                      enabled={randomizer.allowedTypes.includes(option.value)}
                      onToggle={() => toggleRandomizerType(option.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Variation Count"
                  value={variationCount}
                  options={VARIATION_COUNT_OPTIONS}
                  onChange={(value) => setVariationCount(Number(value))}
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={generateVariations}
                    className="w-full rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-2 text-[10px] uppercase tracking-[0.18em]"
                  >
                    Generate Variations
                  </button>
                </div>
              </div>
            </div>

            <div className="order-2 rounded border border-[rgb(var(--signal-rgb)/0.35)] p-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.18em]">Layer Stack</p>
                <div className="flex items-center gap-2">
                  <StyledDropdown
                    value={newLayerType}
                    onChange={setNewLayerType}
                    options={LAYER_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                    tone="dark"
                    className="w-[140px] min-w-[140px]"
                  />
                  <button
                    type="button"
                    onClick={addLayer}
                    className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
                  >
                    Add Layer
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {normalizedRecipe.layers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded border px-2 py-1 ${
                      selectedLayerId === layer.id
                        ? 'border-[rgb(var(--signal-rgb)/0.72)]'
                        : 'border-[rgb(var(--signal-rgb)/0.28)]'
                    }`}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={layer.enabled}
                      onClick={() => patchLayer(layer.id, { enabled: !layer.enabled })}
                      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.12em]"
                    >
                      <TickBox enabled={layer.enabled} sizeClass="h-3.5 w-3.5" markClass="h-2 w-2" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLayerId(layer.id)}
                      className="text-left text-[10px] uppercase tracking-[0.15em]"
                    >
                      {index + 1}. {layer.type}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveLayer(layer.id, -1)}
                        className="rounded border border-[rgb(var(--signal-rgb)/0.35)] px-1 py-0.5 text-[10px] leading-none"
                        aria-label="Move layer up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLayer(layer.id, 1)}
                        className="rounded border border-[rgb(var(--signal-rgb)/0.35)] px-1 py-0.5 text-[10px] leading-none"
                        aria-label="Move layer down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLayer(layer.id)}
                        className="rounded border border-[rgb(var(--signal-rgb)/0.35)] px-1 py-0.5 text-[10px] leading-none"
                        aria-label="Delete layer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-3 rounded border border-[rgb(var(--signal-rgb)/0.35)] p-2">
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em]">
                Layer Editor{selectedLayer ? ` (${selectedLayer.type})` : ''}
              </p>
              {selectedLayer ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="Layer Shape"
                    value={selectedLayer.type}
                    options={LAYER_TYPE_OPTIONS}
                    onChange={(value) => changeLayerType(selectedLayer.id, value)}
                  />
                  <SelectField
                    label="Fill Mode"
                    value={selectedLayer.fillMode}
                    options={FILL_MODE_OPTIONS}
                    onChange={(value) => patchLayer(selectedLayer.id, { fillMode: value })}
                  />
                  <SelectField
                    label="Dash"
                    value={selectedLayer.dashStyle}
                    options={DASH_STYLE_OPTIONS}
                    onChange={(value) => patchLayer(selectedLayer.id, { dashStyle: value })}
                  />
                  <SelectField
                    label="Motion"
                    value={selectedLayer.motion}
                    options={MOTION_TYPE_OPTIONS}
                    onChange={(value) => patchLayer(selectedLayer.id, { motion: value })}
                  />
                  <SelectField
                    label="Motion 2"
                    value={selectedLayer.motionSecondary || 'none'}
                    options={MOTION_TYPE_OPTIONS}
                    onChange={(value) => patchLayer(selectedLayer.id, { motionSecondary: value })}
                  />
                  <RangeField
                    label="Motion Speed"
                    value={selectedLayer.motionSpeed}
                    min={1}
                    max={24}
                    step={0.1}
                    note={layerMotionSpeedNote}
                    onChange={(value) => patchLayer(selectedLayer.id, { motionSpeed: value })}
                  />
                  <RangeField
                    label="Rotation"
                    value={selectedLayer.rotation}
                    min={0}
                    max={359}
                    step={1}
                    suffix="deg"
                    onChange={(value) => patchLayer(selectedLayer.id, { rotation: value })}
                  />
                  <RangeField
                    label="Repeat Count"
                    value={selectedLayer.repeatCount}
                    min={1}
                    max={24}
                    step={1}
                    onChange={(value) => patchLayer(selectedLayer.id, { repeatCount: value })}
                  />
                  <RangeField
                    label="Repeat Radius"
                    value={selectedLayer.repeatRadius}
                    min={0}
                    max={44}
                    step={0.5}
                    onChange={(value) => patchLayer(selectedLayer.id, { repeatRadius: value })}
                  />
                  <RangeField
                    label="Repeat Spread"
                    value={selectedLayer.repeatSpread}
                    min={0}
                    max={360}
                    step={1}
                    suffix="deg"
                    onChange={(value) => patchLayer(selectedLayer.id, { repeatSpread: value })}
                  />
                  <RangeField
                    label="Repeat Offset"
                    value={selectedLayer.repeatOffset}
                    min={0}
                    max={359}
                    step={1}
                    suffix="deg"
                    onChange={(value) => patchLayer(selectedLayer.id, { repeatOffset: value })}
                  />
                  <RangeField
                    label="Repeat Size"
                    value={selectedLayer.repeatSizeRatio}
                    min={0.2}
                    max={1.8}
                    step={0.01}
                    onChange={(value) => patchLayer(selectedLayer.id, { repeatSizeRatio: value })}
                  />

                  {selectedLayer.type === 'ring' ? (
                    <>
                      <RangeField
                        label="Radius"
                        value={selectedLayer.radius}
                        min={1}
                        max={46}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { radius: value })}
                      />
                      <RangeField
                        label="Start Angle"
                        value={selectedLayer.startAngle}
                        min={0}
                        max={359}
                        step={1}
                        suffix="deg"
                        onChange={(value) => patchLayer(selectedLayer.id, { startAngle: value })}
                      />
                      <RangeField
                        label="Sweep Angle"
                        value={selectedLayer.sweepAngle}
                        min={0}
                        max={360}
                        step={1}
                        suffix="deg"
                        onChange={(value) => patchLayer(selectedLayer.id, { sweepAngle: value })}
                      />
                    </>
                  ) : null}

                  {selectedLayer.type === 'square' ? (
                    <>
                      <RangeField
                        label="Square Size"
                        value={selectedLayer.squareSize}
                        min={1}
                        max={90}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { squareSize: value })}
                      />
                      <RangeField
                        label="Corner Radius"
                        value={selectedLayer.squareRadius}
                        min={0}
                        max={24}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { squareRadius: value })}
                      />
                    </>
                  ) : null}

                  {selectedLayer.type === 'grid' ? (
                    <>
                      <RangeField
                        label="Grid Size"
                        value={selectedLayer.gridSize}
                        min={2}
                        max={90}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { gridSize: value })}
                      />
                      <RangeField
                        label="Grid Divisions"
                        value={selectedLayer.gridDivisions}
                        min={2}
                        max={12}
                        step={1}
                        onChange={(value) => patchLayer(selectedLayer.id, { gridDivisions: value })}
                      />
                      <div className="flex items-end">
                        <ToggleField
                          label="Outer Frame"
                          enabled={selectedLayer.gridOuterFrame !== false}
                          onToggle={() =>
                            patchLayer(selectedLayer.id, {
                              gridOuterFrame: selectedLayer.gridOuterFrame === false,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : null}

                  {selectedLayer.type === 'line' ? (
                    <>
                      <RangeField
                        label="Line Length"
                        value={selectedLayer.lineLength}
                        min={1}
                        max={90}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { lineLength: value })}
                      />
                      <RangeField
                        label="Line Offset"
                        value={selectedLayer.lineOffset}
                        min={-44}
                        max={44}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { lineOffset: value })}
                      />
                    </>
                  ) : null}

                  {selectedLayer.type === 'cross' ? (
                    <>
                      <RangeField
                        label="Arm Length"
                        value={selectedLayer.armLength}
                        min={1}
                        max={44}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { armLength: value })}
                      />
                      <RangeField
                        label="Arm Gap"
                        value={selectedLayer.armGap}
                        min={0}
                        max={22}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { armGap: value })}
                      />
                    </>
                  ) : null}

                  {selectedLayer.type === 'dot' ? (
                    <RangeField
                      label="Dot Radius"
                      value={selectedLayer.radius}
                      min={1}
                      max={16}
                      step={0.2}
                      onChange={(value) => patchLayer(selectedLayer.id, { radius: value })}
                    />
                  ) : null}

                  {selectedLayer.type === 'ticks' ? (
                    <>
                      <RangeField
                        label="Tick Count"
                        value={selectedLayer.tickCount}
                        min={1}
                        max={24}
                        step={1}
                        onChange={(value) => patchLayer(selectedLayer.id, { tickCount: value })}
                      />
                      <RangeField
                        label="Tick Radius"
                        value={selectedLayer.tickRadius}
                        min={1}
                        max={46}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { tickRadius: value })}
                      />
                      <RangeField
                        label="Tick Length"
                        value={selectedLayer.tickLength}
                        min={1}
                        max={26}
                        step={0.5}
                        onChange={(value) => patchLayer(selectedLayer.id, { tickLength: value })}
                      />
                      <RangeField
                        label="Tick Offset"
                        value={selectedLayer.tickOffset}
                        min={0}
                        max={359}
                        step={1}
                        suffix="deg"
                        onChange={(value) => patchLayer(selectedLayer.id, { tickOffset: value })}
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-[rgb(var(--signal-rgb)/0.65)]">No layer selected.</p>
              )}
            </div>

            <div className="order-4 rounded border border-[rgb(var(--signal-rgb)/0.35)] p-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.18em]">Render Pipeline</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={randomizeRender}
                    className="rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                  >
                    Random Render
                  </button>
                  <button
                    type="button"
                    onClick={resetRender}
                    className="rounded border border-[rgb(var(--signal-rgb)/0.55)] bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                  >
                    Reset Render
                  </button>
                </div>
              </div>
              <div className="mb-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em]">
                    <span>Render Preset Name</span>
                    <input
                      type="text"
                      value={renderPresetName}
                      onChange={(event) => setRenderPresetName(event.target.value)}
                      placeholder="Name preset"
                      className="rounded border border-[rgb(var(--signal-rgb)/0.35)] bg-black/80 px-2 py-1 text-xs normal-case text-[var(--signal)]"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={saveRenderPreset}
                      className="w-full rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-2 text-[10px] uppercase tracking-[0.16em]"
                    >
                      Save Render Preset
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em]">
                    <span>Render Presets</span>
                    <StyledDropdown
                      value={selectedRenderPresetId}
                      onChange={(nextId) => {
                        setSelectedRenderPresetId(nextId);
                        const matched = renderPresets.find((item) => item.id === nextId);
                        if (matched) setRenderPresetName(matched.name);
                      }}
                      options={[
                        { value: '', label: 'Select preset' },
                        ...renderPresets.map((item) => ({ value: item.id, label: item.name })),
                      ]}
                      tone="dark"
                      className="w-full min-w-0"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={loadRenderPreset}
                      className="w-full rounded border border-[rgb(var(--signal-rgb)/0.7)] bg-black/80 px-2 py-2 text-[10px] uppercase tracking-[0.16em]"
                    >
                      Load
                    </button>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={deleteRenderPreset}
                      disabled={!selectedRenderPreset}
                      className="w-full rounded border border-[rgb(var(--signal-rgb)/0.55)] bg-black/80 px-2 py-2 text-[10px] uppercase tracking-[0.16em] disabled:opacity-45"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleField
                  label="Particles"
                  enabled={normalizedRecipe.masterParticlesEnabled}
                  onToggle={() => patchRecipe({ masterParticlesEnabled: !normalizedRecipe.masterParticlesEnabled })}
                />
                <SelectField
                  label="Particle Shape"
                  value={normalizedRecipe.masterParticleShape}
                  options={PARTICLE_SHAPE_OPTIONS}
                  onChange={(value) => patchRecipe({ masterParticleShape: value })}
                />
                <RangeField
                  label="Particles Strength"
                  value={normalizedRecipe.masterParticlesStrength}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => patchRecipe({ masterParticlesStrength: value })}
                />
                <RangeField
                  label="Particles Detail"
                  value={normalizedRecipe.masterParticlesDetail}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => patchRecipe({ masterParticlesDetail: value })}
                />
                <ToggleField
                  label="Grain"
                  enabled={normalizedRecipe.masterGrainEnabled}
                  onToggle={() => patchRecipe({ masterGrainEnabled: !normalizedRecipe.masterGrainEnabled })}
                />
                <span aria-hidden="true" />
                <RangeField
                  label="Grain Strength"
                  value={normalizedRecipe.masterGrainStrength}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => patchRecipe({ masterGrainStrength: value })}
                />
                <RangeField
                  label="Grain Detail"
                  value={normalizedRecipe.masterGrainDetail}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => patchRecipe({ masterGrainDetail: value })}
                />
                <SelectField
                  label="Prepass Order"
                  value={normalizedRecipe.renderPrepassOrder}
                  options={RENDER_PREPASS_ORDER_OPTIONS}
                  onChange={(value) => patchRecipe({ renderPrepassOrder: value })}
                />
                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                  <div className="space-y-3">
                    <SelectField
                      label="Render Effect 1"
                      value={normalizedRecipe.masterRenderEffect}
                      options={MASTER_RENDER_EFFECT_OPTIONS}
                      onChange={(value) => patchRecipe({ masterRenderEffect: value })}
                    />
                    <RangeField
                      label="Effect Strength 1"
                      value={normalizedRecipe.masterRenderStrength}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => patchRecipe({ masterRenderStrength: value })}
                    />
                    <RangeField
                      label="Effect Detail 1"
                      value={normalizedRecipe.masterRenderDetail}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => patchRecipe({ masterRenderDetail: value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <SelectField
                      label="Render Effect 2"
                      value={normalizedRecipe.masterRenderEffectSecondary}
                      options={MASTER_RENDER_EFFECT_OPTIONS}
                      onChange={(value) => patchRecipe({ masterRenderEffectSecondary: value })}
                    />
                    <RangeField
                      label="Effect Strength 2"
                      value={normalizedRecipe.masterRenderStrengthSecondary}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => patchRecipe({ masterRenderStrengthSecondary: value })}
                    />
                    <RangeField
                      label="Effect Detail 2"
                      value={normalizedRecipe.masterRenderDetailSecondary}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => patchRecipe({ masterRenderDetailSecondary: value })}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[rgb(var(--signal-rgb)/0.72)]">
                Pipeline order: {prepassOrderSummary}, then Effect 1, then Effect 2.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <p className="mb-4 text-xs uppercase tracking-[0.15em] text-[rgb(var(--signal-rgb)/0.7)]">
            Variation Grid
          </p>
          {variations.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {variations.map((variant, index) => (
                <button
                  key={`variation-${index}`}
                  type="button"
                  onClick={() => applyVariation(variant)}
                  className="rounded border border-[rgb(var(--signal-rgb)/0.3)] bg-black/70 p-2 text-left"
                >
                  <SymbolComposerCanvas recipe={variant} animate={false} className="aspect-square w-full" />
                  <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[rgb(var(--signal-rgb)/0.78)]">
                    V{index + 1}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--signal-rgb)/0.6)]">
              No variations yet. Use Generate Variations to create a sheet.
            </p>
          )}
        </div>

        <div className="mt-12">
          <p className="mb-4 text-xs uppercase tracking-[0.15em] text-[rgb(var(--signal-rgb)/0.7)]">
            Saved Symbol Index
          </p>
          {savedSymbols.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {savedSymbols.map((item, index) => (
                <div
                  key={item.id}
                  className="relative rounded border border-[rgb(var(--signal-rgb)/0.35)] bg-black/70 p-3 text-left"
                >
                  <button
                    type="button"
                    onClick={() => deleteSavedSymbol(item.id)}
                    className="absolute right-2 top-2 z-10 rounded border border-[rgb(var(--signal-rgb)/0.6)] bg-black/90 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                    aria-label="Delete saved symbol"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVariation(item.recipe)}
                    className="w-full text-left"
                  >
                    <SymbolComposerCanvas recipe={item.recipe} animate={false} className="aspect-square w-full" />
                    <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--signal-rgb)/0.85)]">
                      {index + 1}. {summarizeComposerRecipe(item.recipe)}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--signal-rgb)/0.6)]">
              No saved symbols yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
