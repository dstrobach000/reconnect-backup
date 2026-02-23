export const QUAD_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const NOISE_LIB = /* glsl */ `
float hash21(vec2 p){
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}
float valueNoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);
}
float fbm2(vec2 p, float seed){
  p += seed * 17.3;
  float v = 0.0, a = 0.5;
  for(int i=0;i<2;i++){v+=a*valueNoise(p);p*=2.01;a*=0.5;}
  return v;
}
float fbm1(vec2 p, float seed){
  return valueNoise(p + seed * 17.3);
}
`;

const SDF_LIB = /* glsl */ `
const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float sdSegment(vec2 p, vec2 a, vec2 b){
  vec2 pa=p-a, ba=b-a;
  float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  return length(pa-ba*h);
}
float segArcLen(vec2 p, vec2 a, vec2 b){
  vec2 ba=b-a;
  float h=clamp(dot(p-a,ba)/dot(ba,ba),0.0,1.0);
  return h * length(ba);
}

float svgAngle(vec2 p){
  return atan(p.x, -p.y);
}
float angleDist(float a, float center, float half){
  float d = mod(a - center + PI, TAU) - PI;
  return abs(d) - half;
}

float sdCircleStroke(vec2 p, float r){
  return abs(length(p)-r);
}
float sdDisk(vec2 p, float r){
  return length(p)-r;
}
float sdArcStroke(vec2 p, float r, float startRad, float sweepRad){
  if(sweepRad >= TAU) return sdCircleStroke(p, r);
  float mid = startRad + sweepRad * 0.5;
  float half = sweepRad * 0.5;
  float a = svgAngle(p);
  float ad = angleDist(a, mid, half);
  if(ad <= 0.0) return abs(length(p)-r);
  vec2 e1 = r*vec2(sin(startRad), -cos(startRad));
  vec2 e2 = r*vec2(sin(startRad+sweepRad), -cos(startRad+sweepRad));
  return min(length(p-e1), length(p-e2));
}
float sdSector(vec2 p, float r, float startRad, float sweepRad){
  if(sweepRad >= TAU) return sdDisk(p, r);
  float mid = startRad + sweepRad * 0.5;
  float half = sweepRad * 0.5;
  float a = svgAngle(p);
  float ad = angleDist(a, mid, half);
  float rd = length(p) - r;
  if(ad <= 0.0 && rd <= 0.0) return max(ad * r, rd);
  if(ad <= 0.0) return rd;
  vec2 d1 = r*vec2(sin(startRad), -cos(startRad));
  vec2 d2 = r*vec2(sin(startRad+sweepRad), -cos(startRad+sweepRad));
  float t1 = clamp(dot(p,d1)/dot(d1,d1),0.0,1.0);
  float t2 = clamp(dot(p,d2)/dot(d2,d2),0.0,1.0);
  return min(length(p-d1*t1), min(length(p-d2*t2), max(0.0,rd)));
}
float arcArcLen(vec2 p, float r, float startRad, float sweepRad){
  float a = svgAngle(p);
  float da = mod(a - startRad + TAU, TAU);
  return clamp(da, 0.0, sweepRad) * r;
}
float sdRoundBox(vec2 p, vec2 b, float r){
  vec2 d = abs(p)-b+r;
  return length(max(d,0.0))+min(max(d.x,d.y),0.0)-r;
}
`;

export const GEOMETRY_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
` + SDF_LIB + NOISE_LIB + /* glsl */ `

#define MAX_INST 24
#define TYPE_RING 0
#define TYPE_CROSS 1
#define TYPE_DOT 2
#define TYPE_TICKS 3
#define TYPE_SQUARE 4
#define TYPE_GRID 5
#define TYPE_LINE 6

uniform int u_shapeType;
uniform int u_fillMode; // 0=stroke,1=fill,2=fill-stroke,3=noise,4=noise-stroke
uniform int u_dashStyle; // 0=solid,1=dashed
uniform float u_strokeWidth;
uniform int u_instanceCount;
uniform vec2 u_positions[MAX_INST];
uniform float u_rotations[MAX_INST];
uniform float u_scales[MAX_INST];
uniform float u_sizeScale;
uniform float u_instMotionScale;
uniform float u_layerOpacity;
uniform float u_instMotionOpacity;
uniform float u_sceneScale;
uniform float u_masterAngle;
uniform float u_masterScale;
uniform float u_layerAngle;
uniform float u_layerScale;
uniform float u_feedbackScale;
uniform vec4 u_color;

