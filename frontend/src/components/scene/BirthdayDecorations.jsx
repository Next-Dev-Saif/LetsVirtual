import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Single Balloon ─────────────────────────────────────────────────────────────
const BALLOON_COLORS = [
  '#ff2266', '#ff8800', '#ffdd00',
  '#00ccff', '#aa44ff', '#00ee88',
];

function Balloon({ position, color, phaseOffset }) {
  const groupRef = useRef();
  const shineRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime + phaseOffset;
    // Gentle vertical float + subtle horizontal sway
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.8;
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.06;
    // Shine shimmer
    if (shineRef.current) {
      shineRef.current.material.opacity = 0.2 + Math.sin(t * 1.2) * 0.1;
    }
  });

  const balloonColor = useMemo(() => new THREE.Color(color), [color]);
  const shineColor = useMemo(() => new THREE.Color('#ffffff'), []);

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      {/* Main balloon body */}
      <mesh castShadow>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial
          color={balloonColor}
          emissive={balloonColor}
          emissiveIntensity={0.25}
          roughness={0.15}
          metalness={0.05}
        />
      </mesh>

      {/* Specular shine spot — tiny offset sphere */}
      <mesh ref={shineRef} position={[-0.2, 0.28, 0.55]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial
          color={shineColor}
          transparent
          opacity={0.25}
          roughness={0}
          metalness={0}
        />
      </mesh>

      {/* Knot at the bottom */}
      <mesh position={[0, -0.75, 0]}>
        <sphereGeometry args={[0.09, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>

      {/* String — thin cylinder from knot down */}
      <mesh position={[0, -0.75 - 1.5, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 3, 4]} />
        <meshStandardMaterial color="#cccccc" roughness={1} />
      </mesh>

      {/* Subtle inner glow light */}
      <pointLight color={color} intensity={2} distance={5} decay={2} />
    </group>
  );
}

// ── Balloon Cluster ─────────────────────────────────────────────────────────────
// Keep total balloon count low (7) to stay performant
const BALLOON_CONFIG = [
  // [x, y, z, colorIndex, phaseOffset]
  // Spread around the scene at mid-high altitude so they're in the sky
  [-18, 18, -8, 0, 0.0],
  [22, 22, -12, 1, 1.3],
  [-5, 26, -20, 2, 2.1],
  [14, 15, 6, 3, 0.7],
  [-25, 20, 14, 4, 1.8],
  [0, 30, -35, 5, 3.0],
  [30, 24, 0, 0, 0.4],
];

// ── Hanging String Lights (single Points mesh — one draw call) ─────────────────
function StringLights() {
  const count = 80;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Two arcing strings from (-15, 10) to (15, 10) and (-15,10) to (0,12)
      const t = i / count;
      arr[i * 3] = -15 + t * 30 + Math.sin(t * Math.PI * 4) * 1.5;
      arr[i * 3 + 1] = 8 - Math.sin(t * Math.PI) * 3;   // catenary dip
      arr[i * 3 + 2] = -2 + Math.cos(t * Math.PI * 2) * 1;
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const palette = [
      [1.0, 0.9, 0.3],
      [1.0, 0.5, 0.2],
      [0.4, 0.8, 1.0],
      [1.0, 0.3, 0.6],
    ];
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = palette[i % palette.length];
      arr[i * 3] = c[0];
      arr[i * 3 + 1] = c[1];
      arr[i * 3 + 2] = c[2];
    }
    return arr;
  }, []);

  // Sprite texture — same soft circle approach
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.35}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        map={tex}
        alphaMap={tex}
        alphaTest={0.001}
      />
    </points>
  );
}

// ── Confetti Arch ──────────────────────────────────────────────────────────────
// Scattered thin planes along an arc above the stage entrance — one mesh each (12 total)
const CONFETTI_COLORS = ['#ff2266', '#ff8800', '#ffdd00', '#00ccff', '#aa44ff', '#00ee88'];

function ConfettiArch({ centerX = 0, centerZ = -12, radius = 8, count = 14 }) {
  const [pieces] = useState(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1); // 0..1
      const angle = Math.PI + t * Math.PI; // arc from left to right
      return {
        x: centerX + Math.cos(angle) * radius,
        y: 4 + Math.sin(t * Math.PI) * 5, // rises to a peak
        z: centerZ,
        rotX: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        scale: 0.25 + Math.random() * 0.35,
        phaseOff: Math.random() * Math.PI * 2,
      };
    });
  });

  const refs = useRef([]);

  useFrame(({ clock }) => {
    pieces.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      const t = clock.elapsedTime * 0.8 + p.phaseOff;
      m.position.y = p.y + Math.sin(t) * 0.4;
      m.rotation.y = clock.elapsedTime * 0.6 + p.phaseOff;
      m.rotation.x = p.rotX + Math.sin(t * 0.7) * 0.3;
    });
  });

  return (
    <group>
      {pieces.map((p, i) => (
        <mesh
          key={i}
          ref={el => (refs.current[i] = el)}
          position={[p.x, p.y, p.z]}
          rotation={[p.rotX, 0, p.rotZ]}
          scale={p.scale}
        >
          <planeGeometry args={[1, 0.5]} />
          <meshStandardMaterial
            color={p.color}
            emissive={p.color}
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Birthday Stars ──────────────────────────────────────────────────────────────
// A handful of glowing 5-pointed star shapes using a points + sprite approach
function BirthdayStars() {
  const starPositions = useMemo(() => [
    [18, 12, -3],
    [-16, 14, 5],
    [6, 18, -15],
    [-22, 10, 12],
    [24, 9, -8],
    [0, 20, -22],
  ], []);

  const refs = useRef([]);

  useFrame(({ clock }) => {
    starPositions.forEach((_, i) => {
      const m = refs.current[i];
      if (!m) return;
      const t = clock.elapsedTime * 0.5 + i * 1.1;
      m.rotation.z = t;
      m.scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 1.3 + i) * 0.12);
    });
  });

  // Build a simple star outline using a torus (thin ring = star visual when combined with bloom)
  return (
    <group>
      {starPositions.map(([x, y, z], i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <group key={i} position={[x, y, z]} ref={el => (refs.current[i] = el)}>
            {/* Outer ring */}
            <mesh>
              <torusGeometry args={[0.55, 0.06, 6, 5]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>
            {/* Inner small sphere core */}
            <mesh>
              <sphereGeometry args={[0.18, 8, 6]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
            </mesh>
            <pointLight color={color} intensity={3} distance={8} decay={2} />
          </group>
        );
      })}
    </group>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function BirthdayDecorations() {
  return (
    <group>
      {/* 7 Balloons spread around mid-sky */}
      {BALLOON_CONFIG.map(([x, y, z, ci, phase], i) => (
        <Balloon
          key={i}
          position={[x, y, z]}
          color={BALLOON_COLORS[ci]}
          phaseOffset={phase}
        />
      ))}






      {/* Glowing birthday star ornaments floating in the mid-sky */}
      <BirthdayStars />
    </group>
  );
}

