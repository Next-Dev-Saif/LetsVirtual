import { useMMOStore } from '../../store/useMMOStore';
import { Disc, Play, Check, X, Sparkles } from 'lucide-react';
import { socket } from '../../services/socket';

const TRACKS = [
  { id: 'synth', title: 'Cyber Birthday Synth 🎂', genre: 'Synthwave / Party', duration: '2:45' },
  { id: 'disco', title: 'Neon Disco Fever 🕺', genre: 'Groovy 80s Electro', duration: '3:12' },
  { id: 'lofi', title: 'Lo-Fi Sunset Lounge 🌇', genre: 'Chill Party Vibe', duration: '2:50' },
  { id: 'hyper', title: 'Hyperpop Celebration 🎉', genre: 'High-Energy Bass Remix', duration: '3:05' },
];

export function JukeboxModal() {
  const isJukeboxOpen = useMMOStore((state) => state.isJukeboxOpen);
  const setIsJukeboxOpen = useMMOStore((state) => state.setIsJukeboxOpen);
  const activeJukeboxTrack = useMMOStore((state) => state.activeJukeboxTrack);

  if (!isJukeboxOpen) return null;

  const handleSelectTrack = (track) => {
    socket.emit('changeJukeboxTrack', {
      trackId: track.id,
      trackTitle: track.title
    });
    setIsJukeboxOpen(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl pointer-events-auto p-4 animate-fade-in">
      <div className="relative bg-slate-950 border border-purple-500/40 p-6 rounded-3xl shadow-[0_0_80px_rgba(168,85,247,0.4)] max-w-md w-full flex flex-col gap-5 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -inset-10 bg-gradient-to-r from-purple-600/15 via-fuchsia-500/15 to-indigo-600/15 rounded-full blur-3xl opacity-70 pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Disc className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>CYBER JUKEBOX</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h2>
              <p className="text-xs text-slate-400 font-medium">Select a track to play for the entire room</p>
            </div>
          </div>
          <button
            onClick={() => setIsJukeboxOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track List */}
        <div className="flex flex-col gap-2.5">
          {TRACKS.map((track) => {
            const isPlaying = activeJukeboxTrack?.id === track.id;
            return (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                  isPlaying
                    ? 'bg-purple-900/40 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                      isPlaying
                        ? 'bg-purple-500 text-white border-purple-300 shadow-md'
                        : 'bg-white/5 text-purple-300 border-white/10 group-hover:bg-purple-500/20'
                    }`}
                  >
                    {isPlaying ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isPlaying ? 'text-purple-200' : 'text-slate-200'}`}>
                      {track.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{track.genre}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPlaying && (
                    <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 uppercase">
                      Playing
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">{track.duration}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
