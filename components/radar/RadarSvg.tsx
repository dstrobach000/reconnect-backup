import React from 'react';

function Quadrants({ mono }) {
  return (
    <g data-glyph="quadrants">
      <g fill={mono}>
        <rect data-cell="tl" x="95" y="95" width="170" height="170" />
        <rect data-cell="tr" x="335" y="95" width="170" height="170" />
        <rect data-cell="bl" x="95" y="335" width="170" height="170" />
        <rect data-cell="br" x="335" y="335" width="170" height="170" />
      </g>
    </g>
  );
}

function Squares({ mono }) {
  return (
    <g
      data-glyph="squares"
      stroke={mono}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      <g transform="rotate(45 300 300)">
        <rect data-zoom-ring data-base-scale="0.34" x="150" y="150" width="300" height="300" />
        <rect data-zoom-ring data-base-scale="0.5" x="150" y="150" width="300" height="300" />
        <rect data-zoom-ring data-base-scale="0.66" x="150" y="150" width="300" height="300" />
        <rect data-zoom-ring data-base-scale="0.82" x="150" y="150" width="300" height="300" />
      </g>
    </g>
  );
}

function Crosshair({ mono }) {
  return (
    <g data-glyph="crosshair" fill="none" strokeLinecap="round">
      <g data-cross-rotor stroke="#000000" strokeWidth="1" opacity="1">
        <circle cx="300" cy="300" r="210" />
        <line data-cross-solid x1="300" y1="92" x2="300" y2="508" />
        <line data-cross-solid x1="92" y1="300" x2="508" y2="300" />
        <line data-cross-grow="up" x1="300" y1="300" x2="300" y2="300" strokeDasharray="1 7" />
        <line data-cross-grow="right" x1="300" y1="300" x2="300" y2="300" strokeDasharray="1 7" />
        <line data-cross-grow="down" x1="300" y1="300" x2="300" y2="300" strokeDasharray="1 7" />
        <line data-cross-grow="left" x1="300" y1="300" x2="300" y2="300" strokeDasharray="1 7" />
      </g>

      <g
        data-reticle-group
        stroke="#000000"
        strokeWidth="1"
        strokeDasharray="2 6"
        opacity="1"
      >
        <circle data-reticle-ring cx="300" cy="300" r="42" />
        <circle data-reticle-ring cx="300" cy="300" r="78" />
        <circle data-reticle-ring cx="300" cy="300" r="114" />
        <circle data-reticle-ring cx="300" cy="300" r="150" />
        <circle data-reticle-ring cx="300" cy="300" r="186" />
      </g>

      <g data-reticle-center stroke="#000000" strokeWidth="1" fill="none">
        <circle cx="300" cy="300" r="6" />
        <circle data-reticle-center-pulse cx="300" cy="300" r="12" />
      </g>
    </g>
  );
}

function Sun({ mono }) {
  return (
    <g
      data-glyph="sun"
      stroke={mono}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      <circle data-circle-zoom data-base-scale="0.28" cx="300" cy="300" r="170" />
      <circle data-circle-zoom data-base-scale="0.44" cx="300" cy="300" r="170" />
      <circle data-circle-zoom data-base-scale="0.6" cx="300" cy="300" r="170" />
      <circle data-circle-zoom data-base-scale="0.76" cx="300" cy="300" r="170" />
    </g>
  );
}

function Diamond({ mono }) {
  return (
    <g data-glyph="diamond" fill="none" strokeLinecap="round">
      <g data-sonar-core stroke={mono} strokeWidth="1">
        <circle data-sonar-ring cx="300" cy="300" r="42" strokeDasharray="4 8" />
        <circle data-sonar-ring cx="300" cy="300" r="66" strokeDasharray="5 9" />
        <circle data-sonar-ring cx="300" cy="300" r="90" strokeDasharray="6 10" />
        <circle data-sonar-ring cx="300" cy="300" r="114" strokeDasharray="7 11" />
        <circle data-sonar-ring cx="300" cy="300" r="138" strokeDasharray="8 12" />
        <circle data-sonar-ring cx="300" cy="300" r="162" strokeDasharray="9 13" />
        <circle data-sonar-ring cx="300" cy="300" r="186" strokeDasharray="10 14" />
      </g>

      <g data-square-cross fill={mono}>
        <rect data-cross-block x="276" y="196" width="48" height="48" />
        <rect data-cross-block x="356" y="276" width="48" height="48" />
        <rect data-cross-block x="276" y="356" width="48" height="48" />
        <rect data-cross-block x="196" y="276" width="48" height="48" />
      </g>
    </g>
  );
}

