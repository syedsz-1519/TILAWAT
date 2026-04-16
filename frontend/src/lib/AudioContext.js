import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import api from "./api";

const AudioCtx = createContext(null);
export const useAudio = () => useContext(AudioCtx);

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());
  const animRef = useRef(null);
  const lastWordRef = useRef({ verse: null, word: null });
  const stateRef = useRef({});

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSurahId, setCurrentSurahId] = useState(null);
  const [currentVerseKey, setCurrentVerseKey] = useState(null);
  const [currentWordPosition, setCurrentWordPosition] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [repeatMode, setRepeatMode] = useState("off");
  const [verseTimings, setVerseTimings] = useState([]);
  const [audioUrl, setAudioUrl] = useState("");

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { verseTimings, repeatMode, currentVerseKey };
  }, [verseTimings, repeatMode, currentVerseKey]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animRef.current);
      if (stateRef.current.repeatMode === "surah") {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
        startSync();
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Word sync loop
  const startSync = useCallback(() => {
    const tick = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;

      const ms = audio.currentTime * 1000;
      const timings = stateRef.current.verseTimings;
      const rm = stateRef.current.repeatMode;

      let activeVerse = null;
      let activeWord = null;

      for (const vt of timings) {
        if (ms >= vt.timestamp_from && ms < vt.timestamp_to) {
          activeVerse = vt.verse_key;
          const segs = vt.segments || [];
          for (const seg of segs) {
            if (ms >= seg[1] && ms < seg[2]) {
              activeWord = seg[0];
              break;
            }
          }
          break;
        }
      }

      // Verse repeat
      if (rm === "verse" && stateRef.current.currentVerseKey) {
        const cvt = timings.find(t => t.verse_key === stateRef.current.currentVerseKey);
        if (cvt && ms >= cvt.timestamp_to) {
          audio.currentTime = cvt.timestamp_from / 1000;
        }
      }

      // Only update state when word changes
      if (activeVerse !== lastWordRef.current.verse || activeWord !== lastWordRef.current.word) {
        lastWordRef.current = { verse: activeVerse, word: activeWord };
        setCurrentVerseKey(activeVerse);
        setCurrentWordPosition(activeWord);
      }
      setCurrentTime(audio.currentTime);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  // Load surah audio
  const loadSurah = useCallback(async (surahId) => {
    if (currentSurahId === surahId && verseTimings.length > 0) return;
    setIsLoading(true);
    try {
      const data = await api.getAudioTimings(surahId);
      const audio = audioRef.current;
      audio.pause();
      cancelAnimationFrame(animRef.current);

      audio.src = data.audio_url;
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      audio.load();

      setCurrentSurahId(surahId);
      setVerseTimings(data.verse_timings || []);
      setAudioUrl(data.audio_url);
      setCurrentVerseKey(null);
      setCurrentWordPosition(null);
      setCurrentTime(0);
      setIsPlaying(false);
      lastWordRef.current = { verse: null, word: null };
    } catch (err) {
      console.error("Failed to load audio:", err);
    }
    setIsLoading(false);
  }, [currentSurahId, verseTimings.length, volume, playbackRate]);

  const playVerse = useCallback((verseKey) => {
    const vt = stateRef.current.verseTimings.find(t => t.verse_key === verseKey);
    if (!vt) return;
    const audio = audioRef.current;
    audio.currentTime = vt.timestamp_from / 1000;
    audio.play().then(() => startSync()).catch(() => {});
    setCurrentVerseKey(verseKey);
  }, [startSync]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().then(() => startSync()).catch(() => {});
    } else {
      audio.pause();
      cancelAnimationFrame(animRef.current);
    }
  }, [startSync]);

  const seekTo = useCallback((fraction) => {
    const audio = audioRef.current;
    if (audio.duration) {
      audio.currentTime = fraction * audio.duration;
      setCurrentTime(audio.currentTime);
    }
  }, []);

  const nextVerse = useCallback(() => {
    const timings = stateRef.current.verseTimings;
    const currentVK = stateRef.current.currentVerseKey;
    if (!timings.length) return;
    const idx = timings.findIndex(t => t.verse_key === currentVK);
    const next = idx < timings.length - 1 ? idx + 1 : 0;
    playVerse(timings[next].verse_key);
  }, [playVerse]);

  const prevVerse = useCallback(() => {
    const timings = stateRef.current.verseTimings;
    const currentVK = stateRef.current.currentVerseKey;
    if (!timings.length) return;
    const idx = timings.findIndex(t => t.verse_key === currentVK);
    const prev = idx > 0 ? idx - 1 : timings.length - 1;
    playVerse(timings[prev].verse_key);
  }, [playVerse]);

  const setVolume = useCallback((v) => {
    audioRef.current.volume = v;
    setVolumeState(v);
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    audioRef.current.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(m => m === "off" ? "verse" : m === "verse" ? "surah" : "off");
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    setPlaybackRateState(prev => {
      const idx = speeds.indexOf(prev);
      const next = speeds[(idx + 1) % speeds.length];
      audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  const value = {
    isPlaying, isLoading, currentSurahId, currentVerseKey, currentWordPosition,
    currentTime, duration, volume, playbackRate, repeatMode,
    verseTimings, audioUrl,
    loadSurah, playVerse, togglePlay, seekTo,
    nextVerse, prevVerse, setVolume, setPlaybackRate,
    cycleRepeat, cycleSpeed, setRepeatMode,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
