export const BUILDER_STORAGE_KEY = 'reconnect-animation-builder-saves-v1';

export const SHAPE_OPTIONS = [
  { label: 'Circle', value: 'circle' },
  { label: 'Square', value: 'square' },
  { label: 'Line', value: 'line' },
];

export const BASE_SHAPE_OPTIONS = [
  { label: 'None', value: 'none' },
  ...SHAPE_OPTIONS,
];

export const BASE_PLACEMENT_OPTIONS = [
  { label: 'Inside', value: 'inside' },
  { label: 'On Edge', value: 'on' },
  { label: 'Outside', value: 'outside' },
];

export const FILL_STROKE_OPTIONS = [
  { label: 'Stroke', value: 'stroke' },
  { label: 'Fill', value: 'fill' },
  { label: 'Fill + Stroke', value: 'fill-stroke' },
];

export const STROKE_STYLE_OPTIONS = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
];

export const SHAPE_LAYOUT_OPTIONS = [
  { label: 'Radial', value: 'radial' },
  { label: 'Stacked', value: 'stacked' },
];

export const MOVEMENT_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Rotate', value: 'rotate' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Orbit', value: 'orbit' },
  { label: 'Drift', value: 'drift' },
  { label: 'Wave', value: 'wave' },
  { label: 'Zoom', value: 'zoom' },
];

export const DEFAULT_BUILDER_CONFIG = {
  numberOfShapes: 6,
  shapeDistance: 100,
  sourceShape: 'circle',
  buildOnShape: 'circle',
  basePlacement: 'on',
  shapeLayout: 'radial',
  fillMode: 'stroke',
  strokeStyle: 'dashed',
  shapeCompletion: 360,
  animateCompletion: false,
  completionStart: 0,
  formGrid: false,
  gridRows: 3,
  gridCols: 3,
  gridStroke: true,
  movementType: 'rotate',
  feedback: 2,
  animationLength: 7,
  lineLength: 24,
  lineAngle: 0,
  lineAngleStep: 90,
  strokeWidth: 1.6,
  strokeColor: '#ffffff',
  fillColor: '#0b0b0b',
  backgroundColor: '#000000',
};

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

const VALID_SOURCE_SHAPES = new Set(SHAPE_OPTIONS.map((shape) => shape.value));
const VALID_BASE_SHAPES = new Set(BASE_SHAPE_OPTIONS.map((shape) => shape.value));

export function normalizeBuilderConfig(raw) {
  const merged = { ...DEFAULT_BUILDER_CONFIG, ...(raw ?? {}) };
  return {
    ...merged,
    sourceShape: VALID_SOURCE_SHAPES.has(merged.sourceShape)
      ? merged.sourceShape
      : DEFAULT_BUILDER_CONFIG.sourceShape,
    buildOnShape: VALID_BASE_SHAPES.has(merged.buildOnShape)
      ? merged.buildOnShape
      : DEFAULT_BUILDER_CONFIG.buildOnShape,
    numberOfShapes: clampNumber(merged.numberOfShapes, 1, 36, DEFAULT_BUILDER_CONFIG.numberOfShapes),
    shapeDistance: clampNumber(merged.shapeDistance, 20, 220, DEFAULT_BUILDER_CONFIG.shapeDistance),
    shapeCompletion: clampNumber(merged.shapeCompletion, 0, 360, DEFAULT_BUILDER_CONFIG.shapeCompletion),
    completionStart: clampNumber(merged.completionStart, 0, 360, DEFAULT_BUILDER_CONFIG.completionStart),
    gridRows: clampNumber(merged.gridRows, 1, 8, DEFAULT_BUILDER_CONFIG.gridRows),
    gridCols: clampNumber(merged.gridCols, 1, 8, DEFAULT_BUILDER_CONFIG.gridCols),
    feedback: clampNumber(merged.feedback, 0, 6, DEFAULT_BUILDER_CONFIG.feedback),
    animationLength: clampNumber(merged.animationLength, 0.6, 24, DEFAULT_BUILDER_CONFIG.animationLength),
    lineLength: clampNumber(merged.lineLength, 4, 80, DEFAULT_BUILDER_CONFIG.lineLength),
    lineAngle: clampNumber(merged.lineAngle, 0, 359, DEFAULT_BUILDER_CONFIG.lineAngle),
    lineAngleStep: clampNumber(merged.lineAngleStep, 0, 180, DEFAULT_BUILDER_CONFIG.lineAngleStep),
    strokeWidth: clampNumber(merged.strokeWidth, 0, 8, DEFAULT_BUILDER_CONFIG.strokeWidth),
    shapeLayout: merged.shapeLayout === 'stacked' ? 'stacked' : 'radial',
    animateCompletion: Boolean(merged.animateCompletion),
    formGrid: Boolean(merged.formGrid),
    gridStroke: Boolean(merged.gridStroke),
  };
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, precision = 1) {
  const factor = 10 ** precision;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomHexColor() {
  const value = Math.floor(Math.random() * 16777215);
  return `#${value.toString(16).padStart(6, '0')}`;
}

export function createRandomBuilderConfig() {
  return normalizeBuilderConfig({
    numberOfShapes: randomInt(1, 20),
    shapeDistance: randomInt(55, 170),
    sourceShape: randomItem(SHAPE_OPTIONS).value,
    buildOnShape: randomItem(BASE_SHAPE_OPTIONS).value,
    basePlacement: randomItem(BASE_PLACEMENT_OPTIONS).value,
    shapeLayout: randomItem(SHAPE_LAYOUT_OPTIONS).value,
    fillMode: randomItem(FILL_STROKE_OPTIONS).value,
    strokeStyle: randomItem(STROKE_STYLE_OPTIONS).value,
    shapeCompletion: randomInt(0, 360),
    animateCompletion: Math.random() > 0.5,
    completionStart: randomInt(0, 360),
    formGrid: Math.random() > 0.5,
    gridRows: randomInt(1, 6),
    gridCols: randomInt(1, 6),
    gridStroke: Math.random() > 0.45,
    movementType: randomItem(MOVEMENT_OPTIONS).value,
    feedback: randomInt(0, 5),
    animationLength: randomFloat(1.6, 16, 1),
    lineLength: randomInt(8, 44),
    lineAngle: randomInt(0, 359),
    lineAngleStep: randomInt(0, 180),
    strokeWidth: randomFloat(0.5, 4, 1),
    strokeColor: randomHexColor(),
    fillColor: randomHexColor(),
    backgroundColor: randomHexColor(),
  });
}

export function summarizeBuilderConfig(config) {
  const normalized = normalizeBuilderConfig(config);
  const shapeWord = normalized.numberOfShapes === 1 ? 'shape' : 'shapes';
  const gridInfo = normalized.formGrid
    ? `${normalized.gridRows}x${normalized.gridCols}`
    : normalized.shapeLayout;
  return `${normalized.numberOfShapes} ${normalized.sourceShape} ${shapeWord}, ${gridInfo}, ${normalized.movementType}`;
}
