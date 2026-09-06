import { useEffect, useState } from 'react';
import { useMMOStore } from '../../store/useMMOStore';
import { Heart, Sparkles, PartyPopper, Gift } from 'lucide-react';

export function BirthdayWishFeed() {
  const birthdayWishes = useMMOStore((state) => state.birthdayWishes);
  const [activeWish, setActiveWish] = useState(null);

  useEffect(() => {
    if (!birthdayWishes || birthdayWishes.length === 0) return;

    const latest = birthdayWishes[birthdayWishes.length - 1];
    if (latest && Date.now() - latest.timestamp < 7500) {
      setActiveWish(latest);

      const timer = setTimeout(() => {
        setActiveWish(null);
      }, 7500);

      return () => clearTimeout(timer);
    }
  }, [birthdayWishes]);

  if (!activeWish) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center w-full max-w-lg px-4 animate-bounce-short">
      <div className="relative bg-slate-950/90 backdrop-blur-2xl px-6 py-4 rounded-3xl border-2 border-amber-400/60 shadow-[0_0_60px_rgba(245,158,11,0.5)] flex flex-col items-center gap-2 text-center text-white overflow-hidden group">
        {/* Ambient background particle glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-rose-500/25 to-yellow-500/20 rounded-3xl blur-xl opacity-90 animate-pulse" />

        {/* Top Header Badge */}
        <div className="relative flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-amber-300 bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-400/40 shadow-sm">
          <Gift className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          <span>LIVE BIRTHDAY WISH FROM <span className="text-white font-extrabold">{activeWish.senderName}</span></span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </div>

        {/* Main Wish Text */}
        <p className="relative text-sm font-black text-slate-100 italic leading-relaxed max-w-md drop-shadow-sm flex items-center gap-2 mt-1">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400 inline shrink-0 animate-pulse" />
          <span>“{activeWish.text}”</span>
          <PartyPopper className="w-4 h-4 text-amber-400 inline shrink-0" />
        </p>

        {/* Micro Footer Indicator */}
        <div className="relative text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          ✨ Interactive Wish Feed
        </div>
      </div>
    </div>
  );
}
