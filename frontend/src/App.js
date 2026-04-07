import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, MessageCircle, Palette, GraduationCap, Home, ChevronLeft, 
  Play, Pause, Download, Send, X, Globe, Volume2, 
  BookOpen, Search, ChevronDown, Check, Library
} from "lucide-react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const defaultSettings = { language: "en", reciter: "yasser_dossari", theme: "light" };

// ==================== COMPONENTS ====================

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

const Header = ({ title, showBack = false, rightAction = null, dark = false }) => {
  const navigate = useNavigate();
  
  return (
    <header className={`${dark ? 'glass-header-dark' : 'glass-header'} sticky top-0 z-30 px-4 py-4`} data-testid="header">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10" data-testid="back-btn">
              <ChevronLeft size={24} className={dark ? "text-[var(--gold)]" : "text-[var(--primary)]"} />
            </button>
          )}
          <h1 className={`font-semibold text-xl ${dark ? 'text-[var(--text-arabic)]' : 'text-[var(--text-primary)]'}`}>
            {title}
          </h1>
        </div>
        {rightAction}
      </div>
    </header>
  );
};

const LanguageSelector = ({ value, onChange, translations }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!translations || Object.keys(translations).length === 0) return <div className="px-3 py-2 text-sm">Loading...</div>;
  const selectedLang = translations[value] || translations["en"] || Object.values(translations)[0];
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20" data-testid="language-selector">
        <Globe size={16} />
        <span className="text-sm">{selectedLang.name}</span>
        <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-64 bg-white border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
            {Object.entries(translations).map(([code, lang]) => (
              <button key={code} onClick={() => { onChange(code); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 flex items-center justify-between ${value === code ? 'bg-gray-100' : ''}`}>
                <span>{lang.name}</span>
                {value === code && <Check size={14} className="text-green-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReciterSelector = ({ value, onChange, reciters }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!reciters || Object.keys(reciters).length === 0) return <div className="px-3 py-2 text-sm">Loading...</div>;
  const selected = reciters[value] || reciters["yasser_dossari"] || Object.values(reciters)[0];
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20" data-testid="reciter-selector">
        <Volume2 size={16} className="text-[var(--gold)]" />
        <span className="text-sm truncate max-w-[120px]">{selected.name}</span>
        <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-72 bg-white border rounded-xl shadow-lg z-50">
            {Object.entries(reciters).map(([id, r]) => (
              <button key={id} onClick={() => { onChange(id); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-100 ${value === id ? 'bg-gray-100' : ''}`}>
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-gray-500">{r.style}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SurahCard = ({ surah, index }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
      className="card-base surah-card" onClick={() => navigate(`/mushaf/${surah.number}`)} data-testid={`surah-card-${surah.number}`}>
      <div className="surah-badge">{surah.number}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--text-primary)] truncate">{surah.englishName}</h3>
        <p className="text-sm text-[var(--text-muted)]">{surah.englishNameTranslation} · {surah.numberOfAyahs} verses</p>
      </div>
      <div className="text-right">
        <p className="arabic-text text-xl text-[var(--primary)]" dir="rtl">{surah.name}</p>
        <span className="text-xs text-[var(--text-muted)] capitalize">{surah.revelationType}</span>
      </div>
    </motion.div>
  );
};

const TajweedLegend = () => (
  <div className="tajweed-legend">
    {[
      { name: "Ikhfa", color: "var(--tajweed-ikhfa)" },
      { name: "Idgham", color: "var(--tajweed-idgham)" },
      { name: "Ghunnah", color: "var(--tajweed-ghunnah)" },
      { name: "Qalqalah", color: "var(--tajweed-qalqalah)" },
      { name: "Madd", color: "var(--tajweed-madd)" },
    ].map(rule => (
      <div key={rule.name} className="tajweed-item">
        <div className="tajweed-dot" style={{ background: rule.color }} />
        <span>{rule.name}</span>
      </div>
    ))}
  </div>
);

const Loading = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="spinner mb-4"></div>
    <p className="text-[var(--text-muted)]">Loading...</p>
  </div>
);

// ==================== AI CHAT ====================

const AIChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [researchMode, setResearchMode] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/chat`, { message: userMessage, session_id: sessionId, research_mode: researchMode });
      setMessages(prev => [...prev, { role: "assistant", content: response.data.response, research_mode: response.data.research_mode }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "I apologize, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()} data-testid="ai-chat-panel">
        
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Tilawa AI تلاوة</h2>
            <p className="text-sm text-gray-500">Ask about the Quran</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" data-testid="close-chat-btn"><X size={20} /></button>
        </div>
        
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-600" />
            <span className="text-sm font-medium">Research Mode</span>
          </div>
          <button onClick={() => setResearchMode(!researchMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${researchMode ? 'bg-green-600' : 'bg-gray-300'}`} data-testid="research-mode-toggle">
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${researchMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        
        {researchMode && <div className="px-4 py-2 bg-amber-50 text-sm text-amber-700">📚 Using Mukashafatul Quloob for sources</div>}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle size={40} className="mx-auto mb-4 text-green-600 opacity-50" />
              <p className="text-gray-500">{researchMode ? "Ask with scholarly sources" : "Ask about the Quran"}</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-green-600 text-white rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'}`}>
                {msg.research_mode && <span className="inline-block px-2 py-0.5 mb-2 text-xs bg-amber-100 text-amber-700 rounded-full">📚 From Library</span>}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          
          {isLoading && <div className="flex gap-1 p-3 bg-gray-100 rounded-2xl rounded-bl-sm w-fit">
            <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
          </div>}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about the Quran..." className="flex-1 px-4 py-3 rounded-full border focus:outline-none focus:border-green-600" data-testid="chat-input" />
            <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="btn-primary p-3 disabled:opacity-50" data-testid="send-chat-btn">
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== PAGES ====================

const HomePage = ({ translations, reciters, settings, onSettingsChange }) => {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    axios.get(`${API}/surahs`).then(res => setSurahs(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  
  const filtered = surahs.filter(s => s.englishName?.toLowerCase().includes(searchQuery.toLowerCase()) || s.name?.includes(searchQuery) || s.number?.toString().includes(searchQuery));
  
  return (
    <div className="min-h-screen pb-24">
      <Header title="TILAWA تلاوة" rightAction={
        <div className="flex items-center gap-2">
          <LanguageSelector value={settings.language} onChange={l => onSettingsChange({ ...settings, language: l })} translations={translations} />
        </div>
      } />
      
      <div className="px-4 py-8 bg-gradient-to-b from-[var(--primary-light)] to-transparent text-center">
        <h2 className="text-3xl font-semibold mb-2">The Noble Quran</h2>
        <p className="text-[var(--text-muted)] mb-6">114 Surahs · 6,236 Verses · Local + Cloud</p>
        
        <div className="max-w-md mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search surahs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3 rounded-full border bg-white focus:outline-none focus:border-[var(--primary)]" data-testid="search-input" />
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? <Loading /> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="surah-grid">
            {filtered.map((surah, i) => <SurahCard key={surah.number} surah={surah} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// MUSHAF SCREEN - Beautiful Dark Theme
const MushafPage = ({ translations, reciters, settings, onSettingsChange }) => {
  const { surahNumber } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState(null);
  const [audio] = useState(new Audio());
  
  const fetchSurah = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/mushaf/${surahNumber}`, { params: { language: settings.language, reciter: settings.reciter } });
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [surahNumber, settings.language, settings.reciter]);
  
  useEffect(() => { fetchSurah(); return () => { audio.pause(); audio.src = ""; }; }, [fetchSurah, audio]);
  
  const handlePlay = (verse) => {
    if (playingVerse === verse.ayah) { audio.pause(); setPlayingVerse(null); }
    else { audio.src = verse.audio_url; audio.play(); setPlayingVerse(verse.ayah); audio.onended = () => setPlayingVerse(null); }
  };
  
  if (loading) return <div className="mushaf-container flex items-center justify-center min-h-screen"><Loading /></div>;
  if (!data) return <div className="mushaf-container text-center py-20 text-white">Surah not found</div>;
  
  const { info, verses, translation, reciter } = data;
  
  return (
    <div className="mushaf-container" data-testid="mushaf-screen">
      <div className="mushaf-pattern"></div>
      <div className="mushaf-glow"></div>
      
      <Header title={info?.englishName || `Surah ${surahNumber}`} showBack dark rightAction={
        <div className="flex items-center gap-2">
          <LanguageSelector value={settings.language} onChange={l => onSettingsChange({ ...settings, language: l })} translations={translations} />
          <ReciterSelector value={settings.reciter} onChange={r => onSettingsChange({ ...settings, reciter: r })} reciters={reciters} />
        </div>
      } />
      
      <div className="surah-header">
        <div className="octagon-badge mx-auto mb-4">{info?.number}</div>
        <h2 className="arabic-quran arabic-xl text-[var(--gold)]" dir="rtl">{info?.name}</h2>
        <p className="text-[var(--text-secondary)] mt-2">{info?.englishNameTranslation} · {info?.numberOfAyahs} Ayahs · {info?.revelationType}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{translation?.name} · {reciter?.name}</p>
      </div>
      
      {surahNumber !== "1" && surahNumber !== "9" && (
        <div className="bismillah bismillah-ornament" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ</div>
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-32">
        {verses.map((verse, idx) => (
          <motion.div key={verse.ayah} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
            className="verse-block" data-testid={`verse-${verse.surah}-${verse.ayah}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <span className="verse-badge">{verse.ayah}</span>
              <button onClick={() => handlePlay(verse)}
                className={`p-3 rounded-full transition-all ${playingVerse === verse.ayah ? 'bg-[var(--gold)] text-black' : 'bg-white/10 hover:bg-white/20'}`}
                data-testid={`play-verse-${verse.ayah}`}>
                {playingVerse === verse.ayah ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
            
            <div className="arabic-quran arabic-lg mb-6" dir="rtl">{verse.arabic}</div>
            
            {verse.translation && (
              <p className="text-[var(--text-secondary)] leading-relaxed" dir={translation?.direction || 'ltr'}
                style={{ textAlign: translation?.direction === 'rtl' ? 'right' : 'left' }}>{verse.translation}</p>
            )}
          </motion.div>
        ))}
      </div>
      
      <TajweedLegend />
    </div>
  );
};

const TajweedPage = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  useEffect(() => { axios.get(`${API}/tajweed/lessons`).then(r => setLessons(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);
  
  return (
    <div className="min-h-screen pb-24" data-testid="tajweed-page">
      <Header title="Tajweed Rules" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-center text-[var(--text-muted)] mb-6">Master Quranic recitation with these essential rules</p>
        {loading ? <Loading /> : (
          <div className="space-y-4">
            {lessons.map((lesson, i) => (
              <motion.div key={lesson.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card-base overflow-hidden cursor-pointer" onClick={() => setSelected(selected === lesson.id ? null : lesson.id)} data-testid={`tajweed-lesson-${lesson.id}`}>
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: lesson.color }}>{lesson.id}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{lesson.name}</h3>
                      <p className="arabic-text text-xl" style={{ color: lesson.color }} dir="rtl">{lesson.arabic}</p>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {selected === lesson.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t">
                        <p className="text-[var(--text-muted)] mb-4">{lesson.description}</p>
                        <div className="mb-4"><span className="font-medium">Letters: </span><span className="arabic-text" dir="rtl">{lesson.letters}</span></div>
                        <h4 className="font-medium mb-2">Examples:</h4>
                        {lesson.examples?.map((ex, i) => (
                          <div key={i} className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="arabic-text text-xl mb-1" style={{ color: lesson.color }} dir="rtl">{ex.arabic}</p>
                            <p className="text-sm text-gray-600"><span className="italic">{ex.transliteration}</span> - {ex.meaning}</p>
                          </div>
                        ))}
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

const LibraryPage = () => {
  const [books, setBooks] = useState({});
  const [chunks, setChunks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([axios.get(`${API}/library/books`), axios.get(`${API}/library/chunks?limit=200`)])
      .then(([b, c]) => { setBooks(b.data); setChunks(c.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const r = await axios.post(`${API}/library/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(r.data);
    } catch (e) { console.error(e); }
  };
  
  const filtered = selectedBook ? chunks.filter(c => c.book_name === selectedBook) : chunks;
  
  return (
    <div className="min-h-screen pb-24" data-testid="library-page">
      <Header title="Islamic Library" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search library..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()} className="w-full pl-11 pr-4 py-3 rounded-full border focus:outline-none focus:border-[var(--primary)]" data-testid="library-search" />
          </div>
          <button onClick={handleSearch} className="btn-primary px-6" data-testid="library-search-btn">Search</button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Search Results</h3>
            {searchResults.map((chunk, i) => (
              <div key={i} className="card-base p-4 mb-3">
                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full mb-2">{chunk.book_name} · Page {chunk.page_number}</span>
                <p className="text-sm text-gray-600">{chunk.content}</p>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setSelectedBook(null)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${!selectedBook ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}>All Books</button>
          {Object.entries(books).map(([k, b]) => (
            <button key={k} onClick={() => setSelectedBook(k)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${selectedBook === k ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}>{b.title}</button>
          ))}
        </div>
        
        {loading ? <Loading /> : chunks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={40} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Library content is being loaded...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 50).map((chunk, i) => (
              <div key={chunk.id || i} className="card-base p-4">
                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full mb-2">{chunk.book_name} · Page {chunk.page_number}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{chunk.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
      const r = await axios.get(`${API}/verse/${surahNumber}/${ayahNumber}`, { params: { language } });
      setVerse(r.data);
    } catch (e) { setVerse(null); }
    setLoading(false);
  };
  
  useEffect(() => { fetchVerse(); }, [surahNumber, ayahNumber, language]);
  
  const downloadCard = async () => {
    const { toPng } = await import('html-to-image');
    const node = document.getElementById('verse-card');
    if (!node) return;
    try {
      const url = await toPng(node, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `tilawa-${surahNumber}-${ayahNumber}.png`;
      link.href = url;
      link.click();
    } catch (e) { console.error(e); }
  };
  
  const cardStyles = { dark: "verse-card-dark", parchment: "verse-card-parchment", minimal: "verse-card-minimal" };
  
  return (
    <div className="min-h-screen pb-24" data-testid="card-creator-page">
      <Header title="Verse Card Creator" />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card-base p-6">
              <h3 className="font-semibold mb-4">Select Verse</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Surah</label>
                  <input type="number" min="1" max="114" value={surahNumber} onChange={e => setSurahNumber(Math.min(114, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-[var(--primary)]" data-testid="surah-input" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Ayah</label>
                  <input type="number" min="1" value={ayahNumber} onChange={e => setAyahNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-[var(--primary)]" data-testid="ayah-input" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-500 mb-1">Translation</label>
                <LanguageSelector value={language} onChange={setLanguage} translations={translations} />
              </div>
              <button onClick={fetchVerse} className="btn-primary w-full" data-testid="load-verse-btn">Load Verse</button>
            </div>
            
            <div className="card-base p-6">
              <h3 className="font-semibold mb-4">Card Style</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {["dark", "parchment", "minimal"].map(s => (
                  <button key={s} onClick={() => setStyle(s)}
                    className={`p-3 rounded-lg border-2 capitalize ${style === s ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-gray-200'}`} data-testid={`style-${s}`}>{s}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showTranslation} onChange={e => setShowTranslation(e.target.checked)} className="w-4 h-4" data-testid="show-translation-toggle" />
                <span className="text-sm">Show Translation</span>
              </label>
            </div>
            
            <button onClick={downloadCard} disabled={!verse} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50" data-testid="download-card-btn">
              <Download size={18} /> Download as PNG (3x)
            </button>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Preview</h3>
            {loading ? <Loading /> : verse ? (
              <div id="verse-card" className={`${cardStyles[style]} rounded-2xl p-10 aspect-square flex flex-col items-center justify-center text-center`}>
                <p className="arabic-quran arabic-lg mb-6" dir="rtl">{verse.arabic}</p>
                {showTranslation && verse.translation && <p className="text-sm leading-relaxed mb-4 max-w-md opacity-70">"{verse.translation}"</p>}
                <p className="text-xs opacity-50">Surah {verse.surah}, Ayah {verse.ayah}</p>
                <p className="text-xs mt-4 opacity-40">TILAWA تلاوة</p>
              </div>
            ) : (
              <div className="card-base aspect-square flex items-center justify-center"><p className="text-gray-500">Enter surah and ayah</p></div>
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
    Promise.all([axios.get(`${API}/translations`), axios.get(`${API}/reciters`)])
      .then(([t, r]) => { setTranslations(t.data); setReciters(r.data); })
      .catch(() => {
        setTranslations({ en: { id: "en.asad", name: "English", direction: "ltr" } });
        setReciters({ yasser_dossari: { id: "yasser_dossari", name: "Yasser Al-Dossari", style: "Murattal" } });
      });
  }, []);
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage translations={translations} reciters={reciters} settings={settings} onSettingsChange={setSettings} />} />
          <Route path="/mushaf/:surahNumber" element={<MushafPage translations={translations} reciters={reciters} settings={settings} onSettingsChange={setSettings} />} />
          <Route path="/surah/:surahNumber" element={<MushafPage translations={translations} reciters={reciters} settings={settings} onSettingsChange={setSettings} />} />
          <Route path="/tajweed" element={<TajweedPage />} />
          <Route path="/cards" element={<CardCreatorPage translations={translations} />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
        
        <BottomNav />
        
        <button className="fab" onClick={() => setChatOpen(true)} data-testid="ai-chat-fab">
          <MessageCircle size={24} />
        </button>
        
        <AnimatePresence>
          {chatOpen && <AIChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />}
        </AnimatePresence>
      </BrowserRouter>
    </div>
  );
}

export default App;
