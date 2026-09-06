import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Music, Swords, Disc, Heart } from 'lucide-react';

// Animated tile that pulses with color
function DanceTile({ position, baseColor, delay }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.elapsedTime + delay) * 0.8;
    const pulse = (Math.sin(t) + 1) * 0.5;
    meshRef.current.material.emissiveIntensity = pulse * 0.6;
  });

  return (
    <mesh ref={meshRef} position={position} receiveShadow>
      <boxGeometry args={[2.9, 0.05, 2.9]} />
      <meshStandardMaterial
        color="#0a0a18"
        emissive={baseColor}
        emissiveIntensity={0.25}
        roughness={0.05}
        metalness={0.9}
      />
    </mesh>
  );
}

// Glowing edge strip
function EdgeStrip({ position, rotation, color, length }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 1.5;
    ref.current.material.emissiveIntensity = (Math.sin(t) + 1) * 0.8 + 0.4;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.08, 0.12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
    </mesh>
  );
}

// ── 3D DEDICATED STRUCTURE 1: Dance Hotspot Podium ───────────────────────────
function DancePodium3D({ position }) {
  const towersRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (towersRef.current) {
      towersRef.current.children.forEach((child, i) => {
        child.scale.y = 1 + Math.sin(t * 4 + i) * 0.5;
      });
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.material.emissiveIntensity = (Math.sin(t * 3) + 1) * 1.2 + 0.6;
    }
  });

  return (
    <group position={position}>
      {/* Tiered Hexagonal Stage Base */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.4, 3.8, 0.24, 6]} />
        <meshStandardMaterial color="#1e0b36" emissive="#581c87" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.28, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.8, 3.2, 0.12, 6]} />
        <meshStandardMaterial color="#3b0764" emissive="#a855f7" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rotating Emissive Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.35, 0]}>
        <ringGeometry args={[2.5, 2.9, 32]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={1.5} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* 4 Neon Audio Equalizer Towers */}
      <group ref={towersRef} position={[0, 0.35, 0]}>
        {[[-2, 0, -2], [2, 0, -2], [-2, 0, 2], [2, 0, 2]].map((pos, idx) => (
          <mesh key={idx} position={[pos[0], 0.8, pos[2]]}>
            <boxGeometry args={[0.3, 1.6, 0.3]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.8} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Floating 3D Title Badge */}
      <Html position={[0, 2.8, 0]} center pointerEvents="none">
        <div className="flex items-center gap-2 bg-slate-950/90 border border-purple-500/50 px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.5)] backdrop-blur-md animate-bounce whitespace-nowrap">
          <Music className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-black text-purple-200 tracking-wider">DANCE ZONE</span>
        </div>
      </Html>
      <pointLight color="#a855f7" intensity={12} distance={15} position={[0, 2, 0]} />
    </group>
  );
}

// ── 3D DEDICATED STRUCTURE 2: Battle Arena Ring ─────────────────────────────
function BattleRing3D({ position }) {
  const bladesGroupRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (bladesGroupRef.current) {
      bladesGroupRef.current.rotation.y = t * 1.2;
    }
    if (ringRef.current) {
      ringRef.current.material.emissiveIntensity = (Math.sin(t * 5) + 1) * 1.5 + 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Octagonal Combat Platform */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.4, 3.8, 0.24, 8]} />
        <meshStandardMaterial color="#2a080c" emissive="#991b1b" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Red Warning Border Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]}>
        <ringGeometry args={[2.6, 3.1, 8]} />
        <meshStandardMaterial color="#f43f5e" emissive="#ef4444" emissiveIntensity={1.8} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Crossed Energy Blades Emblem */}
      <group ref={bladesGroupRef} position={[0, 1.4, 0]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 3.2, 8]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={3} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 3.2, 8]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={3} />
        </mesh>
      </group>

      {/* Floating 3D Title Badge */}
      <Html position={[0, 3.1, 0]} center pointerEvents="none">
        <div className="flex items-center gap-2 bg-slate-950/90 border border-rose-500/50 px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(244,63,94,0.5)] backdrop-blur-md animate-bounce whitespace-nowrap">
          <Swords className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-black text-rose-200 tracking-wider">1v1 BATTLE ARENA</span>
        </div>
      </Html>
      <pointLight color="#ef4444" intensity={14} distance={15} position={[0, 2, 0]} />
    </group>
  );
}

