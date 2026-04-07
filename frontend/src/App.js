import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, MessageCircle, Palette, GraduationCap, Home, ChevronLeft, 
  Play, Pause, Download, Send, X, Loader2, Globe, Volume2, 
  BookOpen, Search, Settings, ChevronDown, Check, Library
} from "lucide-react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ==================== CONTEXT & STATE ====================

const defaultSettings = {
  language: "en",
  reciter: "yasser_dossari",
  researchMode: false
};

// ==================== COMPONENTS ====================

// Bottom Navigation
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/tajweed", icon: GraduationCap, label: "Tajweed" },
    { path: "/cards", icon: Palette, label: "Cards" },
    { path: "/library", icon: Library, label: "Library" },
  ];
  
  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`bottom-nav-item px-3 py-1 ${location.pathname === path ? 'active' : ''}`}
            data-testid={`nav-${label.toLowerCase()}`}
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// Header Component
const Header = ({ title, showBack = false, rightAction = null }) => {
  const navigate = useNavigate();
  
  return (
    <header className="glass-header sticky top-0 z-30 px-4 py-4" data-testid="header">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[var(--primary-light)] rounded-full transition-colors"
              data-testid="back-btn"
            >
              <ChevronLeft size={24} className="text-[var(--primary)]" />
            </button>
          )}
          <h1 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
        </div>
        {rightAction}
      </div>
    </header>
  );
};