// shape params
uniform float u_radius;
uniform float u_startAngle;
uniform float u_sweepAngle;
uniform float u_armLength;
uniform float u_armGap;
uniform float u_squareSize;
uniform float u_squareRadius;
uniform float u_gridSize;
uniform int u_gridDivisions;
uniform int u_gridOuterFrame;
uniform float u_lineLength;
uniform float u_lineOffset;
uniform int u_tickCount;
uniform float u_tickRadius;
uniform float u_tickLength;
uniform float u_tickOffset;

// noise fill
uniform int u_useNoiseFill;
uniform float u_noiseFreq;
uniform float u_noiseTile;
uniform float u_noiseSeed;
uniform int u_noiseType;
uniform int u_inverted;

vec2 invCenterTransform(vec2 p, float angle, float scale){
  vec2 c = p - 50.0;
  float cs = cos(-angle), sn = sin(-angle);
  c = vec2(cs*c.x - sn*c.y, sn*c.x + cs*c.y) / scale;
  return c + 50.0;
}

vec2 toLocal(vec2 svgP, int idx){
  vec2 p = svgP;
  p = (p - 50.0) / u_sceneScale + 50.0;
  p = invCenterTransform(p, u_masterAngle, u_masterScale);
  p = (p - 50.0) / u_feedbackScale + 50.0;
  p = invCenterTransform(p, u_layerAngle, u_layerScale);
  p -= u_positions[idx];
  float a = -u_rotations[idx];
  float cs = cos(a), sn = sin(a);
  p = vec2(cs*p.x - sn*p.y, sn*p.x + cs*p.y);
  p /= u_instMotionScale * u_scales[idx] * u_sizeScale;
  return p;
}

struct ShapeResult {
  float strokeDist;
  float fillDist;
  float arcLen;
};

ShapeResult evalRing(vec2 p){
  ShapeResult r;
  r.strokeDist = sdArcStroke(p, u_radius, u_startAngle, u_sweepAngle);
  r.fillDist = sdSector(p, u_radius, u_startAngle, u_sweepAngle);
  r.arcLen = arcArcLen(p, u_radius, u_startAngle, u_sweepAngle);
  return r;
}

ShapeResult evalCross(vec2 p){
  float g = u_armGap, l = u_armLength;
  float d = 1e6;
  float al = 0.0;
  float dn = sdSegment(p, vec2(0,-g), vec2(0,-l));
  float de = sdSegment(p, vec2(g,0), vec2(l,0));
  float ds = sdSegment(p, vec2(0,g), vec2(0,l));
  float dw = sdSegment(p, vec2(-g,0), vec2(-l,0));
  if(dn<d){d=dn; al=segArcLen(p,vec2(0,-g),vec2(0,-l));}
  if(de<d){d=de; al=segArcLen(p,vec2(g,0),vec2(l,0));}
  if(ds<d){d=ds; al=segArcLen(p,vec2(0,g),vec2(0,l));}
  if(dw<d){d=dw; al=segArcLen(p,vec2(-g,0),vec2(-l,0));}
  d = min(min(dn,de),min(ds,dw));
  ShapeResult r;
  r.strokeDist = d;
  r.fillDist = d;
  r.arcLen = al;
  return r;
}

ShapeResult evalTicks(vec2 p){
  float d = 1e6;
  float al = 0.0;
  for(int i=0;i<MAX_INST;i++){
    if(i>=u_tickCount) break;
    float a = u_tickOffset + TAU / float(u_tickCount) * float(i);
    vec2 dir = vec2(sin(a), -cos(a));
    vec2 a1 = dir * u_tickRadius;
    vec2 a2 = dir * (u_tickRadius + u_tickLength);
    float di = sdSegment(p, a1, a2);
    if(di<d){d=di; al=segArcLen(p,a1,a2);}
  }
  ShapeResult r;
  r.strokeDist = d;
  r.fillDist = d;
  r.arcLen = al;
  return r;
}

ShapeResult evalDot(vec2 p){
  return evalRing(p);
}

ShapeResult evalSquare(vec2 p){
  float half = u_squareSize * 0.5;
  float cr = min(u_squareRadius, half);
  float d = sdRoundBox(p, vec2(half), cr);
  ShapeResult r;
  r.strokeDist = abs(d);
  r.fillDist = d;
  r.arcLen = 0.0;
  return r;
}

ShapeResult evalGrid(vec2 p){
  float half = u_gridSize * 0.5;
  int divs = max(2, u_gridDivisions);
  float step = u_gridSize / float(divs);
  float d = 1e6;
  for(int i=1;i<24;i++){
    if(i>=divs) break;
    float off = -half + step * float(i);
    d = min(d, sdSegment(p, vec2(-half,off), vec2(half,off)));
    d = min(d, sdSegment(p, vec2(off,-half), vec2(off,half)));
  }
  if(u_gridOuterFrame == 1){
    float bd = sdRoundBox(p, vec2(half), 0.0);
    d = min(d, abs(bd));
  }
  ShapeResult r;
  r.strokeDist = d;
  r.fillDist = d;
  r.arcLen = 0.0;
  return r;
}

