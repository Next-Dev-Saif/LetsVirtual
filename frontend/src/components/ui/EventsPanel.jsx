import { useState } from 'react';
import { Radio, Music, Target, Calendar, X, Clock } from 'lucide-react';
import { useMMOStore } from '../../store/useMMOStore';

export function EventsPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const concertStatus = useMMOStore((state) => state.concertState.status);
  const smashEmStatus = useMMOStore((state) => state.smashEmState.status);
  const eventCycleState = useMMOStore((state) => state.eventCycleState);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-24 right-6 z-20 bg-slate-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl text-xs font-extrabold text-purple-300 shadow-[0_0_30px_rgba(0,0,0,0.6)] hover:bg-slate-900 transition-all pointer-events-auto border border-purple-500/30 flex items-center gap-2"
      >
        <Calendar className="w-4 h-4 text-purple-400" />
        <span>Show Events</span>
      </button>
    );
  }

  return (
    <div className="absolute top-24 right-6 z-20 pointer-events-auto w-72">
      <div className="bg-slate-950/85 backdrop-blur-2xl p-4 rounded-2xl border border-purple-500/30 shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col gap-3">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-xs font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-400" /> Room Event Cycle
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 10-Minute Loop Status Banner */}
        {eventCycleState.status === 'cooldown' && (
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 p-2.5 rounded-xl border border-purple-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-[11px] font-bold text-purple-200">Next Cycle In:</span>
            </div>
            <span className="text-xs font-mono font-black text-pink-300 bg-black/40 px-2 py-0.5 rounded border border-pink-500/30">
              {formatTime(eventCycleState.cooldownCountdown)}
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Live Concert Event Card */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              concertStatus === 'active' || concertStatus === 'counting'
                ? 'bg-purple-900/30 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" /> 1. Live 3D Concert
              </span>
              <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                {concertStatus === 'active' ? 'LIVE NOW' : concertStatus === 'counting' ? 'SOON' : 'READY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              EngineQueen 3D Dance Showcase with multi-phase Dolly Zoom camera.
            </p>
          </div>

          {/* Smash Em Arena Event Card */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              smashEmStatus === 'active' || smashEmStatus === 'counting'
                ? 'bg-amber-900/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" /> 2. Egg Smash 'Em Arena
              </span>
              <span className="text-[9px] font-mono font-bold text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-400/30">
                {smashEmStatus === 'active' ? 'IN PROGRESS' : smashEmStatus === 'counting' ? 'SOON' : 'NEXT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              3D parabolic egg shooting target minigame. First to 20 pts wins!
            </p>
          </div>

          {/* Free World Exploration */}
          <div className="p-3 rounded-xl border bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-400" /> 3. 10-Min Free World Loop
              </span>
              <span className="text-[9px] font-mono font-bold text-cyan-200 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/30">
                {eventCycleState.status === 'cooldown' ? 'FREE PLAY' : 'AUTOMATED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Explore the island, dance on stage, or hang out. Repeats every 10 mins!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