// Language Selector
const LanguageSelector = ({ value, onChange, translations }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle case when translations is empty
  if (!translations || Object.keys(translations).length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <Globe size={16} className="text-[var(--primary)]" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }
  
  const selectedLang = translations[value] || translations["en"] || Object.values(translations)[0];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--primary)] transition-colors"
        data-testid="language-selector"
      >
        <Globe size={16} className="text-[var(--primary)]" />
        <span className="text-sm">{selectedLang.name}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-64 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {Object.entries(translations).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => { onChange(code); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--primary-light)] flex items-center justify-between ${value === code ? 'bg-[var(--primary-light)]' : ''}`}
                data-testid={`lang-${code}`}
              >
                <span>{lang.name}</span>
                {value === code && <Check size={14} className="text-[var(--primary)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reciter Selector
const ReciterSelector = ({ value, onChange, reciters }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle case when reciters is empty
  if (!reciters || Object.keys(reciters).length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <Volume2 size={16} className="text-[var(--accent-gold)]" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }
  
  const selectedReciter = reciters[value] || reciters["yasser_dossari"] || Object.values(reciters)[0];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--primary)] transition-colors"
        data-testid="reciter-selector"
      >
        <Volume2 size={16} className="text-[var(--accent-gold)]" />
        <span className="text-sm truncate max-w-[150px]">{selectedReciter.name}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-72 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg z-50"
          >
            {Object.entries(reciters).map(([id, reciter]) => (
              <button
                key={id}
                onClick={() => { onChange(id); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left hover:bg-[var(--primary-light)] flex items-center justify-between ${value === id ? 'bg-[var(--primary-light)]' : ''}`}
                data-testid={`reciter-${id}`}
              >
                <div>
                  <p className="text-sm font-medium">{reciter.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{reciter.style}</p>
                </div>
                {value === id && <Check size={14} className="text-[var(--primary)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Surah Card Component
const SurahCard = ({ surah, index }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className="card-base p-4 sm:p-5 cursor-pointer"
      onClick={() => navigate(`/surah/${surah.number}`)}
      data-testid={`surah-card-${surah.number}`}
    >
      <div className="flex items-center gap-4">
        <div className="surah-badge flex-shrink-0">
          {surah.number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">
            {surah.englishName}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {surah.englishNameTranslation} · {surah.numberOfAyahs} verses
          </p>
        </div>
        <div className="text-right">
          <p className="arabic-text text-xl text-[var(--primary)]" dir="rtl">
            {surah.name}
          </p>
          <span className="text-xs text-[var(--text-tertiary)] capitalize">
            {surah.revelationType}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Verse Component
const VerseBlock = ({ verse, isPlaying, onPlay, translationDirection }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-base p-6 sm:p-8"
      data-testid={`verse-${verse.surah}-${verse.ayah}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className="verse-badge">{verse.ayah}</span>
        <button
          onClick={() => onPlay(verse)}
          className={`p-3 rounded-full transition-all ${isPlaying ? 'bg-[var(--primary)] text-white audio-playing' : 'bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white'}`}
          data-testid={`play-verse-${verse.ayah}`}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>
      
      <div className="arabic-text arabic-lg mb-6 text-[var(--text-primary)]" dir="rtl">
        {verse.arabic}
      </div>
      
      {verse.translation && (
        <p 
          className="text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg"
          dir={translationDirection}
          style={{ textAlign: translationDirection === 'rtl' ? 'right' : 'left' }}
        >
          {verse.translation}
        </p>
      )}
    </motion.div>
  );
};

// AI Chat Component
const AIChat = ({ isOpen, onClose, translations }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [researchMode, setResearchMode] = useState(false);
  const [language, setLanguage] = useState("en");
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/chat`, {
        message: userMessage,
        session_id: sessionId,
        research_mode: researchMode,
        language: language
      });
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.response,
        research_mode: response.data.research_mode
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "I apologize, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-[var(--bg-default)] shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
        data-testid="ai-chat-panel"
      >
        {/* Chat Header */}
        <div className="glass-header p-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-heading text-lg font-semibold">Tilawa AI</h2>
            <p className="text-sm text-[var(--text-secondary)]">Ask about the Quran</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--primary-light)] rounded-full transition-colors"
            data-testid="close-chat-btn"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Research Mode Toggle */}
        <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[var(--accent-gold)]" />
            <span className="text-sm font-medium">Research Mode</span>
          </div>
          <button
            onClick={() => setResearchMode(!researchMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${researchMode ? 'bg-[var(--primary)]' : 'bg-[var(--border-default)]'}`}
            data-testid="research-mode-toggle"
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${researchMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        
        {researchMode && (
          <div className="px-4 py-2 bg-[var(--accent-gold-light)] text-sm text-[var(--accent-gold)]">
            📚 Using Islamic library for authentic sources
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                <MessageCircle size={28} className="text-[var(--primary)]" />
              </div>
              <p className="text-[var(--text-secondary)]">
                {researchMode 
                  ? "Ask questions with authentic scholarly sources"
                  : "Ask me anything about the Quran, Tajweed, or Islamic teachings."
                }
              </p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-[var(--primary)] text-white rounded-br-sm' 
                  : 'bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-bl-sm'
              }`}>
                {msg.research_mode && (
                  <span className="inline-block px-2 py-0.5 mb-2 text-xs bg-[var(--accent-gold-light)] text-[var(--accent-gold)] rounded-full">
                    📚 From Library
                  </span>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex gap-1 p-3 bg-[var(--bg-surface)] rounded-2xl rounded-bl-sm w-fit">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-default)] flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder={researchMode ? "Ask with scholarly sources..." : "Ask about the Quran..."}
              className="flex-1 px-4 py-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-default)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              data-testid="chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="send-chat-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Loading Component
const Loading = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="spinner mb-4"></div>
    <p className="text-[var(--text-secondary)]">Loading...</p>
  </div>
);

// ==================== PAGES ====================

// Home Page - Surah List
const HomePage = ({ translations, reciters, settings, onSettingsChange }) => {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await axios.get(`${API}/surahs`);
        setSurahs(response.data);
      } catch (error) {
        console.error("Error fetching surahs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurahs();
  }, []);
  
  const filteredSurahs = surahs.filter(surah => 
    surah.englishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.name?.includes(searchQuery) ||
    surah.number?.toString().includes(searchQuery)
  );
  
  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="TILAWA تلاوة" 
        rightAction={
          <div className="flex items-center gap-2">
            <LanguageSelector 
              value={settings.language} 
              onChange={(lang) => onSettingsChange({ ...settings, language: lang })}
              translations={translations}
            />
            <ReciterSelector
              value={settings.reciter}
              onChange={(reciter) => onSettingsChange({ ...settings, reciter })}
              reciters={reciters}
            />
          </div>
        }
      />
      
      {/* Hero Section */}
      <div className="relative px-4 py-8 sm:py-12 bg-gradient-to-b from-[var(--primary-light)] to-transparent">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] mb-2">
            The Noble Quran
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            114 Surahs · 6,236 Verses · 12+ Languages · Multiple Reciters
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search surahs by name or number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--primary)] shadow-sm"
              data-testid="search-input"
            />
          </div>
        </div>
      </div>
      
      {/* Surah Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="surah-grid">
            {filteredSurahs.map((surah, index) => (
              <SurahCard key={surah.number} surah={surah} index={index} />
            ))}
          </div>
        )}
        
        {!loading && filteredSurahs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">No surahs found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Surah Reading Page (Mushaf)
const SurahPage = ({ translations, reciters, settings, onSettingsChange }) => {
  const { surahNumber } = useParams();
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState(null);
  const [audio] = useState(new Audio());
  
  const fetchSurah = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/surah/${surahNumber}`, {
        params: { language: settings.language, reciter: settings.reciter }
      });
      setSurahData(response.data);
    } catch (error) {
      console.error("Error fetching surah:", error);
    } finally {
      setLoading(false);
    }
  }, [surahNumber, settings.language, settings.reciter]);
  
  useEffect(() => {
    fetchSurah();
    
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [fetchSurah, audio]);
  
  const handlePlay = (verse) => {
    if (playingVerse === verse.ayah) {
      audio.pause();
      setPlayingVerse(null);
    } else {
      audio.src = verse.audio_url;
      audio.play();
      setPlayingVerse(verse.ayah);
      
      audio.onended = () => setPlayingVerse(null);
    }
  };
  
  if (loading) return <Loading />;
  if (!surahData) return <div className="text-center py-20">Surah not found</div>;
  
  const { info, verses, translation, reciter } = surahData;
  
  return (
    <div className="min-h-screen pb-24" data-testid="mushaf-screen">
      <Header 
        title={info?.englishName || `Surah ${surahNumber}`}
        showBack={true}
        rightAction={
          <div className="flex items-center gap-2">
            <LanguageSelector 
              value={settings.language} 
              onChange={(lang) => onSettingsChange({ ...settings, language: lang })}
              translations={translations}
            />
            <ReciterSelector
              value={settings.reciter}
              onChange={(r) => onSettingsChange({ ...settings, reciter: r })}
              reciters={reciters}
            />
          </div>
        }
      />
      
      {/* Surah Info */}
      <div className="bg-[var(--primary-light)] px-4 py-6 text-center">
        <p className="arabic-text text-2xl text-[var(--primary)] mb-2" dir="rtl">{info?.name}</p>
        <p className="text-[var(--text-secondary)]">
          {info?.englishNameTranslation} · {info?.numberOfAyahs} verses · {info?.revelationType}
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-2">
          {translation?.name} · {reciter?.name}
        </p>
      </div>
      
      {/* Bismillah */}
      {surahNumber !== "1" && surahNumber !== "9" && (
        <div className="text-center py-8 px-4">
          <p className="arabic-text arabic-lg text-[var(--primary)]" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            In the name of Allah, the Most Gracious, the Most Merciful
          </p>
        </div>
      )}
      
      {/* Verses */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {verses.map(verse => (
          <VerseBlock
            key={verse.ayah}
            verse={verse}
            isPlaying={playingVerse === verse.ayah}
            onPlay={handlePlay}
            translationDirection={translation?.direction || "ltr"}
          />
        ))}
      </div>
    </div>
  );
};

