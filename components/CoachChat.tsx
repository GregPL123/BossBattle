
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, TranscriptItem, Scenario } from '../types';

interface CoachChatProps {
  apiKey: string;
  result: AnalysisResult;
  transcript: TranscriptItem[];
  scenario: Scenario;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const CoachChat: React.FC<CoachChatProps> = ({ apiKey, result, transcript, scenario }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: "I've analyzed your performance. I'm ready to answer specific questions about your negotiation tactics, tone, or missed opportunities. What would you like to know?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const ai = new GoogleGenAI({ apiKey });
      
      const dialogue = transcript
        .filter(t => !t.isPartial)
        .map(t => `${t.role.toUpperCase()}: ${t.text}`)
        .join('\n');

      const systemInstruction = `
        You are an expert Negotiation Coach. 
        The user just completed a roleplay scenario: "${scenario.name}".
        
        Analysis Summary:
        - Score: ${result.score}/100
        - Outcome: ${result.outcome}
        - Feedback: ${result.feedback}
        
        Transcript:
        ${dialogue}
        
        Your goal is to answer the user's follow-up questions about their performance.
        Be specific, quoting the transcript where possible.
        Be encouraging but honest.
        Keep answers concise (under 100 words) unless asked for details.
      `;

      // Fixed: Using gemini-3-pro-preview for complex conversational reasoning
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction },
      });

      chatRef.current = chat;
    };

    initChat();
  }, [apiKey, result, transcript, scenario]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg.text });
      const text = response.text || "I couldn't generate a response.";
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I lost connection to the coaching server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="bg-gray-950/80 p-4 border-b border-gray-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xl">
           🧠
        </div>
        <div>
          <h3 className="font-bold text-white">Coach Debrief</h3>
          <p className="text-xs text-gray-400">Ask about your performance</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-700 flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-gray-950/80 border-t border-gray-800">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g. How could I have been more persuasive?"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachChat;