function UpDown({ mono }) {
  return (
    <g
      data-glyph="updown"
      stroke={mono}
      strokeWidth="1"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      <g data-up-arrow-rotor>
        <path
          data-up-arrow-arc
          d="M150 318 A158 158 0 0 1 248 152"
          strokeDasharray="3 6"
        />
        <path
          data-up-arrow-arc
          d="M450 282 A158 158 0 0 1 352 448"
          strokeDasharray="3 6"
        />

        <path
          data-up-arrow-head
          d="M144 304 L198 186 L214 238"
        />
        <path
          data-up-arrow-head
          d="M456 296 L402 414 L386 362"
        />
      </g>
    </g>
  );
}

function Refresh({ mono }) {
  return (
    <g
      data-glyph="refresh"
      data-refresh
      stroke={mono}
      strokeWidth="2"
      fill="none"
      strokeLinecap="square"
    >
      <path data-refresh-a d="M166 220C198 156 264 120 338 120C384 120 426 135 460 164" />
      <path data-refresh-a d="M460 164 L460 250 L374 250" />
      <path data-refresh-b d="M434 380C402 444 336 480 262 480C216 480 174 465 140 436" />
      <path data-refresh-b d="M140 436 L140 350 L226 350" />
    </g>
  );
}

function Upload({ mono }) {
  return (
    <g data-glyph="upload" stroke={mono} strokeWidth="2" fill="none" strokeLinecap="square">
      <path d="M112 300A188 188 0 1 1 488 300" />
      <path data-upload d="M300 430V204" />
      <path data-upload d="M216 286L300 202L384 286" />
    </g>
  );
}

function SonarWave({ mono }) {
  return (
    <g data-glyph="sonarWave" stroke={mono} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle data-sonar-wave-ring cx="300" cy="300" r="52" strokeWidth="2" strokeDasharray="6 8" />
      <circle data-sonar-wave-ring cx="300" cy="300" r="92" strokeWidth="2" strokeDasharray="7 9" />
      <circle data-sonar-wave-ring cx="300" cy="300" r="132" strokeWidth="2" strokeDasharray="8 10" />
      <circle data-sonar-wave-ring cx="300" cy="300" r="172" strokeWidth="2" strokeDasharray="9 11" />
      <path data-sonar-wave-beam d="M300 300 L300 98" strokeWidth="2" />
      <circle cx="300" cy="300" r="9" fill={mono} stroke="none" />
    </g>
  );
}

function Oscilloscope({ mono }) {
  return (
    <g data-glyph="oscilloscope" stroke={mono} fill="none" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="100" y="184" width="400" height="232" strokeWidth="2" />
      <path
        data-osc-grid
        d="M100 242H500 M100 300H500 M100 358H500"
        strokeWidth="1"
        strokeDasharray="2 8"
      />
      <path
        data-osc-trace
        d="M116 300H164 L194 258 L226 338 L256 300 L294 220 L330 378 L366 276 L400 300 H484"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      <line data-osc-scan x1="116" y1="194" x2="116" y2="406" strokeWidth="1" strokeDasharray="2 6" />
    </g>
  );
}

function ReconnectBridge({ mono }) {
  return (
    <g data-glyph="reconnectBridge" stroke={mono} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle data-bridge-node cx="196" cy="300" r="68" strokeWidth="2" strokeDasharray="5 8" />
      <circle data-bridge-node cx="404" cy="300" r="68" strokeWidth="2" strokeDasharray="5 8" />
      <path data-bridge-link d="M264 300H336" strokeWidth="3" />
      <path data-bridge-dash d="M232 252L292 290 M368 348L308 310" strokeWidth="1" strokeDasharray="2 6" />
      <circle cx="300" cy="300" r="10" fill={mono} stroke="none" />
    </g>
  );
}

function RadarSector({ mono }) {
  return (
    <g data-glyph="radarSector" stroke={mono} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle data-sector-ring cx="300" cy="300" r="188" strokeWidth="2" />
      <circle data-sector-ring cx="300" cy="300" r="136" strokeWidth="1" strokeDasharray="4 8" />
      <circle data-sector-ring cx="300" cy="300" r="84" strokeWidth="1" strokeDasharray="3 7" />
      <g data-sector-rotor>
        <path data-sector-arm d="M300 300L300 102" strokeWidth="2" />
        <path data-sector-guide d="M300 300A198 198 0 0 1 430 152" strokeWidth="1" strokeDasharray="2 6" />
      </g>
      <circle cx="300" cy="300" r="8" fill={mono} stroke="none" />
    </g>
  );
}

