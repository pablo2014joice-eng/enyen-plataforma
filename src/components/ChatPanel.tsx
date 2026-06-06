import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Sparkles, User, AudioLines, Send } from 'lucide-react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  isThinking: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isMicSupported: boolean;
  onSendMessage: (text: string) => void;
  onToggleListen: () => void;
}

export default function ChatPanel({
  messages,
  isThinking,
  isSpeaking,
  isListening,
  isMicSupported,
  onSendMessage,
  onToggleListen,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');

  // Rola automaticamente para baixo com novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, isSpeaking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isThinking) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col h-[400px] bg-slate-900/30 border border-slate-800/60 rounded-3xl relative overflow-hidden backdrop-blur-md">
      {/* Scrollable Message Box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              A Orni está acordada!
            </p>
            <p className="text-xs text-slate-500">
              Segura na esfera acima para falar. Tudo o que disseres irá surgir no chat!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] ${
                  msg.role === 'user'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-[12.5px] leading-relaxed relative ${
                  msg.role === 'user'
                    ? 'bg-sky-600/10 border border-sky-500/20 text-sky-200 rounded-tr-none'
                    : 'bg-slate-950/60 border border-emerald-500/10 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))
        )}

        {/* Thinking State Indicator */}
        {isThinking && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center animate-spin">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-950/60 border border-teal-500/10 text-slate-400 py-2 px-3.5 rounded-2xl rounded-tl-none italic text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              A processar...
            </div>
          </div>
        )}

        {/* Vocal Synthesis Visualizer */}
        {isSpeaking && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center animate-pulse">
              <AudioLines className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 py-1.5 px-3 rounded-2xl rounded-tl-none text-xs flex flex-col gap-1 w-full">
              <div className="flex items-center gap-1 font-medium">
                <AudioLines className="w-3 h-3 animate-bounce text-emerald-400" />
                <span>A Orni está a responder por voz...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Mic Support warning & Action Guidelines */}
      <div className="p-4 bg-slate-950/85 border-t border-slate-800/80 flex flex-col items-center justify-center text-center space-y-2 py-5">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
          <Mic className="w-4 h-4 animate-pulse text-emerald-400" />
          <span>Segura na Orni para falar!</span>
        </div>
        <p className="text-[11px] text-slate-400 max-w-xs leading-normal">
          Pressiona e mantém premido o clique na esfera Orni para ativares a voz. Solta quando terminares de falar e ela responderá!
        </p>
        {!isMicSupported && (
          <div className="text-[10px] text-rose-450 font-mono flex items-center justify-center gap-1 border border-rose-900/40 bg-rose-950/20 px-2.5 py-1 rounded-xl">
            <MicOff className="w-3.5 h-3.5 animate-bounce" />
            <span>Permite o acesso ao microfone nas definições do navegador.</span>
          </div>
        )}
        <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest mt-1">
          Auto-Mute desativado • Resposta Automática Ativa
        </p>
      </div>
    </div>
  );
}
