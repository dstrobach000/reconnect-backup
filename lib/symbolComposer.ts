const LAYER_TYPES = ['ring', 'cross', 'dot', 'ticks', 'square', 'grid', 'line', 'text', 'image'];
const RANDOMIZER_LAYER_TYPES = ['ring', 'cross', 'dot', 'ticks', 'square', 'grid', 'line'];
const FILL_MODES = ['stroke', 'fill', 'fill-stroke', 'noise', 'noise-stroke'];
const DASH_STYLES = ['solid', 'dashed'];
const MOTION_TYPES = [
  'none',
  'rotate',
  'counter-rotate',
  'pulse',
  'sweep',
  'sweep-angle',
  'blink',
  'infinite-zoom',
  'typewriter',
  'cross-arm-gap',
  'cross-arm-length',
  'cross-arm-morph',
];
const MASTER_MOTION_TYPES = ['none', 'rotate', 'counter-rotate', 'pulse', 'sweep', 'infinite-zoom'];
const MASTER_RENDER_EFFECT_TYPES = ['none', 'threshold', 'posterize', 'pixelate', 'glow', 'blur'];
const RENDER_PREPASS_ORDERS = ['particles-first', 'grain-first'];
const MASTER_FRAME_SHAPES = ['none', 'circle', 'square'];
const PARTICLE_SHAPES = ['square', 'circle'];
const NOISE_TYPES = ['fractalNoise', 'turbulence'];
const FIXED_LAYER_COLOR = '#ffffff';

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function createId(prefix = 'layer') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export const LAYER_TYPE_OPTIONS = [
  { label: 'Ring', value: 'ring' },
  { label: 'Cross', value: 'cross' },
  { label: 'Dot', value: 'dot' },
  { label: 'Ticks', value: 'ticks' },
  { label: 'Square', value: 'square' },
  { label: 'Grid', value: 'grid' },
  { label: 'Line', value: 'line' },
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
];

export const FILL_MODE_OPTIONS = [
  { label: 'Stroke', value: 'stroke' },
  { label: 'Fill', value: 'fill' },
  { label: 'Fill + Stroke', value: 'fill-stroke' },
  { label: 'Noise Fill', value: 'noise' },
  { label: 'Noise + Stroke', value: 'noise-stroke' },
];

export const DASH_STYLE_OPTIONS = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
];

export const MOTION_TYPE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Rotate', value: 'rotate' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Counter Rotate', value: 'counter-rotate' },
  { label: 'Sweep', value: 'sweep' },
  { label: 'Sweep Angle', value: 'sweep-angle' },
  { label: 'Blink', value: 'blink' },
  { label: 'Infinite Zoom', value: 'infinite-zoom' },
  { label: 'Typewriter', value: 'typewriter' },
  { label: 'Cross Arm Gap', value: 'cross-arm-gap' },
  { label: 'Cross Arm Length', value: 'cross-arm-length' },
  { label: 'Cross Arm Morph', value: 'cross-arm-morph' },
];

export const MASTER_MOTION_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Rotate', value: 'rotate' },
  { label: 'Counter Rotate', value: 'counter-rotate' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Sweep', value: 'sweep' },
  { label: 'Infinite Zoom', value: 'infinite-zoom' },
];

export const MASTER_RENDER_EFFECT_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Threshold', value: 'threshold' },
  { label: 'Posterize', value: 'posterize' },
  { label: 'Pixelate', value: 'pixelate' },
  { label: 'Glow', value: 'glow' },
  { label: 'Blur', value: 'blur' },
];

export const RENDER_PREPASS_ORDER_OPTIONS = [
  { label: 'Particles -> Grain', value: 'particles-first' },
  { label: 'Grain -> Particles', value: 'grain-first' },
];

export const MASTER_FRAME_SHAPE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Circle', value: 'circle' },
  { label: 'Square', value: 'square' },
];

export const PARTICLE_SHAPE_OPTIONS = [
  { label: 'Square', value: 'square' },
  { label: 'Circle', value: 'circle' },
];

export const NOISE_TYPE_OPTIONS = [
  { label: 'Fractal', value: 'fractalNoise' },
  { label: 'Turbulence', value: 'turbulence' },
];

