import React, { useState, useMemo } from 'react';
import { useAudio } from '../AudioContext';
import { NATURE_SOUNDS } from '../constants';
import { AnimationStyle } from '../types';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, Activity, Wind, CloudRain, 
  Sliders, ChevronDown, Check, X, 
  Moon, Zap, Focus as FocusIcon, List, Plus,
  Shuffle, Repeat, Repeat1, MoreHorizontal,
  ChevronLeft, Music as MusicIcon, Flame, Droplets, Waves, Trees
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerViewProps {
  onBack?: () => void;
}

export default function PlayerView({ onBack }: PlayerViewProps) {
  const { 
    tracks, 
    subliminalTracks,
    playlists,
    currentTrackIndex, 
    isPlaying, 
    setIsPlaying, 
    currentTime, 
    duration, 
    seekTo,
    settings,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleLoop,
    playingPlaylistId,
    currentPlaybackList,
    updateSubliminalSettings,
    updateBinauralSettings,
    updateNatureSettings,
    updateNoiseSettings,
    updateSettings,
    updateAudioTools,
    addTrack
  } = useAudio();

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const currentTrack = currentTrackIndex !== null ? currentPlaybackList[currentTrackIndex] : null;

  const currentPlaylist = playingPlaylistId ? playlists.find(p => p.id === playingPlaylistId) : null;
  const currentPosition = currentTrackIndex !== null ? `${currentTrackIndex + 1}/${currentPlaybackList.length}` : "";

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeLayersLabel = useMemo(() => {
    const layers = [
      settings.subliminal.isEnabled && "Subliminal",
      settings.binaural.isEnabled && "Binaural",
      settings.nature.isEnabled && settings.nature.type,
      settings.noise.isEnabled && `${settings.noise.type} Noise`
    ].filter(Boolean) as string[];
    
    if (layers.length === 0) return "Standard Audio";
    return layers.join(' • ');
  }, [settings]);

  const applyPreset = (mode: 'sleep' | 'focus' | 'relax') => {
    if (mode === 'sleep') {
      updateSubliminalSettings({ isEnabled: true, volume: 0.08 });
      updateBinauralSettings({ isEnabled: true, leftFreq: 150, rightFreq: 152, volume: 0.03 });
      updateNatureSettings({ isEnabled: true, type: 'rain', volume: 0.4 });
      updateNoiseSettings({ isEnabled: false });
    } else if (mode === 'focus') {
      updateSubliminalSettings({ isEnabled: true, volume: 0.12 });
      updateBinauralSettings({ isEnabled: true, leftFreq: 200, rightFreq: 214, volume: 0.06 });
      updateNatureSettings({ isEnabled: false });
      updateNoiseSettings({ isEnabled: true, type: 'white', volume: 0.15 });
    } else if (mode === 'relax') {
      updateSubliminalSettings({ isEnabled: true, volume: 0.1 });
      updateBinauralSettings({ isEnabled: true, leftFreq: 200, rightFreq: 208, volume: 0.05 });
      updateNatureSettings({ isEnabled: true, type: 'ocean', volume: 0.5 });
      updateNoiseSettings({ isEnabled: false });
    }
  };

  const getAnimationProps = (style: AnimationStyle) => {
    if (style === 'off' || !style) return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
    
    let currentStyle: AnimationStyle = style;
    if (style === 'random') {
      const styles: AnimationStyle[] = ['slide-up', 'slide-down', 'slide-left', 'slide-right'];
      currentStyle = styles[Math.floor(Math.random() * styles.length)];
    }

    switch (currentStyle) {
      case 'slide-up': return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
      case 'slide-down': return { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } };
      case 'slide-left': return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
      case 'slide-right': return { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } };
      default: return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
    }
  };

  const animationProps = useMemo(() => getAnimationProps(settings.animationStyle), [settings.animationStyle]);

  if (!currentTrack) {
// ... rest of the check ...
  }

  return (
    <div className={`h-full flex flex-col items-center justify-between select-none relative w-full max-w-2xl mx-auto bg-white overflow-hidden ${settings.bigTouchMode ? 'pb-16' : 'pb-12'}`}>
      {/* Top Bar */}
      <header className={`w-full flex items-center justify-between ${settings.bigTouchMode ? 'px-8 h-24' : 'px-6 h-20'} flex-shrink-0`}>
        <button 
          onClick={onBack}
          className={`${settings.bigTouchMode ? 'w-14 h-14' : 'w-10 h-10'} -ml-2 flex items-center justify-center text-black hover:bg-gray-50 rounded-full transition-colors`}
        >
          <ChevronDown size={settings.bigTouchMode ? 32 : 28} />
        </button>
        <h1 className={`font-bold uppercase tracking-[0.25em] text-gray-400 ${settings.bigTouchMode ? 'text-xs' : 'text-[10px]'}`}>Now Playing</h1>
        <button className={`${settings.bigTouchMode ? 'w-14 h-14' : 'w-10 h-10'} -mr-2 flex items-center justify-center text-black hover:bg-gray-50 rounded-full transition-colors`}>
          <MoreHorizontal size={settings.bigTouchMode ? 28 : 24} />
        </button>
      </header>

      {/* Main Art & Info */}
      <div className={`flex-1 flex flex-col items-center justify-center w-full px-8 ${settings.bigTouchMode ? 'gap-12' : 'gap-10'} ${!settings.showArtwork ? 'py-4' : ''}`}>
        {/* Album Art */}
        <AnimatePresence mode="wait">
          {settings.showArtwork ? (
            <motion.div 
              key="artwork"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: isPlaying ? 1 : 0.92 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className={`w-full ${settings.bigTouchMode ? 'max-w-[400px]' : 'max-w-[340px]'} aspect-square bg-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-black/[0.02] overflow-hidden relative`}
            >
              {currentTrack.artwork ? (
                <img src={currentTrack.artwork} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <MusicIcon size={settings.bigTouchMode ? 140 : 120} className="text-gray-100" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="waveform"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-[280px] h-32 flex items-center justify-center gap-1.5"
            >
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isPlaying ? [12, 48, 24, 64, 16][(i + Math.floor(currentTime)) % 5] : 8,
                    opacity: isPlaying ? [0.2, 0.5, 0.3, 0.6, 0.4][(i + Math.floor(currentTime)) % 5] : 0.1
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1 bg-apple-blue rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Track Title & Artist */}
        <div className={`text-center w-full transition-all duration-500 ${settings.showArtwork ? 'max-w-sm' : 'max-w-xl'}`}>
          <h2 className={`font-extrabold tracking-tight text-black line-clamp-1 mb-2 transition-all ${!settings.showArtwork ? (settings.bigTouchMode ? 'text-6xl mb-4' : 'text-5xl mb-3') : (settings.bigTouchMode ? 'text-4xl' : 'text-3xl')}`}>
            {currentTrack.name}
          </h2>
          <p className={`text-gray-400 font-bold mb-8 transition-all ${!settings.showArtwork ? (settings.bigTouchMode ? 'text-2xl' : 'text-xl') : (settings.bigTouchMode ? 'text-xl' : 'text-lg')}`}>
            {currentTrack.artist}
          </p>

          {/* Layer Indicator Pill - Cleaner */}
          <button 
            onClick={() => setIsPanelOpen(true)}
            className={`inline-flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors active:scale-95 border border-black/[0.01] ${settings.bigTouchMode ? 'px-8 py-4' : 'px-6 py-3'}`}
          >
            <div className="flex gap-1.5">
              {settings.subliminal.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-apple-blue" />}
              {settings.binaural.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
              {settings.nature.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
              {settings.noise.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </div>
            <span className={`font-bold uppercase tracking-[0.1em] text-gray-500 ${settings.bigTouchMode ? 'text-[11px]' : 'text-[10px]'}`}>{activeLayersLabel}</span>
          </button>
        </div>
      </div>

      {/* Playback Controls & Progress */}
      <div className={`w-full max-w-sm flex flex-col px-8 ${settings.bigTouchMode ? 'gap-10 mb-8' : 'gap-8 mb-4'}`}>
        {/* Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="relative h-6 flex items-center">
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className={`w-full ${settings.bigTouchMode ? 'h-2' : 'h-1'} bg-gray-100 rounded-full appearance-none cursor-pointer accent-black`}
            />
          </div>
          <div className={`flex justify-between font-bold text-gray-400 tabular-nums ${settings.bigTouchMode ? 'text-[11px]' : 'text-[10px]'}`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between px-2 pb-2">
          <button onClick={() => playPrevious()} className={`${settings.bigTouchMode ? 'p-6' : 'p-4'} text-black hover:bg-gray-50 rounded-full active:scale-90 transition-all`}>
            <SkipBack size={settings.bigTouchMode ? 48 : 40} fill="currentColor" stroke="none" />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`${settings.bigTouchMode ? 'w-24 h-24' : 'w-20 h-20'} bg-black text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all`}
          >
            {isPlaying ? (
              <Pause size={settings.bigTouchMode ? 44 : 36} fill="currentColor" stroke="none" />
            ) : (
              <Play size={settings.bigTouchMode ? 44 : 36} fill="currentColor" stroke="none" className="ml-1" />
            )}
          </button>

          <button onClick={() => playNext()} className={`${settings.bigTouchMode ? 'p-6' : 'p-4'} text-black hover:bg-gray-50 rounded-full active:scale-90 transition-all`}>
            <SkipForward size={settings.bigTouchMode ? 48 : 40} fill="currentColor" stroke="none" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet Layer Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <div className="fixed inset-0 z-[200]">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            />
            
            {/* Panel Content - Respects animationStyle */}
            <motion.div 
              key="layer-panel"
              {...animationProps}
              transition={{ duration: settings.animationStyle === 'off' ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="absolute bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white rounded-t-[3rem] shadow-[0_-8px_40px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[85vh] z-[210]"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
              
              <div className={`px-8 border-b border-black/[0.03] flex items-center justify-between ${settings.bigTouchMode ? 'py-6' : 'py-4'}`}>
                <h3 className={`font-bold tracking-tight ${settings.bigTouchMode ? 'text-2xl' : 'text-xl'}`}>Audio Layers</h3>
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className={`${settings.bigTouchMode ? 'w-12 h-12' : 'w-10 h-10'} -mr-2 flex items-center justify-center text-apple-text-secondary hover:bg-gray-50 rounded-full`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className={`flex-1 overflow-y-auto no-scrollbar pb-32 space-y-10 ${settings.bigTouchMode ? 'p-10' : 'p-8'}`}>
                {/* 1. Quick Modes */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4 px-1">Quick Modes</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <PresetButton icon={Moon} label="Sleep" color="bg-apple-blue" onClick={() => applyPreset('sleep')} />
                    <PresetButton icon={Zap} label="Focus" color="bg-orange-500" onClick={() => applyPreset('focus')} />
                    <PresetButton icon={FocusIcon} label="Relax" color="bg-green-500" onClick={() => applyPreset('relax')} />
                  </div>
                </div>

                {/* 2. Subliminal Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary px-1">Configuration</h4>
                  
                  <LayerOption 
                    icon={Volume2} 
                    label="Subliminal" 
                    isEnabled={settings.subliminal.isEnabled} 
                    onToggle={(v) => updateSubliminalSettings({ isEnabled: v })}
                    vol={settings.subliminal.volume}
                    setVol={(v) => updateSubliminalSettings({ volume: v })}
                    color="text-apple-blue"
                    maxVol={0.3}
                  >
                    <div className="flex flex-col gap-4 mt-2">
                      <div className="bg-gray-100 p-1 rounded-xl flex items-center h-8">
                        <button 
                          onClick={() => updateSubliminalSettings({ isPlaylistMode: false })}
                          className={`flex-1 h-full text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${!settings.subliminal.isPlaylistMode ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                        >
                          Track
                        </button>
                        <button 
                          onClick={() => updateSubliminalSettings({ isPlaylistMode: true })}
                          className={`flex-1 h-full text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${settings.subliminal.isPlaylistMode ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                        >
                          Playlist
                        </button>
                      </div>
                      <p className="text-[9px] text-apple-text-secondary italic px-1">
                        {settings.subliminal.isPlaylistMode ? 'Playing from source playlist...' : 'Playing selected subliminal track...'}
                      </p>
                    </div>
                  </LayerOption>

                  <LayerOption 
                    icon={Activity} 
                    label="Binaural" 
                    isEnabled={settings.binaural.isEnabled} 
                    onToggle={(v) => updateBinauralSettings({ isEnabled: v })}
                    vol={settings.binaural.volume}
                    setVol={(v) => updateBinauralSettings({ volume: v })}
                    color="text-purple-500"
                    maxVol={0.1}
                    subtitle={`${settings.binaural.leftFreq}Hz • ${settings.binaural.rightFreq}Hz`}
                  >
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {[
                        { label: 'Theta', l: 200, r: 204 },
                        { label: 'Alpha', l: 200, r: 210 },
                        { label: 'Gamma', l: 200, r: 240 }
                      ].map(p => (
                        <button 
                          key={p.label}
                          onClick={() => updateBinauralSettings({ leftFreq: p.l, rightFreq: p.r })}
                          className="py-2 px-1 rounded-xl text-[9px] font-bold uppercase bg-white border border-black/5 text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </LayerOption>

                  <LayerOption 
                    icon={CloudRain} 
                    label="Nature" 
                    isEnabled={settings.nature.isEnabled} 
                    onToggle={(v) => updateNatureSettings({ isEnabled: v })}
                    vol={settings.nature.volume}
                    setVol={(v) => updateNatureSettings({ volume: v })}
                    color="text-green-500"
                    subtitle={settings.nature.type}
                  >
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {NATURE_SOUNDS.map(sound => (
                        <button 
                          key={sound.id}
                          onClick={() => updateNatureSettings({ type: sound.id as any })}
                          className={`py-2 px-1 rounded-xl text-[9px] font-bold uppercase transition-all border ${settings.nature.type === sound.id ? 'bg-green-500 text-white border-green-500' : 'bg-gray-50 border-black/5 text-apple-text-secondary'}`}
                        >
                          {sound.name}
                        </button>
                      ))}
                    </div>
                  </LayerOption>

                  <LayerOption 
                    icon={Wind} 
                    label="Noise" 
                    isEnabled={settings.noise.isEnabled} 
                    onToggle={(v) => updateNoiseSettings({ isEnabled: v })}
                    vol={settings.noise.volume}
                    setVol={(v) => updateNoiseSettings({ volume: v })}
                    color="text-orange-500"
                    subtitle={`${settings.noise.type} noise`}
                  >
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        {['white', 'pink', 'brown'].map(type => (
                          <button 
                            key={type}
                            onClick={() => updateNoiseSettings({ type: type as any })}
                            className={`py-2 px-1 rounded-xl text-[9px] font-bold uppercase transition-all border ${settings.noise.type === type ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-gray-50 border-black/5 text-apple-text-secondary'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                  </LayerOption>
                </div>

                {/* 3. Audio Tools */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary px-1">Audio Processing</h4>
                  
                  <div className="space-y-4">
                    {/* Output Gain */}
                    <div className="bg-gray-50 border border-black/[0.03] p-5 rounded-[2rem] space-y-4">
                       <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold tracking-tight">Output Gain</span>
                             <span className="text-[9px] font-bold text-apple-blue uppercase tracking-widest">{settings.audioTools.gainDb} dB</span>
                          </div>
                          <input 
                            type="range" 
                            min="-60" max="0" step="1"
                            value={settings.audioTools.gainDb}
                            onChange={(e) => updateAudioTools({ gainDb: parseInt(e.target.value) })}
                            className="w-32 h-1 bg-black/5 rounded-full appearance-none accent-apple-text-primary"
                          />
                       </div>

                       <div className="h-px bg-black/5" />

                       {/* Normalization */}
                       <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold tracking-tight">Normalization</span>
                             <span className="text-[9px] font-bold text-apple-text-secondary uppercase tracking-widest">
                               {settings.audioTools.normalizeTargetDb !== null ? `Peak ${settings.audioTools.normalizeTargetDb}dB` : 'Off'}
                             </span>
                          </div>
                          <button 
                            onClick={() => updateAudioTools({ normalizeTargetDb: settings.audioTools.normalizeTargetDb === null ? -10 : null })}
                            className={`w-10 h-6 rounded-full relative transition-colors ${settings.audioTools.normalizeTargetDb !== null ? 'bg-apple-blue' : 'bg-gray-200'}`}
                          >
                            <motion.div className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full" animate={{ x: settings.audioTools.normalizeTargetDb !== null ? 16 : 0 }} />
                          </button>
                       </div>
                    </div>

                    {/* Speed Selector */}
                    <div className="bg-gray-50 border border-black/[0.03] p-5 rounded-[2rem]">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary mb-4 px-1">Playback Speed</h5>
                      <div className="flex gap-2">
                        {[1, 1.5, 2, 2.5].map(rate => (
                          <button
                            key={rate}
                            onClick={() => updateSettings({ playbackRate: rate })}
                            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border ${settings.playbackRate === rate ? 'bg-apple-text-primary text-white border-apple-text-primary shadow-sm' : 'bg-white text-apple-text-secondary border-black/5 hover:bg-gray-100'}`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PresetButton = ({ icon: Icon, label, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-3 p-5 bg-white border border-black/[0.03] rounded-[2.5rem] hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
  >
    <div className={`w-12 h-12 flex-shrink-0 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/5`}>
      <Icon size={22} />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary truncate w-full text-center">{label}</span>
  </button>
);

const LayerOption = ({ icon: Icon, label, isEnabled, onToggle, vol, setVol, color, maxVol = 1, subtitle, children }: any) => {
  return (
    <div className="bg-gray-50 border border-black/[0.03] p-5 rounded-[2rem] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-10 h-10 ${isEnabled ? 'bg-white shadow-sm' : 'bg-white/50'} rounded-2xl flex-shrink-0 flex items-center justify-center ${isEnabled ? color : 'text-gray-300'} transition-all`}>
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-sm font-bold tracking-tight truncate">{label}</h5>
            {subtitle && <p className="text-[9px] text-apple-text-secondary uppercase font-bold tracking-widest truncate">{subtitle}</p>}
          </div>
        </div>
        <button 
          onClick={() => onToggle(!isEnabled)}
          className={`flex-shrink-0 w-10 h-6 rounded-full relative transition-colors ${isEnabled ? (color.includes('blue') ? 'bg-apple-blue' : color.includes('purple') ? 'bg-purple-500' : color.includes('green') ? 'bg-green-500' : 'bg-orange-500') : 'bg-gray-200'}`}
        >
          <motion.div className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full" animate={{ x: isEnabled ? 16 : 0 }} />
        </button>
      </div>
      
      {isEnabled && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-4">
            <input 
              type="range"
              min={0}
              max={maxVol}
              step={0.01}
              value={vol}
              onChange={(e) => setVol(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-black/5 rounded-full appearance-none accent-apple-text-primary"
            />
            <span className="text-[10px] font-extrabold text-apple-text-primary w-8 text-right tabular-nums">{Math.round(vol * 100)}%</span>
          </div>
          {children}
        </div>
      )}
    </div>
  );
};
