import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const http = axios.create({ baseURL: API, timeout: 30000 });

const api = {
  getSurahs: () => http.get("/surahs").then(r => r.data),
  getSurah: (id) => http.get(`/surahs/${id}`).then(r => r.data),
  getVerses: (surahId, translation_ids = "20") => http.get(`/surahs/${surahId}/verses`, { params: { translations: translation_ids } }).then(r => r.data),
  getTranslations: () => http.get("/translations").then(r => r.data),
  generateTts: (text) => http.post("/tts", { text }, { responseType: 'blob' }).then(r => r.data),
  getVerse: (key) => http.get(`/verses/${key}`).then(r => r.data),
  getAudioTimings: (surahId, reciterId = 11) =>
    http.get(`/audio-timings/${surahId}`, { params: { reciter_id: reciterId } }).then(r => r.data),
  getReciters: () => http.get("/reciters").then(r => r.data),
  search: (q, limit = 20) => http.get("/search", { params: { q, limit } }).then(r => r.data),
  getBookmarks: () => http.get("/bookmarks").then(r => r.data),
  createBookmark: (data) => http.post("/bookmarks", data).then(r => r.data),
  deleteBookmark: (id) => http.delete(`/bookmarks/${id}`).then(r => r.data),
  getTajweedRules: () => http.get("/tajweed/rules").then(r => r.data),
  createTajweedSession: (verseKey) =>
    http.post("/tajweed/sessions", { verse_key: verseKey }).then(r => r.data),
  getTajweedSession: (id) => http.get(`/tajweed/sessions/${id}`).then(r => r.data),
  getTajweedRule: (id) => http.get(`/tajweed/rules/${id}`).then(r => r.data),
  getDashboardStats: () => http.get("/dashboard/stats").then(r => r.data),
  getQuizQuestions: (limit = 8) => http.get("/quiz/questions", { params: { limit } }).then(r => r.data),
  submitQuiz: (answers) => http.post("/quiz/submit", { answers }).then(r => r.data),
};

export default api;
