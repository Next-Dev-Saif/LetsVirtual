import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { useMMOStore } from '../../store/useMMOStore';
import * as THREE from 'three';

// Flying 3D Egg Projectile with Parabolic Arc & Impact Fragmentation
function FlyingEggProjectile({ splat }) {
  const meshRef = useRef();
  const shardsGroupRef = useRef();

  const { pointsAdded, zoneName, nickname, hitWorldPos } = splat;
  const { camera } = useThree();

  // Trajectory start & target vectors
  const startVector = useMemo(() => {
    return camera.position.clone().add(new THREE.Vector3(0, -0.3, 0));
  }, [camera]);

  const targetVector = useMemo(() => {
    return new THREE.Vector3(...(hitWorldPos || [0, 2.5, 0.05]));
  }, [hitWorldPos]);

  // Trajectory state
  const [isSmashed, setIsSmashed] = useState(false);
  const startTimeRef = useRef(null);
  const smashedRef = useRef(false);

  // Shell Fragment Particles
  const shards = useMemo(() => {
    const s = [];
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.5;
      s.push({
        dir: new THREE.Vector3(Math.cos(angle), Math.random() * 1.5 + 0.2, Math.sin(angle)).normalize(),
        speed,
        scale: 0.06 + Math.random() * 0.08
      });
    }
    return s;
  }, []);

  useFrame(({ clock }, delta) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTimeRef.current;
    const progressVal = elapsed * 3.8; // ~0.26 sec flight time

    if (!smashedRef.current) {
      if (progressVal >= 1.0) {
        smashedRef.current = true;
        setIsSmashed(true);
      } else if (meshRef.current) {
        // Parabolic arc trajectory
        const t = Math.min(1.0, progressVal);
        const currentPos = new THREE.Vector3().lerpVectors(startVector, targetVector, t);
        currentPos.y += Math.sin(t * Math.PI) * 1.2; // Arc curve

        meshRef.current.position.copy(currentPos);
        meshRef.current.rotation.x += delta * 15;
        meshRef.current.rotation.z += delta * 12;
      }
    } else {
      // Smashed impact phase (animate and fade out fragment shards)
      const shardProgress = Math.min(1.5, progressVal - 1.0);
      const fade = Math.max(0, 1 - shardProgress / 1.2);
      if (shardsGroupRef.current) {
        shardsGroupRef.current.children.forEach((child, idx) => {
          const sh = shards[idx];
          if (sh && child) {
            child.position.set(
              sh.dir.x * sh.speed * shardProgress,
              sh.dir.y * sh.speed * shardProgress,
              sh.dir.z * sh.speed * shardProgress
            );
            if (child.material) {
              child.material.opacity = fade;
            }
          }
        });
      }
    }
  });

  const isHeadHit = pointsAdded === 5;
  const isCenterHit = pointsAdded === 3;
  const splatColor = isHeadHit ? '#facc15' : isCenterHit ? '#fb923c' : '#fef08a';

  return (
    <group position={[0, 0, 0]}>
      {/* Flying Egg Mesh */}
      {!isSmashed && (
        <mesh ref={meshRef} position={startVector.toArray()} scale={[0.22, 0.3, 0.22]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {/* Smashed Yolk Decal & Fragments at Impact Site */}
      {isSmashed && (
        <group position={targetVector.toArray()}>
          {/* Yellow Egg Yolk Splat Mesh */}
          <mesh rotation={[0, 0, 0.4]}>
            <circleGeometry args={[isHeadHit ? 0.38 : 0.26, 24]} />
            <meshStandardMaterial
              color={splatColor}
              emissive={splatColor}
              emissiveIntensity={1.8}
              roughness={0.2}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Egg White Runny Ring */}
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[isHeadHit ? 0.52 : 0.38, 24]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.88}
              roughness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Shell Fragment Explosions */}
          <group ref={shardsGroupRef}>
            {shards.map((sh, idx) => (
              <mesh
                key={idx}
                position={[0, 0, 0]}
                scale={[sh.scale, sh.scale, sh.scale]}
              >
                <boxGeometry args={[1, 1, 0.3]} />
                <meshStandardMaterial color="#fef3c7" transparent opacity={1} />
              </mesh>
            ))}
          </group>

          {/* Floating Score Splash Badge */}
          <Html position={[0, 0.45, 0.1]} center pointerEvents="none">
            <div className="flex flex-col items-center animate-[bounce_0.6s_ease-out]">
              <div className="bg-slate-950/95 border-2 border-yellow-400 text-amber-300 font-extrabold px-3.5 py-1 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)] text-xs flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-base font-black text-yellow-400">+{pointsAdded}</span>
                <span className="text-[11px] text-white font-bold">{nickname}</span>
              </div>
              <span className="text-[10px] font-black text-yellow-300 drop-shadow-md tracking-wide mt-0.5">{zoneName}</span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

export function SmashEmTarget() {
  const smashEmState = useMMOStore((state) => state.smashEmState);
  const { status, splats } = smashEmState;
  const meshRef = useRef();

  // Load target picture texture
  const texture = useTexture('/assets/JustMe.jpg');

  if (status !== 'active' && status !== 'counting') return null;

  const handleTargetClick = (e) => {
    if (status !== 'active') return;
    e.stopPropagation();

    const uv = e.uv ? [e.uv.x, e.uv.y] : [0.5, 0.5];
    const point = e.point ? [e.point.x, e.point.y, e.point.z] : [0, 2.8, 0.1];

    import('../../services/socket').then(({ socket }) => {
      socket.emit('smashEmShoot', {
        uv,
        hitWorldPos: point
      });
    });
  };

  return (
    <group position={[0, 2.8, 0]}>
      {/* Outer Wooden/Neon Photo Frame */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[4.4, 5.4, 0.15]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Glowing Neon Frame Edge */}
      <mesh position={[0, 0, 0.08]}>
        <ringGeometry args={[2.2, 2.3, 4]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2} />
      </mesh>

      {/* Target Picture Plane with UV Raycast Handler */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0.09]}
        onClick={handleTargetClick}
        pointerEvents="auto"
      >
        <planeGeometry args={[4.0, 5.0]} />
        <meshStandardMaterial map={texture} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Head Target Bullseye Ring Indicator (top center) */}
      <mesh position={[0, 1.25, 0.1]}>
        <ringGeometry args={[0.35, 0.4, 32]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} side={THREE.DoubleSide} />
      </mesh>

      {/* Fixed Single-Line Target Label Badge */}
      <Html position={[0, 3.1, 0.1]} center pointerEvents="none">
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-rose-500 text-slate-950 font-black text-sm px-6 py-2 rounded-full border-2 border-white shadow-[0_0_30px_rgba(245,158,11,0.7)] tracking-wider uppercase whitespace-nowrap min-w-[340px] text-center flex items-center justify-center gap-2">
          <span>🎯 TARGET:</span>
          <span>SMASH HEAD FOR 5 PTS!</span>
        </div>
      </Html>

      {/* Render 3D Flying Egg Projectiles & Smashed Decals */}
      {splats.map((splat) => (
        <FlyingEggProjectile key={splat.id} splat={splat} />
      ))}
    </group>
  );
}
