import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FIREWORK_COUNT = 12;
const PARTICLES_PER_FIREWORK = 150;
const TOTAL_PARTICLES = FIREWORK_COUNT * PARTICLES_PER_FIREWORK;

// Spread launch points evenly around a 360° ring so fireworks are
// visible from any camera direction
const FIREWORK_CONFIGS = Array.from({ length: FIREWORK_COUNT }, (_, i) => {
  const angle  = (i / FIREWORK_COUNT) * Math.PI * 2;
  const radius = 50 + Math.random() * 30;           // 50–80 units out
  const colors = [
    '#ff0088', '#00cfff', '#ffcc00', '#ff4400',
    '#aa00ff', '#00ff88', '#ff6688', '#88eeff',
    '#ff8800', '#cc00ff', '#00ffcc', '#ff2200',
  ];
  return {
    launchX: Math.cos(angle) * radius,
    launchZ: Math.sin(angle) * radius,
    color: new THREE.Color(colors[i % colors.length]),
  };
});

function randomBurstAlt() { return 40 + Math.random() * 35; } // 40–75 high

export function SkyFireworks() {
  const pointsRef = useRef();

  // Procedurally generated soft glow sprite — no external file needed
  const spriteTex = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const half = size / 2;

    // Outer soft halo
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.15, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4,  'rgba(255,255,255,0.5)');
    grad.addColorStop(0.7,  'rgba(255,255,255,0.15)');
    grad.addColorStop(1,    'rgba(255,255,255,0)');

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Bright core pinpoint
    const core = ctx.createRadialGradient(half, half, 0, half, half, half * 0.08);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(half, half, half * 0.08, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  const positions  = useMemo(() => new Float32Array(TOTAL_PARTICLES * 3), []);
  const colors     = useMemo(() => new Float32Array(TOTAL_PARTICLES * 3), []);
  const velocities = useMemo(() => new Float32Array(TOTAL_PARTICLES * 3), []);
  const lifetimes  = useMemo(() => new Float32Array(TOTAL_PARTICLES),     []);

  // Per-firework mutable state (not React state — updated every frame)
  const fwState = useMemo(() => FIREWORK_CONFIGS.map((cfg, i) => ({
    cfg,
    phase:    'waiting',
    countdown: i * 0.7,           // stagger start times
    burstAlt:  randomBurstAlt(),
    rocketY:   0,
    baseIdx:   i * PARTICLES_PER_FIREWORK,
  })), []);

  // Hide all particles initially
  useMemo(() => {
    for (let i = 0; i < TOTAL_PARTICLES * 3; i++) positions[i] = 9999;
  }, [positions]);

  const burst = useCallback((fw) => {
    fw.phase   = 'burst';
    fw.countdown = 0;
    const { cfg, baseIdx } = fw;
    for (let p = 0; p < PARTICLES_PER_FIREWORK; p++) {
      const idx = (baseIdx + p) * 3;
      positions[idx]     = cfg.launchX;
      positions[idx + 1] = fw.burstAlt;
      positions[idx + 2] = cfg.launchZ;

      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const spd   = 0.18 + Math.random() * 0.42;
      velocities[idx]     = spd * Math.sin(phi) * Math.cos(theta);
      velocities[idx + 1] = spd * Math.sin(phi) * Math.sin(theta) * 0.65;
      velocities[idx + 2] = spd * Math.cos(phi);

      // Bright vertex colour for additive bloom
      colors[idx]     = cfg.color.r * 3;
      colors[idx + 1] = cfg.color.g * 3;
      colors[idx + 2] = cfg.color.b * 3;
      lifetimes[baseIdx + p] = 1;
    }
  }, [positions, velocities, colors, lifetimes]);

  const hide = useCallback((fw) => {
    fw.phase     = 'waiting';
    fw.countdown = 1.5 + Math.random() * 2.5;    // 1.5–4 s gap, nearly continuous
    fw.burstAlt  = randomBurstAlt();
    fw.rocketY   = 0;
    for (let p = 0; p < PARTICLES_PER_FIREWORK; p++) {
      const idx = (fw.baseIdx + p) * 3;
      positions[idx] = positions[idx + 1] = positions[idx + 2] = 9999;
      lifetimes[fw.baseIdx + p] = 0;
    }
  }, [positions, lifetimes]);

  useFrame((_, delta) => {
    const geo = pointsRef.current?.geometry;
    if (!geo) return;

    for (const fw of fwState) {

      if (fw.phase === 'waiting') {
        fw.countdown -= delta;
        if (fw.countdown <= 0) {
          fw.phase    = 'rising';
          fw.rocketY  = 0;
        }

      } else if (fw.phase === 'rising') {
        fw.rocketY += delta * 28;           // rocket speed
        // Show a single bright spark rising
        const idx = fw.baseIdx * 3;
        positions[idx]     = fw.cfg.launchX;
        positions[idx + 1] = fw.rocketY;
        positions[idx + 2] = fw.cfg.launchZ;
        if (fw.rocketY >= fw.burstAlt) burst(fw);

      } else if (fw.phase === 'burst') {
        fw.countdown += delta;              // reuse as life timer
        const fade = Math.max(0, 1 - fw.countdown / 2.2);

        for (let p = 0; p < PARTICLES_PER_FIREWORK; p++) {
          const pidx = (fw.baseIdx + p) * 3;
          velocities[pidx + 1] -= delta * 0.55;   // gravity
          positions[pidx]     += velocities[pidx]     * delta * 55;
          positions[pidx + 1] += velocities[pidx + 1] * delta * 55;
          positions[pidx + 2] += velocities[pidx + 2] * delta * 55;
          lifetimes[fw.baseIdx + p] = fade;

          // Dim colour as it fades
          const cidx = (fw.baseIdx + p) * 3;
          colors[cidx]     = fw.cfg.color.r * 3 * fade;
          colors[cidx + 1] = fw.cfg.color.g * 3 * fade;
          colors[cidx + 2] = fw.cfg.color.b * 3 * fade;
        }

        if (fw.countdown > 2.2) hide(fw);
      }
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate    = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TOTAL_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={TOTAL_PARTICLES}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.2}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        map={spriteTex}
        alphaMap={spriteTex}
        alphaTest={0.001}
      />
    </points>
  );
}
