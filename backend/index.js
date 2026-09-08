const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : '*';

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'LetsVirtual MMO Backend' });
});

// Store active rooms
const rooms = {};
const MAX_ROOMS = 5;
const MAX_PLAYERS_PER_ROOM = 5;

const CONCERT_COUNTDOWN_TIME = 60;   // 1 minute countdown
const CONCERT_SHOWCASE_TIME = 60;    // 1 minute active concert
const SMASH_EM_COUNTDOWN_TIME = 15;  // 15 seconds countdown
const SMASH_EM_MAX_DURATION = 60;     // 60 seconds max active minigame
const EVENT_CYCLE_COOLDOWN_TIME = 600;// 10 minutes (600s) repeat cooldown

// Helper to find or create a room
function assignRoom() {
  for (let i = 1; i <= MAX_ROOMS; i++) {
    const roomId = `room-${i}`;
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        players: {},
        cycleStatus: 'idle', // 'idle' | 'running' | 'cooldown'
        cooldownCountdown: EVENT_CYCLE_COOLDOWN_TIME,
        cooldownTimer: null,
        concertStatus: 'idle', // 'idle' | 'counting' | 'active'
        concertCountdown: CONCERT_COUNTDOWN_TIME,
        concertDuration: CONCERT_SHOWCASE_TIME,
        concertTimer: null,
        featuredModel: 'EngineQueen.glb',
        smashEmStatus: 'idle', // 'idle' | 'counting' | 'active'
        smashEmCountdown: SMASH_EM_COUNTDOWN_TIME,
        smashEmDuration: SMASH_EM_MAX_DURATION,
        smashEmTimer: null,
        smashEmScores: {}
      };
      return roomId;
    }
    if (Object.keys(rooms[roomId].players).length < MAX_PLAYERS_PER_ROOM) {
      return roomId;
    }
  }
  return null; // Server full
}

// Utility to check and maintain room concert status when a player leaves
function checkRoomConcertStatus(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Ensure the event cycle is running for the remaining players if it was idle
  if (room.cycleStatus === 'idle' && Object.keys(room.players).length > 0) {
    startRoomEventCycle(roomId);
  }
}

// Master Room Event Sequence Controller
function startRoomEventCycle(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Only start sequence if room is idle (not already running or in 10-min cooldown)
  if (room.cycleStatus !== 'idle') return;

  const playerCount = Object.keys(room.players).length;
  if (playerCount < 1) return;

  room.cycleStatus = 'running';
  startConcertCountdown(roomId);
}

// 1. Concert Showcase Stage
function startConcertCountdown(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.concertStatus = 'counting';
  room.concertCountdown = CONCERT_COUNTDOWN_TIME;

  io.to(roomId).emit('concertTimerTick', {
    status: 'counting',
    countdown: room.concertCountdown,
    model: room.featuredModel
  });

  if (room.concertTimer) clearInterval(room.concertTimer);

  room.concertTimer = setInterval(() => {
    if (!rooms[roomId]) {
      clearInterval(room.concertTimer);
      return;
    }

    const activePlayers = Object.keys(rooms[roomId].players).length;
    if (activePlayers < 1) {
      // Pause cycle if room is empty
      clearInterval(rooms[roomId].concertTimer);
      rooms[roomId].concertTimer = null;
      rooms[roomId].concertStatus = 'idle';
      rooms[roomId].cycleStatus = 'idle';
      rooms[roomId].concertCountdown = CONCERT_COUNTDOWN_TIME;
      io.to(roomId).emit('concertTimerCancelled', {
        status: 'idle',
        message: 'Concert countdown paused (Waiting for online party guests).'
      });
      return;
    }

    rooms[roomId].concertCountdown -= 1;

    if (rooms[roomId].concertCountdown > 0) {
      io.to(roomId).emit('concertTimerTick', {
        status: 'counting',
        countdown: rooms[roomId].concertCountdown,
        model: rooms[roomId].featuredModel
      });
    } else {
      // Start active concert!
      clearInterval(rooms[roomId].concertTimer);
      rooms[roomId].concertStatus = 'active';
      rooms[roomId].concertCountdown = 0;
      rooms[roomId].concertDuration = CONCERT_SHOWCASE_TIME;

      io.to(roomId).emit('concertStarted', {
        status: 'active',
        model: rooms[roomId].featuredModel || 'EngineQueen.glb',
        stagePos: [0, 0.05, 0],
        duration: CONCERT_SHOWCASE_TIME
      });

      // Active concert duration timer
      rooms[roomId].concertTimer = setInterval(() => {
        if (!rooms[roomId]) {
          clearInterval(room.concertTimer);
          return;
        }

        rooms[roomId].concertDuration -= 1;
        if (rooms[roomId].concertDuration > 0) {
          io.to(roomId).emit('concertActiveTick', {
            status: 'active',
            duration: rooms[roomId].concertDuration
          });
        } else {
          // Concert complete! Transition to Smash 'Em
          clearInterval(rooms[roomId].concertTimer);
          rooms[roomId].concertTimer = null;
          rooms[roomId].concertStatus = 'idle';
          rooms[roomId].concertCountdown = CONCERT_COUNTDOWN_TIME;
          io.to(roomId).emit('concertEnded', { status: 'idle' });

          setTimeout(() => {
            if (rooms[roomId]) {
              startSmashEmCountdown(roomId);
            }
          }, 3000);
        }
      }, 1000);
    }
  }, 1000);
}

