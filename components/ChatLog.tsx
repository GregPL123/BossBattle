
import React, { useEffect, useRef } from 'react';
import { TranscriptItem, Language } from '../types';

interface ChatLogProps {
  transcript: TranscriptItem[];
  lang: Language;
  isAiSpeaking: boolean;
}

const ChatLog: React.FC<ChatLogProps> = ({ transcript, lang, isAiSpeaking }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-20">
        <div className="text-6xl mb-6">📄</div>
        <p className="font-sans text-[11px] uppercase tracking-[0.6em] font-bold text-os-slate">Establishing Secure Session Transcript...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 py-6 relative">
      {transcript.map((item, idx) => {
        const isUser = item.role === 'user';
        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={item.id} className={`flex flex-col animate-fade-in group ${isUser ? 'items-end' : 'items-start'}`}>
            
            {/* Professional Metadata */}
            <div className={`flex items-center gap-4 mb-2 font-sans text-[9px] font-bold uppercase tracking-widest ${isUser ? 'flex-row-reverse' : ''}`}>
               <span className="text-os-slate/40">{timeStr}</span>
               <span className={`h-px w-4 ${isUser ? 'bg-os-primary' : 'bg-os-accent'}`}></span>
               <span className={isUser ? 'text-os-primary' : 'text-os-accent'}>
                 {isUser ? 'YOU' : 'EXECUTIVE'}
               </span>
            </div>

            {/* Clean Message Card */}
            <div className={`
              p-6 rounded-2xl text-base leading-relaxed tracking-tight border shadow-sm transition-all relative overflow-hidden backdrop-blur-md max-w-[85%]
              ${isUser 
                ? 'bg-os-primary/5 border-os-primary/20 text-white' 
                : 'bg-white/5 border-white/10 text-gray-100'}
            `}>
              <span className="relative z-10 block font-sans font-medium text-lg">
                {item.text}
                {item.isPartial && (
                  <span className="inline-block w-1.5 h-4 ml-2 bg-os-primary animate-pulse align-middle"></span>
                )}
              </span>
            </div>

            {/* Subtle metrics for user messages */}
            {isUser && !item.isPartial && (
               <div className="mt-2 flex gap-3 opacity-0 group-hover:opacity-40 transition-all">
                  <span className="text-[7px] font-bold text-os-slate tracking-widest uppercase">Verified Response</span>
                  <span className="text-[7px] font-bold text-os-slate tracking-widest uppercase">KPI_ALIGN: NOMINAL</span>
               </div>
            )}
          </div>
        );
      })}
      
      {isAiSpeaking && (
         <div className="flex items-center gap-4 pl-4 opacity-40">
            <div className="flex gap-1.5">
               <div className="w-1.5 h-1.5 bg-os-accent rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-os-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
               <div className="w-1.5 h-1.5 bg-os-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-[9px] font-bold text-os-accent uppercase tracking-widest italic">Executive is responding...</span>
         </div>
      )}

      <div ref={bottomRef} className="h-8" />
    </div>
  );
};

export default ChatLog;
