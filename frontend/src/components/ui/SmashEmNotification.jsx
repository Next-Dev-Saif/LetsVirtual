import { useMMOStore } from '../../store/useMMOStore';
import { Target, Crosshair, Trophy, Flame, Zap, Sparkles, Crown, Laugh } from 'lucide-react';

export function SmashEmNotification() {
  const smashEmState = useMMOStore((state) => state.smashEmState);
  const localId = useMMOStore((state) => state.localId);
  const players = useMMOStore((state) => state.players);

  const { status, countdown, scores, winnerName, joke } = smashEmState;

  if (status === 'idle') return null;

  // Format scoreboard list sorted by points descending
  const sortedScores = Object.entries(scores || {})
    .map(([pid, score]) => ({
      id: pid,
      name: pid === localId ? 'You' : players[pid]?.nickname || `Player ${pid.substring(0, 4)}`,
      score,
      isLocal: pid === localId
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <>
      {/* Top Banner: Countdown State */}
      {status === 'counting' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="relative bg-slate-950/90 backdrop-blur-2xl px-6 py-3.5 rounded-2xl border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center gap-4 text-white overflow-hidden group">
            {/* Ambient light glow inside banner */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/20 via-yellow-500/20 to-orange-600/20 rounded-2xl blur-md opacity-80" />

            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-inner">
              <Target className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
            <div className="relative flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> Egg Smash 'Em Arena Upcoming
              </span>
              <p className="text-sm text-slate-200 font-medium">
                Minigame starts in <span className="font-mono font-black text-yellow-300 text-base ml-1">{countdown}s</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Minigame HUD: Crosshair & Live Leaderboard */}
      {status === 'active' && (
        <>
          {/* Fixed Center Tactical Aim Crosshair */}
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <div className="relative flex items-center justify-center w-10 h-10 border-2 border-amber-400/90 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-pulse">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
              <div className="absolute -top-3.5 w-0.5 h-2.5 bg-amber-400" />
              <div className="absolute -bottom-3.5 w-0.5 h-2.5 bg-amber-400" />
              <div className="absolute -left-3.5 h-0.5 w-2.5 bg-amber-400" />
              <div className="absolute -right-3.5 h-0.5 w-2.5 bg-amber-400" />
            </div>
          </div>

          {/* Top Live Leaderboard HUD */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-md px-4 flex flex-col items-center gap-2">
            <div className="bg-slate-950/90 backdrop-blur-2xl px-5 py-3.5 rounded-2xl border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.35)] w-full flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-amber-400 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>EGG SMASH 'EM ARENA</span>
                </span>
                <span className="text-yellow-300 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">RACE TO 20 PTS</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                {sortedScores.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex justify-between items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      p.isLocal
                        ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/50 text-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-white/5 border border-white/5 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400 font-black">#{idx + 1}</span>
                      <span className="flex items-center gap-1">
                        {idx === 0 && <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />}
                        {p.name}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (p.score / 20) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-black text-xs text-yellow-300 w-12 text-right">{p.score} / 20</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] text-amber-200/90 font-semibold border border-amber-500/30 shadow-lg flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" /> Aim crosshair at stage photo target & Left Click to shoot eggs!
            </div>
          </div>
        </>
      )}

      {/* Winner & Egg Joke Overlay Modal */}
      {status === 'winner' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-2xl pointer-events-auto p-4 animate-fade-in">
          <div className="relative bg-slate-950 border-2 border-amber-400/80 p-8 rounded-3xl shadow-[0_0_90px_rgba(251,191,36,0.6)] text-center max-w-md w-full flex flex-col items-center gap-5 overflow-hidden">
            {/* Background glow circle */}
            <div className="absolute -inset-10 bg-gradient-to-r from-amber-500/15 via-yellow-500/25 to-orange-500/15 rounded-full blur-3xl opacity-70 pointer-events-none" />

            <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
              <Trophy className="w-10 h-10 text-amber-300 animate-bounce" />
            </div>

            <div className="flex flex-col items-center gap-1">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 tracking-tight drop-shadow-sm uppercase flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-300" /> EGG-CELLENT VICTORY!
              </h2>
              <p className="text-lg font-bold text-white mt-1">
                <span className="text-amber-300 underline underline-offset-4 decoration-amber-500 font-black">{winnerName}</span> WON THE ARENA!
              </p>
            </div>

            {/* Funny Birthday Egg Joke Card */}
            <div className="relative bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-400/40 p-5 rounded-2xl text-amber-100 text-sm font-medium leading-relaxed shadow-inner w-full flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest">
                <Laugh className="w-4 h-4 text-amber-300" /> Birthday Egg Joke
              </div>
              <p className="italic text-slate-200">“{joke}”</p>
            </div>

            <div className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mt-1 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" /> Returning to free world in 8 seconds...
            </div>
          </div>
        </div>
      )}
    </>
  );
}