// ── 3D DEDICATED STRUCTURE 3: Cyber Jukebox Console ─────────────────────────
function JukeboxConsole3D({ position }) {
  const reelsGroupRef = useRef();
  const speakerRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (reelsGroupRef.current) {
      reelsGroupRef.current.children.forEach((reel) => {
        reel.rotation.z = t * 3.5;
      });
    }
    if (speakerRef.current) {
      speakerRef.current.material.emissiveIntensity = (Math.sin(t * 4) + 1) * 1.2 + 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Base Stand */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.4, 0.4, 16]} />
        <meshStandardMaterial color="#0b0f19" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Main Jukebox Cabinet */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.2, 2.4, 1.2]} />
        <meshStandardMaterial color="#1e1b4b" emissive="#3730a3" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Front Glowing Speaker Mesh */}
      <mesh ref={speakerRef} position={[0, 1.2, 0.62]}>
        <boxGeometry args={[1.7, 1.1, 0.05]} />
        <meshStandardMaterial color="#6366f1" emissive="#818cf8" emissiveIntensity={1.5} />
      </mesh>

      {/* Spinning Tape Cassette Reels */}
      <group ref={reelsGroupRef} position={[0, 2.2, 0.62]}>
        <mesh position={[-0.45, 0, 0]}>
          <torusGeometry args={[0.3, 0.07, 16, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.45, 0, 0]}>
          <torusGeometry args={[0.3, 0.07, 16, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Floating 3D Title Badge */}
      <Html position={[0, 3.2, 0]} center pointerEvents="none">
        <div className="flex items-center gap-2 bg-slate-950/90 border border-indigo-500/50 px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(99,102,241,0.5)] backdrop-blur-md animate-bounce whitespace-nowrap">
          <Disc className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs font-black text-indigo-200 tracking-wider">CYBER JUKEBOX</span>
        </div>
      </Html>
      <pointLight color="#6366f1" intensity={14} distance={15} position={[0, 2, 0]} />
    </group>
  );
}

// ── 3D DEDICATED STRUCTURE 4: Birthday Wish Card Desk ───────────────────────
function WishCardDesk3D({ position }) {
  const heartRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (heartRef.current) {
      heartRef.current.rotation.y = t * 1.5;
      heartRef.current.position.y = 1.8 + Math.sin(t * 2) * 0.15;
      heartRef.current.material.emissiveIntensity = (Math.sin(t * 3) + 1) * 1.5 + 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Base Pedestal */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.2, 0.4, 16]} />
        <meshStandardMaterial color="#1a1104" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Wish Desk Console */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.6, 1.2, 16]} />
        <meshStandardMaterial color="#451a03" emissive="#78350f" emissiveIntensity={0.4} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Floating Glowing Crystal Heart Centerpiece */}
      <mesh ref={heartRef} position={[0, 1.8, 0]}>
        <octahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} roughness={0.1} />
      </mesh>

      {/* Floating 3D Title Badge */}
      <Html position={[0, 3.0, 0]} center pointerEvents="none">
        <div className="flex items-center gap-2 bg-slate-950/90 border border-amber-500/50 px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.5)] backdrop-blur-md animate-bounce whitespace-nowrap">
          <Heart className="w-4 h-4 text-amber-400 fill-amber-400/30" />
          <span className="text-xs font-black text-amber-200 tracking-wider">BIRTHDAY WISH BOX</span>
        </div>
      </Html>
      <pointLight color="#f59e0b" intensity={14} distance={15} position={[0, 2, 0]} />
    </group>
  );
}

const TILE_COLORS = ['#5b21b6', '#7c3aed', '#4f46e5', '#1d4ed8', '#0891b2', '#7c3aed'];

// ── MAIN DANCE STAGE COMPONENT ────────────────────────────────────────────────
export function DanceStage() {
  const cols = 20;
  const rows = 20;
  const tileSize = 3;

  const tiles = useMemo(() => {
    const result = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = TILE_COLORS[(r + c) % TILE_COLORS.length];
        result.push({
          key: `${r}-${c}`,
          position: [
            (c - cols / 2 + 0.5) * tileSize,
            -0.025,
            (r - rows / 2 + 0.5) * tileSize
          ],
          color,
          delay: (r + c) * 0.2
        });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {/* Surrounding Infinite Dark Floor Extending Toward Horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#03030c" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* Extended 20x20 Tiled Dance Floor Grid */}
      {tiles.map((t) => (
        <DanceTile key={t.key} position={t.position} baseColor={t.color} delay={t.delay} />
      ))}

      {/* Extended Perimeter Edge Lighting Strips (60 Units Length) */}
      <EdgeStrip position={[0, 0.02, 30]} rotation={[0, 0, 0]} color="#a855f7" length={60} />
      <EdgeStrip position={[0, 0.02, -30]} rotation={[0, 0, 0]} color="#a855f7" length={60} />
      <EdgeStrip position={[30, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} color="#6366f1" length={60} />
      <EdgeStrip position={[-30, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} color="#6366f1" length={60} />

      {/* 4 Dedicated 3D Interactive Hotspot Monuments */}
      <DancePodium3D position={[10, 0, 10]} />
      <BattleRing3D position={[-10, 0, 10]} />
      <JukeboxConsole3D position={[10, 0, -10]} />
      <WishCardDesk3D position={[-10, 0, -10]} />

      {/* Central Stage Spotlight Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[5, 64]} />
        <meshStandardMaterial
          color="#4f46e5"
          emissive="#4f46e5"
          emissiveIntensity={0.08}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Stage Spotlights */}
      <pointLight color="#a855f7" intensity={25} distance={45} position={[0, 18, 0]} />
      <pointLight color="#3b82f6" intensity={15} distance={50} position={[-18, 15, -10]} />
      <pointLight color="#ec4899" intensity={15} distance={50} position={[18, 15, -10]} />
    </group>
  );
}

