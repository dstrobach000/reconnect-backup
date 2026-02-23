import {
  QUAD_VERT,
  GEOMETRY_FRAG,
  COPY_FRAG,
  FEEDBACK_FRAG,
  THRESHOLD_FRAG,
  POSTERIZE_FRAG,
  PIXELATE_FRAG,
  BLUR_FRAG,
  PARTICLES_FRAG,
  GRAIN_FRAG,
  COMPOSITE_FRAG,
  GLOW_ADD_FRAG,
} from './shaders';

// ─── helpers ──────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function polar(radius: number, angleDeg: number) {
  const r = ((angleDeg - 90) * Math.PI) / 180;
  return { x: radius * Math.cos(r), y: radius * Math.sin(r) };
}

function loopSyncedDuration(loop: number, desired: number, min = 0.04) {
  const sl = Math.max(0.1, loop);
  const sd = Math.max(min, desired);
  return sl / Math.max(1, Math.round(sl / sd));
}

function loopSyncedFromSpeed(loop: number, speed: number) {
  return loopSyncedDuration(loop, loop / clamp(speed, 1, 24));
}

function loopPhase(t: number, dur: number) {
  if (!(dur > 0) || !Number.isFinite(t)) return 0;
  return (((t % dur) + dur) % dur) / dur;
}