ShapeResult evalLine(vec2 p){
  float halfLen = u_lineLength * 0.5;
  float y1 = -(u_lineOffset + halfLen);
  float y2 = -(u_lineOffset - halfLen);
  float d = sdSegment(p, vec2(0, y1), vec2(0, y2));
  ShapeResult r;
  r.strokeDist = d;
  r.fillDist = d;
  r.arcLen = segArcLen(p, vec2(0,y1), vec2(0,y2));
  return r;
}

ShapeResult evalShape(vec2 p){
  if(u_shapeType==TYPE_RING) return evalRing(p);
  if(u_shapeType==TYPE_CROSS) return evalCross(p);
  if(u_shapeType==TYPE_DOT) return evalDot(p);
  if(u_shapeType==TYPE_TICKS) return evalTicks(p);
  if(u_shapeType==TYPE_SQUARE) return evalSquare(p);
  if(u_shapeType==TYPE_GRID) return evalGrid(p);
  return evalLine(p);
}

void main(){
  vec2 svgP = vec2(v_uv.x * 100.0, (1.0-v_uv.y) * 100.0);
  float maxAlpha = 0.0;
  vec3 col = u_color.rgb;

  for(int i=0;i<MAX_INST;i++){
    if(i>=u_instanceCount) break;
    vec2 lp = toLocal(svgP, i);
    ShapeResult sr = evalShape(lp);

    bool hasFill = u_fillMode>=1;
    bool hasStroke = u_fillMode==0 || u_fillMode==2 || u_fillMode==4;
    float halfSW = u_strokeWidth * 0.5;
    float aa = fwidth(sr.strokeDist) * 0.6;
    float alpha = 0.0;

    if(hasFill){
      float faa = fwidth(sr.fillDist) * 0.6;
      alpha = max(alpha, 1.0 - smoothstep(-faa, faa, sr.fillDist));
    }
    if(hasStroke && u_strokeWidth > 0.0){
      float sa = 1.0 - smoothstep(halfSW - aa, halfSW + aa, sr.strokeDist);
      if(u_dashStyle == 1){
        float period = 8.0;
        float inDash = step(mod(sr.arcLen, period), 4.0);
        sa *= inDash;
      }
      alpha = max(alpha, sa);
    }

    if(u_useNoiseFill == 1 && alpha > 0.001){
      vec2 nc = mod(lp, u_noiseTile) * u_noiseFreq;
      float n;
      if(u_noiseType == 1){
        n = abs(fbm2(nc, u_noiseSeed) * 2.0 - 1.0);
      } else {
        n = fbm2(nc, u_noiseSeed);
      }
      float nBW = step(0.5, n);
      float noiseColor = nBW;
      bool hasFillOnly = u_fillMode==3;
      if(hasFillOnly){
        col = vec3(noiseColor);
      } else {
        float faa = fwidth(sr.fillDist) * 0.6;
        float fillMask = 1.0 - smoothstep(-faa, faa, sr.fillDist);
        float strokeMask = 1.0 - smoothstep(halfSW - aa, halfSW + aa, sr.strokeDist);
        col = mix(vec3(noiseColor), u_color.rgb, strokeMask / max(alpha, 0.001));
      }
    }

    maxAlpha = max(maxAlpha, alpha);
  }

  float finalAlpha = maxAlpha * u_layerOpacity * u_instMotionOpacity;
  fragColor = vec4(col * finalAlpha, finalAlpha);
}
`;

export const COPY_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
void main(){
  fragColor = texture(u_tex, v_uv);
}
`;

export const FEEDBACK_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform float u_scale;
uniform float u_opacity;
void main(){
  vec2 uv = (v_uv - 0.5) / u_scale + 0.5;
  if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){
    fragColor = vec4(0);
    return;
  }
  vec4 c = texture(u_tex, uv);
  fragColor = c * u_opacity;
}
`;

export const THRESHOLD_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform float u_cutoff;
uniform float u_softness;
void main(){
  vec4 c = texture(u_tex, v_uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float t = smoothstep(u_cutoff - u_softness, u_cutoff + u_softness, lum);
  fragColor = vec4(vec3(t), c.a);
}
`;

