import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Globe, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface AarogyaAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const AarogyaAIAssistant: React.FC<AarogyaAIAssistantProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Namaste! 🙏 I am **Aarogya AI**, your intelligent SwasthyaOS hospital companion. I can help you check live ICU & bed availability, find available doctors, triage emergencies, or query pharmacy stocks.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'hi' | 'mr'>(
    (i18n.language as 'en' | 'hi' | 'mr') || 'en'
  );
  const [suggestions, setSuggestions] = useState<string[]>([
    'How many ICU beds are available?',
    'Which doctors are available today?',
    'Emergency helpline and ambulance status',
    'Is the pharmacy open and Paracetamol in stock?'
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (currentLang === 'hi') utterance.lang = 'hi-IN';
    else if (currentLang === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/chat', {
        message: query,
        language: currentLang
      });

      if (res.data.success) {
        const replyText = res.data.data.reply;
        const botMsg: Message = {
          sender: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
        speakText(replyText);

        if (res.data.data.suggestions) {
          setSuggestions(res.data.data.suggestions);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: '⚠️ I encountered an error communicating with the clinical knowledge base. Please try again or visit the Help Desk.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 p-0 bg-slate-900/40 backdrop-blur-md transition-all animate-in fade-in">
      <div className="relative w-full sm:w-[480px] h-[92vh] sm:h-[650px] sm:rounded-2xl rounded-t-2xl border border-slate-200 flex flex-col shadow-2xl overflow-hidden bg-white/95 backdrop-blur-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/70 via-white to-cyan-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base">Aarogya AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono font-semibold">
                  Hospital Core
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Intelligent Clinical & Operations Assistant</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Multilingual Switcher inside assistant */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px] font-mono">
              {(['en', 'hi', 'mr'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCurrentLang(lang)}
                  className={`px-2 py-0.5 rounded-md uppercase font-bold transition ${
                    currentLang === lang ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Voice toggle */}
            <button
              onClick={() => {
                if (voiceEnabled) window.speechSynthesis?.cancel();
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`p-2 rounded-lg text-xs transition ${
                voiceEnabled ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={voiceEnabled ? 'Voice output ON' : 'Voice output OFF'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{m.time}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-blue-700 text-xs py-2 px-3 bg-blue-50 rounded-xl border border-blue-200 w-fit">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Aarogya AI is consulting hospital databases...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/80 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug)}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 hover:border-blue-300 transition shadow-xs"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentLang === 'hi'
                ? 'आरोग्य एआई से पूछें (उदा. आईसीयू बेड, डॉक्टर)...'
                : currentLang === 'mr'
                ? 'आरोग्य एआयला विचारा (उदा. खाटा, डॉक्टर)...'
                : 'Ask Aarogya AI (e.g. ICU beds, doctor status)...'
            }
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Disclaimer */}
        <div className="px-3 py-1 bg-slate-50 text-[10px] text-slate-500 text-center border-t border-slate-200">
          ⚠️ For operational & triage advice. For life-threatening emergencies, call 108 immediately.
        </div>
      </div>
    </div>
  );
};
