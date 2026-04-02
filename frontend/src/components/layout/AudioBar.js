import React, { useCallback } from "react";
import { useAudio } from "@/lib/AudioContext";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Repeat, Repeat1, Gauge
} from "lucide-react";

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioBar() {
  const {
    isPlaying, isLoading, currentVerseKey, currentSurahId,
    currentTime, duration, volume, playbackRate, repeatMode,
    togglePlay, nextVerse, prevVerse, seekTo,
    setVolume, cycleRepeat, cycleSpeed,
  } = useAudio();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    seekTo(Math.max(0, Math.min(1, fraction)));
  }, [seekTo]);

  if (!currentSurahId) return null;

  return (
    <div
      data-testid="audio-bar"
      className="fixed bottom-0 left-0 lg:left-80 right-0 h-24 bg-[#070a0f]/80 backdrop-blur-xl border-t border-[#c8943f]/15 z-50 flex items-center px-4 lg:px-8 gap-4"
    >
      {/* Verse Info */}
      <div className="w-28 lg:w-40 shrink-0">
        {currentVerseKey ? (
          <div>
            <p data-testid="audio-verse-key" className="text-[#c8943f] text-sm font-medium">
              {currentVerseKey}
            </p>
            <p className="text-[11px] text-[#8b95a5]">Now Playing</p>
          </div>
        ) : (
          <p className="text-[11px] text-[#8b95a5]">
            {isLoading ? "Loading audio..." : "Ready"}
          </p>
        )}
      </div>

      {/* Center: Controls + Progress */}
      <div className="flex-1 flex flex-col items-center gap-1.5 max-w-2xl mx-auto">
        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            data-testid="audio-prev-btn"
            onClick={prevVerse}
            className="text-[#8b95a5] hover:text-[#c8943f] transition-colors"
          >
            <SkipBack size={18} />
          </button>
          <button
            data-testid="audio-play-btn"
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-[#c8943f] text-[#070a0f] hover:bg-[#e6b058] transition-colors"
            disabled={isLoading}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button
            data-testid="audio-next-btn"
            onClick={nextVerse}
            className="text-[#8b95a5] hover:text-[#c8943f] transition-colors"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="w-full flex items-center gap-2.5 text-[11px] text-[#8b95a5]">
          <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div
            data-testid="audio-progress-bar"
            className="progress-track flex-1"
            onClick={handleProgressClick}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="w-10 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume, Speed, Repeat */}
      <div className="hidden md:flex items-center gap-3 w-40 shrink-0 justify-end">
        <button
          data-testid="audio-repeat-btn"
          onClick={cycleRepeat}
          className={`transition-colors ${
            repeatMode !== "off" ? "text-[#c8943f]" : "text-[#8b95a5] hover:text-[#c8943f]"
          }`}
          title={`Repeat: ${repeatMode}`}
        >
          {repeatMode === "verse" ? <Repeat1 size={16} /> : <Repeat size={16} />}
        </button>

        <button
          data-testid="audio-speed-btn"
          onClick={cycleSpeed}
          className="text-[11px] text-[#8b95a5] hover:text-[#c8943f] transition-colors min-w-[36px] text-center tabular-nums"
          title="Playback speed"
        >
          {playbackRate}x
        </button>

        <div className="flex items-center gap-1.5 w-24">
          <button
            data-testid="audio-mute-btn"
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="text-[#8b95a5] hover:text-[#c8943f] transition-colors"
          >
            {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <Slider
            data-testid="audio-volume-slider"
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            max={1}
            step={0.01}
            className="w-16"
          />
        </div>
      </div>
    </div>
  );
}