// 2. Smash 'Em Minigame Stage
const BIRTHDAY_EGG_JOKES = [
  "Why did the birthday egg go to the party? Because it was ready to get egg-cited, scrambled, and cracked up! 🥚🥳💥",
  "How do eggs celebrate birthdays? They throw an egg-straordinary party! 🍳🎉",
  "What did the egg say after winning the smash battle? You crack me up! 🎂🥚",
  "Why was the egg afraid of the party? It didn't want to get beaten! 🐣"
];

function startSmashEmCountdown(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.smashEmStatus = 'counting';
  room.smashEmCountdown = SMASH_EM_COUNTDOWN_TIME;
  room.smashEmScores = {};

  io.to(roomId).emit('smashEmTimerTick', {
    status: 'counting',
    countdown: room.smashEmCountdown
  });

  if (room.smashEmTimer) clearInterval(room.smashEmTimer);

  room.smashEmTimer = setInterval(() => {
    if (!rooms[roomId]) {
      clearInterval(room.smashEmTimer);
      return;
    }

    rooms[roomId].smashEmCountdown -= 1;

    if (rooms[roomId].smashEmCountdown > 0) {
      io.to(roomId).emit('smashEmTimerTick', {
        status: 'counting',
        countdown: rooms[roomId].smashEmCountdown
      });
    } else {
      // Start Active Smash 'Em Event!
      clearInterval(rooms[roomId].smashEmTimer);
      rooms[roomId].smashEmTimer = null;
      rooms[roomId].smashEmStatus = 'active';
      rooms[roomId].smashEmDuration = SMASH_EM_MAX_DURATION;

      // Initialize scores
      Object.keys(rooms[roomId].players).forEach((pid) => {
        rooms[roomId].smashEmScores[pid] = 0;
      });

      io.to(roomId).emit('smashEmStarted', {
        status: 'active',
        scores: rooms[roomId].smashEmScores,
        duration: SMASH_EM_MAX_DURATION
      });

      // Max duration safety timer so Smash 'Em auto-completes cleanly
      rooms[roomId].smashEmTimer = setInterval(() => {
        if (!rooms[roomId] || rooms[roomId].smashEmStatus !== 'active') {
          clearInterval(room.smashEmTimer);
          return;
        }

        rooms[roomId].smashEmDuration -= 1;

        if (rooms[roomId].smashEmDuration <= 0) {
          // Time expired -> find top scorer or draw
          clearInterval(rooms[roomId].smashEmTimer);
          rooms[roomId].smashEmTimer = null;

          let topScorerId = null;
          let topScore = -1;
          Object.entries(rooms[roomId].smashEmScores).forEach(([pid, score]) => {
            if (score > topScore) {
              topScore = score;
              topScorerId = pid;
            }
          });

          const winnerPlayer = topScorerId ? rooms[roomId].players[topScorerId] : null;
          finishSmashEmEvent(roomId, topScorerId, winnerPlayer?.nickname || 'Top Marksman');
        }
      }, 1000);
    }
  }, 1000);
}

function finishSmashEmEvent(roomId, winnerId, winnerName) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.smashEmTimer) clearInterval(room.smashEmTimer);
  room.smashEmTimer = null;
  room.smashEmStatus = 'winner';

  const randomJoke = BIRTHDAY_EGG_JOKES[Math.floor(Math.random() * BIRTHDAY_EGG_JOKES.length)];

  io.to(roomId).emit('smashEmEnded', {
    status: 'winner',
    winnerId: winnerId,
    winnerName: winnerName,
    scores: room.smashEmScores,
    joke: randomJoke
  });

  // After 8 seconds winner modal display, transition to 10-Minute Cooldown Loop!
  setTimeout(() => {
    if (rooms[roomId]) {
      rooms[roomId].smashEmStatus = 'idle';
      rooms[roomId].smashEmScores = {};
      io.to(roomId).emit('smashEmReset', { status: 'idle' });

      startEventCycleCooldown(roomId);
    }
  }, 8000);
}