export const VARIATION_COUNT_OPTIONS = [
  { label: '12', value: 12 },
  { label: '24', value: 24 },
  { label: '40', value: 40 },
];

export const RANDOMIZER_DEFAULTS = {
  layerCount: 4,
  complexity: 60,
  includeMotion: true,
  includeFill: false,
  includeRepeats: true,
  includeDashed: true,
  allowedTypes: [...RANDOMIZER_LAYER_TYPES],
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLayerBase(type) {
  return {
    id: createId('layer'),
    type,
    enabled: true,
    strokeColor: FIXED_LAYER_COLOR,
    fillColor: FIXED_LAYER_COLOR,
    fillMode: 'stroke',
    dashStyle: 'solid',
    strokeWidth: 1.4,
    opacity: 1,
    rotation: 0,
    scale: 1,
    motion: 'none',
    motionSecondary: 'none',
    motionSpeed: 1,
    repeatCount: 1,
    repeatRadius: 0,
    repeatSpread: 360,
    repeatOffset: 0,
    repeatSizeRatio: 1,
  };
}

const TYPE_DEFAULTS = {
  ring: {
    radius: 30,
    startAngle: 0,
    sweepAngle: 360,
  },
  cross: {
    armLength: 26,
    armGap: 6,
  },
  dot: {
    radius: 4,
  },
  ticks: {
    tickCount: 8,
    tickRadius: 28,
    tickLength: 8,
    tickWidth: 1.2,
    tickOffset: 0,
  },
  square: {
    squareSize: 48,
    squareRadius: 0,
  },
  grid: {
    gridSize: 56,
    gridDivisions: 4,
    gridOuterFrame: true,
  },
  line: {
    lineLength: 36,
    lineOffset: 0,
  },
  text: {
    textContent: 'RECONNECT:',
    textSize: 18,
    textLetterSpacing: 0,
    textAnchor: 'middle',
    textBaseline: 'middle',
    textYOffset: 0,
  },
  image: {
    imageSrc: '',
    imageName: '',
    imageFit: 'contain',
  },
};

export function createLayer(type = 'ring', overrides = {}) {
  const validType = LAYER_TYPES.includes(type) ? type : 'ring';
  return {
    ...getLayerBase(validType),
    ...TYPE_DEFAULTS[validType],
    ...overrides,
  };
}

function normalizeLayer(rawLayer) {
  const validType = LAYER_TYPES.includes(rawLayer?.type) ? rawLayer.type : 'ring';
  const merged = {
    ...getLayerBase(validType),
    ...TYPE_DEFAULTS[validType],
    ...(rawLayer ?? {}),
    type: validType,
  };

  return {
    ...merged,
    id: merged.id || createId('layer'),
    enabled: Boolean(merged.enabled),
    strokeColor: FIXED_LAYER_COLOR,
    fillColor: FIXED_LAYER_COLOR,
    fillMode: FILL_MODES.includes(merged.fillMode) ? merged.fillMode : 'stroke',
    dashStyle: DASH_STYLES.includes(merged.dashStyle) ? merged.dashStyle : 'solid',
    motion: MOTION_TYPES.includes(merged.motion) ? merged.motion : 'none',
    motionSecondary: MOTION_TYPES.includes(merged.motionSecondary) ? merged.motionSecondary : 'none',
    strokeWidth: clampNumber(merged.strokeWidth, 0, 8, 1.3),
    opacity: 1,
    rotation: clampNumber(merged.rotation, 0, 359, 0),
    scale: clampNumber(merged.scale, 0.2, 2.8, 1),
    motionSpeed: clampNumber(merged.motionSpeed, 1, 24, 1),
    repeatCount: clampNumber(merged.repeatCount, 1, 24, 1),
    repeatRadius: clampNumber(merged.repeatRadius, 0, 44, 0),
    repeatSpread: clampNumber(merged.repeatSpread, 0, 360, 360),
    repeatOffset: clampNumber(merged.repeatOffset, 0, 359, 0),
    repeatSizeRatio: clampNumber(merged.repeatSizeRatio, 0.2, 1.8, 1),
    radius: clampNumber(merged.radius, 1, 46, 28),
    startAngle: clampNumber(merged.startAngle, 0, 359, 0),
    sweepAngle: clampNumber(merged.sweepAngle, 0, 360, 360),
    armLength: clampNumber(merged.armLength, 1, 44, 26),
    armGap: clampNumber(merged.armGap, 0, 22, 6),
    tickCount: clampNumber(merged.tickCount, 1, 24, 8),
    tickRadius: clampNumber(merged.tickRadius, 1, 46, 28),
    tickLength: clampNumber(merged.tickLength, 1, 26, 8),
    tickWidth: clampNumber(merged.tickWidth, 0.2, 8, 1.2),
    tickOffset: clampNumber(merged.tickOffset, 0, 359, 0),
    squareSize: clampNumber(merged.squareSize, 1, 90, 48),
    squareRadius: clampNumber(merged.squareRadius, 0, 24, 0),
    gridSize: clampNumber(merged.gridSize, 2, 90, 56),
    gridDivisions: Math.round(clampNumber(merged.gridDivisions, 2, 12, 4)),
    gridOuterFrame: merged.gridOuterFrame !== false,
    lineLength: clampNumber(merged.lineLength, 1, 90, 36),
    lineOffset: clampNumber(merged.lineOffset, -44, 44, 0),
    textContent: String(merged.textContent ?? 'RECONNECT:').slice(0, 48),
    textSize: clampNumber(merged.textSize, 4, 40, 18),
    textLetterSpacing: clampNumber(merged.textLetterSpacing, -1, 4, 0),
    textAnchor: 'middle',
    textBaseline: 'middle',
    textYOffset: clampNumber(merged.textYOffset, -30, 30, 0),
    imageSrc: typeof merged.imageSrc === 'string' ? merged.imageSrc : '',
    imageName: typeof merged.imageName === 'string' ? merged.imageName.slice(0, 120) : '',
    imageFit: ['contain', 'cover', 'stretch'].includes(merged.imageFit) ? merged.imageFit : 'contain',
  };
}

export function createDefaultComposerRecipe() {
  return {
    loopSeconds: 8,
    masterStrokeWidth: 1.4,
    masterFrameStrokeWidth: 1.4,
    masterSpeed: 1,
    masterMotion: 'none',
    masterMotionSpeed: 1,
    masterRenderEffect: 'none',
    masterRenderStrength: 0.55,
    masterRenderDetail: 0.6,
    masterParticlesEnabled: false,
    masterParticlesStrength: 0.55,
    masterParticlesDetail: 0.6,
    masterParticleShape: 'square',
    renderPrepassOrder: 'particles-first',
    masterRenderEffectSecondary: 'none',
    masterRenderStrengthSecondary: 0.55,
    masterRenderDetailSecondary: 0.6,
    masterGrainEnabled: false,
    masterGrainStrength: 0.55,
    masterGrainDetail: 0.6,
    masterFrameShape: 'none',
    masterNoiseType: 'fractalNoise',
    masterNoiseScale: 1,
    masterNoiseSeed: 17,
    masterSize: 1,
    layerSizeRatio: 1,
    layerSizeRatioLfoEnabled: false,
    layerSizeRatioLfoCycleSeconds: 3.2,
    layerSizeRatioLfoDepth: 0.25,
    masterFeedback: 0,
    feedbackLfoEnabled: false,
    feedbackLfoCycleSeconds: 3.2,
    feedbackLfoDepth: 0.32,
    inverted: false,
    backgroundColor: '#000000',
    layers: [
      createLayer('ring', { radius: 32 }),
      createLayer('cross', { armLength: 24, armGap: 7 }),
      createLayer('dot', { radius: 2.8, fillMode: 'fill' }),
    ],
  };
}

export function normalizeComposerRecipe(rawRecipe) {
  const fallback = createDefaultComposerRecipe();
  const merged = { ...fallback, ...(rawRecipe ?? {}) };
  const legacyPrimaryEffect = String(merged.masterRenderEffect || 'none');
  const legacySecondaryEffect = String(merged.masterRenderEffectSecondary || 'none');
  const legacyParticlesRequested = legacyPrimaryEffect === 'particles' || legacySecondaryEffect === 'particles';
  const legacyGrainRequested = legacyPrimaryEffect === 'grain' || legacySecondaryEffect === 'grain';
  const legacyParticleStrengthFallback = legacyPrimaryEffect === 'particles'
    ? clampNumber(merged.masterRenderStrength, 0, 1, fallback.masterParticlesStrength)
    : legacySecondaryEffect === 'particles'
      ? clampNumber(merged.masterRenderStrengthSecondary, 0, 1, fallback.masterParticlesStrength)
      : fallback.masterParticlesStrength;
  const legacyParticleDetailFallback = legacyPrimaryEffect === 'particles'
    ? clampNumber(merged.masterRenderDetail, 0, 1, fallback.masterParticlesDetail)
    : legacySecondaryEffect === 'particles'
      ? clampNumber(merged.masterRenderDetailSecondary, 0, 1, fallback.masterParticlesDetail)
      : fallback.masterParticlesDetail;
  const legacyParticleShapeFallback = legacyPrimaryEffect === 'particles'
    ? merged.masterParticleShape
    : legacySecondaryEffect === 'particles'
      ? merged.masterParticleShapeSecondary
      : fallback.masterParticleShape;
  const legacyGrainStrengthFallback = legacyPrimaryEffect === 'grain'
    ? clampNumber(merged.masterRenderStrength, 0, 1, fallback.masterGrainStrength)
    : legacySecondaryEffect === 'grain'
      ? clampNumber(merged.masterRenderStrengthSecondary, 0, 1, fallback.masterGrainStrength)
      : fallback.masterGrainStrength;
  const legacyGrainDetailFallback = legacyPrimaryEffect === 'grain'
    ? clampNumber(merged.masterRenderDetail, 0, 1, fallback.masterGrainDetail)
    : legacySecondaryEffect === 'grain'
      ? clampNumber(merged.masterRenderDetailSecondary, 0, 1, fallback.masterGrainDetail)
      : fallback.masterGrainDetail;
  const inferredInverted = typeof merged.inverted === 'boolean'
    ? merged.inverted
    : String(merged.backgroundColor || '').toLowerCase() === '#ffffff';
  const layers = Array.isArray(merged.layers) && merged.layers.length
    ? merged.layers.map((layer) => normalizeLayer(layer))
    : fallback.layers.map((layer) => normalizeLayer(layer));

  return {
    ...merged,
    loopSeconds: clampNumber(merged.loopSeconds, 0.6, 180, fallback.loopSeconds),
    masterStrokeWidth: clampNumber(merged.masterStrokeWidth, 0.2, 8, fallback.masterStrokeWidth),
    masterFrameStrokeWidth: clampNumber(
      merged.masterFrameStrokeWidth,
      0.2,
      8,
      fallback.masterFrameStrokeWidth,
    ),
    masterSpeed: clampNumber(merged.masterSpeed, 1, 24, fallback.masterSpeed),
    masterMotion: MASTER_MOTION_TYPES.includes(merged.masterMotion) ? merged.masterMotion : fallback.masterMotion,
    masterMotionSpeed: clampNumber(merged.masterMotionSpeed, 1, 24, fallback.masterMotionSpeed),
    masterRenderEffect: MASTER_RENDER_EFFECT_TYPES.includes(merged.masterRenderEffect)
      ? merged.masterRenderEffect
      : fallback.masterRenderEffect,
    masterRenderStrength: clampNumber(merged.masterRenderStrength, 0, 1, fallback.masterRenderStrength),
    masterRenderDetail: clampNumber(merged.masterRenderDetail, 0, 1, fallback.masterRenderDetail),
    masterParticlesEnabled: merged.masterParticlesEnabled == null
      ? legacyParticlesRequested
      : Boolean(merged.masterParticlesEnabled),
    masterParticlesStrength: clampNumber(
      merged.masterParticlesStrength,
      0,
      1,
      legacyParticleStrengthFallback,
    ),
    masterParticlesDetail: clampNumber(
      merged.masterParticlesDetail,
      0,
      1,
      legacyParticleDetailFallback,
    ),
    masterParticleShape: PARTICLE_SHAPES.includes(merged.masterParticleShape)
      ? merged.masterParticleShape
      : PARTICLE_SHAPES.includes(legacyParticleShapeFallback)
        ? legacyParticleShapeFallback
        : fallback.masterParticleShape,
    renderPrepassOrder: RENDER_PREPASS_ORDERS.includes(merged.renderPrepassOrder)
      ? merged.renderPrepassOrder
      : fallback.renderPrepassOrder,
    masterRenderEffectSecondary: MASTER_RENDER_EFFECT_TYPES.includes(merged.masterRenderEffectSecondary)
      ? merged.masterRenderEffectSecondary
      : fallback.masterRenderEffectSecondary,
    masterRenderStrengthSecondary: clampNumber(
      merged.masterRenderStrengthSecondary,
      0,
      1,
      fallback.masterRenderStrengthSecondary,
    ),
    masterRenderDetailSecondary: clampNumber(
      merged.masterRenderDetailSecondary,
      0,
      1,
      fallback.masterRenderDetailSecondary,
    ),
    masterGrainEnabled: merged.masterGrainEnabled == null
      ? legacyGrainRequested
      : Boolean(merged.masterGrainEnabled),
    masterGrainStrength: clampNumber(
      merged.masterGrainStrength,
      0,
      1,
      legacyGrainStrengthFallback,
    ),
    masterGrainDetail: clampNumber(
      merged.masterGrainDetail,
      0,
      1,
      legacyGrainDetailFallback,
    ),
    masterFrameShape: MASTER_FRAME_SHAPES.includes(merged.masterFrameShape)
      ? merged.masterFrameShape
      : fallback.masterFrameShape,
    masterNoiseType: NOISE_TYPES.includes(merged.masterNoiseType) ? merged.masterNoiseType : fallback.masterNoiseType,
    masterNoiseScale: clampNumber(merged.masterNoiseScale, 0.2, 4, fallback.masterNoiseScale),
    masterNoiseSeed: Math.round(clampNumber(merged.masterNoiseSeed, 1, 999, fallback.masterNoiseSeed)),
    masterSize: clampNumber(merged.masterSize, 0.1, 1, fallback.masterSize),
    layerSizeRatio: clampNumber(merged.layerSizeRatio, 0.4, 1.8, fallback.layerSizeRatio),
    layerSizeRatioLfoEnabled: Boolean(merged.layerSizeRatioLfoEnabled),
    layerSizeRatioLfoCycleSeconds: clampNumber(
      merged.layerSizeRatioLfoCycleSeconds,
      0.4,
      16,
      fallback.layerSizeRatioLfoCycleSeconds,
    ),
    layerSizeRatioLfoDepth: clampNumber(merged.layerSizeRatioLfoDepth, 0, 1, fallback.layerSizeRatioLfoDepth),
    masterFeedback: Math.round(clampNumber(merged.masterFeedback, 0, 10, fallback.masterFeedback)),
    feedbackLfoEnabled: Boolean(merged.feedbackLfoEnabled),
    feedbackLfoCycleSeconds: clampNumber(merged.feedbackLfoCycleSeconds, 0.4, 16, fallback.feedbackLfoCycleSeconds),
    feedbackLfoDepth: clampNumber(merged.feedbackLfoDepth, 0, 1, fallback.feedbackLfoDepth),
    inverted: inferredInverted,
    backgroundColor: inferredInverted ? '#ffffff' : '#000000',
    layers,
  };
}

function varyNumber(value, min, max, pctRange = 0.25) {
  const delta = (Math.random() * 2 - 1) * pctRange * Math.max(1, Math.abs(value));
  return clampNumber(value + delta, min, max, value);
}

function mutateLayer(layer) {
  const next = normalizeLayer(layer);
  next.rotation = (next.rotation + Math.floor(Math.random() * 360)) % 360;
  next.repeatCount = clampNumber(
    next.repeatCount + Math.floor(Math.random() * 5) - 2,
    1,
    24,
    next.repeatCount,
  );
  next.repeatRadius = varyNumber(next.repeatRadius, 0, 44, 0.55);
  next.repeatOffset = (next.repeatOffset + Math.floor(Math.random() * 180)) % 360;
  next.repeatSizeRatio = varyNumber(next.repeatSizeRatio, 0.2, 1.8, 0.35);
  const baseMotionPool = ['none', 'rotate', 'counter-rotate', 'pulse', 'sweep', 'sweep-angle', 'blink', 'infinite-zoom'];
  const crossMotionPool = [...baseMotionPool, 'cross-arm-gap', 'cross-arm-length', 'cross-arm-morph'];
  const motionPool = next.type === 'cross' ? crossMotionPool : baseMotionPool;
  next.motion = motionPool[Math.floor(Math.random() * motionPool.length)];
  next.motionSpeed = varyNumber(next.motionSpeed, 1, 24, 0.55);

  if (next.type === 'ring') {
    next.radius = varyNumber(next.radius, 2, 46, 0.35);
    next.startAngle = (next.startAngle + Math.floor(Math.random() * 140)) % 360;
    next.sweepAngle = varyNumber(next.sweepAngle, 20, 360, 0.55);
  }

  if (next.type === 'cross') {
    next.armLength = varyNumber(next.armLength, 4, 44, 0.45);
    next.armGap = varyNumber(next.armGap, 0, 22, 0.45);
  }

  if (next.type === 'dot') {
    next.radius = varyNumber(next.radius, 1, 16, 0.5);
  }

  if (next.type === 'ticks') {
    next.tickCount = clampNumber(
      next.tickCount + Math.floor(Math.random() * 7) - 3,
      2,
      24,
      next.tickCount,
    );
    next.tickRadius = varyNumber(next.tickRadius, 3, 46, 0.45);
    next.tickLength = varyNumber(next.tickLength, 2, 26, 0.5);
    next.tickOffset = (next.tickOffset + Math.floor(Math.random() * 180)) % 360;
  }

  if (next.type === 'square') {
    next.squareSize = varyNumber(next.squareSize, 4, 90, 0.45);
    next.squareRadius = varyNumber(next.squareRadius, 0, 24, 0.6);
  }

  if (next.type === 'grid') {
    next.gridSize = varyNumber(next.gridSize, 6, 90, 0.4);
    next.gridDivisions = clampNumber(
      next.gridDivisions + Math.floor(Math.random() * 5) - 2,
      2,
      12,
      next.gridDivisions,
    );
    if (Math.random() > 0.7) {
      next.gridOuterFrame = !next.gridOuterFrame;
    }
  }

  if (next.type === 'line') {
    next.lineLength = varyNumber(next.lineLength, 4, 90, 0.45);
    next.lineOffset = varyNumber(next.lineOffset, -44, 44, 0.7);
  }

  next.id = createId('layer');
  return next;
}

export function generateRecipeVariations(baseRecipe, count = 24) {
  const normalized = normalizeComposerRecipe(baseRecipe);
  const total = clampNumber(count, 1, 60, 24);

  return Array.from({ length: total }, () => {
    const next = normalizeComposerRecipe({
      ...normalized,
      loopSeconds: varyNumber(normalized.loopSeconds, 0.6, 180, 0.4),
      layers: normalized.layers.map((layer) => mutateLayer(layer)),
    });

    return next;
  });
}

export function createRandomComposerRecipe(settings, baseRecipe) {
  const base = normalizeComposerRecipe(baseRecipe ?? createDefaultComposerRecipe());
  const mergedSettings = { ...RANDOMIZER_DEFAULTS, ...(settings ?? {}) };
  const allowedTypes = Array.isArray(mergedSettings.allowedTypes) && mergedSettings.allowedTypes.length
    ? mergedSettings.allowedTypes.filter((type) => LAYER_TYPES.includes(type))
    : [...RANDOMIZER_LAYER_TYPES];
  const complexity = clampNumber(mergedSettings.complexity, 0, 100, RANDOMIZER_DEFAULTS.complexity);
  const layerCount = clampNumber(mergedSettings.layerCount, 1, 12, RANDOMIZER_DEFAULTS.layerCount);
  const includeMotion = Boolean(mergedSettings.includeMotion);
  const includeFill = Boolean(mergedSettings.includeFill);
  const includeRepeats = Boolean(mergedSettings.includeRepeats);
  const includeDashed = Boolean(mergedSettings.includeDashed);

  const layers = Array.from({ length: layerCount }, () => {
    const type = randomItem(allowedTypes);
    const layer = createLayer(type);

    layer.fillMode = includeFill ? randomItem(FILL_MODES) : 'stroke';
    layer.dashStyle = includeDashed && complexity > 38 && Math.random() > 0.45 ? 'dashed' : 'solid';
    layer.rotation = randomInt(0, 359);
    layer.repeatCount = 1;
    layer.repeatRadius = 0;
    layer.repeatSpread = 360;
    layer.repeatOffset = randomInt(0, 359);
    layer.repeatSizeRatio = 1;
    const motionPool = complexity > 52
      ? ['none', 'rotate', 'counter-rotate', 'pulse', 'sweep', 'sweep-angle', 'blink', 'infinite-zoom']
      : ['none', 'rotate', 'pulse', 'sweep', 'infinite-zoom'];
    const crossMotionPool = [...motionPool, 'cross-arm-gap', 'cross-arm-length', 'cross-arm-morph'];
    layer.motion = includeMotion
      ? randomItem(type === 'cross' ? crossMotionPool : motionPool)
      : 'none';
    layer.motionSpeed = varyNumber(1, 1, 24, 0.55);

    if (includeRepeats && complexity > 24 && Math.random() > 0.4) {
      layer.repeatCount = randomInt(2, Math.min(16, 4 + Math.floor(complexity / 12)));
      layer.repeatRadius = varyNumber(14, 3, 36, 0.9);
      layer.repeatSpread = randomItem([90, 120, 180, 270, 360]);
      layer.repeatOffset = randomInt(0, 359);
      layer.repeatSizeRatio = varyNumber(0.85, 0.45, 1.4, 0.6);
    }

    if (type === 'ring') {
      layer.radius = varyNumber(26, 6, 44, 0.55);
      layer.startAngle = randomInt(0, 359);
      layer.sweepAngle = randomInt(Math.max(35, 360 - Math.floor(complexity * 2.2)), 360);
    }

    if (type === 'cross') {
      layer.armLength = varyNumber(24, 6, 42, 0.55);
      layer.armGap = varyNumber(7, 0, 20, 0.55);
    }

    if (type === 'dot') {
      layer.radius = varyNumber(3.2, 1, 10, 0.7);
    }

    if (type === 'ticks') {
      layer.tickCount = randomInt(4, Math.min(20, 6 + Math.floor(complexity / 5)));
      layer.tickRadius = varyNumber(28, 4, 42, 0.5);
      layer.tickLength = varyNumber(6, 2, 18, 0.7);
      layer.tickOffset = randomInt(0, 359);
    }

    if (type === 'square') {
      layer.squareSize = varyNumber(48, 8, 84, 0.5);
      layer.squareRadius = varyNumber(2, 0, 20, 0.9);
    }

    if (type === 'grid') {
      layer.gridSize = varyNumber(56, 12, 86, 0.4);
      layer.gridDivisions = randomInt(2, Math.min(10, 3 + Math.floor(complexity / 12)));
      layer.gridOuterFrame = Math.random() > 0.18;
    }

    if (type === 'line') {
      layer.lineLength = varyNumber(34, 6, 86, 0.5);
      layer.lineOffset = varyNumber(0, -30, 30, 1);
    }

    return layer;
  });

  return normalizeComposerRecipe({
    ...base,
    layers,
  });
}

export function summarizeComposerRecipe(recipe) {
  const normalized = normalizeComposerRecipe(recipe);
  const activeLayers = normalized.layers.filter((layer) => layer.enabled);
  const layerWord = activeLayers.length === 1 ? 'layer' : 'layers';
  return `${activeLayers.length} ${layerWord}, ${normalized.loopSeconds.toFixed(1)}s loop`;
}
