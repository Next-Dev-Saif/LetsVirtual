import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { NetworkedPlayers } from './NetworkedPlayers';
import { LocalPlayerController } from './LocalPlayerController';
import { DanceStage } from './DanceStage';
import { SkyFireworks } from './SkyFireworks';
import { CosmicSky } from './CosmicSky';
import { BirthdayDecorations } from './BirthdayDecorations';
import { ConcertShowcase } from './ConcertShowcase';
import { SmashEmTarget } from './SmashEmTarget';
import { useMMOStore } from '../../store/useMMOStore';
import { Suspense, useEffect } from 'react';

export function PartyScene() {
  const concertStatus = useMMOStore((state) => state.concertState.status);
  const smashEmStatus = useMMOStore((state) => state.smashEmState.status);

  // When a blocking overlay (challenge dialog, server full, live concert, or smash winner modal) is active:
  const hasBlockingUI = useMMOStore((state) =>
    !!state.incomingChallenge ||
    !!state.serverFull ||
    state.concertState.status === 'active' ||
    state.smashEmState.status === 'winner'
  );

  // Suppress the "pointer lock cannot be acquired immediately after exit" browser
  // error that Three.js sometimes triggers during the transition.
  useEffect(() => {
    const suppress = (e) => e.preventDefault();
    document.addEventListener('pointerlockerror', suppress);
    return () => document.removeEventListener('pointerlockerror', suppress);
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full z-0"
      style={{ pointerEvents: hasBlockingUI ? 'none' : 'auto' }}
    >
      <Canvas shadows camera={{ position: [0, 5, 15], fov: 60 }}>
        <Suspense fallback={null}>
          {/* Horizon Atmospheric Fog & GPU Cosmic Sky Dome */}
          <fogExp2 attach="fog" color="#080417" density={0.003} />
          <Stars radius={160} depth={90} count={6000} factor={4} saturation={0.2} fade speed={0.5} />
          <CosmicSky />
          <Environment preset="night" />

          {/* Lighting */}
          <ambientLight intensity={0.3} color="#1a1040" />
          <directionalLight
            position={[10, 20, 10]}
            intensity={0.6}
            color="#7c60e0"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* World */}
          <DanceStage />
          <BirthdayDecorations />
          <NetworkedPlayers />
          <LocalPlayerController />
          <SkyFireworks />

          {/* Live 3D Concert Showcase & Smash Em Target */}
          <ConcertShowcase />
          <SmashEmTarget />

          <EffectComposer>
            <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.85} height={300} intensity={1.8} />
            <Vignette eskil={false} offset={0.15} darkness={1.3} />
          </EffectComposer>
        </Suspense>

        {/* Unmount PointerLockControls entirely when a blocking overlay or live concert is active. */}
        {!hasBlockingUI && (
          <PointerLockControls
            maxPolarAngle={Math.PI / 2 - 0.05}
            minPolarAngle={0.1}
          />
        )}
      </Canvas>
    </div>
  );
}
