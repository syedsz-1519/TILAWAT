import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Command, Loader2, Sparkles, StopCircle, Settings } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OmarVoiceAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'As-salamu alaykum! I am Omar, your Voice AI assistant. Click the microphone to ask me about the Quran.' }
  ]);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Load saved API key
    const savedKey = localStorage.getItem('claude_api_key');
    if (savedKey) setApiKey(savedKey);

    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript + ' ';
          else interimTranscript += transcript;
        }
        setQuery(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        // We trigger sending automatically in useEffect if query is finalized, or user can click send
      };
      
      recognition.onerror = (e) => {
        setIsListening(false);
        console.error("Speech Recognition Error:", e.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleAgent = () => setIsOpen(!isOpen);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setQuery('');
      recognitionRef.current.start();
    }
  };

  const fetchTTS = async (text) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text.substring(0, 300));
        const voices = window.speechSynthesis.getVoices();
        const omarVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Male')) || voices[0];
        
        if (omarVoice) utterance.voice = omarVoice;
        utterance.rate = 0.95;
        utterance.pitch = 0.9;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const saveKey = () => {
    localStorage.setItem('claude_api_key', apiKey);
    setShowSettings(false);
    setMessages(prev => [...prev, { role: 'agent', text: '✅ Claude API Key saved! I am now powered by advanced intelligence.' }]);
  };

  const generateWithClaude = async (userQuery, contextualData) => {
    const context = contextualData ? `\nRelevant Context:\n${JSON.stringify(contextualData)}` : '';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: `You are a helpful Quranic voice assistant. Use the provided context to answer questions succinctly.${context}`,
            messages: [{ role: 'user', content: userQuery }]
        })
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.content[0].text;
  };

  const handleSend = async () => {
    const textToSend = query;
    if (!textToSend.trim()) return;

    if (isListening) recognitionRef.current?.stop();

    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      // 1. Local/Backend Semantic Search
      let endpoint = `/api/search?q=${encodeURIComponent(textToSend)}&limit=1`;
      let searchType = 'Quran';
      
      if (textToSend.toLowerCase().includes('hadith') || textToSend.toLowerCase().includes('bukhari')) {
        endpoint = `/api/hadiths?q=${encodeURIComponent(textToSend.replace(/hadith|bukhari/gi, '').trim())}&limit=1`;
        searchType = 'Hadith';
      }

      const res = await fetch(endpoint).catch(() => null);
      const data = res ? await res.json() : null;
      
      let replyText = "I couldn't find a specific reference for that right now. Could you rephrase it?";
      let contextualData = null;

      if (searchType === 'Quran' && data?.results?.length > 0) {
        contextualData = data.results[0];
        replyText = `In ${data.results[0].verse_key}, the Quran says: "${data.results[0].translation_en}"`;
      } else if (searchType === 'Hadith' && data?.length > 0) {
        contextualData = data[0];
        replyText = `According to Sahih al-Bukhari: "${data[0].text_en.substring(0, 150)}..."`;
      }

      // 2. Claude AI Enhancement (if API Key exists)
      if (apiKey) {
        try {
          replyText = await generateWithClaude(textToSend, contextualData);
        } catch (claudeErr) {
          console.error("Claude Err (Falling back to local):", claudeErr);
        }
      }

      setMessages(prev => [...prev, { role: 'agent', text: replyText }]);
      await fetchTTS(replyText);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'agent', text: "I'm having trouble connecting at the moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={toggleAgent}
          className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center border-2 border-primary/50 relative group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-105'}`}
          style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse group-hover:bg-primary/40 transition-all duration-500"></div>
          <Sparkles className="absolute top-2 right-2 w-4 h-4 text-primary animate-pulse" />
          <Mic className="text-primary w-7 h-7 relative z-10" />
        </Button>
      </div>

      <div className={`fixed bottom-6 right-6 z-50 w-[380px] origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'scale-100 opacity-100 pointer-events-auto shadow-2xl shadow-primary/20' : 'scale-75 opacity-0 pointer-events-none'}`}>
        <Card className="flex flex-col bg-slate-950/95 backdrop-blur-3xl border-primary/20 overflow-hidden shadow-[0_0_40px_-10px_rgba(230,195,100,0.15)] ring-1 ring-white/5">
          <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-primary/20 p-4 pb-4 flex flex-row items-center justify-between space-y-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative cursor-pointer" onClick={toggleListening}>
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-primary/10 border-primary/30 text-primary'} ${isSpeaking ? 'ring-2 ring-primary/50' : ''}`}>
                  <Mic className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white tracking-wide">Omar AI (Voice)</h3>
                <p className="text-xs text-primary/80 flex items-center gap-1">
                  {isListening ? 'Listening...' : 'Tap Mic to Speak'}
                </p>
              </div>
            </div>
            <div className="flex gap-1 z-10">
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="text-slate-400 hover:text-white rounded-full">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleAgent} className="text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          {showSettings && (
            <div className="p-4 bg-slate-900 border-b border-primary/20 flex flex-col gap-2">
              <p className="text-xs text-slate-400">Optional: Enter Anthropic API Key for advanced AI reasoning.</p>
              <div className="flex gap-2">
                <Input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..." className="h-8 bg-black/50 text-xs border-primary/30 text-white" />
                <Button size="sm" onClick={saveKey} className="h-8 text-xs">Save</Button>
              </div>
            </div>
          )}

          <CardContent className="p-4 h-[350px] overflow-y-auto space-y-4 font-sans no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-slate-950 font-medium rounded-br-none shadow-[0_4px_20px_-5px_rgba(230,195,100,0.3)]' 
                    : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-slate-400">Processing...</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-3 bg-slate-900/50 border-t border-primary/10">
            <div className="flex w-full items-center space-x-2">
              <Input 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening..." : "Type or speak..."} 
                className="bg-slate-950/50 border-white/10 text-white rounded-full px-4"
              />
              {isSpeaking ? (
                <Button size="icon" onClick={handleStopAudio} variant="destructive" className="rounded-full shadow-lg shrink-0">
                  <StopCircle className="w-5 h-5" />
                </Button>
              ) : (
                <Button size="icon" onClick={handleSend} disabled={isLoading || !query.trim()} className="bg-primary text-slate-950 rounded-full shadow-lg shrink-0">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
