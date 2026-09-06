import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useMMOStore } from '../../store/useMMOStore';

export function Avatar({ id, modelName, position, rotation, state, isLocal, nickname }) {
  const group = useRef();
  
  const { scene, animations } = useGLTF(`/assets/${modelName}`);
  
  // Clone the scene so multiple players can use the same avatar model without stealing the object reference
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, group);

  // Smooth interpolation for remote players, exact copy for local player
  useFrame((state, delta) => {
    if (group.current) {
      if (isLocal) {
        // High-frequency local update directly from the store ref without React re-rendering
        const localState = useMMOStore.getState().localPlayerState;
        group.current.position.set(...localState.position);
        group.current.rotation.set(...localState.rotation);
      } else {
        // Interpolate position
        const targetPos = new THREE.Vector3(...position);
        group.current.position.lerp(targetPos, delta * 15);
        
        // Interpolate rotation
        const targetRot = new THREE.Euler(...rotation);
        const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
        group.current.quaternion.slerp(targetQuat, delta * 15);
      }
    }
  });

  useEffect(() => {
    // Play the animation matching the state
    if (actions && Object.keys(actions).length > 0) {
      // Try to find the exact action, or default to Idle or the first available action
      const actionName = actions[state] ? state : Object.keys(actions)[0];
      const action = actions[actionName];
      if (action) {
        action.reset().fadeIn(0.2).play();
        return () => {
          action.fadeOut(0.2);
        };
      }
    }
  }, [state, actions]);

  return (
    <group ref={group} dispose={null}>
      <Billboard position={[0, 2.2, 0]}>
        <Text 
          fontSize={0.2}
          color="white"
          outlineWidth={0.02}
          outlineColor="black"
          anchorX="center"
          anchorY="middle"
        >
          {nickname || (isLocal ? useMMOStore.getState().localNickname : `Player ${id.substring(0, 4)}`)}
        </Text>
      </Billboard>
      <primitive object={clone} />
    </group>
  );
}

// Preload standard avatars
useGLTF.preload('/assets/Player.glb');
useGLTF.preload('/assets/Player2.glb');
useGLTF.preload('/assets/Observer.glb');
useGLTF.preload('/assets/HomePageGreeter3.glb');
