
import React, { useEffect, useRef } from 'react';
import { TranscriptItem, UserProfile, Language } from '../types';
import { translations } from '../translations';

interface ChatLogProps {
  transcript: TranscriptItem[];
  userProfile?: UserProfile;
  lang: Language;
}

const ChatLog: React.FC<ChatLogProps> = ({ transcript, userProfile, lang }) => {
  const t = translations[lang];
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [transcript]);

  const handleDownload = () => {
    if (transcript.length === 0) return;
    const textContent = transcript.map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.role.toUpperCase()}: ${t.text}`).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (transcript.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mt-8 flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-2 px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500">{t.liveTranscript}</span>
        </div>
        <button onClick={handleDownload} className="text-xs flex items-center gap-1 text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800">
          📥 {t.export}
        </button>
      </div>
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 flex-1 overflow-y-auto space-y-6 shadow-inner custom-scrollbar relative">
        {transcript.map((item) => (
          <div key={item.id} className={`flex gap-3 relative z-10 ${item.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full border border-gray-700 overflow-hidden shrink-0 shadow-lg`}>
              <img src={item.role === 'user' ? `https://api.dicebear.com/7.x/micah/svg?seed=${userProfile?.avatarSeed || 'user'}&backgroundColor=1f2937` : `https://api.dicebear.com/7.x/bottts/svg?seed=boss&backgroundColor=1f2937`} alt={item.role} className="w-full h-full object-cover" />
            </div>
            <div className={`flex flex-col max-w-[80%] ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${item.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'}`}>
                {item.text}
                {item.isPartial && <span className="inline-block w-1.5 h-1.5 ml-1 bg-current rounded-full animate-bounce"></span>}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1">{new Date(item.timestamp).toLocaleTimeString([], {minute:'2-digit', second:'2-digit'})}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatLog;
