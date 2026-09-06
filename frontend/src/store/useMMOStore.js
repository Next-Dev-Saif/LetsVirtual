import { create } from 'zustand';

export const useMMOStore = create((set) => ({
  localId: null,
  localNickname: '',
  roomId: null,
  serverFull: false,
  isDanceMode: false,
  activeZone: null, // 'dance' | 'battle' | 'jukebox' | 'wishCard' | null
  isJukeboxOpen: false,
  isWishModalOpen: false,
  activeJukeboxTrack: { id: 'synth', title: 'Cyber Birthday Synth 🎂' },
  birthdayWishes: [],
  incomingChallenge: null, // { challengerId }
  activeBattle: null, // { opponentId }
  localHealth: 100,
  opponentHealth: 100,
  damageVFX: false,
  hitVFX: false,
  players: {}, // Dictionary of players by socket id
  chatMessages: [],
  
  // Concert Showcase State
  concertState: {
    status: 'idle', // 'idle' | 'counting' | 'active'
    countdown: 0,
    duration: 60,
    model: 'EngineQueen.glb',
    stagePos: [0, 0.05, 0],
    activeAudienceVFX: []
  },

  // Smash 'Em Minigame State
  smashEmState: {
    status: 'idle', // 'idle' | 'counting' | 'active' | 'winner'
    countdown: 15,
    scores: {},
    splats: [],
    winnerName: null,
    joke: ''
  },

  // 10-Minute Room Event Cycle State
  eventCycleState: {
    status: 'idle', // 'idle' | 'running' | 'cooldown'
    cooldownCountdown: 600,
    nextEventTitle: 'Live 3D Concert Showcase'
  },

  setConcertState: (partial) => set((state) => ({
    concertState: { ...state.concertState, ...partial }
  })),

  setSmashEmState: (partial) => set((state) => ({
    smashEmState: { ...state.smashEmState, ...partial }
  })),

  setEventCycleState: (partial) => set((state) => ({
    eventCycleState: { ...state.eventCycleState, ...partial }
  })),

  addEggSplat: (splat) => set((state) => ({
    smashEmState: {
      ...state.smashEmState,
      splats: [...state.smashEmState.splats, splat].slice(-25)
    }
  })),

  clearEggSplats: () => set((state) => ({
    smashEmState: { ...state.smashEmState, splats: [] }
  })),

  addAudienceVFX: (effect) => set((state) => ({
    concertState: {
      ...state.concertState,
      activeAudienceVFX: [...state.concertState.activeAudienceVFX, effect].slice(-15)
    }
  })),

  removeAudienceVFX: (id) => set((state) => ({
    concertState: {
      ...state.concertState,
      activeAudienceVFX: state.concertState.activeAudienceVFX.filter(e => e.id !== id)
    }
  })),
  
  // Mutable reference for high-frequency local player updates without React re-renders
  localPlayerState: { position: [0, 0, 0], rotation: [0, 0, 0], state: 'Idle' },

  setLocalId: (id) => set({ localId: id }),
  setLocalNickname: (name) => set({ localNickname: name }),
  setRoomId: (id) => set({ roomId: id }),
  setServerFull: (isFull) => set({ serverFull: isFull }),
  setActiveZone: (zone) => set({ activeZone: zone }),
  setIsDanceMode: (danceMode) => set({ isDanceMode: danceMode }),
  setIsJukeboxOpen: (open) => set({ isJukeboxOpen: open }),
  setIsWishModalOpen: (open) => set({ isWishModalOpen: open }),
  setActiveJukeboxTrack: (track) => set({ activeJukeboxTrack: track }),
  addBirthdayWish: (wish) => set((state) => ({ birthdayWishes: [...state.birthdayWishes, wish].slice(-10) })),
  setIncomingChallenge: (challenge) => set({ incomingChallenge: challenge }),
  setActiveBattle: (battle) => set({ 
    activeBattle: battle,
    localHealth: 100,
    opponentHealth: 100
  }),
  setLocalHealth: (hp) => set({ localHealth: hp }),
  setOpponentHealth: (hp) => set({ opponentHealth: hp }),
  setDamageVFX: (active) => set({ damageVFX: active }),
  setHitVFX: (active) => set({ hitVFX: active }),

  attemptAttack: async (damage, actionName) => {
    const state = useMMOStore.getState();
    const { activeBattle, localPlayerState, players } = state;
    
    // 1. Play animation regardless of hit
    const { socket } = await import('../services/socket');
    socket.emit('playerAction', { state: actionName });
    
    if (activeBattle) {
      const opponent = players[activeBattle.opponentId];
      if (opponent) {
        // Distance check
        const dx = opponent.position[0] - localPlayerState.position[0];
        const dz = opponent.position[2] - localPlayerState.position[2];
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist <= 3) {
          // Angle check
          const angleToOpponent = Math.atan2(dx, dz);
          let rotY = localPlayerState.rotation[1];
          let angleDiff = Math.abs(rotY - angleToOpponent);
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff)); // normalize to -pi..pi
          
          if (Math.abs(angleDiff) <= Math.PI / 4) {
            // Hit!
            socket.emit('dealDamage', { targetId: activeBattle.opponentId, damage });
            state.setHitVFX(true);
            setTimeout(() => state.setHitVFX(false), 150);
            state.setOpponentHealth(Math.max(0, state.opponentHealth - damage));
          }
        }
      }
    }
    
    // Reset to Idle
    setTimeout(() => socket.emit('playerAction', { state: 'Idle' }), 1000);
  },

  setPlayers: (players) => set({ players }),

  addPlayer: (player) => set((state) => ({
    players: {
      ...state.players,
      [player.id]: player
    }
  })),

  removePlayer: (id) => set((state) => {
    const newPlayers = { ...state.players };
    delete newPlayers[id];
    return { players: newPlayers };
  }),

  updatePlayerState: (playerData) => set((state) => {
    if (!state.players[playerData.id]) return state;
    return {
      players: {
        ...state.players,
        [playerData.id]: {
          ...state.players[playerData.id],
          position: playerData.position,
          rotation: playerData.rotation,
          state: playerData.state
        }
      }
    };
  }),

  updatePlayerAction: (id, action) => set((state) => {
    if (!state.players[id]) return state;
    return {
      players: {
        ...state.players,
        [id]: {
          ...state.players[id],
          state: action
        }
      }
    };
  }),

  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages, msg].slice(-50) // Keep last 50 msgs
  }))
}));
