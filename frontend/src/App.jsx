import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { PartyScene } from './components/scene/PartyScene';
import { initializeSocket } from './services/socket';
import { ConcertAudio } from './components/scene/ConcertAudio';
import { ChatInterface } from './components/ui/ChatInterface';
import { PlayerRoster } from './components/ui/PlayerRoster';
import { GameGuide } from './components/ui/GameGuide';
import { ConcertNotification } from './components/ui/ConcertNotification';
import { SmashEmNotification } from './components/ui/SmashEmNotification';
import { JukeboxModal } from './components/ui/JukeboxModal';
import { WishModal } from './components/ui/WishModal';
import { BirthdayWishFeed } from './components/ui/BirthdayWishFeed';
import { useMMOStore } from './store/useMMOStore';

function Home() {
  const [isJoined, setIsJoined] = useState(false);
  const roomId = useMMOStore((state) => state.roomId);
  const serverFull = useMMOStore((state) => state.serverFull);
  const isDanceMode = useMMOStore((state) => state.isDanceMode);
  const incomingChallenge = useMMOStore((state) => state.incomingChallenge);
  const activeBattle = useMMOStore((state) => state.activeBattle);
  const localHealth = useMMOStore((state) => state.localHealth);
  const opponentHealth = useMMOStore((state) => state.opponentHealth);
  const damageVFX = useMMOStore((state) => state.damageVFX);
  const hitVFX = useMMOStore((state) => state.hitVFX);

  const [nicknameInput, setNicknameInput] = useState('');

  const handleJoin = () => {
    if (!nicknameInput.trim()) {
      alert("Please enter a nickname!");
      return;
    }
    useMMOStore.getState().setLocalNickname(nicknameInput.trim());
    initializeSocket();
    setIsJoined(true);
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* 3D Background Scene */}
      <PartyScene />
      <ConcertAudio />
      <JukeboxModal />
      <WishModal />
      <BirthdayWishFeed />

      {/* Server Full Overlay */}
      {serverFull && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center max-w-md">
            <h2 className="text-3xl font-bold text-red-400 mb-4">Server Full!</h2>
            <p className="text-slate-300 mb-6">
              All 5 party rooms are currently at maximum capacity (5 players each).
              Please try joining again later!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      {!isJoined && !serverFull && (
        <div className="relative z-10 flex items-center justify-center min-h-screen pointer-events-none">
          <div className="text-center pointer-events-auto bg-white/5 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h1 className="text-5xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">Let's Virtual MMO</h1>
            <p className="text-slate-300 mb-8 max-w-md mx-auto text-lg font-light">
              Enter your nickname to join the party
            </p>

            <input
              type="text"
              placeholder="Your Nickname..."
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 mb-6 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-center text-lg"
              maxLength={15}
            />

            <button
              onClick={handleJoin}
              className="w-full px-8 py-4 bg-indigo-600/80 hover:bg-indigo-500/90 transition-all rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-[1.02]"
            >
              Enter World
            </button>
          </div>
        </div>
      )}

      {/* In-Game Overlay */}
      {isJoined && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
          {/* Top-left: room badge */}
          <div className="self-start">
            <div className="bg-black/20 backdrop-blur-xl px-4 py-1.5 rounded-full text-xs font-medium border border-white/10 text-white/50 tracking-wider">
              🎉 {roomId ? `Room ${roomId}` : 'Joining...'}
            </div>
          </div>

          <ConcertNotification />
          <SmashEmNotification />
          <PlayerRoster />
          <GameGuide />
          <ChatInterface />
        </div>
      )}

      {/* Dance Mode Overlay */}
      {isJoined && isDanceMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 pointer-events-auto">
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-semibold">Choose a move</p>
          <div className="flex items-end gap-5">
            {[
              { emoji: '🕺', label: 'Groove', state: 'Dance', color: 'from-purple-700/80 to-purple-500/80 shadow-purple-500/30', size: 'w-16 h-16' },
              { emoji: '💃', label: 'Sway', state: 'Dance2', color: 'from-fuchsia-700/80 to-pink-500/80 shadow-pink-500/30', size: 'w-20 h-20 -mb-1' },

            ].map(btn => (
              <button
                key={btn.state}
                onClick={() =>
                  import('./services/socket').then(({ socket }) =>
                    socket.emit('playerAction', { state: btn.state })
                  )
                }
                className={`${btn.size} flex flex-col items-center justify-center gap-1 rounded-full bg-gradient-to-tr ${btn.color} border border-white/20 backdrop-blur-xl shadow-[0_0_30px_var(--tw-shadow-color)] active:scale-95 transition-all hover:scale-105`}
              >
                <span className="text-2xl leading-none">{btn.emoji}</span>
                <span className="text-[9px] text-white/70 font-semibold">{btn.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              useMMOStore.getState().setIsDanceMode(false);
              import('./services/socket').then(({ socket }) => socket.emit('playerAction', { state: 'Idle' }));
            }}
            className="text-white/40 hover:text-white/80 text-xs transition-colors mt-1 tracking-wider"
          >
            ✕ Leave dance floor
          </button>
        </div>
      )}



      {/* Incoming Challenge Overlay */}
      {isJoined && incomingChallenge && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div className="relative bg-black/60 backdrop-blur-2xl p-8 rounded-3xl border border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.25)] text-center max-w-sm w-full mx-4">
            {/* Pulsing glow ring — decorative only, must not block button clicks */}
            <div className="absolute -inset-px rounded-3xl border border-red-500/20 animate-pulse pointer-events-none" />
            <div className="text-5xl mb-4 animate-bounce">⚔️</div>
            <h3 className="text-2xl font-black text-white mb-1 tracking-tight">Challenge!</h3>
            <p className="text-white/50 text-sm mb-8">A player wants to fight you. Step into the arena?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  console.log('[Challenge] Accept button clicked');
                  const state = useMMOStore.getState();
                  console.log('[Challenge] incomingChallenge state:', state.incomingChallenge);
                  const challengerId = state.incomingChallenge?.challengerId;
                  console.log('[Challenge] challengerId:', challengerId);
                  if (!challengerId) {
                    console.error('[Challenge] ERROR: challengerId is missing!');
                    return;
                  }
                  import('./services/socket').then(({ socket }) => {
                    console.log('[Challenge] socket connected:', socket.connected, '| emitting acceptChallenge to:', challengerId);
                    socket.emit('acceptChallenge', challengerId);
                  });
                }}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02]"
              >
                Accept ⚔️
              </button>
              <button
                onClick={() => {
                  console.log('[Challenge] Decline button clicked');
                  const challengerId = useMMOStore.getState().incomingChallenge?.challengerId;
                  import('./services/socket').then(({ socket }) => {
                    console.log('[Challenge] emitting declineChallenge to:', challengerId);
                    socket.emit('declineChallenge', challengerId);
                    useMMOStore.getState().setIncomingChallenge(null);
                  });
                }}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-white/70 hover:text-white transition-all"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Damage VFX Overlay */}
      {isJoined && damageVFX && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-red-600/30 transition-opacity duration-150" />
      )}

      {/* Hit VFX Overlay */}
      {isJoined && hitVFX && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-yellow-100/40 mix-blend-overlay transition-opacity duration-150" />
      )}

      {/* Active Battle HUD & Combat Controls */}
      {isJoined && activeBattle && (
        <>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-3xl px-4">
            <div className="bg-black/40 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4">
              <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em] text-center">
                Battle in Progress
              </h2>
              <div className="flex justify-between items-center w-full gap-8">
                {/* Local Player Health */}
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold mb-2 text-indigo-300 uppercase tracking-wider">
                    <span>You</span>
                    <span>{localHealth} HP</span>
                  </div>
                  <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden shadow-inner border border-white/5 skew-x-[-15deg]">
                    <div
                      className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 h-full transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      style={{ width: `${localHealth}%` }}
                    />
                  </div>
                </div>

                {/* VS Badge */}
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] mx-4 skew-x-[-10deg]">
                  VS
                </div>

                {/* Opponent Health */}
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold mb-2 text-red-300 uppercase tracking-wider flex-row-reverse">
                    <span>Opponent</span>
                  </div>
                  <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden shadow-inner border border-white/5 skew-x-[15deg]">
                    <div
                      className="bg-gradient-to-l from-red-600 via-rose-500 to-red-400 h-full transition-all duration-300 ml-auto shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      style={{ width: `${opponentHealth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-6 pointer-events-auto">
            <button
              onClick={() => {
                useMMOStore.getState().attemptAttack(10, 'Attack1');
              }}
              className="w-20 h-20 bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all rounded-full font-bold text-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center gap-1 active:scale-95 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">👊</span>
              <span className="text-[10px] text-white/50">Jab (1)</span>
            </button>
            <button
              onClick={() => {
                useMMOStore.getState().attemptAttack(15, 'GuyAction');
              }}
              className="w-20 h-20 bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all rounded-full font-bold text-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center gap-1 active:scale-95 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🥊</span>
              <span className="text-[10px] text-white/50">Cross (2)</span>
            </button>
            <button
              onClick={() => {
                useMMOStore.getState().attemptAttack(20, 'GuyAction');
              }}
              className="w-24 h-24 -mt-2 bg-gradient-to-tr from-rose-600/80 to-orange-500/80 backdrop-blur-xl border border-white/30 hover:from-rose-500 hover:to-orange-400 transition-all rounded-full font-bold text-sm shadow-[0_0_40px_rgba(244,63,94,0.4)] flex flex-col items-center justify-center gap-1 active:scale-95 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🔥</span>
              <span className="text-xs text-white/90">Heavy (3)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
