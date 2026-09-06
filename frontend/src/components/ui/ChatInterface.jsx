import { useState, useRef, useEffect } from 'react';
import { useMMOStore } from '../../store/useMMOStore';
import { socket } from '../../services/socket';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const messages = useMMOStore((state) => state.chatMessages);
  const localId = useMMOStore((state) => state.localId);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('chatMessage', { text: message.trim() });
      setMessage('');
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-20 w-full max-w-[300px] flex flex-col gap-2 pointer-events-auto">
      <div className="bg-slate-950/85 backdrop-blur-2xl rounded-2xl border border-purple-500/30 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col h-72">
        {/* Header */}
        <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs font-black text-purple-300 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>ROOM LIVE CHAT</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
            <Sparkles className="w-3 h-3 text-amber-400" /> Live
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.map((msg, i) => {
            const isMe = msg.id === localId;
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                  {msg.isSystem ? 'System Notice' : (isMe ? 'You' : msg.nickname || msg.id.slice(0, 4))}
                </span>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs font-medium max-w-[85%] leading-relaxed ${msg.isSystem
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-inner'
                    : isMe
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-white/10 text-slate-100 rounded-bl-none border border-white/10'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-2 border-t border-white/10 bg-black/40 flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type to chat..."
            className="flex-1 bg-white/5 text-xs text-white px-3.5 py-2 rounded-xl outline-none border border-white/10 focus:border-purple-400/60 focus:bg-white/10 transition-all placeholder:text-slate-500 font-medium"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 transition-all active:scale-95 shadow-md flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
