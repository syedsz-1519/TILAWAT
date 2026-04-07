import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Book, MessageCircle, Palette, Type, GraduationCap, Home, ChevronLeft, Play, Pause, Volume2, Download, Send, X, Loader2 } from "lucide-react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ==================== COMPONENTS ====================

// Bottom Navigation
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/tajweed", icon: GraduationCap, label: "Tajweed" },
    { path: "/cards", icon: Palette, label: "Cards" },
  ];
  
  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`bottom-nav-item px-4 py-1 ${location.pathname === path ? 'active' : ''}`}
            data-testid={`nav-${label.toLowerCase()}`}
          >
            <Icon size={20} />
            <span>{label}</span>
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
const VerseBlock = ({ verse, isPlaying, onPlay }) => {
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
      
      {verse.translation_en && (
        <p className="text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg">
          {verse.translation_en}
        </p>
      )}
    </motion.div>
  );
};

// AI Chat Component
const AIChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/chat`, {
        message: userMessage,
        session_id: sessionId
      });
      
      setMessages(prev => [...prev, { role: "assistant", content: response.data.response }]);
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
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-[var(--bg-default)] shadow-xl"
        onClick={e => e.stopPropagation()}
        data-testid="ai-chat-panel"
      >
        {/* Chat Header */}
        <div className="glass-header p-4 flex items-center justify-between">
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
        
        {/* Messages */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                <MessageCircle size={28} className="text-[var(--primary)]" />
              </div>
              <p className="text-[var(--text-secondary)]">
                Ask me anything about the Quran, Tajweed, or Islamic teachings.
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
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[var(--bg-surface)] border-t border-[var(--border-default)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about the Quran..."
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
const HomePage = () => {
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
      <Header title="TILAWA تلاوة" />
      
      {/* Hero Section */}
      <div className="relative px-4 py-8 sm:py-12 bg-gradient-to-b from-[var(--primary-light)] to-transparent">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] mb-2">
            The Noble Quran
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            114 Surahs · 6,236 Verses · Read, Listen & Learn
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search surahs by name or number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--primary)] shadow-sm"
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
const SurahPage = () => {
  const { surahNumber } = useParams();
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState(null);
  const [audio] = useState(new Audio());
  
  useEffect(() => {
    const fetchSurah = async () => {
      try {
        const response = await axios.get(`${API}/surah/${surahNumber}`);
        setSurahData(response.data);
      } catch (error) {
        console.error("Error fetching surah:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurah();
    
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [surahNumber, audio]);
  
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
  
  const { info, verses } = surahData;
  
  return (
    <div className="min-h-screen pb-24" data-testid="mushaf-screen">
      <Header 
        title={info?.englishName || `Surah ${surahNumber}`}
        showBack={true}
        rightAction={
          <div className="text-right">
            <span className="arabic-text text-lg text-[var(--primary)]" dir="rtl">{info?.name}</span>
          </div>
        }
      />
      
      {/* Surah Info */}
      <div className="bg-[var(--primary-light)] px-4 py-6 text-center">
        <p className="text-[var(--text-secondary)]">
          {info?.englishNameTranslation} · {info?.numberOfAyahs} verses · {info?.revelationType}
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

// Card Creator Page
const CardCreatorPage = () => {
  const [surahNumber, setSurahNumber] = useState(1);
  const [ayahNumber, setAyahNumber] = useState(1);
  const [verse, setVerse] = useState(null);
  const [style, setStyle] = useState("dark");
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  
  const fetchVerse = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/verse/${surahNumber}/${ayahNumber}`);
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
  }, [surahNumber, ayahNumber]);
  
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
                <span className="text-sm">Show English Translation</span>
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
                
                {showTranslation && verse.translation_en && (
                  <p className={`text-sm sm:text-base leading-relaxed mb-4 max-w-md ${style === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    "{verse.translation_en}"
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
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/surah/:surahNumber" element={<SurahPage />} />
          <Route path="/tajweed" element={<TajweedPage />} />
          <Route path="/cards" element={<CardCreatorPage />} />
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
          {chatOpen && <AIChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />}
        </AnimatePresence>
      </BrowserRouter>
    </div>
  );
}

export default App;
