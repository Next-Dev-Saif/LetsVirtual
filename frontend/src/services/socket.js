import { io } from 'socket.io-client';
import { useMMOStore } from '../store/useMMOStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://vp-backend.bonto.run';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const initializeSocket = () => {
  if (socket.connected) return;

  const nickname = useMMOStore.getState().localNickname || 'Guest';
  socket.auth = { nickname };

  socket.connect();

  socket.on('connect', () => {
    console.log('Connected to MMO Backend:', socket.id);
    useMMOStore.getState().setLocalId(socket.id);
  });

  socket.on('roomJoined', (roomId) => {
    useMMOStore.getState().setRoomId(roomId);
  });

  socket.on('serverFull', (data) => {
    alert(data.message);
    useMMOStore.getState().setServerFull(true);
  });

  socket.on('incomingChallenge', (data) => {
    useMMOStore.getState().setIncomingChallenge(data);
  });

  socket.on('battleStarted', (data) => {
    useMMOStore.getState().setActiveBattle(data);
    useMMOStore.getState().setIncomingChallenge(null);
  });

  socket.on('challengeDeclined', () => {
    alert("Your challenge was declined.");
  });

  socket.on('takeDamage', (data) => {
    const state = useMMOStore.getState();
    if (state.activeBattle) {
      const currentHealth = state.localHealth;
      const newHealth = Math.max(0, currentHealth - data.amount);
      state.setLocalHealth(newHealth);
      state.setDamageVFX(true);
      setTimeout(() => state.setDamageVFX(false), 200);

      // Play hit/defend animation (unless they are actively attacking?)
      // We can just rely on the playerAction event if they block
      if (newHealth <= 0) {
        // Broadcast death
        socket.emit('playerAction', { state: 'Death' });
        // Emit battleLost to server
        socket.emit('battleLost', state.activeBattle.opponentId);
      }
    }
  });

  socket.on('battleEnded', (data) => {
    const state = useMMOStore.getState();
    const { winnerId, loserId } = data;

    // Check if we were in this battle
    if (state.activeBattle && (state.activeBattle.opponentId === winnerId || state.activeBattle.opponentId === loserId)) {
      setTimeout(() => {
        state.setActiveBattle(null);
        state.setLocalHealth(100);
        state.setOpponentHealth(100);
        socket.emit('playerAction', { state: 'Idle' });
      }, 3000); // End battle after 3 seconds so Death animation can finish
    }

    // Announce to global chat
    const winner = state.players[winnerId];
    const loser = state.players[loserId];
    let winnerName = winnerId === socket.id ? "You" : (winner?.nickname || `Player ${winnerId.substring(0, 4)}`);
    let loserName = loserId === socket.id ? "You" : (loser?.nickname || `Player ${loserId.substring(0, 4)}`);

    state.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `🏆 ${winnerName} defeated ${loserName} in a 1v1 Battle!`,
      isSystem: true
    });
  });

  socket.on('currentPlayers', (players) => {
    useMMOStore.getState().setPlayers(players);
  });

  socket.on('playerJoined', (player) => {
    useMMOStore.getState().addPlayer(player);
  });

  socket.on('playerLeft', (id) => {
    useMMOStore.getState().removePlayer(id);
  });

  socket.on('playerMoved', (player) => {
    useMMOStore.getState().updatePlayerState(player);
  });

  socket.on('playerActionTriggered', (data) => {
    useMMOStore.getState().updatePlayerAction(data.id, data.action);
  });

  socket.on('chatMessage', (msg) => {
    useMMOStore.getState().addChatMessage(msg);
  });

  // Live Concert Socket Handlers
  socket.on('concertStateSync', (data) => {
    useMMOStore.getState().setConcertState({
      status: data.status,
      countdown: data.countdown,
      duration: data.duration,
      model: data.model || 'EngineQueen.glb',
      stagePos: data.stagePos || [0, 0.05, 0]
    });
  });

  socket.on('concertTimerTick', (data) => {
    useMMOStore.getState().setConcertState({
      status: data.status,
      countdown: data.countdown,
      model: data.model || 'EngineQueen.glb'
    });
  });

  socket.on('concertTimerCancelled', (data) => {
    const store = useMMOStore.getState();
    store.setConcertState({ status: 'idle', countdown: 0 });
    store.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `📢 ${data.message}`,
      isSystem: true
    });
  });

  socket.on('concertStarted', (data) => {
    const store = useMMOStore.getState();
    store.setConcertState({
      status: 'active',
      duration: data.duration,
      model: data.model || 'EngineQueen.glb',
      stagePos: data.stagePos || [0, 0.05, 0]
    });
    store.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `🎉 LIVE CONCERT SHOWCASE STARTED! Featuring ${data.model || 'EngineQueen.glb'}!`,
      isSystem: true
    });
  });

  socket.on('concertActiveTick', (data) => {
    useMMOStore.getState().setConcertState({
      status: 'active',
      duration: data.duration
    });
  });

  socket.on('concertEnded', () => {
    const store = useMMOStore.getState();
    store.setConcertState({ status: 'idle', countdown: 0, duration: 60 });
    store.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `✨ Live Concert showcase finished! Free movement restored.`,
      isSystem: true
    });
  });

  socket.on('concertAudienceEffect', (data) => {
    if (data.senderId === socket.id) return; // already rendered locally
    const store = useMMOStore.getState();
    store.addAudienceVFX({
      id: `${data.senderId}-${data.timestamp}-${Math.random()}`,
      senderId: data.senderId,
      nickname: data.nickname,
      actionType: data.actionType,
      timestamp: data.timestamp
    });
  });

  // Smash 'Em Minigame Socket Handlers
  socket.on('smashEmTimerTick', (data) => {
    useMMOStore.getState().setSmashEmState({
      status: data.status,
      countdown: data.countdown
    });
  });

  socket.on('smashEmStarted', (data) => {
    const store = useMMOStore.getState();
    store.clearEggSplats();
    store.setSmashEmState({
      status: 'active',
      scores: data.scores || {}
    });
    store.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `🥚 EGG SMASH 'EM ARENA STARTED! Aim & shoot the target photo! First to 20 points wins!`,
      isSystem: true
    });
  });

  socket.on('smashEmScoreUpdate', (data) => {
    const store = useMMOStore.getState();
    store.setSmashEmState({ scores: data.scores });
    store.addEggSplat({
      id: `${data.shooterId}-${Date.now()}-${Math.random()}`,
      shooterId: data.shooterId,
      nickname: data.nickname,
      pointsAdded: data.pointsAdded,
      totalScore: data.totalScore,
      zoneName: data.zoneName,
      hitWorldPos: data.hitWorldPos,
      timestamp: Date.now()
    });
  });

  socket.on('smashEmEnded', (data) => {
    const store = useMMOStore.getState();
    store.setSmashEmState({
      status: 'winner',
      winnerName: data.winnerName,
      scores: data.scores,
      joke: data.joke
    });
    store.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `🏆 WINNER! ${data.winnerName} won the Egg Smash 'Em Arena!`,
      isSystem: true
    });
  });

  socket.on('smashEmReset', () => {
    const store = useMMOStore.getState();
    store.setSmashEmState({ status: 'idle', countdown: 15, winnerName: null, joke: '' });
  });

  socket.on('jukeboxTrackChanged', (data) => {
    const store = useMMOStore.getState();
    store.setActiveJukeboxTrack({ id: data.trackId, title: data.trackTitle });
    store.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `🎵 ${data.requestedBy} changed the Cyber Jukebox track to: "${data.trackTitle}"!`,
      isSystem: true
    });
  });

  socket.on('eventCycleTick', (data) => {
    useMMOStore.getState().setEventCycleState({
      status: data.status,
      cooldownCountdown: data.countdown,
      nextEventTitle: data.nextEventTitle || 'Live 3D Concert Showcase'
    });
  });

  socket.on('eventCycleSync', (data) => {
    useMMOStore.getState().setEventCycleState({
      status: data.status,
      cooldownCountdown: data.cooldownCountdown || 600,
      nextEventTitle: 'Live 3D Concert Showcase'
    });
  });

  socket.on('birthdayWishBroadcast', (data) => {
    const store = useMMOStore.getState();
    store.addBirthdayWish(data);
    store.addChatMessage({
      id: Date.now(),
      sender: 'System',
      text: `💌 ${data.senderName} sent a Birthday Wish: "${data.text}"!`,
      isSystem: true
    });
  });
};
