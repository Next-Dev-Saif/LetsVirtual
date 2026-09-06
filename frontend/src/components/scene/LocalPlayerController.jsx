import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMMOStore } from '../../store/useMMOStore';
import { socket } from '../../services/socket';
import * as THREE from 'three';

export function LocalPlayerController() {
  const localId = useMMOStore((state) => state.localId);
  const players = useMMOStore((state) => state.players);

  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  });

  const lastSendTime = useRef(0);
  const position = useRef(new THREE.Vector3(0, 0, 0));
  const rotation = useRef(new THREE.Euler(0, 0, 0));
  const playerState = useRef('Idle');
  const speed = 5; // units per second

  const { camera } = useThree();

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp': moveState.current.forward = true; break;
        case 'KeyS':
        case 'ArrowDown': moveState.current.backward = true; break;
        case 'KeyA':
        case 'ArrowLeft': moveState.current.left = true; break;
        case 'KeyD':
        case 'ArrowRight': moveState.current.right = true; break;
        case 'KeyE': {
          const store = useMMOStore.getState();
          const { activeZone, activeBattle, isDanceMode, players, localId, localPlayerState } = store;

          if (activeZone && !activeBattle && !isDanceMode) {
            if (activeZone === 'dance') {
              store.setIsDanceMode(true);
              import('../../services/socket').then(({ socket }) => {
                socket.emit('playerAction', { state: 'Dance' });
              });
            } else if (activeZone === 'battle') {
              const localPos = localPlayerState.position;
              let nearestId = null;
              let nearestDist = Infinity;

              Object.values(players).forEach(p => {
                if (p.id !== localId) {
                  const dx = p.position[0] - localPos[0];
                  const dz = p.position[2] - localPos[2];
                  const dist = Math.sqrt(dx * dx + dz * dz);
                  if (dist < 10 && dist < nearestDist) {
                    nearestDist = dist;
                    nearestId = p.id;
                  }
                }
              });

              if (nearestId) {
                import('../../services/socket').then(({ socket }) => {
                  socket.emit('challengePlayer', nearestId);
                });
            } else if (activeZone === 'jukebox') {
              store.setIsJukeboxOpen(true);
            } else if (activeZone === 'wishCard') {
              store.setIsWishModalOpen(true);
            }
            }
          }
          break;
        }
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp': moveState.current.forward = false; break;
        case 'KeyS':
        case 'ArrowDown': moveState.current.backward = false; break;
        case 'KeyA':
        case 'ArrowLeft': moveState.current.left = false; break;
        case 'KeyD':
        case 'ArrowRight': moveState.current.right = false; break;
      }
    };

    const handleCombatKeys = (e) => {
      const activeBattle = useMMOStore.getState().activeBattle;
      if (!activeBattle) return;

      let action = null;
      let damage = 0;

      if (e.code === 'Digit1') {
        action = 'Attack1';
        damage = 10;
      } else if (e.code === 'Digit2') {
        action = 'GuyAction';
        damage = 15;
      } else if (e.code === 'Digit3') {
        action = 'GuyAction';
        damage = 20;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        action = 'Focus';
      }

      if (action) {
        if (damage > 0) {
          useMMOStore.getState().attemptAttack(damage, action);
        } else {
          socket.emit('playerAction', { state: action });
          setTimeout(() => socket.emit('playerAction', { state: 'Idle' }), 1000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleCombatKeys);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleCombatKeys);
    };
  }, []);

  // Force rotation to face opponent when battle starts
  const activeBattle = useMMOStore((state) => state.activeBattle);
  useEffect(() => {
    if (activeBattle && players[activeBattle.opponentId]) {
      const oppPos = players[activeBattle.opponentId].position;
      const dx = oppPos[0] - position.current.x;
      const dz = oppPos[2] - position.current.z;
      const angle = Math.atan2(dx, dz);
      rotation.current.y = angle;
    }
  }, [activeBattle, players]);

  // Resync player position and orient camera facing the Smash Em Target when event starts
  const smashEmStatus = useMMOStore((state) => state.smashEmState.status);
  useEffect(() => {
    if (smashEmStatus === 'active' && localId) {
      let hash = 0;
      for (let i = 0; i < localId.length; i++) {
        hash = (hash << 5) - hash + localId.charCodeAt(i);
      }
      const xOffset = ((Math.abs(hash) % 7) - 3) * 0.8; // range -2.4 to +2.4

      // Resync position facing the target at Z=5.5
      position.current.set(xOffset, 0, 5.5);

      const dx = 0 - position.current.x;
      const dz = 0 - position.current.z;
      rotation.current.y = Math.atan2(dx, dz);

      // Point camera directly towards target plane [0, 2.5, 0]
      camera.position.set(xOffset, 1.6, 5.5);
      camera.lookAt(0, 2.5, 0);

      // Emit movement update to room
      socket.emit('playerMove', {
        position: [position.current.x, position.current.y, position.current.z],
        rotation: [rotation.current.x, rotation.current.y, rotation.current.z],
        state: 'Idle'
      });
    }
  }, [smashEmStatus, localId, camera]);

  useFrame((state, delta) => {
    if (!localId || !players[localId]) return;

    // Block movement if in dance mode, active concert, or active Smash Em event
    const isDanceMode = useMMOStore.getState().isDanceMode;
    const isConcertActive = useMMOStore.getState().concertState.status === 'active';
    const isSmashEmActive = useMMOStore.getState().smashEmState.status === 'active';
    const activeBattle = useMMOStore.getState().activeBattle;
    const isBattling = !!activeBattle;

    let isMoving = false;
    let dx = 0;
    let dz = 0;

    if (!isDanceMode && !isConcertActive && !isSmashEmActive) {
      const { forward, backward, left, right } = moveState.current;
      if (forward) dz -= 1;
      if (backward) dz += 1;
      if (left) dx -= 1;
      if (right) dx += 1;
    }

    if (dx !== 0 || dz !== 0) {
      isMoving = true;
      // Normalize input
      const length = Math.sqrt(dx * dx + dz * dz);
      dx /= length;
      dz /= length;

      // Get camera's forward and right directions (ignoring Y axis)
      const cameraForward = new THREE.Vector3();
      camera.getWorldDirection(cameraForward);
      cameraForward.y = 0;
      cameraForward.normalize();

      const cameraRight = new THREE.Vector3().crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();

      // Calculate movement vector relative to camera
      const moveDirection = new THREE.Vector3()
        .addScaledVector(cameraForward, -dz) // forward/backward
        .addScaledVector(cameraRight, dx)    // left/right
        .normalize();

      const moveStep = speed * delta;

      const newPos = position.current.clone();
      newPos.x += moveDirection.x * moveStep;
      newPos.z += moveDirection.z * moveStep;

      if (isBattling && players[activeBattle.opponentId]) {
        const oppPosArr = players[activeBattle.opponentId].position;
        const oppPos = new THREE.Vector3(oppPosArr[0], oppPosArr[1], oppPosArr[2]);
        if (newPos.distanceTo(oppPos) > 15) {
          // Clamp distance
          const dir = new THREE.Vector3().subVectors(newPos, oppPos).normalize();
          newPos.copy(oppPos).add(dir.multiplyScalar(15));
        }
      }

      // Update player position
      position.current.copy(newPos);

      // Calculate the angle the character should face (atan2 of the movement direction)
      const angle = Math.atan2(moveDirection.x, moveDirection.z);

      // Smoothly rotate the character to face the movement direction
      const currentRot = rotation.current.y;

      // Shortest path angle interpolation
      let diff = angle - currentRot;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      rotation.current.y += diff * 10 * delta;
    }

    // TPP Camera Follow Logic (Only when concert showcase is NOT active)
    if (!isConcertActive) {
      const distance = 2.3;
      const heightOffset = 1.6;

      const camForward = new THREE.Vector3();
      camera.getWorldDirection(camForward);
      camForward.y = 0; // Keep the follow logic planar for stability
      camForward.normalize();

      // Calculate the ideal position behind the player
      const targetPos = new THREE.Vector3(position.current.x, position.current.y + heightOffset, position.current.z);
      const idealCameraPos = targetPos.clone().addScaledVector(camForward, -distance);

      // Smoothly lerp camera to the ideal position
      camera.position.lerp(idealCameraPos, 15 * delta);
    }

    const baseState = isMoving ? 'Walk' : 'Idle';
    const newState = isBattling ? (isMoving ? 'Walk' : 'Idle') : baseState;
    const currentState = useMMOStore.getState().players[localId]?.state || 'Idle';

    // Only update to Walk/Idle if we are not currently doing an action like Attacking
    const isActionState = currentState.startsWith('Attack') || currentState === 'Focus' || currentState === 'GuyAction' || currentState === 'Dance' || currentState === 'Dance2';
    if (!isActionState && currentState !== newState) {
      playerState.current = newState;
    } else {
      playerState.current = currentState;
    }

    // High frequency update to the local mutable ref for smooth rendering
    const localPlayerRef = useMMOStore.getState().localPlayerState;
    localPlayerRef.position = [position.current.x, position.current.y, position.current.z];
    localPlayerRef.rotation = [rotation.current.x, rotation.current.y, rotation.current.z];
    localPlayerRef.state = playerState.current;

    const now = performance.now();
    if (now - lastSendTime.current > 100) { // Send every 100ms
      if (isMoving || currentState !== playerState.current) {
        const payload = {
          id: localId,
          position: localPlayerRef.position,
          rotation: localPlayerRef.rotation,
          state: localPlayerRef.state
        };
        socket.emit('playerMove', payload);
        useMMOStore.getState().updatePlayerState(payload);
      }
      lastSendTime.current = now;

      // Zone Detection Logic (Dance: [10, 10], Battle: [-10, 10], Jukebox: [10, -10], Wish: [-10, -10])
      const distToDance = Math.sqrt(Math.pow(position.current.x - 10, 2) + Math.pow(position.current.z - 10, 2));
      const distToBattle = Math.sqrt(Math.pow(position.current.x - (-10), 2) + Math.pow(position.current.z - 10, 2));
      const distToJukebox = Math.sqrt(Math.pow(position.current.x - 10, 2) + Math.pow(position.current.z - (-10), 2));
      const distToWish = Math.sqrt(Math.pow(position.current.x - (-10), 2) + Math.pow(position.current.z - (-10), 2));

      let currentZone = null;
      if (distToDance < 3.8) currentZone = 'dance';
      else if (distToBattle < 3.8) currentZone = 'battle';
      else if (distToJukebox < 3.8) currentZone = 'jukebox';
      else if (distToWish < 3.8) currentZone = 'wishCard';

      const storeState = useMMOStore.getState();
      if (storeState.activeZone !== currentZone) {
        storeState.setActiveZone(currentZone);
      }
    }
  });

  return null;
}
