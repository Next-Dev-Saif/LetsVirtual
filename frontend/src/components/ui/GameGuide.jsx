import { useMMOStore } from '../../store/useMMOStore';
import { Music, Swords, Disc, Heart, Navigation, MousePointer } from 'lucide-react';

export function GameGuide() {
  const isJoined = !!useMMOStore((state) => state.roomId);
  const activeZone = useMMOStore((state) => state.activeZone);
  const activeBattle = useMMOStore((state) => state.activeBattle);
  const isDanceMode = useMMOStore((state) => state.isDanceMode);

  if (!isJoined || activeBattle || isDanceMode) return null;

  const getZoneConfig = () => {
    switch (activeZone) {
      case 'dance':
        return {
          title: 'Dance Zone Hotspot',
          desc: 'Groove & sync moves with the crowd',
          icon: Music,
          colorClass: 'bg-purple-950/85 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.4)]',
          badgeClass: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
          bgAccent: 'bg-purple-400'
        };
      case 'battle':
        return {
          title: '1v1 Battle Arena',
          desc: 'Challenge the nearest rival',
          icon: Swords,
          colorClass: 'bg-rose-950/85 border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.4)]',
          badgeClass: 'bg-rose-500/20 border-rose-400/40 text-rose-300',
          bgAccent: 'bg-rose-400'
        };
      case 'jukebox':
        return {
          title: 'Cyber Jukebox Console',
          desc: 'Change party music track for the room',
          icon: Disc,
          colorClass: 'bg-indigo-950/85 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.4)]',
          badgeClass: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300',
          bgAccent: 'bg-indigo-400'
        };
      case 'wishCard':
        return {
          title: 'Birthday Wish Box',
          desc: 'Broadcast custom 3D birthday wishes to everyone',
          icon: Heart,
          colorClass: 'bg-amber-950/85 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.4)]',
          badgeClass: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
          bgAccent: 'bg-amber-400'
        };
      default:
        return null;
    }
  };

  const zoneConfig = getZoneConfig();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-3 w-full max-w-lg px-4">
      {/* Zone prompt — shown when inside a zone */}
      {zoneConfig && (
        <div className="pointer-events-auto w-full animate-fade-in">
          <div
            className={`relative overflow-hidden rounded-2xl border backdrop-blur-2xl px-6 py-4 flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${zoneConfig.colorClass}`}
            onClick={() => {
              const store = useMMOStore.getState();
              if (activeZone === 'dance') {
                store.setIsDanceMode(true);
                import('../../services/socket').then(({ socket }) =>
                  socket.emit('playerAction', { state: 'Dance' })
                );
              } else if (activeZone === 'battle') {
                const { players, localId, localPlayerState } = store;
                const localPos = localPlayerState.position;
                let nearestId = null, nearestDist = Infinity;
                Object.values(players).forEach(p => {
                  if (p.id !== localId) {
                    const dx = p.position[0] - localPos[0];
                    const dz = p.position[2] - localPos[2];
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    if (dist < 10 && dist < nearestDist) { nearestDist = dist; nearestId = p.id; }
                  }
                });
                if (nearestId) {
                  import('../../services/socket').then(({ socket }) =>
                    socket.emit('challengePlayer', nearestId)
                  );
                }
              } else if (activeZone === 'jukebox') {
                store.setIsJukeboxOpen(true);
              } else if (activeZone === 'wishCard') {
                store.setIsWishModalOpen(true);
              }
            }}
          >
            {/* Shimmering background accent */}
            <div
              className={`absolute inset-0 opacity-15 ${zoneConfig.bgAccent}`}
              style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 60%)' }}
            />
            <div className="relative flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-md ${zoneConfig.badgeClass}`}>
                <zoneConfig.icon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-tight uppercase tracking-wider">
                  {zoneConfig.title}
                </p>
                <p className="text-slate-300 text-xs mt-0.5 font-medium">
                  {zoneConfig.desc}
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-2 shrink-0">
              <kbd className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs font-mono font-black text-amber-300 shadow-inner">
                E
              </kbd>
              <span className="text-slate-400 text-xs font-semibold">or Tap</span>
            </div>
          </div>
        </div>
      )}

      {/* Ambient controls guide */}
      {!activeZone && (
        <div className="flex items-center gap-3 opacity-75">
          <div className="h-px flex-1 bg-white/10" />
          <div className="flex gap-2 items-center">
            {[
              { icon: Navigation, key: 'WASD', label: 'Move' },
              { icon: MousePointer, key: 'Drag', label: 'Look' },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-1.5 bg-slate-950/80 border border-white/10 rounded-full px-3 py-1 backdrop-blur-md shadow-sm"
                >
                  <IconComponent className="w-3 h-3 text-purple-400" />
                  <kbd className="text-[10px] font-mono font-bold text-amber-300">{item.key}</kbd>
                  <span className="text-[10px] text-slate-400 font-medium">{item.label}</span>
                </div>
              );
            })}
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block animate-pulse" />
                Dance
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                Battle
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse" />
                Jukebox
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                Wish Box
              </span>
            </div>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      )}
    </div>
  );
}