// 3. 10-Minute Cooldown / Free-Play Period (Repeat Cycle)
function startEventCycleCooldown(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.cycleStatus = 'cooldown';
  room.cooldownCountdown = EVENT_CYCLE_COOLDOWN_TIME;

  io.to(roomId).emit('eventCycleTick', {
    status: 'cooldown',
    countdown: room.cooldownCountdown,
    nextEventTitle: 'Live 3D Concert Showcase'
  });

  if (room.cooldownTimer) clearInterval(room.cooldownTimer);

  room.cooldownTimer = setInterval(() => {
    if (!rooms[roomId]) {
      clearInterval(room.cooldownTimer);
      return;
    }

    const activePlayers = Object.keys(rooms[roomId].players).length;
    if (activePlayers < 1) {
      clearInterval(rooms[roomId].cooldownTimer);
      rooms[roomId].cooldownTimer = null;
      rooms[roomId].cycleStatus = 'idle';
      rooms[roomId].cooldownCountdown = EVENT_CYCLE_COOLDOWN_TIME;
      return;
    }

    rooms[roomId].cooldownCountdown -= 1;

    if (rooms[roomId].cooldownCountdown > 0) {
      io.to(roomId).emit('eventCycleTick', {
        status: 'cooldown',
        countdown: rooms[roomId].cooldownCountdown,
        nextEventTitle: 'Live 3D Concert Showcase'
      });
    } else {
      // 10 minutes completed -> REPEAT THE EVENT SEQUENCE!
      clearInterval(rooms[roomId].cooldownTimer);
      rooms[roomId].cooldownTimer = null;
      rooms[roomId].cycleStatus = 'idle';

      // Automatically trigger next sequence cycle
      startRoomEventCycle(roomId);
    }
  }, 1000);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  const assignedRoomId = assignRoom();
  
  if (!assignedRoomId) {
    socket.emit('serverFull', { message: 'All party rooms are full. Please join later!' });
    socket.disconnect();
    return;
  }

  socket.join(assignedRoomId);
  socket.roomId = assignedRoomId; // Attach roomId to socket for easy access

  // Initialize player data
  const nickname = socket.handshake.auth?.nickname || 'Guest';
  const player = {
    id: socket.id,
    nickname: nickname,
    position: [(Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10], // random spawn
    rotation: [0, 0, 0],
    avatar: 'Observer.glb',
    state: 'Idle',
    roomId: assignedRoomId
  };

  rooms[assignedRoomId].players[socket.id] = player;

  // Inform the user they joined a room
  socket.emit('roomJoined', assignedRoomId);

  // Broadcast to the room that a new player joined
  socket.to(assignedRoomId).emit('playerJoined', player);
  
  // Send current room players to the new client
  socket.emit('currentPlayers', rooms[assignedRoomId].players);

  // Send initial concert status & event cycle sync to newly joined player
  socket.emit('concertStateSync', {
    status: rooms[assignedRoomId].concertStatus,
    countdown: rooms[assignedRoomId].concertCountdown,
    duration: rooms[assignedRoomId].concertDuration,
    model: rooms[assignedRoomId].featuredModel,
    stagePos: [0, 0.05, 0]
  });

  socket.emit('eventCycleSync', {
    status: rooms[assignedRoomId].cycleStatus,
    cooldownCountdown: rooms[assignedRoomId].cooldownCountdown,
    concertStatus: rooms[assignedRoomId].concertStatus,
    smashEmStatus: rooms[assignedRoomId].smashEmStatus
  });

  // Evaluate & trigger automated room event cycle
  startRoomEventCycle(assignedRoomId);

  // Handle player moving
  socket.on('playerMove', (data) => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId].players[socket.id]) {
      rooms[roomId].players[socket.id].position = data.position;
      rooms[roomId].players[socket.id].rotation = data.rotation;
      rooms[roomId].players[socket.id].state = data.state;
      socket.to(roomId).emit('playerMoved', rooms[roomId].players[socket.id]);
    }
  });

  // Handle chat message
  socket.on('chatMessage', (msg) => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId].players[socket.id]) {
      const player = rooms[roomId].players[socket.id];
      io.to(roomId).emit('chatMessage', { id: socket.id, nickname: player.nickname, text: msg.text, timestamp: Date.now() });
    }
  });

  // Handle action (Dance, Battle, etc.)
  socket.on('playerAction', (action) => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId].players[socket.id]) {
      rooms[roomId].players[socket.id].state = action.state;
      io.to(roomId).emit('playerActionTriggered', { id: socket.id, action: action.state });
    }
  });

  // Concert Audience Interaction Event
  socket.on('concertAudienceAction', (data) => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId].concertStatus === 'active') {
      const player = rooms[roomId].players[socket.id];
      io.to(roomId).emit('concertAudienceEffect', {
        senderId: socket.id,
        nickname: player?.nickname || 'Guest',
        actionType: data.actionType, // 'wave' | 'cheer' | 'fireworks' | 'hearts'
        timestamp: Date.now()
      });
    }
  });

  // Smash 'Em Shooting Event Handler
  socket.on('smashEmShoot', (data) => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId].smashEmStatus === 'active') {
      const { uv, hitWorldPos } = data;
      const player = rooms[roomId].players[socket.id];
      if (!player) return;

      // Score calculation based on UV hit position on target photo plane:
      // UV center is (0.5, 0.5), Top Head is (0.5, 0.75)
      let points = 1;
      let zoneName = 'Edge Hit! (+1)';

      if (uv && Array.isArray(uv) && uv.length === 2) {
        const [u, v] = uv;
        const distToHead = Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow(v - 0.75, 2));
        const distToCenter = Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2));

        if (distToHead <= 0.14) {
          points = 5;
          zoneName = 'BULLSEYE HEAD SHOT! (+5)';
        } else if (distToCenter <= 0.28) {
          points = 3;
          zoneName = 'CENTER HIT! (+3)';
        } else {
          points = 1;
          zoneName = 'EDGE HIT! (+1)';
        }
      }

      const currentScore = (rooms[roomId].smashEmScores[socket.id] || 0) + points;
      rooms[roomId].smashEmScores[socket.id] = currentScore;

      // Broadcast score update and egg splat position to room
      io.to(roomId).emit('smashEmScoreUpdate', {
        shooterId: socket.id,
        nickname: player.nickname,
        pointsAdded: points,
        totalScore: currentScore,
        zoneName,
        hitWorldPos,
        scores: rooms[roomId].smashEmScores
      });

      // Check if player reached 20 points -> WINNER!
      if (currentScore >= 20) {
        finishSmashEmEvent(roomId, socket.id, player.nickname);
      }
    }
  });

  // 1v1 Matchmaking Events
  socket.on('challengePlayer', (targetId) => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId].players[targetId]) {
      // Send challenge to the target player
      io.to(targetId).emit('incomingChallenge', { challengerId: socket.id });
    }
  });

  socket.on('acceptChallenge', (challengerId) => {
    const roomId = socket.roomId;
    if (roomId) {
      // Lock both players into Battling state
      if (rooms[roomId].players[socket.id]) rooms[roomId].players[socket.id].state = 'Battling';
      if (rooms[roomId].players[challengerId]) rooms[roomId].players[challengerId].state = 'Battling';
      
      // Notify both players that the battle started
      io.to(socket.id).emit('battleStarted', { opponentId: challengerId });
      io.to(challengerId).emit('battleStarted', { opponentId: socket.id });
      
      // Broadcast state changes to the room
      io.to(roomId).emit('playerActionTriggered', { id: socket.id, action: 'Battling' });
      io.to(roomId).emit('playerActionTriggered', { id: challengerId, action: 'Battling' });
    }
  });

  socket.on('declineChallenge', (challengerId) => {
    io.to(challengerId).emit('challengeDeclined', { targetId: socket.id });
  });

  socket.on('dealDamage', (data) => {
    const { targetId, damage } = data;
    // Broadcast the damage to the target
    io.to(targetId).emit('takeDamage', { amount: damage, attackerId: socket.id });
  });

  socket.on('battleLost', (winnerId) => {
    const roomId = socket.roomId;
    if (roomId) {
      // Broadcast winner to the entire room
      io.to(roomId).emit('battleEnded', { winnerId: winnerId, loserId: socket.id });
    }
  });

  socket.on('changeJukeboxTrack', (data) => {
    const roomId = socket.roomId;
    if (roomId) {
      io.to(roomId).emit('jukeboxTrackChanged', {
        ...data,
        requestedBy: socket.nickname || 'Guest'
      });
    }
  });

  socket.on('sendBirthdayWish', (data) => {
    const roomId = socket.roomId;
    if (roomId) {
      io.to(roomId).emit('birthdayWishBroadcast', {
        id: `${socket.id}-${Date.now()}`,
        senderName: socket.nickname || 'Guest',
        text: data.text,
        color: data.color || '#f59e0b',
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomId = socket.roomId;
    
    if (roomId && rooms[roomId]) {
      delete rooms[roomId].players[socket.id];
      io.to(roomId).emit('playerLeft', socket.id);

      const remainingPlayers = Object.keys(rooms[roomId].players).length;
      if (remainingPlayers === 0) {
        if (rooms[roomId].concertTimer) clearInterval(rooms[roomId].concertTimer);
        delete rooms[roomId];
      } else {
        checkRoomConcertStatus(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`MMO Backend listening on port ${PORT}`);
});
