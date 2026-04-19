import React from 'react';
import { useAudio } from '../AudioContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Activity, Wind, CloudRain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PlayerView() {
  const { 
    tracks, 
    currentTrackIndex, 
    isPlaying, 
    setIsPlaying, 
    currentTime, 
    duration, 
    seekTo,
    settings,
    updateSubliminalSettings,
    updateBinauralSettings,
    updateNatureSettings,
    updateNoiseSettings
  } = useAudio();
  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  if (!currentTrack) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-12">
        <div className="w-64 h-64 bg-apple-card rounded-[3rem] shadow-2xl shadow-black/5 flex items-center justify-center">
            <Music size={64} className="text-apple-bg" />
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold">Select a track</h2>
          <p className="text-apple-text-secondary mt-2">Pick something from your library to start listening.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-between py-8 px-6">
      {/* Artwork Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <motion.div 
          className="w-full aspect-square bg-apple-card rounded-[3rem] shadow-2xl shadow-black/10 flex items-center justify-center overflow-hidden"
          animate={{ 
            scale: isPlaying ? 1 : 0.9,
            rotate: isPlaying ? 0 : -2
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {currentTrack.artwork ? (
            <img src={currentTrack.artwork} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-gray-50 to-gray-200 flex items-center justify-center">
               <Music size={120} className="text-gray-300" />
            </div>
          )}
        </motion.div>
        
        <div className="mt-12 text-center w-full">
          <motion.h2 
            className="text-2xl font-bold tracking-tight truncate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentTrack.name}
          </motion.h2>
          <motion.p 
            className="text-apple-text-secondary mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {currentTrack.artist}
          </motion.p>
        </div>
      </div>

      {/* Controls Area */}
      <div className="w-full max-w-sm flex flex-col gap-8 pb-12">
        {/* Progress Bar */}
        <div className="flex flex-col gap-2">
          <input 
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer accent-apple-blue overflow-hidden"
          />
          <div className="flex justify-between text-[10px] font-semibold text-apple-text-secondary tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime((duration || 0) - currentTime)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-10">
          <button className="text-apple-text-primary active:scale-95 transition-transform">
            <SkipBack size={28} fill="currentColor" stroke="none" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 bg-apple-text-primary text-apple-card rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" stroke="none" /> : <Play size={32} fill="currentColor" stroke="none" className="ml-1" />}
          </button>
          <button className="text-apple-text-primary active:scale-95 transition-transform">
            <SkipForward size={28} fill="currentColor" stroke="none" />
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="grid grid-cols-2 gap-3">
          {/* Subliminal Mini Toggle */}
          <div className="flex flex-col gap-2 bg-apple-card/50 px-4 py-3 rounded-2xl border border-black/5">
            <div className="flex items-center justify-between">
              <div className={settings.subliminal.isEnabled ? "text-apple-blue" : "text-apple-text-secondary"}>
                <Volume2 size={16} />
              </div>
              <button 
                onClick={() => updateSubliminalSettings({ isEnabled: !settings.subliminal.isEnabled })}
                className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${settings.subliminal.isEnabled ? 'bg-apple-blue' : 'bg-gray-200'}`}
              >
                <motion.div 
                  className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full"
                  animate={{ x: settings.subliminal.isEnabled ? 12 : 0 }}
                />
              </button>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Subliminal</span>
          </div>

          {/* Binaural Mini Toggle */}
          <div className="flex flex-col gap-2 bg-apple-card/50 px-4 py-3 rounded-2xl border border-black/5">
            <div className="flex items-center justify-between">
              <div className={settings.binaural.isEnabled ? "text-purple-500" : "text-apple-text-secondary"}>
                <Activity size={16} />
              </div>
              <button 
                onClick={() => updateBinauralSettings({ isEnabled: !settings.binaural.isEnabled })}
                className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${settings.binaural.isEnabled ? 'bg-purple-500' : 'bg-gray-200'}`}
              >
                <motion.div 
                  className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full"
                  animate={{ x: settings.binaural.isEnabled ? 12 : 0 }}
                />
              </button>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Binaural</span>
          </div>

          {/* Nature Mini Toggle */}
          <div className="flex flex-col gap-2 bg-apple-card/50 px-4 py-3 rounded-2xl border border-black/5">
             <div className="flex items-center justify-between">
                <div className={settings.nature.isEnabled ? "text-green-500" : "text-apple-text-secondary"}>
                   <CloudRain size={16} />
                </div>
                <button 
                  onClick={() => updateNatureSettings({ isEnabled: !settings.nature.isEnabled })}
                  className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${settings.nature.isEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.nature.isEnabled ? 12 : 0 }} />
                </button>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Nature</span>
          </div>

          {/* Noise Mini Toggle */}
          <div className="flex flex-col gap-2 bg-apple-card/50 px-4 py-3 rounded-2xl border border-black/5">
             <div className="flex items-center justify-between">
                <div className={settings.noise.isEnabled ? "text-orange-500" : "text-apple-text-secondary"}>
                   <Wind size={16} />
                </div>
                <button 
                  onClick={() => updateNoiseSettings({ isEnabled: !settings.noise.isEnabled })}
                  className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${settings.noise.isEnabled ? 'bg-orange-500' : 'bg-gray-200'}`}
                >
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.noise.isEnabled ? 12 : 0 }} />
                </button>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Noise</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const Music = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);