function CompassGrid({ mono }) {
  return (
    <g data-glyph="compassGrid" stroke={mono} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="300" cy="300" r="186" strokeWidth="2" />
      <circle cx="300" cy="300" r="132" strokeWidth="1" strokeDasharray="4 8" />
      <path d="M300 114V486 M114 300H486" strokeWidth="1" strokeDasharray="2 6" />
      <path data-compass-needle d="M300 300L408 214" strokeWidth="3" />
      <path data-compass-tail d="M300 300L234 380" strokeWidth="2" />
      <circle cx="300" cy="300" r="10" fill={mono} stroke="none" />
    </g>
  );
}

function GpsLock({ mono }) {
  return (
    <g data-glyph="gpsLock" stroke={mono} fill="none" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M164 164H230 M370 164H436 M164 436H230 M370 436H436" strokeWidth="2" />
      <path d="M164 164V230 M436 164V230 M164 436V370 M436 436V370" strokeWidth="2" />
      <circle data-gps-ring cx="300" cy="300" r="122" strokeWidth="1" strokeDasharray="3 7" />
      <circle data-gps-ring cx="300" cy="300" r="78" strokeWidth="1" strokeDasharray="2 6" />
      <path d="M300 218V382 M218 300H382" strokeWidth="1" strokeDasharray="2 6" />
      <path data-gps-diamond d="M300 266L334 300L300 334L266 300Z" strokeWidth="2" />
    </g>
  );
}

function MatrixGrid({ mono }) {
  return (
    <g data-glyph="matrixGrid" stroke={mono} fill="none" strokeLinecap="square" strokeLinejoin="miter">
      <path
        data-matrix-lines
        d="M138 186H462 M138 252H462 M138 318H462 M138 384H462 M186 138V462 M252 138V462 M318 138V462 M384 138V462"
        strokeWidth="1"
        strokeDasharray="2 6"
      />
      <g data-matrix-nodes fill={mono} stroke="none">
        <rect x="246" y="246" width="12" height="12" />
        <rect x="312" y="246" width="12" height="12" />
        <rect x="246" y="312" width="12" height="12" />
        <rect x="312" y="312" width="12" height="12" />
      </g>
      <rect x="138" y="138" width="324" height="324" strokeWidth="2" />
    </g>
  );
}

function NetworkMesh({ mono }) {
  return (
    <g data-glyph="networkMesh" stroke={mono} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path
        data-network-links
        d="M146 332L220 208L334 184L446 258L420 392L290 434L182 380Z M220 208L290 434 M334 184L182 380 M446 258L290 434"
        strokeWidth="1.5"
        strokeDasharray="3 7"
      />
      <g data-network-nodes fill={mono} stroke="none">
        <circle cx="146" cy="332" r="7" />
        <circle cx="220" cy="208" r="7" />
        <circle cx="334" cy="184" r="7" />
        <circle cx="446" cy="258" r="7" />
        <circle cx="420" cy="392" r="7" />
        <circle cx="290" cy="434" r="7" />
        <circle cx="182" cy="380" r="7" />
      </g>
    </g>
  );
}

export default function RadarSvg({ className, mono = 'currentColor', variant = 'crosshair' }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {variant === 'quadrants' ? <Quadrants mono={mono} /> : null}
      {variant === 'squares' ? <Squares mono={mono} /> : null}
      {variant === 'crosshair' ? <Crosshair mono={mono} /> : null}
      {variant === 'sun' ? <Sun mono={mono} /> : null}
      {variant === 'diamond' ? <Diamond mono={mono} /> : null}
      {variant === 'updown' ? <UpDown mono={mono} /> : null}
      {variant === 'refresh' ? <Refresh mono={mono} /> : null}
      {variant === 'upload' ? <Upload mono={mono} /> : null}
      {variant === 'sonarWave' ? <SonarWave mono={mono} /> : null}
      {variant === 'oscilloscope' ? <Oscilloscope mono={mono} /> : null}
      {variant === 'reconnectBridge' ? <ReconnectBridge mono={mono} /> : null}
      {variant === 'radarSector' ? <RadarSector mono={mono} /> : null}
      {variant === 'compassGrid' ? <CompassGrid mono={mono} /> : null}
      {variant === 'gpsLock' ? <GpsLock mono={mono} /> : null}
      {variant === 'matrixGrid' ? <MatrixGrid mono={mono} /> : null}
      {variant === 'networkMesh' ? <NetworkMesh mono={mono} /> : null}
    </svg>
  );
}