// Tajweed Lessons Page
const TajweedPage = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await axios.get(`${API}/tajweed/lessons`);
        setLessons(response.data);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);
  
  return (
    <div className="min-h-screen pb-24" data-testid="tajweed-page">
      <Header title="Tajweed Rules" />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-[var(--text-secondary)] mb-6 text-center">
          Master the art of Quranic recitation with these essential Tajweed rules
        </p>
        
        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-base overflow-hidden cursor-pointer"
                onClick={() => setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)}
                data-testid={`tajweed-lesson-${lesson.id}`}
              >
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: lesson.color }}
                    >
                      {lesson.id}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-[var(--text-primary)]">
                        {lesson.name}
                      </h3>
                      <p className="arabic-text text-xl" style={{ color: lesson.color }} dir="rtl">
                        {lesson.arabic}
                      </p>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {selectedLesson === lesson.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-[var(--border-default)]"
                      >
                        <p className="text-[var(--text-secondary)] mb-4">
                          {lesson.description}
                        </p>
                        
                        <div className="mb-4">
                          <span className="text-sm font-medium text-[var(--text-primary)]">Letters: </span>
                          <span className="arabic-text text-lg" dir="rtl">{lesson.letters}</span>
                        </div>
                        
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Examples:</h4>
                        <div className="space-y-2">
                          {lesson.examples?.map((ex, i) => (
                            <div key={i} className="bg-[var(--bg-subtle)] p-3 rounded-lg">
                              <p className="arabic-text text-xl mb-1" style={{ color: lesson.color }} dir="rtl">
                                {ex.arabic}
                              </p>
                              <p className="text-sm text-[var(--text-secondary)]">
                                <span className="italic">{ex.transliteration}</span> - {ex.meaning}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Library Page (Offline Reader)
const LibraryPage = () => {
  const [books, setBooks] = useState({});
  const [chunks, setChunks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const [booksRes, chunksRes] = await Promise.all([
          axios.get(`${API}/library/books`),
          axios.get(`${API}/library/chunks?limit=200`)
        ]);
        setBooks(booksRes.data);
        setChunks(chunksRes.data);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await axios.post(`${API}/library/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
    }
  };
  
  const filteredChunks = selectedBook 
    ? chunks.filter(c => c.book_name === selectedBook)
    : chunks;
  
  return (
    <div className="min-h-screen pb-24" data-testid="library-page">
      <Header title="Islamic Library" />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-11 pr-4 py-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--primary)]"
              data-testid="library-search"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary px-6" data-testid="library-search-btn">
            Search
          </button>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Search Results</h3>
            <div className="space-y-3">
              {searchResults.map((chunk, i) => (
                <div key={i} className="card-base p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-[var(--accent-gold-light)] text-[var(--accent-gold)] text-xs rounded-full">
                      {chunk.book_name}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">Page {chunk.page_number}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{chunk.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Book Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedBook(null)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${!selectedBook ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-surface)] border border-[var(--border-default)]'}`}
            data-testid="library-all-btn"
          >
            All Books
          </button>
          {Object.entries(books).map(([key, book]) => (
            <button
              key={key}
              onClick={() => setSelectedBook(key)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${selectedBook === key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-surface)] border border-[var(--border-default)]'}`}
              data-testid={`library-book-${key}`}
            >
              {book.title}
            </button>
          ))}
        </div>
        
        {loading ? (
          <Loading />
        ) : chunks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
              <BookOpen size={28} className="text-[var(--primary)]" />
            </div>
            <p className="text-[var(--text-secondary)] mb-4">
              No books uploaded yet. Upload Islamic PDFs to build your library.
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Supported: Mukashafatul Quloob, Muntakhab Ahadees, Ash-Shifa
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChunks.slice(0, 50).map((chunk, i) => (
              <div key={chunk.id || i} className="card-base p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-[var(--accent-gold-light)] text-[var(--accent-gold)] text-xs rounded-full">
                    {chunk.book_name}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">Page {chunk.page_number}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{chunk.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Card Creator Page
const CardCreatorPage = ({ translations }) => {
  const [surahNumber, setSurahNumber] = useState(1);
  const [ayahNumber, setAyahNumber] = useState(1);
  const [verse, setVerse] = useState(null);
  const [style, setStyle] = useState("dark");
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [language, setLanguage] = useState("en");
  
  const fetchVerse = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/verse/${surahNumber}/${ayahNumber}`, {
        params: { language }
      });
      setVerse(response.data);
    } catch (error) {
      console.error("Error fetching verse:", error);
      setVerse(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVerse();
  }, [surahNumber, ayahNumber, language]);
  
  const downloadCard = async () => {
    const { toPng } = await import('html-to-image');
    const node = document.getElementById('verse-card');
    if (!node) return;
    
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `tilawa-${surahNumber}-${ayahNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };
  
  const cardStyles = {
    dark: "verse-card-dark",
    parchment: "verse-card-parchment",
    minimal: "verse-card-minimal border border-[var(--border-default)]"
  };
  
  return (
    <div className="min-h-screen pb-24" data-testid="card-creator-page">
      <Header title="Verse Card Creator" />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="card-base p-6">
              <h3 className="font-semibold mb-4">Select Verse</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Surah</label>
                  <input
                    type="number"
                    min="1"
                    max="114"
                    value={surahNumber}
                    onChange={e => setSurahNumber(Math.min(114, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--primary)]"
                    data-testid="surah-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Ayah</label>
                  <input
                    type="number"
                    min="1"
                    value={ayahNumber}
                    onChange={e => setAyahNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--primary)]"
                    data-testid="ayah-input"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Translation</label>
                <LanguageSelector
                  value={language}
                  onChange={setLanguage}
                  translations={translations}
                />
              </div>
              
              <button 
                onClick={fetchVerse}
                className="btn-primary w-full"
                data-testid="load-verse-btn"
              >
                Load Verse
              </button>
            </div>
            
            <div className="card-base p-6">
              <h3 className="font-semibold mb-4">Card Style</h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {["dark", "parchment", "minimal"].map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`p-3 rounded-lg border-2 transition-all capitalize ${
                      style === s 
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]' 
                        : 'border-[var(--border-default)] hover:border-[var(--primary)]'
                    }`}
                    data-testid={`style-${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={e => setShowTranslation(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)]"
                  data-testid="show-translation-toggle"
                />
                <span className="text-sm">Show Translation</span>
              </label>
            </div>
            
            <button
              onClick={downloadCard}
              disabled={!verse}
              className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="download-card-btn"
            >
              <Download size={18} />
              Download as PNG
            </button>
          </div>
          
          {/* Preview */}
          <div>
            <h3 className="font-semibold mb-4">Preview</h3>
            
            {loading ? (
              <Loading />
            ) : verse ? (
              <div 
                id="verse-card"
                className={`${cardStyles[style]} rounded-2xl p-8 sm:p-10 aspect-square flex flex-col items-center justify-center text-center`}
                style={{
                  backgroundImage: style === "dark" ? `url(https://static.prod-images.emergentagent.com/jobs/ce4fd726-9fce-42f9-8cda-bc2279f260f4/images/9e36a9d22409730f260e9b5291cefc5b283cc17678f63f73d9b663c8b7104a34.png)` : undefined,
                  backgroundSize: 'cover'
                }}
              >
                <p className="arabic-text text-2xl sm:text-3xl mb-6 leading-[2.2]" dir="rtl">
                  {verse.arabic}
                </p>
                
                {showTranslation && verse.translation && (
                  <p className={`text-sm sm:text-base leading-relaxed mb-4 max-w-md ${style === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    "{verse.translation}"
                  </p>
                )}
                
                <p className={`text-xs sm:text-sm ${style === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Surah {verse.surah}, Ayah {verse.ayah}
                </p>
                
                <p className={`text-xs mt-4 ${style === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  TILAWA تلاوة
                </p>
              </div>
            ) : (
              <div className="card-base aspect-square flex items-center justify-center">
                <p className="text-[var(--text-secondary)]">Enter a valid surah and ayah number</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [translations, setTranslations] = useState({});
  const [reciters, setReciters] = useState({});
  const [settings, setSettings] = useState(defaultSettings);
  
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [transRes, recRes] = await Promise.all([
          axios.get(`${API}/translations`),
          axios.get(`${API}/reciters`)
        ]);
        setTranslations(transRes.data);
        setReciters(recRes.data);
      } catch (error) {
        console.error("Error fetching config:", error);
        // Fallback
        setTranslations({ en: { id: "en.asad", name: "English", direction: "ltr" } });
        setReciters({ yasser_dossari: { id: "yasser_dossari", name: "Yasser Al-Dossari", style: "Murattal" } });
      }
    };
    fetchConfig();
  }, []);
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <HomePage 
              translations={translations} 
              reciters={reciters} 
              settings={settings} 
              onSettingsChange={setSettings} 
            />
          } />
          <Route path="/surah/:surahNumber" element={
            <SurahPage 
              translations={translations} 
              reciters={reciters} 
              settings={settings} 
              onSettingsChange={setSettings} 
            />
          } />
          <Route path="/tajweed" element={<TajweedPage />} />
          <Route path="/cards" element={<CardCreatorPage translations={translations} />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
        
        <BottomNav />
        
        {/* AI Chat FAB */}
        <button
          className="fab"
          onClick={() => setChatOpen(true)}
          data-testid="ai-chat-fab"
        >
          <MessageCircle size={24} />
        </button>
        
        {/* AI Chat Panel */}
        <AnimatePresence>
          {chatOpen && <AIChat isOpen={chatOpen} onClose={() => setChatOpen(false)} translations={translations} />}
        </AnimatePresence>
      </BrowserRouter>
    </div>
  );
}

export default App;
