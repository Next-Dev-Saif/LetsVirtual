import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMMOStore } from '../../store/useMMOStore';

// Preload EngineQueen model
useGLTF.preload('/assets/EngineQueen.glb');

// Single Audience Reaction Effect Element
function AudienceVFXInstance({ effect, onComplete }) {
  const groupRef = useRef();
  const textRef = useRef();
  const ringRef = useRef();
  const particlesGroupRef = useRef();

  const startTimeRef = useRef(null);
  const completedRef = useRef(false);

  const particles = useMemo(() => {
    const p = [];
    const count = effect.actionType === 'fireworks' ? 35 : (effect.actionType === 'hearts' ? 25 : 18);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 2.5 + Math.random() * 4.5;
      p.push({
        dir: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.abs(Math.cos(phi)) + 0.3,
          Math.sin(phi) * Math.sin(theta)
        ).normalize(),
        speed,
        scale: 0.12 + Math.random() * 0.22,
      });
    }
    return p;
  }, [effect.actionType]);

  useFrame(({ clock }) => {
    if (completedRef.current) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTimeRef.current;
    const progressVal = elapsed * 1.4;

    if (progressVal >= 1.6) {
      completedRef.current = true;
      queueMicrotask(() => {
        onComplete(effect.id);
      });
      return;
    }

    const opacity = Math.max(0, 1 - progressVal / 1.6);

    // Update floating action text height
    if (textRef.current) {
      textRef.current.position.y = 2.2 + progressVal * 1.8;
    }

    // Update 3D Wave Ring
    if (groupRef.current && effect.actionType === 'wave') {
      const scale = 1 + progressVal * 10;
      groupRef.current.scale.set(scale, 1, scale);
      if (ringRef.current) {
        ringRef.current.material.opacity = opacity;
      }
    }

    // Update Burst Particles
    if (particlesGroupRef.current && effect.actionType !== 'wave') {
      particlesGroupRef.current.children.forEach((child, idx) => {
        const pt = particles[idx];
        if (pt && child) {
          child.position.set(
            pt.dir.x * pt.speed * progressVal,
            pt.dir.y * pt.speed * progressVal,
            pt.dir.z * pt.speed * progressVal
          );
          if (child.material) {
            child.material.opacity = opacity;
          }
        }
      });
    }
  });

  const getColor = () => {
    switch (effect.actionType) {
      case 'wave': return '#c084fc';
      case 'cheer': return '#f59e0b';
      case 'fireworks': return '#06b6d4';
      case 'hearts': return '#f43f5e';
      default: return '#ffffff';
    }
  };

  const getLabel = () => {
    switch (effect.actionType) {
      case 'wave': return `👋 ${effect.nickname} waved!`;
      case 'cheer': return `👏 ${effect.nickname} cheered!`;
      case 'fireworks': return `✨ ${effect.nickname} launched fireworks!`;
      case 'hearts': return `💖 ${effect.nickname} sent love!`;
      default: return `🎉 ${effect.nickname}`;
    }
  };

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      {/* Floating Action Text Badge */}
      <group ref={textRef} position={[0, 2.2, 0]}>
        <Html center pointerEvents="none">
          <div className="flex items-center gap-2 bg-slate-950/90 text-white px-4 py-1.5 rounded-full border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.5)] backdrop-blur-md animate-bounce whitespace-nowrap">
            <span className="text-xs font-black text-amber-300 tracking-wide">{getLabel()}</span>
          </div>
        </Html>
      </group>

      {/* 3D Wave Ring */}
      {effect.actionType === 'wave' && (
        <group position={[0, -1, 0]}>
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1.3, 32]} />
            <meshStandardMaterial
              color={getColor()}
              emissive={getColor()}
              emissiveIntensity={4}
              transparent
              opacity={1}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Burst Particles for Fireworks / Cheer / Hearts */}
      {effect.actionType !== 'wave' && (
        <group ref={particlesGroupRef}>
          {particles.map((pt, idx) => (
            <mesh key={idx} position={[0, 0, 0]}>
              <sphereGeometry args={[pt.scale, 12, 12]} />
              <meshStandardMaterial
                color={getColor()}
                emissive={getColor()}
                emissiveIntensity={4.5}
                transparent
                opacity={1}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// Smooth Procedural Glowing Stage Particles using Three.js Points
function StageGlowingParticles() {
  const count = 60;
  const pointsRef = useRef();

  const [positions, initialAngles, radii, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const rads = new Float32Array(count);
    const spds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      rads[i] = 1.5 + Math.random() * 2.0;
      spds[i] = 0.4 + Math.random() * 0.8;

      pos[i * 3] = Math.cos(angles[i]) * rads[i];
      pos[i * 3 + 1] = (i / count) * 4.5;
      pos[i * 3 + 2] = Math.sin(angles[i]) * rads[i];
    }
    return [pos, angles, rads, spds];
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array;

    for (let i = 0; i < count; i++) {
      const angle = initialAngles[i] + t * speeds[i] * 0.4;
      const currentRadius = radii[i] + Math.sin(t * 1.5 + i) * 0.15;
      const currentY = ((i / count) * 4.5 + t * 0.5) % 4.5;

      arr[i * 3] = Math.cos(angle) * currentRadius;
      arr[i * 3 + 1] = currentY;
      arr[i * 3 + 2] = Math.sin(angle) * currentRadius;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#c084fc"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Stage Dynamic Concert Spotlights
function StageSpotlights() {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.6;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <spotLight
        position={[6, 8, 6]}
        target-position={[0, 2.2, 0]}
        color="#a855f7"
        intensity={35}
        angle={0.4}
        penumbra={0.8}
        castShadow
      />
      <spotLight
        position={[-6, 8, -6]}
        target-position={[0, 2.2, 0]}
        color="#06b6d4"
        intensity={35}
        angle={0.4}
        penumbra={0.8}
        castShadow
      />
      <spotLight
        position={[-6, 8, 6]}
        target-position={[0, 2.2, 0]}
        color="#ec4899"
        intensity={35}
        angle={0.4}
        penumbra={0.8}
        castShadow
      />
      <spotLight
        position={[6, 8, -6]}
        target-position={[0, 2.2, 0]}
        color="#f59e0b"
        intensity={35}
        angle={0.4}
        penumbra={0.8}
        castShadow
      />
    </group>
  );
}

// Advanced Multi-Motion Cinematic Camera Rig: Dolly Zoom In / Out, Up / Down Crane, & Orbit
function DollyZoomCameraRig({ active }) {
  const { camera } = useThree();

  useFrame(({ clock }, delta) => {
    if (!active) return;

    const t = clock.elapsedTime;
    const targetCenter = new THREE.Vector3(0, 2.2, 0);

    // Multi-phase camera choreography:
    // Phase 1 (0s - 20s): Dolly Zoom In + Crane Up
    // Phase 2 (20s - 40s): Dolly Zoom Out + Crane Down (Low angle sweep)
    // Phase 3 (40s - 60s): Oscillating Dolly Zoom Spiral Orbit
    const cycle = (t % 60) / 60; // 0 to 1 over 60 seconds

    let minFOV = 30;
    let maxFOV = 75;
    let currentFOV = 50;
    let heightOffset = 2.2;
    let orbitSpeed = 0.35;

    if (cycle < 0.33) {
      // Phase 1: Dolly In (FOV contracts 70 -> 32) + Upward Crane (Height 1.5 -> 3.8)
      const p = cycle / 0.33;
      currentFOV = THREE.MathUtils.lerp(70, 32, Math.sin(p * Math.PI / 2));
      heightOffset = THREE.MathUtils.lerp(1.5, 3.8, p);
      orbitSpeed = 0.3;
    } else if (cycle < 0.66) {
      // Phase 2: Dolly Out (FOV expands 32 -> 78) + Low Angle Crane Down (Height 3.8 -> 1.0)
      const p = (cycle - 0.33) / 0.33;
      currentFOV = THREE.MathUtils.lerp(32, 78, Math.sin(p * Math.PI / 2));
      heightOffset = THREE.MathUtils.lerp(3.8, 1.0, p);
      orbitSpeed = -0.4; // reverse orbit direction
    } else {
      // Phase 3: Continuous Oscillating Dolly Zoom In/Out + Dynamic Wave Crane & Fast Orbit
      const p = (cycle - 0.66) / 0.34;
      const wave = (Math.sin(p * Math.PI * 4) + 1) * 0.5;
      currentFOV = minFOV + wave * (maxFOV - minFOV);
      heightOffset = 2.2 + Math.sin(p * Math.PI * 3) * 1.4;
      orbitSpeed = 0.5;
    }

    // Invert FOV to Distance for Dolly Zoom Vertigo Effect
    const baseTargetHeight = 3.8;
    const desiredDistance = baseTargetHeight / (2 * Math.tan((currentFOV * Math.PI) / 360));

    // Orbital yaw rotation around performer
    const angle = t * orbitSpeed;

    const camX = Math.sin(angle) * desiredDistance;
    const camZ = Math.cos(angle) * desiredDistance;
    const camY = heightOffset;

    const targetCamPos = new THREE.Vector3(camX, camY, camZ);

    // Apply FOV and projection matrix update
    camera.fov = THREE.MathUtils.lerp(camera.fov, currentFOV, delta * 6);
    camera.updateProjectionMatrix();

    // Smooth camera position interpolation
    camera.position.lerp(targetCamPos, delta * 6);
    camera.lookAt(targetCenter);
  });

  return null;
}

// Main Concert Showcase Component
export function ConcertShowcase() {
  const concertState = useMMOStore((state) => state.concertState);
  const activeAudienceVFX = useMMOStore((state) => state.concertState.activeAudienceVFX);
  const removeAudienceVFX = useMMOStore((state) => state.removeAudienceVFX);

  const isActive = concertState.status === 'active';
  const modelName = concertState.model || 'EngineQueen.glb';

  const groupRef = useRef();
  const { scene, animations } = useGLTF(`/assets/${modelName}`);
  const { actions } = useAnimations(animations, groupRef);

  // Play dance animation when concert is active
  useEffect(() => {
    if (!isActive || !actions || Object.keys(actions).length === 0) return;

    // Try finding dance animation
    const danceKey = actions['Dance'] ? 'Dance' : (actions['Dance2'] ? 'Dance2' : Object.keys(actions)[0]);
    const action = actions[danceKey];

    if (action) {
      action.reset().fadeIn(0.5).play();
      return () => {
        action.fadeOut(0.5);
      };
    }
  }, [actions, isActive]);

  // Do not render concert performer or stage VFX until the concert has started!
  if (!isActive) return null;

  return (
    <group position={[0, 0.05, 0]}>
      {/* Stage Performer Model (Scaled Up) */}
      <group ref={groupRef} dispose={null}>
        <primitive object={scene} scale={2.2} />
      </group>

      {/* Stage VFX & Spotlights */}
      <StageGlowingParticles />
      <StageSpotlights />

      {/* Live Audience Reaction Effects */}
      {activeAudienceVFX.map((vfx) => (
        <AudienceVFXInstance key={vfx.id} effect={vfx} onComplete={removeAudienceVFX} />
      ))}

      {/* Dolly Zoom Camera Controller */}
      <DollyZoomCameraRig active={isActive} />
    </group>
  );
}
