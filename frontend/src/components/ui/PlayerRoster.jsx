import { useMMOStore } from '../../store/useMMOStore';
import { Users, Music, Swords, Sparkles } from 'lucide-react';

export function PlayerRoster() {
  const players = useMMOStore((state) => state.players);
  const localId = useMMOStore((state) => state.localId);
  const count = Object.keys(players).length;

  return (
    <div className="absolute top-6 right-6 z-20 pointer-events-auto">
      <div className="bg-slate-950/85 backdrop-blur-2xl rounded-2xl border border-purple-500/30 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden min-w-[200px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-white/5">
          <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" /> Room Roster
          </span>
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
            {count} / 5 Online
          </span>
        </div>

        {/* Player list */}
        <div className="px-3.5 py-3 flex flex-col gap-2">
          {Object.values(players).map((p) => {
            const isMe = p.id === localId;
            const isDancing = p.state?.startsWith('Dance');
            const isBattling = p.state?.startsWith('Attack') || p.state === 'GuyAction';

            return (
              <div key={p.id} className="flex items-center gap-3 py-1">
                {/* Avatar Initial Badge */}
                <div className="relative shrink-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-md ${
                      isMe
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border border-purple-400/50'
                        : 'bg-white/10 text-slate-200 border border-white/10'
                    }`}
                  >
                    {(p.nickname || '?')[0].toUpperCase()}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                      isDancing
                        ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                        : isBattling
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate flex items-center gap-1 ${isMe ? 'text-purple-300' : 'text-slate-200'}`}>
                    {p.nickname || `Player`}
                    {isMe && <span className="text-[9px] font-normal text-purple-400/80">(You)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium mt-0.5">
                    {isDancing ? (
                      <span className="flex items-center gap-1 text-purple-300">
                        <Music className="w-3 h-3 text-purple-400 animate-spin" /> Dancing
                      </span>
                    ) : isBattling ? (
                      <span className="flex items-center gap-1 text-rose-400">
                        <Swords className="w-3 h-3 text-rose-400" /> Battling
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Standing by
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
