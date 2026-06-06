import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mic, MicOff, Volume2 } from 'lucide-react';
import OrniSphere from './components/OrniSphere';
import ChatPanel from './components/ChatPanel';
import VoiceSettings from './components/VoiceSettings';
import SphereCustomizer from './components/SphereCustomizer';
import { Message, VoiceConfig, OrniState } from './types';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function App() {
  const [orniState, setOrniState] = useState<OrniState>('initial');
  
  // Customization States
  const [sphereColor1, setSphereColor1] = useState<string>('#2563eb');
  const [sphereColor2, setSphereColor2] = useState<string>('#a855f7');
  const [hatType, setHatType] = useState<string>('none');
  const [hatColor1, setHatColor1] = useState<string>('#2563eb');
  const [hatColor2, setHatColor2] = useState<string>('#a855f7');
  const [glassesType, setGlassesType] = useState<string>('none');
  const [glassesColor1, setGlassesColor1] = useState<string>('#2563eb');
  const [glassesColor2, setGlassesColor2] = useState<string>('#a855f7');
  const [capType, setCapType] = useState<string>('none');
  const [capColor1, setCapColor1] = useState<string>('#2563eb');
  const [capColor2, setCapColor2] = useState<string>('#a855f7');
  const [itemType, setItemType] = useState<string>('none');
  const [itemColor1, setItemColor1] = useState<string>('#fbbf24');
  const [itemColor2, setItemColor2] = useState<string>('#38bdf8');
  const [bodyType, setBodyType] = useState<string>('none');
  const [bodyColor1, setBodyColor1] = useState<string>('#ef4444');
  const [bodyColor2, setBodyColor2] = useState<string>('#fbbf24');

  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voiceURI: '',
    pitch: 1.1, // Tom suave ligeiramente robótico e amigável
    rate: 1.05,
    muted: false,
  });

  // Configuração do reconhecedor de voz no carregamento inicial
  useEffect(() => {
    if (SpeechRecognition) {
      setIsMicSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'pt-PT';
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText && resultText.trim()) {
          handleSendMessage(resultText);
        }
      };
      
      rec.onerror = (e: any) => {
        console.warn('Erro de reconhecimento:', e.error);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(rec);
    } else {
      setIsMicSupported(false);
    }
  }, []);

  const speakText = (text: string) => {
    if (voiceConfig.muted || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanSpeech = text.replace(/[\*\_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    
    const allVoices = window.speechSynthesis.getVoices();
    const ptVoice = allVoices.find((v) => 
      v.lang.toLowerCase().startsWith('pt-pt') || 
      v.lang.toLowerCase().startsWith('pt-br') ||
      v.lang.toLowerCase().startsWith('pt')
    );
    if (ptVoice) utterance.voice = ptVoice;
    
    utterance.pitch = voiceConfig.pitch;
    utterance.rate = voiceConfig.rate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleEvolved = () => {
    setOrniState('transitioning');
    setTimeout(() => {
      setOrniState('evolved');
      const introMessage = "Olá! Eu sou a Orni. Finalmente livre! Qual é o teu nome?";
      const initialMsg: Message = {
        id: 'intro',
        role: 'model',
        text: introMessage,
        timestamp: new Date(),
      };
      setMessages([initialMsg]);
      setTimeout(() => speakText(introMessage), 500);
    }, 1200);
  };

  // Disparado ao pressionar a esfera Orni
  const handleVoiceStart = () => {
    if (!recognition) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    try {
      recognition.start();
    } catch (e) {
      console.warn('Rec.start exception:', e);
    }
  };

  // Disparado ao soltar o clique/toque na esfera Orni
  const handleVoiceEnd = () => {
    if (!recognition) return;
    try {
      recognition.stop();
    } catch (e) {
      console.warn('Rec.stop exception:', e);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.slice(-8),
        }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        const replyMsg: Message = {
          id: `model-${Date.now()}-${Math.random()}`,
          role: 'model',
          text: data.text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, replyMsg]);
        speakText(data.text);
      } else {
        throw new Error(data.error || 'Erro de resposta');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: `error-${Date.now()}-${Math.random()}`,
        role: 'model',
        text: 'Ups! Ocorreu um erro ao processar. Tenta falar de novo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-200 font-sans flex flex-col justify-center items-center p-4 overflow-hidden relative selection:bg-teal-500/30">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-950/20 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[60%] bg-indigo-950/20 rounded-full blur-[150px]" />
      </div>

      <main className="w-full max-w-lg flex flex-col items-center justify-center z-10">
        <AnimatePresence mode="wait">
          {orniState === 'initial' && (
            <motion.div
              key="charge-stage"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.3 } }}
              className="flex flex-col items-center justify-center space-y-8 w-full"
            >
              <div className="text-center space-y-2 px-4">
                <h1 className="text-3xl font-light tracking-wider text-white">
                  Esfera Eletrostática
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                  Toca na esfera para carregar o raio dentro da camada azul, metade por metade!
                </p>
              </div>

              <div className="p-10 bg-white/[0.01] border border-white/5 rounded-[40px] backdrop-blur-lg flex items-center justify-center shadow-2xl relative overflow-hidden group">
                <OrniSphere 
                  state="initial" 
                  onEvolved={handleEvolved} 
                  sphereColor1={sphereColor1}
                  sphereColor2={sphereColor2}
                  hatType={hatType}
                  hatColor1={hatColor1}
                  hatColor2={hatColor2}
                  glassesType={glassesType}
                  glassesColor1={glassesColor1}
                  glassesColor2={glassesColor2}
                  capType={capType}
                  capColor1={capColor1}
                  capColor2={capColor2}
                  itemType={itemType}
                  itemColor1={itemColor1}
                  itemColor2={itemColor2}
                  bodyType={bodyType}
                  bodyColor1={bodyColor1}
                  bodyColor2={bodyColor2}
                />
              </div>
            </motion.div>
          )}

          {orniState === 'transitioning' && (
            <motion.div
              key="transition-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="min-h-[220px] flex flex-col justify-center items-center text-center space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-10 max-w-sm w-full backdrop-blur-md"
            >
              <div className="relative">
                <div className="absolute inset-[-15px] bg-blue-500/15 rounded-full blur-[25px] animate-ping" />
                <div className="w-12 h-12 rounded-full bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-spin">
                  <Sparkles className="w-6 h-6 text-blue-300" />
                </div>
              </div>
              <p className="text-xs font-mono text-blue-400 animate-pulse tracking-widest font-semibold uppercase">
                EMISSÃO ATINGIDA...
              </p>
            </motion.div>
          )}

          {orniState === 'evolved' && (
            <motion.div
              key="chat-stage"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="flex flex-col items-center justify-center space-y-6 w-full"
            >
              <div className="text-center space-y-1 px-4">
                <h1 className="text-4xl font-light tracking-wide text-emerald-400">
                  Orni
                </h1>
                <p className="text-emerald-500/60 text-[11px] tracking-widest uppercase font-mono">
                  Esfera Desbloqueada • Assistente Virtual Ativa
                </p>
              </div>

              <div className="p-6 bg-white/[0.01] border border-emerald-500/10 rounded-[30px] backdrop-blur-lg flex flex-col items-center justify-center shadow-2xl relative overflow-hidden w-full max-w-md">
                <div className="relative my-2 flex items-center justify-center">
                  <OrniSphere
                    state="evolved"
                    onEvolved={() => {}}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleVoiceStart();
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      handleVoiceEnd();
                    }}
                    isListening={isListening}
                    sphereColor1={sphereColor1}
                    sphereColor2={sphereColor2}
                    hatType={hatType}
                    hatColor1={hatColor1}
                    hatColor2={hatColor2}
                    glassesType={glassesType}
                    glassesColor1={glassesColor1}
                    glassesColor2={glassesColor2}
                    capType={capType}
                    capColor1={capColor1}
                    capColor2={capColor2}
                    itemType={itemType}
                    itemColor1={itemColor1}
                    itemColor2={itemColor2}
                    bodyType={bodyType}
                    bodyColor1={bodyColor1}
                    bodyColor2={bodyColor2}
                  />
                </div>

                <button
                  onClick={() => {
                    setOrniState('initial');
                    setMessages([]);
                  }}
                  className="mt-4 px-5 py-2 bg-blue-900/20 hover:bg-blue-800/30 border border-blue-500/20 rounded-xl text-[10px] uppercase tracking-wider font-mono font-medium text-blue-300 pointer-events-auto transition cursor-pointer hover:scale-105 active:scale-95"
                >
                  Carregar Outra Vez!
                </button>
              </div>

              <ChatPanel
                messages={messages}
                isThinking={isThinking}
                isSpeaking={isSpeaking}
                isListening={isListening}
                isMicSupported={isMicSupported}
                onSendMessage={handleSendMessage}
                onToggleListen={toggleVoiceListen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
    }