export const POSTERIZE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform float u_steps;
void main(){
  vec4 c = texture(u_tex, v_uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float q = floor(lum * u_steps) / max(1.0, u_steps - 1.0);
  fragColor = vec4(vec3(q), c.a);
}
`;

export const PIXELATE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_pixelSize;
void main(){
  vec2 ps = vec2(u_pixelSize) / u_resolution;
  vec2 uv = floor(v_uv / ps + 0.5) * ps;
  fragColor = texture(u_tex, uv);
}
`;

export const BLUR_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform vec2 u_dir;
uniform float u_radius;
void main(){
  vec4 sum = vec4(0);
  float total = 0.0;
  float sigma = max(u_radius * 0.5, 0.5);
  int samples = int(ceil(u_radius * 2.0));
  samples = min(samples, 32);
  for(int i = -32; i <= 32; i++){
    if(abs(i) > samples) continue;
    float fi = float(i);
    float w = exp(-0.5 * fi*fi / (sigma*sigma));
    sum += texture(u_tex, v_uv + u_dir * fi) * w;
    total += w;
  }
  fragColor = sum / total;
}
`;

export const PARTICLES_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_frequency;
uniform float u_coverage;
uniform float u_dilateRadius;
uniform float u_seed;
uniform int u_shape; // 0=square, 1=circle
` + NOISE_LIB + /* glsl */ `
void main(){
  vec4 src = texture(u_tex, v_uv);
  vec2 svgP = vec2(v_uv.x * 100.0, (1.0 - v_uv.y) * 100.0);
  float n = fbm2(svgP * u_frequency * 0.01, u_seed);
  float mask = step(1.0 - u_coverage, n);
  if(u_shape == 1){
    float dilated = 0.0;
    float r = u_dilateRadius / u_resolution.x * 100.0;
    int s = int(ceil(r * 0.5));
    s = min(s, 4);
    for(int dx=-4;dx<=4;dx++){
      if(abs(dx)>s) continue;
      for(int dy=-4;dy<=4;dy++){
        if(abs(dy)>s) continue;
        vec2 off = vec2(float(dx), float(dy)) * r * 0.5;
        vec2 sp = svgP + off;
        float nn = fbm2(sp * u_frequency * 0.01, u_seed);
        float mm = step(1.0 - u_coverage, nn);
        float dist = length(off) / max(r, 0.01);
        dilated = max(dilated, mm * smoothstep(1.0, 0.3, dist));
      }
    }
    mask = dilated;
  }
  fragColor = src * mask;
}
`;

export const GRAIN_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform float u_frequency;
uniform float u_amount;
uniform float u_seed;
` + NOISE_LIB + /* glsl */ `
void main(){
  vec4 src = texture(u_tex, v_uv);
  vec2 svgP = vec2(v_uv.x * 100.0, (1.0 - v_uv.y) * 100.0);
  float n = fbm1(svgP * u_frequency * 0.01, u_seed);
  float grain = n * u_amount;
  vec3 blended = 1.0 - (1.0 - src.rgb) * (1.0 - vec3(grain));
  fragColor = vec4(blended, src.a);
}
`;

export const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform vec3 u_bgColor;
uniform int u_clipShape; // 0=none, 1=circle, 2=square
uniform float u_clipInset;
uniform float u_frameStroke;
uniform vec3 u_frameColor;
void main(){
  vec4 scene = texture(u_tex, v_uv);
  vec2 svgP = vec2(v_uv.x * 100.0, (1.0 - v_uv.y) * 100.0);
  vec2 center = svgP - 50.0;
  float clipAlpha = 1.0;
  if(u_clipShape == 1){
    float r = 50.0 - u_clipInset;
    float d = length(center) - r;
    clipAlpha = 1.0 - smoothstep(-0.5, 0.5, d);
  } else if(u_clipShape == 2){
    float half = 50.0 - u_clipInset;
    vec2 d = abs(center) - half;
    float box = max(d.x, d.y);
    clipAlpha = 1.0 - smoothstep(-0.5, 0.5, box);
  }
  vec3 result = mix(u_bgColor, scene.rgb, scene.a * clipAlpha);

  if(u_clipShape > 0 && u_frameStroke > 0.0){
    float fd;
    if(u_clipShape == 1){
      float fr = 50.0 - u_clipInset;
      fd = abs(length(center) - fr);
    } else {
      float fh = 50.0 - u_clipInset;
      fd = abs(max(abs(center.x)-fh, abs(center.y)-fh));
    }
    float fw = u_frameStroke * 0.5;
    float frameMask = 1.0 - smoothstep(fw - 0.3, fw + 0.3, fd);
    result = mix(result, u_frameColor, frameMask);
  }

  fragColor = vec4(result, 1.0);
}
`;

export const GLOW_ADD_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_texA;
uniform sampler2D u_texB;
void main(){
  vec4 a = texture(u_texA, v_uv);
  vec4 b = texture(u_texB, v_uv);
  fragColor = vec4(max(a.rgb, a.rgb + b.rgb), max(a.a, b.a));
}
`;