function triPhase(p: number) {
  return p < 0.5 ? p * 2 : (1 - p) * 2;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// ─── animation state computation ──────────────────────────────
interface MasterMotionState {
  angle: number;
  scale: number;
}

function getMasterMotion(recipe: any, t: number, gSpeed: number): MasterMotionState {
  const dur = loopSyncedFromSpeed(recipe.loopSeconds, recipe.masterMotionSpeed * gSpeed);
  const ph = loopPhase(t, dur);
  const tri = triPhase(ph);
  let angle = 0, scale = 1;
  if (recipe.masterMotion === 'rotate') angle = ph * Math.PI * 2;
  else if (recipe.masterMotion === 'counter-rotate') angle = -ph * Math.PI * 2;
  else if (recipe.masterMotion === 'pulse') scale = 1 + 0.07 * tri;
  else if (recipe.masterMotion === 'sweep') angle = (24 * tri * Math.PI) / 180;
  else if (recipe.masterMotion === 'infinite-zoom') scale = 1 + 0.22 * ph;
  return { angle, scale };
}

interface LayerMotionState {
  angle: number;
  scale: number;
  opacity: number;
  instanceScale: number;
  instanceOpacity: number;
  armGap: number;
  armLength: number;
}

function getLayerMotionModes(layer: any): string[] {
  const m: string[] = [];
  if (layer.motion && layer.motion !== 'none') m.push(layer.motion);
  if (layer.motionSecondary && layer.motionSecondary !== 'none' && !m.includes(layer.motionSecondary))
    m.push(layer.motionSecondary);
  return m;
}

function getLayerMotion(layer: any, t: number, loop: number, gSpeed: number): LayerMotionState {
  const modes = getLayerMotionModes(layer);
  const dur = loopSyncedFromSpeed(loop, layer.motionSpeed * gSpeed);
  const ph = loopPhase(t, dur);
  const tri = triPhase(ph);
  let angle = 0, scale = 1, opacity = 1, instScale = 1, instOp = 1;
  let armGap = layer.armGap, armLength = layer.armLength;

  for (const m of modes) {
    if (m === 'rotate') { angle += ph * Math.PI * 2; continue; }
    if (m === 'counter-rotate') { angle -= ph * Math.PI * 2; continue; }
    if (m === 'pulse') { scale *= 1 + 0.14 * tri; continue; }
    if (m === 'sweep') { angle += (42 * tri * Math.PI) / 180; continue; }
    if (m === 'blink') { opacity *= ph < 0.5 ? 1 : 0.2; continue; }
    if (m === 'infinite-zoom') {
      instScale *= 0.54 + 0.54 * ph;
      instOp *= 1 - ph;
      continue;
    }
    if (layer.type === 'cross' && m === 'cross-arm-gap') {
      const mn = 0, mx = Math.max(0, layer.armLength - 1);
      const lo = clamp(layer.armGap * 0.22, mn, mx);
      const hi = clamp(Math.max(layer.armGap * 1.85, layer.armGap + 3), mn, mx);
      armGap = lo + (hi - lo) * tri;
      continue;
    }
    if (layer.type === 'cross' && m === 'cross-arm-length') {
      const mnL = Math.max(layer.armGap + 1, layer.armLength * 0.35, 2);
      const mxL = Math.max(mnL + 0.5, Math.min(44, layer.armLength * 1.5));
      const lo = clamp(Math.max(layer.armLength * 0.45, layer.armGap + 1), mnL, mxL);
      const hi = clamp(Math.max(layer.armLength * 1.45, lo + 1), mnL, mxL);
      armLength = lo + (hi - lo) * tri;
      continue;
    }
    if (layer.type === 'cross' && m === 'cross-arm-morph') {
      const mnG = 0, mxG = Math.max(0, layer.armLength - 1);
      const mnL = Math.max(layer.armGap + 1, layer.armLength * 0.35, 2);
      const mxL = Math.max(mnL + 0.5, Math.min(44, layer.armLength * 1.5));
      const loG = clamp(layer.armGap * 0.24, mnG, mxG);
      const hiG = clamp(Math.max(layer.armGap * 1.75, layer.armGap + 2.5), mnG, mxG);
      const loL = clamp(Math.max(layer.armLength * 0.48, layer.armGap + 1), mnL, mxL);
      const hiL = clamp(Math.max(layer.armLength * 1.35, loL + 1), mnL, mxL);
      armGap = loG + (hiG - loG) * tri;
      armLength = hiL + (loL - hiL) * tri;
    }
  }

  return {
    angle,
    scale: clamp(scale, 0.1, 8),
    opacity: clamp(opacity, 0, 1),
    instanceScale: clamp(instScale, 0.1, 8),
    instanceOpacity: clamp(instOp, 0, 1),
    armGap,
    armLength,
  };
}

function getSweepState(
  t: number, loop: number, speed: number, masterSpeed: number,
  startAngle: number, maxSweep: number,
) {
  const dur = loopSyncedFromSpeed(loop, speed * masterSpeed);
  if (!(dur > 0)) return null;
  const w = ((t % dur) + dur) % dur;
  const phase = (w / dur) * 2;
  const local = phase < 1 ? phase : phase - 1;
  const filling = phase < 1;
  return {
    startAngle: filling ? startAngle : startAngle + local * maxSweep,
    sweep: filling ? maxSweep * local : maxSweep * (1 - local),
  };
}

function getLayerSizeScale(idx: number, total: number, ratio: number) {
  if (total <= 1) return 1;
  const pivot = (total - 1) * 0.5;
  const exponent = idx - pivot;
  let scaled = Math.pow(ratio, exponent);
  if (total % 2 === 1 && Math.abs(exponent) < 0.0001) {
    scaled *= Math.pow(ratio, 0.5);
  }
  return clamp(scaled, 0.2, 4);
}

function getRepeatInstanceScale(layer: any, idx: number) {
  if (layer.repeatCount <= 1) return 1;
  return clamp(Math.pow(layer.repeatSizeRatio, idx), 0.1, 8);
}

function getRepeatPosition(layer: any, idx: number) {
  if (layer.repeatCount <= 1 || layer.repeatRadius <= 0) return { x: 50, y: 50 };
  const step = layer.repeatSpread / layer.repeatCount;
  const angle = layer.repeatOffset + step * idx;
  const off = polar(layer.repeatRadius, angle);
  return { x: 50 + off.x, y: 50 + off.y };
}

function getLayerExtent(layer: any, sw: number) {
  const pad = Math.max(0, sw) * 0.5;
  const rsm =
    layer.repeatCount > 1 && layer.repeatSizeRatio > 1
      ? Math.pow(layer.repeatSizeRatio, layer.repeatCount - 1)
      : 1;
  const byType: Record<string, number> = {
    ring: layer.radius + pad,
    cross: layer.armLength + pad,
    dot: layer.radius + pad,
    ticks: layer.tickRadius + layer.tickLength + pad,
    square: layer.squareSize * 0.5 + pad,
    grid: layer.gridSize * 0.5 + pad,
    line: Math.abs(layer.lineOffset) + layer.lineLength * 0.5 + pad,
  };
  return (byType[layer.type] ?? 1) * rsm + layer.repeatRadius;
}

function layerHasMotion(layer: any, motion: string) {
  return layer.motion === motion || layer.motionSecondary === motion;
}

function estimateLayerMotionScaleMax(layer: any) {
  let mul = 1;
  if (layerHasMotion(layer, 'pulse')) mul *= 1.14;
  if (layerHasMotion(layer, 'infinite-zoom')) mul *= 1.08;
  if (layer.type === 'cross' && (layerHasMotion(layer, 'cross-arm-length') || layerHasMotion(layer, 'cross-arm-morph'))) {
    mul *= 1.45;
  }
  return mul;
}

function estimateMasterScaleMax(recipe: any) {
  if (recipe.masterMotion === 'pulse') return 1.07;
  if (recipe.masterMotion === 'infinite-zoom') return 1.22;
  return 1;
}

function estimateFeedbackScaleMax(recipe: any) {
  const feedbackCount = Math.max(0, recipe.masterFeedback ?? 0);
  let maxScale = 1 + feedbackCount * 0.08;
  if (feedbackCount > 0 && recipe.feedbackLfoEnabled) {
    maxScale += clamp(recipe.feedbackLfoDepth ?? 0, 0, 1) * 0.34;
  }
  return maxScale;
}

function estimateEffectPad(effect: string, str: number, det: number) {
  if (effect === 'pixelate') {
    return 0.12 + str * (0.9 + det * 2.2);
  }
  if (effect === 'blur') {
    const std = 0.08 + str * (1.2 + det * 4);
    return std * 2.6;
  }
  if (effect === 'glow') {
    const std = 0.08 + str * (0.8 + det * 2.4);
    return std * 2.8;
  }
  return 0;
}

function estimatePostFxPad(recipe: any) {
  let pad = 0;

  if (recipe.masterParticlesEnabled) {
    const pStr = recipe.masterParticlesStrength ?? 0.55;
    const pDet = recipe.masterParticlesDetail ?? 0.6;
    const pRadius = 0.06 + pStr * (0.45 + pDet * 1.15);
    const circlePad = recipe.masterParticleShape === 'circle'
      ? 0.15 + pRadius * 0.7
      : 0;
    pad += pRadius + circlePad;
  }

  pad += estimateEffectPad(
    recipe.masterRenderEffect,
    recipe.masterRenderStrength,
    recipe.masterRenderDetail,
  );
  pad += estimateEffectPad(
    recipe.masterRenderEffectSecondary,
    recipe.masterRenderStrengthSecondary,
    recipe.masterRenderDetailSecondary,
  );

  // Small fixed safety guard for rasterized/threshold edges.
  pad += 0.8;

  return pad;
}

function computeSceneScale(recipe: any, layerSizeRatioFit: number) {
  let maxExt = 1;
  const enabledLayerIndices: number[] = [];
  for (let i = 0; i < recipe.layers.length; i++) {
    if (recipe.layers[i]?.enabled) enabledLayerIndices.push(i);
  }
  const enabledTotal = Math.max(1, enabledLayerIndices.length);
  for (let enabledIndex = 0; enabledIndex < enabledLayerIndices.length; enabledIndex++) {
    const layerIndex = enabledLayerIndices[enabledIndex];
    const l = recipe.layers[layerIndex];
    if (!l.enabled) continue;
    const ls = getLayerSizeScale(enabledIndex, enabledTotal, layerSizeRatioFit);
    maxExt = Math.max(maxExt, getLayerExtent(l, recipe.masterStrokeWidth) * ls);
  }
  return clamp((48 / Math.max(1, maxExt)) * recipe.masterSize, 0.1, 12);
}

// ─── WebGL utilities ──────────────────────────────────────────
function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile error: ${log}`);
  }
  return s;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'a_pos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`Program link error: ${log}`);
  }
  return p;
}

interface FBO {
  fb: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
}

function createFBO(gl: WebGL2RenderingContext, w: number, h: number): FBO {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Use universally supported 8-bit render targets for reliable preview output.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    throw new Error(`Framebuffer incomplete: ${status}`);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, w, h };
}

function resizeFBO(gl: WebGL2RenderingContext, fbo: FBO, w: number, h: number) {
  if (fbo.w === w && fbo.h === h) return;
  gl.bindTexture(gl.TEXTURE_2D, fbo.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  fbo.w = w;
  fbo.h = h;
}

type Prog = {
  id: WebGLProgram;
  u: Map<string, WebGLUniformLocation | null>;
};

function buildProg(gl: WebGL2RenderingContext, vsrc: string, fsrc: string, unames: string[]): Prog {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsrc);
  const id = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  const u = new Map<string, WebGLUniformLocation | null>();
  for (const n of unames) u.set(n, gl.getUniformLocation(id, n));
  return { id, u };
}

// ─── Main class ───────────────────────────────────────────────
const SHAPE_TYPES: Record<string, number> = {
  ring: 0, cross: 1, dot: 2, ticks: 3, square: 4, grid: 5, line: 6,
};
const FILL_MODES: Record<string, number> = {
  stroke: 0, fill: 1, 'fill-stroke': 2, noise: 3, 'noise-stroke': 4,
};

export class SymbolRenderer {
  private gl: WebGL2RenderingContext;
  private geo: Prog;
  private copy: Prog;
  private feedback: Prog;
  private threshold: Prog;
  private posterize: Prog;
  private pixelate: Prog;
  private blur: Prog;
  private particles: Prog;
  private grain: Prog;
  private composite: Prog;
  private glowAdd: Prog;
  private vao: WebGLVertexArrayObject;
  private sceneFB!: FBO;
  private fbA!: FBO;
  private fbB!: FBO;
  private tempFB!: FBO;
  private w = 0;
  private h = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    })!;
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;

    const geoUniforms = [
      'u_shapeType', 'u_fillMode', 'u_dashStyle', 'u_strokeWidth',
      'u_instanceCount', 'u_sizeScale', 'u_instMotionScale',
      'u_layerOpacity', 'u_instMotionOpacity',
      'u_sceneScale', 'u_masterAngle', 'u_masterScale',
      'u_layerAngle', 'u_layerScale', 'u_feedbackScale', 'u_color',
      'u_radius', 'u_startAngle', 'u_sweepAngle',
      'u_armLength', 'u_armGap', 'u_squareSize', 'u_squareRadius',
      'u_gridSize', 'u_gridDivisions', 'u_gridOuterFrame',
      'u_lineLength', 'u_lineOffset',
      'u_tickCount', 'u_tickRadius', 'u_tickLength', 'u_tickOffset',
      'u_useNoiseFill', 'u_noiseFreq', 'u_noiseTile', 'u_noiseSeed',
      'u_noiseType', 'u_inverted',
      ...Array.from({ length: 24 }, (_, i) => `u_positions[${i}]`),
      ...Array.from({ length: 24 }, (_, i) => `u_rotations[${i}]`),
      ...Array.from({ length: 24 }, (_, i) => `u_scales[${i}]`),
    ];

    this.geo = buildProg(gl, QUAD_VERT, GEOMETRY_FRAG, geoUniforms);
    this.copy = buildProg(gl, QUAD_VERT, COPY_FRAG, ['u_tex']);
    this.feedback = buildProg(gl, QUAD_VERT, FEEDBACK_FRAG, ['u_tex', 'u_scale', 'u_opacity']);
    this.threshold = buildProg(gl, QUAD_VERT, THRESHOLD_FRAG, ['u_tex', 'u_cutoff', 'u_softness', 'u_amount']);
    this.posterize = buildProg(gl, QUAD_VERT, POSTERIZE_FRAG, ['u_tex', 'u_steps']);
    this.pixelate = buildProg(gl, QUAD_VERT, PIXELATE_FRAG, ['u_tex', 'u_resolution', 'u_pixelSize']);
    this.blur = buildProg(gl, QUAD_VERT, BLUR_FRAG, ['u_tex', 'u_dir', 'u_radius']);
    this.particles = buildProg(gl, QUAD_VERT, PARTICLES_FRAG, [
      'u_tex', 'u_resolution', 'u_frequency', 'u_coverage', 'u_dilateRadius', 'u_seed', 'u_shape',
    ]);
    this.grain = buildProg(gl, QUAD_VERT, GRAIN_FRAG, ['u_tex', 'u_frequency', 'u_amount', 'u_seed']);
    this.composite = buildProg(gl, QUAD_VERT, COMPOSITE_FRAG, [
      'u_tex', 'u_bgColor', 'u_clipShape', 'u_clipInset', 'u_frameStroke', 'u_frameColor',
    ]);
    this.glowAdd = buildProg(gl, QUAD_VERT, GLOW_ADD_FRAG, ['u_texA', 'u_texB']);

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.vao = vao;

    this.resize(canvas.width || 512, canvas.height || 512);
  }

  resize(w: number, h: number) {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    const gl = this.gl;
    if (this.sceneFB) {
      resizeFBO(gl, this.sceneFB, w, h);
      resizeFBO(gl, this.fbA, w, h);
      resizeFBO(gl, this.fbB, w, h);
      resizeFBO(gl, this.tempFB, w, h);
    } else {
      this.sceneFB = createFBO(gl, w, h);
      this.fbA = createFBO(gl, w, h);
      this.fbB = createFBO(gl, w, h);
      this.tempFB = createFBO(gl, w, h);
    }
    this.canvas.width = w;
    this.canvas.height = h;
  }

  private drawQuad() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private bindFB(fbo: FBO | null) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo ? fbo.fb : null);
    gl.viewport(0, 0, fbo ? fbo.w : this.w, fbo ? fbo.h : this.h);
  }

  private bindTex(unit: number, tex: WebGLTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  private u(prog: Prog, name: string) {
    return prog.u.get(name) ?? null;
  }

  renderFrame(recipe: any, timeSeconds: number) {
    const gl = this.gl;
    const r = recipe;
    const t = timeSeconds;
    const gSpeed = clamp(r.masterSpeed, 1, 24);

    const layerSizeRatioFit = clamp(
      r.layerSizeRatio + (r.layerSizeRatioLfoEnabled ? r.layerSizeRatioLfoDepth * 0.5 : 0),
      0.4, 1.8,
    );
    const sceneScale = computeSceneScale(r, layerSizeRatioFit);
    const mm = getMasterMotion(r, t, gSpeed);
    const totalLayers = r.layers.length;
    const enabledLayerOrderByIndex = new Array<number>(totalLayers).fill(-1);
    let enabledLayerCount = 0;
    for (let li = 0; li < totalLayers; li++) {
      if (!r.layers[li]?.enabled) continue;
      enabledLayerOrderByIndex[li] = enabledLayerCount;
      enabledLayerCount += 1;
    }
    enabledLayerCount = Math.max(1, enabledLayerCount);
    const inverted = r.inverted;
    const layerColor: [number, number, number] = inverted ? [0, 0, 0] : [1, 1, 1];

    let forcedLayerSizeRatio = r.layerSizeRatio;
    if (r.layerSizeRatioLfoEnabled) {
      const cycle = loopSyncedDuration(r.loopSeconds, r.layerSizeRatioLfoCycleSeconds, 0.08);
      const ph = loopPhase(t, cycle);
      forcedLayerSizeRatio = clamp(
        r.layerSizeRatio + Math.sin(ph * Math.PI * 2) * r.layerSizeRatioLfoDepth * 0.5,
        0.4, 1.8,
      );
    }

    // 1. Render shapes into sceneFB (no feedback)
    this.bindFB(this.sceneFB);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.geo.id);

    gl.uniform1f(this.u(this.geo, 'u_sceneScale'), sceneScale);
    gl.uniform1f(this.u(this.geo, 'u_masterAngle'), mm.angle);
    gl.uniform1f(this.u(this.geo, 'u_masterScale'), mm.scale);
    gl.uniform1f(this.u(this.geo, 'u_feedbackScale'), 1.0);
    gl.uniform4f(this.u(this.geo, 'u_color'), layerColor[0], layerColor[1], layerColor[2], 1);
    gl.uniform1i(this.u(this.geo, 'u_inverted'), inverted ? 1 : 0);

    const noiseFreq = clamp(0.9 / r.masterNoiseScale, 0.08, 2);
    const noiseTile = clamp(16 * r.masterNoiseScale, 6, 72);
    gl.uniform1f(this.u(this.geo, 'u_noiseFreq'), noiseFreq);
    gl.uniform1f(this.u(this.geo, 'u_noiseTile'), noiseTile);
    gl.uniform1f(this.u(this.geo, 'u_noiseSeed'), r.masterNoiseSeed);
    gl.uniform1i(this.u(this.geo, 'u_noiseType'), r.masterNoiseType === 'turbulence' ? 1 : 0);

    for (let li = 0; li < totalLayers; li++) {
      const layer = r.layers[li];
      if (!layer.enabled) continue;

      const lm = getLayerMotion(layer, t, r.loopSeconds, gSpeed);
      const enabledLayerIndex = enabledLayerOrderByIndex[li];
      const lss = getLayerSizeScale(
        enabledLayerIndex < 0 ? 0 : enabledLayerIndex,
        enabledLayerCount,
        forcedLayerSizeRatio,
      );
      const hasSweepAngle = getLayerMotionModes(layer).includes('sweep-angle');

      gl.uniform1f(this.u(this.geo, 'u_layerAngle'), lm.angle);
      gl.uniform1f(this.u(this.geo, 'u_layerScale'), lm.scale);
      gl.uniform1f(this.u(this.geo, 'u_layerOpacity'), lm.opacity);
      gl.uniform1f(this.u(this.geo, 'u_instMotionScale'), lm.instanceScale);
      gl.uniform1f(this.u(this.geo, 'u_instMotionOpacity'), lm.instanceOpacity);
      gl.uniform1f(this.u(this.geo, 'u_sizeScale'), lss);
      gl.uniform1i(this.u(this.geo, 'u_shapeType'), SHAPE_TYPES[layer.type] ?? 0);
      gl.uniform1i(this.u(this.geo, 'u_fillMode'), FILL_MODES[layer.fillMode] ?? 0);
      gl.uniform1i(this.u(this.geo, 'u_dashStyle'), layer.dashStyle === 'dashed' ? 1 : 0);
      gl.uniform1f(this.u(this.geo, 'u_strokeWidth'), r.masterStrokeWidth);
      gl.uniform1i(this.u(this.geo, 'u_useNoiseFill'),
        (layer.fillMode === 'noise' || layer.fillMode === 'noise-stroke') ? 1 : 0);

      let startAngleDeg = layer.startAngle ?? 0;
      let sweepDeg = layer.sweepAngle ?? 360;
      if (hasSweepAngle && (layer.type === 'ring' || layer.type === 'dot')) {
        const maxSweep = clamp(layer.sweepAngle, 0, 360);
        const ss = getSweepState(t, r.loopSeconds, layer.motionSpeed, gSpeed, layer.startAngle, maxSweep);
        if (ss) {
          startAngleDeg = ss.startAngle;
          sweepDeg = ss.sweep;
        }
      }

      const deg2rad = Math.PI / 180;
      gl.uniform1f(this.u(this.geo, 'u_radius'), layer.radius ?? 30);
      gl.uniform1f(this.u(this.geo, 'u_startAngle'), startAngleDeg * deg2rad);
      gl.uniform1f(this.u(this.geo, 'u_sweepAngle'), sweepDeg * deg2rad);
      gl.uniform1f(this.u(this.geo, 'u_armLength'), lm.armLength);
      gl.uniform1f(this.u(this.geo, 'u_armGap'), lm.armGap);
      gl.uniform1f(this.u(this.geo, 'u_squareSize'), layer.squareSize ?? 48);
      gl.uniform1f(this.u(this.geo, 'u_squareRadius'), layer.squareRadius ?? 0);
      gl.uniform1f(this.u(this.geo, 'u_gridSize'), layer.gridSize ?? 56);
      gl.uniform1i(this.u(this.geo, 'u_gridDivisions'), layer.gridDivisions ?? 4);
      gl.uniform1i(this.u(this.geo, 'u_gridOuterFrame'), layer.gridOuterFrame ? 1 : 0);
      gl.uniform1f(this.u(this.geo, 'u_lineLength'), layer.lineLength ?? 36);
      gl.uniform1f(this.u(this.geo, 'u_lineOffset'), layer.lineOffset ?? 0);
      gl.uniform1i(this.u(this.geo, 'u_tickCount'), layer.tickCount ?? 8);
      gl.uniform1f(this.u(this.geo, 'u_tickRadius'), layer.tickRadius ?? 28);
      gl.uniform1f(this.u(this.geo, 'u_tickLength'), layer.tickLength ?? 8);
      gl.uniform1f(this.u(this.geo, 'u_tickOffset'), (layer.tickOffset ?? 0) * deg2rad);

      const instCount = Math.max(1, layer.repeatCount);
      gl.uniform1i(this.u(this.geo, 'u_instanceCount'), instCount);
      for (let ii = 0; ii < instCount; ii++) {
        const pos = getRepeatPosition(layer, ii);
        const sc = getRepeatInstanceScale(layer, ii);
        gl.uniform2f(this.u(this.geo, `u_positions[${ii}]`), pos.x, pos.y);
        gl.uniform1f(this.u(this.geo, `u_rotations[${ii}]`), (layer.rotation ?? 0) * deg2rad);
        gl.uniform1f(this.u(this.geo, `u_scales[${ii}]`), sc);
      }

      this.drawQuad();
    }

    // 2. Feedback compositing → fbA
    this.bindFB(this.fbA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const feedbackCount = Math.max(0, r.masterFeedback ?? 0);
    for (let fi = feedbackCount; fi >= 0; fi--) {
      let fScale = 1 + fi * 0.08;
      let fOpacity = fi === 0 ? 1 : Math.max(0.06, 0.25 / (fi + 1));

      if (r.feedbackLfoEnabled && feedbackCount > 0 && fi > 0) {
        const cycle = loopSyncedDuration(r.loopSeconds, r.feedbackLfoCycleSeconds, 0.08);
        const depth = r.feedbackLfoDepth;
        const fw = fi / Math.max(1, feedbackCount);
        const sDelta = depth * 0.34 * fw;
        const trailOp = clamp(fOpacity * (0.8 + depth * 0.45), 0.03, 1);
        const resetDur = clamp(cycle * (0.1 + fw * 0.08), 0.01, Math.max(0.01, cycle * 0.45));
        const fadeDur = Math.max(0.01, cycle - resetDur);
        const phaseDelay = cycle * 0.55 * fw;
        const localT = ((t - phaseDelay) % cycle + cycle) % cycle;

        if (localT <= fadeDur) {
          const p = localT / fadeDur;
          fScale = fScale + sDelta * p;
          fOpacity = trailOp * (1 - p);
        } else {
          const p = (localT - fadeDur) / resetDur;
          fScale = (fScale + sDelta) + (fScale - (fScale + sDelta)) * p;
          fOpacity = trailOp * p;
        }
      }

      gl.useProgram(this.feedback.id);
      this.bindTex(0, this.sceneFB.tex);
      gl.uniform1i(this.u(this.feedback, 'u_tex'), 0);
      gl.uniform1f(this.u(this.feedback, 'u_scale'), fScale);
      gl.uniform1f(this.u(this.feedback, 'u_opacity'), fOpacity);
      this.drawQuad();
    }

    // 3. Post-processing chain
    let readFB = this.fbA;
    let writeFB = this.fbB;
    const swap = () => { [readFB, writeFB] = [writeFB, readFB]; };

    const isGrainFirst = r.renderPrepassOrder === 'grain-first';
    const prepass1 = isGrainFirst ? 'grain' : 'particles';
    const prepass2 = isGrainFirst ? 'particles' : 'grain';

    const applyPrepass = (type: string) => {
      if (type === 'particles' && r.masterParticlesEnabled) {
        const str = r.masterParticlesStrength ?? 0.55;
        const det = r.masterParticlesDetail ?? 0.6;
        const cov = clamp(0.05 + str * (0.2 + det * 0.42), 0.04, 0.72);
        const freq = clamp(0.8 + det * 3.6, 0.4, 6);
        const dilateR = 0.06 + str * (0.45 + det * 1.15);
        gl.disable(gl.BLEND);
        gl.useProgram(this.particles.id);
        this.bindFB(writeFB);
        this.bindTex(0, readFB.tex);
        gl.uniform1i(this.u(this.particles, 'u_tex'), 0);
        gl.uniform2f(this.u(this.particles, 'u_resolution'), this.w, this.h);
        gl.uniform1f(this.u(this.particles, 'u_frequency'), freq);
        gl.uniform1f(this.u(this.particles, 'u_coverage'), cov);
        gl.uniform1f(this.u(this.particles, 'u_dilateRadius'), dilateR);
        gl.uniform1f(this.u(this.particles, 'u_seed'), r.masterNoiseSeed);
        gl.uniform1i(this.u(this.particles, 'u_shape'), r.masterParticleShape === 'circle' ? 1 : 0);
        this.drawQuad();
        swap();
      }
      if (type === 'grain' && r.masterGrainEnabled) {
        const str = r.masterGrainStrength ?? 0.55;
        const det = r.masterGrainDetail ?? 0.6;
        const amount = 0.05 + str * (0.18 + det * 0.42);
        const freq = clamp(0.9 + det * 4.4, 0.6, 5.6);
        gl.disable(gl.BLEND);
        gl.useProgram(this.grain.id);
        this.bindFB(writeFB);
        this.bindTex(0, readFB.tex);
        gl.uniform1i(this.u(this.grain, 'u_tex'), 0);
        gl.uniform1f(this.u(this.grain, 'u_frequency'), freq);
        gl.uniform1f(this.u(this.grain, 'u_amount'), amount);
        gl.uniform1f(this.u(this.grain, 'u_seed'), r.masterNoiseSeed);
        this.drawQuad();
        swap();
      }
    };

    applyPrepass(prepass1);
    applyPrepass(prepass2);

    const doBlur = (radiusPx: number) => {
      gl.useProgram(this.blur.id);
      // horizontal: readFB → writeFB
      this.bindFB(writeFB);
      this.bindTex(0, readFB.tex);
      gl.uniform1i(this.u(this.blur, 'u_tex'), 0);
      gl.uniform2f(this.u(this.blur, 'u_dir'), 1.0 / this.w, 0);
      gl.uniform1f(this.u(this.blur, 'u_radius'), radiusPx);
      this.drawQuad();
      swap();
      // vertical: readFB → writeFB
      this.bindFB(writeFB);
      this.bindTex(0, readFB.tex);
      gl.uniform2f(this.u(this.blur, 'u_dir'), 0, 1.0 / this.h);
      this.drawQuad();
      swap();
    };

    const applyEffect = (effect: string, str: number, det: number) => {
      if (effect === 'none') return;
      gl.disable(gl.BLEND);

      if (effect === 'threshold') {
        const cutoff = clamp(0.12 + det * 0.82, 0.02, 0.99);
        const softness = clamp((1 - det) * 0.12, 0, 0.14);
        const amount = clamp(str, 0, 1);
        gl.useProgram(this.threshold.id);
        this.bindFB(writeFB);
        this.bindTex(0, readFB.tex);
        gl.uniform1i(this.u(this.threshold, 'u_tex'), 0);
        gl.uniform1f(this.u(this.threshold, 'u_cutoff'), cutoff);
        gl.uniform1f(this.u(this.threshold, 'u_softness'), softness);
        gl.uniform1f(this.u(this.threshold, 'u_amount'), amount);
        this.drawQuad();
        swap();
      } else if (effect === 'posterize') {
        const steps = Math.max(2, Math.round(2 + det * 14));
        gl.useProgram(this.posterize.id);
        this.bindFB(writeFB);
        this.bindTex(0, readFB.tex);
        gl.uniform1i(this.u(this.posterize, 'u_tex'), 0);
        gl.uniform1f(this.u(this.posterize, 'u_steps'), steps);
        this.drawQuad();
        swap();
      } else if (effect === 'pixelate') {
        const px = 0.12 + str * (0.9 + det * 2.2);
        const pixelSizePx = px * (this.w / 100);
        gl.useProgram(this.pixelate.id);
        this.bindFB(writeFB);
        this.bindTex(0, readFB.tex);
        gl.uniform1i(this.u(this.pixelate, 'u_tex'), 0);
        gl.uniform2f(this.u(this.pixelate, 'u_resolution'), this.w, this.h);
        gl.uniform1f(this.u(this.pixelate, 'u_pixelSize'), pixelSizePx);
        this.drawQuad();
        swap();
      } else if (effect === 'blur') {
        const std = 0.08 + str * (1.2 + det * 4);
        doBlur(std * (this.w / 100));
      } else if (effect === 'glow') {
        const std = 0.08 + str * (0.8 + det * 2.4);
        const radiusPx = std * (this.w / 100);
        // save original to temp
        gl.useProgram(this.copy.id);
        this.bindFB(this.tempFB);
        this.bindTex(0, readFB.tex);
        gl.uniform1i(this.u(this.copy, 'u_tex'), 0);
        this.drawQuad();
        // blur current
        doBlur(radiusPx);
        // additive composite: original (temp) + blurred (readFB) → writeFB
        gl.useProgram(this.glowAdd.id);
        this.bindFB(writeFB);
        this.bindTex(0, this.tempFB.tex);
        this.bindTex(1, readFB.tex);
        gl.uniform1i(this.u(this.glowAdd, 'u_texA'), 0);
        gl.uniform1i(this.u(this.glowAdd, 'u_texB'), 1);
        this.drawQuad();
        swap();
      }
    };

    applyEffect(r.masterRenderEffect, r.masterRenderStrength, r.masterRenderDetail);
    applyEffect(
      r.masterRenderEffectSecondary,
      r.masterRenderStrengthSecondary,
      r.masterRenderDetailSecondary,
    );

    // 4. Final composite to canvas
    gl.disable(gl.BLEND);
    this.bindFB(null);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.composite.id);
    this.bindTex(0, readFB.tex);
    gl.uniform1i(this.u(this.composite, 'u_tex'), 0);

    const bg = hexToRgb(r.backgroundColor || '#000000');
    gl.uniform3f(this.u(this.composite, 'u_bgColor'), bg[0], bg[1], bg[2]);

    const frameShape = r.masterFrameShape || 'none';
    const clipShapeInt = frameShape === 'circle' ? 1 : frameShape === 'square' ? 2 : 0;
    const frameSW = r.masterFrameStrokeWidth ?? 1.4;
    const frameInset = Math.max(1, frameSW);
    const clipInset = clamp(frameInset + frameSW * 0.5, 0, 49.5);
    gl.uniform1i(this.u(this.composite, 'u_clipShape'), clipShapeInt);
    gl.uniform1f(this.u(this.composite, 'u_clipInset'), clipInset);
    gl.uniform1f(this.u(this.composite, 'u_frameStroke'), frameSW);
    gl.uniform3f(this.u(this.composite, 'u_frameColor'), layerColor[0], layerColor[1], layerColor[2]);
    this.drawQuad();
  }

  dispose() {
    const gl = this.gl;
    const progs = [
      this.geo, this.copy, this.feedback, this.threshold,
      this.posterize, this.pixelate, this.blur, this.particles,
      this.grain, this.composite, this.glowAdd,
    ];
    for (const p of progs) gl.deleteProgram(p.id);
    const fbos = [this.sceneFB, this.fbA, this.fbB, this.tempFB];
    for (const f of fbos) {
      if (!f) continue;
      gl.deleteFramebuffer(f.fb);
      gl.deleteTexture(f.tex);
    }
    gl.deleteVertexArray(this.vao);
  }
}
