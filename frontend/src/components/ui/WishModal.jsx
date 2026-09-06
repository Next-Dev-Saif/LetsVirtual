import { useState } from 'react';
import { useMMOStore } from '../../store/useMMOStore';
import { Heart, Send, Sparkles, X } from 'lucide-react';
import { socket } from '../../services/socket';

const PRESET_WISHES = [
  'Happy Birthday! Wishing you a legendary celebration! 🎂🎉',
  'May your birthday be filled with endless joy & party vibes! ✨🥳',
  'Happy Birthday! Keep shining brighter every year! 🚀💖',
  'Best birthday party ever! Cheers to health & happiness! 🎁🥂'
];

export function WishModal() {
  const isWishModalOpen = useMMOStore((state) => state.isWishModalOpen);
  const setIsWishModalOpen = useMMOStore((state) => state.setIsWishModalOpen);
  const [customWish, setCustomWish] = useState('');

  if (!isWishModalOpen) return null;

  const handleSendWish = (textToSend) => {
    const wishText = textToSend || customWish.trim();
    if (!wishText) return;

    socket.emit('sendBirthdayWish', { text: wishText });
    setCustomWish('');
    setIsWishModalOpen(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl pointer-events-auto p-4 animate-fade-in">
      <div className="relative bg-slate-950 border border-rose-500/40 p-6 rounded-3xl shadow-[0_0_80px_rgba(244,63,94,0.4)] max-w-md w-full flex flex-col gap-5 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -inset-10 bg-gradient-to-r from-rose-600/15 via-pink-500/15 to-amber-500/15 rounded-full blur-3xl opacity-70 pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <Heart className="w-5 h-5 animate-pulse text-rose-400 fill-rose-400/30" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>BIRTHDAY WISH BOX</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h2>
              <p className="text-xs text-slate-400 font-medium">Broadcast a 3D birthday wish to everyone in room</p>
            </div>
          </div>
          <button
            onClick={() => setIsWishModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Wishes */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-rose-300">Quick Birthday Wishes</span>
          {PRESET_WISHES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendWish(preset)}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-950/40 hover:border-rose-500/40 text-xs font-medium text-slate-200 text-left transition-all active:scale-98 shadow-sm flex items-center justify-between group"
            >
              <span>{preset}</span>
              <Send className="w-3.5 h-3.5 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Custom Wish Form */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <span className="text-[10px] uppercase font-black tracking-widest text-rose-300">Custom Message</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customWish}
              onChange={(e) => setCustomWish(e.target.value)}
              placeholder="Write your custom birthday wish..."
              className="flex-1 bg-white/5 border border-white/10 focus:border-rose-400/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium placeholder:text-slate-500"
            />
            <button
              onClick={() => handleSendWish()}
              disabled={!customWish.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
