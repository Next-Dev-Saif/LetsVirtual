import { useMMOStore } from '../../store/useMMOStore';
import { Radio, Sparkles, Hand, PartyPopper, Heart, Disc } from 'lucide-react';

export function ConcertNotification() {
  const concertState = useMMOStore((state) => state.concertState);
  const { status, countdown, duration } = concertState;

  if (status === 'idle') return null;

  // Format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAudienceAction = (actionType) => {
    const store = useMMOStore.getState();
    const localId = store.localId || 'local';
    const nickname = store.localNickname || 'You';

    // Instant local visual feedback
    store.addAudienceVFX({
      id: `${localId}-${Date.now()}-${Math.random()}`,
      senderId: localId,
      nickname,
      actionType,
      timestamp: Date.now()
    });

    import('../../services/socket').then(({ socket }) => {
      socket.emit('concertAudienceAction', { actionType });
    });
  };

  return (
    <>
      {/* Top Banner: Countdown State */}
      {status === 'counting' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <div className="relative bg-slate-950/85 backdrop-blur-2xl px-6 py-3.5 rounded-2xl border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.35)] flex items-center gap-4 text-white overflow-hidden group">
            {/* Ambient inner glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-fuchsia-500/20 to-indigo-600/20 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse text-purple-300" />
            </div>

            <div className="relative flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Live Concert Upcoming
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/30">
                  EngineQueen
                </span>
              </div>
              <p className="text-sm text-slate-200 font-medium">
                Concert will start in <span className="font-mono font-black text-amber-300 text-base ml-1">{formatTime(countdown)}</span>
              </p>
            </div>

            {/* Countdown progress ring indicator */}
            <div className="relative w-11 h-11 flex items-center justify-center ml-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-400 transition-all duration-1000 ease-linear"
                  strokeDasharray={`${((60 - countdown) / 60) * 100}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-black text-purple-200">{countdown}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Concert Showcase HUD */}
      {status === 'active' && (
        <>
          {/* Top Live Concert Header */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center">
            <div className="bg-slate-950/90 backdrop-blur-2xl px-6 py-3 rounded-full border border-pink-500/40 shadow-[0_0_45px_rgba(236,72,153,0.4)] flex items-center gap-3 text-white">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>

              <Disc className="w-4 h-4 text-pink-400 animate-spin" />

              <span className="font-black text-xs tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300">
                LIVE SHOWCASE: ENGINE QUEEN
              </span>

              {/* Audio Equalizer Visualizer Bars */}
              <div className="flex items-end gap-0.5 h-4 px-1">
                <span className="w-1 bg-pink-400 rounded-t animate-[bounce_0.8s_infinite_100ms] h-full"></span>
                <span className="w-1 bg-purple-400 rounded-t animate-[bounce_0.7s_infinite_200ms] h-3"></span>
                <span className="w-1 bg-indigo-400 rounded-t animate-[bounce_0.9s_infinite_300ms] h-4"></span>
                <span className="w-1 bg-fuchsia-400 rounded-t animate-[bounce_0.6s_infinite_150ms] h-2"></span>
              </div>

              <span className="font-mono text-xs text-amber-300 font-bold bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Bottom Audience Interactive Controls Toolbar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-2">
            <div className="text-[10px] uppercase font-black tracking-widest text-purple-300 bg-slate-950/80 px-3.5 py-1 rounded-full border border-purple-500/30 backdrop-blur-md shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300" /> Audience Concert Reactions
            </div>

            <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-2xl p-2.5 rounded-2xl border border-purple-500/35 shadow-[0_0_50px_rgba(147,51,234,0.35)]">
              {[
                { id: 'wave', icon: Hand, label: 'Wave', color: 'hover:bg-purple-600/30 hover:border-purple-400/60 text-purple-300' },
                { id: 'cheer', icon: PartyPopper, label: 'Cheer', color: 'hover:bg-amber-600/30 hover:border-amber-400/60 text-amber-300' },
                { id: 'fireworks', icon: Sparkles, label: 'Fireworks', color: 'hover:bg-cyan-600/30 hover:border-cyan-400/60 text-cyan-300' },
                { id: 'hearts', icon: Heart, label: 'Hearts', color: 'hover:bg-rose-600/30 hover:border-rose-400/60 text-rose-300' },
              ].map((btn) => {
                const IconComp = btn.icon;
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleAudienceAction(btn.id)}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white/5 border border-white/10 transition-all duration-200 active:scale-90 ${btn.color} group shadow-md`}
                  >
                    <IconComp className="w-6 h-6 group-hover:scale-125 transition-transform duration-200" />
                    <span className="text-[9px] font-bold text-slate-200 mt-1">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
