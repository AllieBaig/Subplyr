import React, { useState } from 'react';
import { useAudio } from '../AudioContext';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, Activity, Wind, CloudRain, 
  Sliders, ChevronDown, Check, X, 
  Moon, Zap, Focus as FocusIcon, List, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PlayerView() {
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
    updateSubliminalSettings,
    updateBinauralSettings,
    updateNatureSettings,
    updateNoiseSettings,
    updateSettings,
    updateAudioTools,
    addTrack
  } = useAudio();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAudioToolsOpen, setIsAudioToolsOpen] = useState(false);

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeLayers = [
    settings.subliminal.isEnabled && "Subliminal",
    settings.binaural.isEnabled && "Binaural",
    settings.nature.isEnabled && settings.nature.type,
    settings.noise.isEnabled && `${settings.noise.type} noise`
  ].filter(Boolean) as string[];

  const applyPreset = (mode: 'sleep' | 'focus' | 'relax') => {
    if (mode === 'sleep') {
      updateSubliminalSettings({ isEnabled: true, volume: 0.1 });
      updateBinauralSettings({ isEnabled: true, leftFreq: 150, rightFreq: 152, volume: 0.03 });
      updateNatureSettings({ isEnabled: true, type: 'rain', volume: 0.4 });
      updateNoiseSettings({ isEnabled: false });
    } else if (mode === 'focus') {
      updateSubliminalSettings({ isEnabled: true, volume: 0.15 });
      updateBinauralSettings({ isEnabled: true, leftFreq: 200, rightFreq: 214, volume: 0.06 });
      updateNatureSettings({ isEnabled: false });
      updateNoiseSettings({ isEnabled: true, type: 'white', volume: 0.15 });
    } else if (mode === 'relax') {
      updateSubliminalSettings({ isEnabled: true, volume: 0.12 });
      updateBinauralSettings({ isEnabled: true, leftFreq: 200, rightFreq: 208, volume: 0.05 });
      updateNatureSettings({ isEnabled: true, type: 'ocean', volume: 0.5 });
      updateNoiseSettings({ isEnabled: false });
    }
  };

  if (!currentTrack) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-12 pt-20">
        <div className="w-64 h-64 bg-white rounded-[3rem] shadow-2xl border border-black/5 flex items-center justify-center">
            <Music size={64} className="text-gray-100" />
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">Your music awaits</h2>
          <p className="text-apple-text-secondary mt-3 text-sm leading-relaxed px-4">Visit your library to select a track and start your mindful session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-between pb-12 overflow-hidden select-none">
      {/* Top Header - Fixed Height */}
      <header className="w-full flex items-center justify-between mt-4 h-12 flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-apple-text-secondary">
          <ChevronDown size={24} />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary leading-none">Now Playing</p>
        </div>
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="w-10 h-10 rounded-full bg-apple-card border border-black/5 flex items-center justify-center text-apple-text-primary shadow-sm active:scale-95 transition-transform"
        >
          <Sliders size={18} />
        </button>
      </header>

      {/* Main Art & Info - Centered with flex-grow but stable containment */}
      <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-sm overflow-hidden ${settings.miniMode ? 'px-1' : 'px-2'}`}>
        <div className={`w-full relative flex items-center justify-center ${settings.miniMode ? 'mb-6' : 'mb-10'}`}>
          <motion.div 
            className={`w-full aspect-square bg-white border border-black/[0.03] flex items-center justify-center overflow-hidden relative ${settings.miniMode ? 'rounded-2xl shadow-md' : 'rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)]'}`}
            animate={{ 
              scale: isPlaying ? 1 : 0.92,
              filter: settings.miniMode ? 'blur(0px)' : (isPlaying ? 'blur(0px)' : 'blur(2px)'),
              opacity: settings.miniMode ? (isPlaying ? 1 : 0.9) : (isPlaying ? 1 : 0.8)
            }}
            transition={{ 
              type: 'spring', 
              stiffness: settings.miniMode ? 300 : 200, 
              damping: settings.miniMode ? 30 : 25 
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            {currentTrack.artwork ? (
              <img src={currentTrack.artwork} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-gray-50 to-gray-100 flex items-center justify-center">
                 <Music size={settings.miniMode ? 80 : 120} className="text-gray-200" />
              </div>
            )}
          </motion.div>
        </div>
        
        <div className={`text-center w-full px-4 flex flex-col justify-center ${settings.miniMode ? 'h-28' : 'h-36'}`}>
          <h2 className={`${settings.miniMode ? 'text-xl' : 'text-2xl'} font-extrabold tracking-tight text-apple-text-primary mb-1.5 line-clamp-2 leading-tight overflow-hidden text-ellipsis`}>
            {currentTrack.name}
          </h2>
          <p className="text-apple-text-secondary font-semibold text-sm tracking-wide">{currentTrack.artist}</p>
          
          <div className="flex justify-center">
            <button 
              onClick={() => setIsPanelOpen(true)}
              className={`inline-flex items-center gap-2 bg-apple-card border border-black/5 rounded-full text-[10px] font-bold tracking-wide uppercase text-apple-text-secondary ${settings.miniMode ? 'mt-2 px-3 py-1.5' : 'mt-4 px-4 py-2 shadow-sm'} transition-colors`}
            >
              <div className="flex gap-1">
                {settings.subliminal.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-apple-blue" />}
                {settings.binaural.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                {settings.nature.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                {settings.noise.isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </div>
              <span className="truncate max-w-[120px]">{activeLayers.length > 0 ? activeLayers.join(' • ') : 'Standard'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Playback Controls - Fixed at Bottom */}
      <div className={`w-full max-w-sm flex flex-col px-4 flex-shrink-0 ${settings.miniMode ? 'gap-4 mt-2' : 'gap-8 mt-4'}`}>
        <div className="flex flex-col gap-3">
          <div className="relative h-6 flex items-center">
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className={`w-full bg-black/5 rounded-full appearance-none cursor-pointer accent-apple-text-primary ${settings.miniMode ? 'h-1' : 'h-1.5'}`}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-apple-text-secondary tabular-nums tracking-widest leading-none bg-apple-bg px-1 rounded-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={`flex items-center justify-between px-6 ${settings.miniMode ? 'pb-0' : 'pb-2'}`}>
          <button onClick={playPrevious} className="p-3 text-apple-text-primary active:scale-90 transition-transform">
            <SkipBack size={settings.miniMode ? 28 : 36} fill="currentColor" stroke="none" />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`bg-apple-text-primary text-white rounded-full flex items-center justify-center active:scale-95 transition-all ${settings.miniMode ? 'w-16 h-16 shadow-lg' : 'w-20 h-20 shadow-[0_12px_32px_rgba(0,0,0,0.2)]'}`}
          >
            {isPlaying ? <Pause size={settings.miniMode ? 28 : 36} fill="currentColor" stroke="none" /> : <Play size={settings.miniMode ? 28 : 36} fill="currentColor" stroke="none" className="ml-1" />}
          </button>

          <button onClick={playNext} className="p-3 text-apple-text-primary active:scale-90 transition-transform">
            <SkipForward size={settings.miniMode ? 28 : 36} fill="currentColor" stroke="none" />
          </button>
        </div>
      </div>

      {/* Layer Control Panel (Bottom/Top Sheet) */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ y: settings.hiddenLayersPosition === 'top' ? '-100%' : '100%' }}
              animate={{ y: 0 }}
              exit={{ y: settings.hiddenLayersPosition === 'top' ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed ${settings.hiddenLayersPosition === 'top' ? 'top-0 rounded-b-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)]' : 'bottom-0 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]'} left-0 right-0 max-w-md mx-auto bg-white z-[200] max-h-[85vh] overflow-y-auto no-scrollbar`}
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur-xl px-8 py-6 border-b border-black/[0.03] flex items-center justify-between z-10">
                <h3 className="text-xl font-bold tracking-tight">Sound Layers</h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                        const newPos = settings.hiddenLayersPosition === 'bottom' ? 'top' : 'bottom';
                        updateSettings({ hiddenLayersPosition: newPos });
                    }}
                    className="text-[10px] font-bold text-apple-blue uppercase tracking-widest bg-apple-blue/5 px-3 py-1.5 rounded-full"
                  >
                    {settings.hiddenLayersPosition}
                  </button>
                  <button 
                    onClick={() => setIsPanelOpen(false)}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-apple-text-primary active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 pb-32 space-y-10">
                {/* Mode Presets */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4">Quick Sessions</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <PresetButton icon={Moon} label="Sleep" color="bg-apple-blue" onClick={() => applyPreset('sleep')} />
                    <PresetButton icon={Zap} label="Focus" color="bg-orange-500" onClick={() => applyPreset('focus')} />
                    <PresetButton icon={FocusIcon} label="Relax" color="bg-green-500" onClick={() => applyPreset('relax')} />
                  </div>
                </div>

                {/* Main Audio & Speed */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4">Main Audio Control</h4>
                  
                  <LayerOption 
                    icon={Music} 
                    label="Main Track" 
                    isEnabled={true}
                    onToggle={() => {}}
                    vol={settings.mainVolume}
                    setVol={(v: number) => updateSettings({ mainVolume: v })}
                    color="text-apple-text-primary"
                    subtitle="Primary audio layer"
                  />

                  <div className="bg-apple-card p-5 rounded-[2.5rem] border border-black/[0.03] space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-apple-text-secondary">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold tracking-tight">Playback Speed</h5>
                        <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-wider">Stable Pitch</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       {[1, 1.5, 2, 2.5].map(rate => (
                         <button
                           key={rate}
                           onClick={() => updateSettings({ playbackRate: rate })}
                           className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold transition-all border ${settings.playbackRate === rate ? 'bg-apple-text-primary text-white border-apple-text-primary shadow-md' : 'bg-gray-50 text-apple-text-secondary border-black/5 hover:bg-gray-100'}`}
                         >
                           {rate}x
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Layer Controls */}
                <div className="space-y-4">
                  <LayerOption 
                    icon={Volume2} 
                    label="Subliminal" 
                    isEnabled={settings.subliminal.isEnabled} 
                    onToggle={(v) => updateSubliminalSettings({ isEnabled: v })}
                    vol={settings.subliminal.volume}
                    setVol={(v) => updateSubliminalSettings({ volume: v })}
                    color="text-apple-blue"
                    maxVol={0.3}
                    subtitle="Hidden affirmations layer"
                  >
                    <div className="mt-6 flex flex-col gap-6">
                      {/* Segmented Control */}
                      <div className="bg-gray-100 p-1 rounded-2xl flex items-center h-10">
                        <button 
                          onClick={() => updateSubliminalSettings({ isPlaylistMode: false })}
                          className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${!settings.subliminal.isPlaylistMode ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                        >
                          Single Track
                        </button>
                        <button 
                          onClick={() => updateSubliminalSettings({ isPlaylistMode: true })}
                          className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.subliminal.isPlaylistMode ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                        >
                          Play via Playlist
                        </button>
                      </div>

                      {settings.subliminal.isPlaylistMode ? (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-apple-text-secondary">Source Playlist</p>
                            {settings.subliminal.sourcePlaylistId && (
                              <span className="text-[9px] font-bold text-apple-blue uppercase tracking-widest">Selected</span>
                            )}
                          </div>
                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {playlists.map(p => (
                              <button
                                key={p.id}
                                onClick={() => updateSubliminalSettings({ sourcePlaylistId: p.id })}
                                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${settings.subliminal.sourcePlaylistId === p.id ? 'bg-apple-blue text-white border-apple-blue shadow-md' : 'bg-white text-apple-text-secondary border-black/[0.08] hover:border-black/20'}`}
                              >
                                {p.name}
                              </button>
                            ))}
                            {playlists.length === 0 && (
                              <p className="text-[10px] text-gray-400 italic px-2 py-2">No playlists created yet</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-apple-text-secondary">Source Track</p>
                            <label className="flex items-center gap-1.5 text-apple-blue cursor-pointer active:opacity-50 transition-opacity">
                              <Plus size={12} />
                              <span className="text-[9px] font-bold uppercase tracking-widest">Upload New</span>
                              <input 
                                type="file" 
                                accept="audio/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    await addTrack(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {[...subliminalTracks, ...tracks].map(t => (
                              <button
                                key={t.id}
                                onClick={() => updateSubliminalSettings({ selectedTrackId: t.id })}
                                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${settings.subliminal.selectedTrackId === t.id ? 'bg-apple-blue text-white border-apple-blue shadow-md' : 'bg-white text-apple-text-secondary border-black/[0.08] hover:border-black/20'}`}
                              >
                                {t.name}
                              </button>
                            ))}
                            {[...subliminalTracks, ...tracks].length === 0 && (
                              <p className="text-[10px] text-gray-400 italic px-2 py-2">No audio tracks found</p>
                            )}
                          </div>
                        </div>
                      )}
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
                  />
                  <LayerOption 
                    icon={CloudRain} 
                    label="Nature" 
                    isEnabled={settings.nature.isEnabled} 
                    onToggle={(v) => updateNatureSettings({ isEnabled: v })}
                    vol={settings.nature.volume}
                    setVol={(v) => updateNatureSettings({ volume: v })}
                    color="text-green-500"
                    subtitle={settings.nature.type}
                  />
                  <LayerOption 
                    icon={Wind} 
                    label="Noise" 
                    isEnabled={settings.noise.isEnabled} 
                    onToggle={(v) => updateNoiseSettings({ isEnabled: v })}
                    vol={settings.noise.volume}
                    setVol={(v) => updateNoiseSettings({ volume: v })}
                    color="text-orange-500"
                    subtitle={`${settings.noise.type} noise`}
                  />
                </div>

                {/* Audio Tools Section */}
                <div className="pt-2">
                  <button 
                    onClick={() => setIsAudioToolsOpen(!isAudioToolsOpen)}
                    className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-black/[0.03] active:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white shadow-sm rounded-2xl flex items-center justify-center text-apple-text-primary">
                        <Sliders size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold tracking-tight">Audio Tools</h4>
                        {settings.audioTools.gainDb !== 0 || settings.audioTools.normalizeTargetDb !== null ? (
                          <p className="text-[9px] text-apple-blue font-bold uppercase tracking-widest">Active Filters</p>
                        ) : (
                          <p className="text-[9px] text-apple-text-secondary font-bold uppercase tracking-widest">Digital Processing</p>
                        )}
                      </div>
                    </div>
                    <ChevronDown size={20} className={`text-apple-text-secondary transition-transform duration-300 ${isAudioToolsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isAudioToolsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-1 pt-4 space-y-4">
                           <div className="bg-apple-card p-5 rounded-[2rem] border border-black/[0.03] space-y-6">
                              <div>
                                <div className="flex justify-between items-center mb-4 px-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary">Pre-Gain</span>
                                    <span className="text-[10px] font-bold text-apple-blue">{settings.audioTools.gainDb} dB</span>
                                  </div>
                                  <button onClick={() => updateAudioTools({ gainDb: 0 })} className="text-[9px] font-bold text-apple-blue uppercase tracking-widest">Reset</button>
                                </div>
                                <input 
                                  type="range" 
                                  min="-60" 
                                  max="0" 
                                  step="1"
                                  value={settings.audioTools.gainDb}
                                  onChange={(e) => updateAudioTools({ gainDb: parseInt(e.target.value) })}
                                  className="w-full h-1 bg-black/5 rounded-full appearance-none accent-apple-text-primary"
                                />
                                <div className="flex justify-between mt-2 px-1">
                                  <span className="text-[8px] font-bold text-apple-text-secondary">-60 dB</span>
                                  <span className="text-[8px] font-bold text-apple-text-secondary">0 dB</span>
                                </div>
                              </div>

                              <div className="h-px bg-black/[0.03] w-full" />

                              <div>
                                <div className="flex justify-between items-center mb-4 px-1">
                                  <div className="flex items-center gap-3">
                                    <h5 className="text-xs font-bold tracking-tight">Normalization</h5>
                                    {settings.audioTools.normalizeTargetDb !== null && (
                                       <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <span className="text-[10px] font-bold text-apple-text-secondary tracking-tight">
                                       {settings.audioTools.normalizeTargetDb !== null ? `${settings.audioTools.normalizeTargetDb} dB` : 'Off'}
                                     </span>
                                     <button 
                                        onClick={() => updateAudioTools({ normalizeTargetDb: settings.audioTools.normalizeTargetDb === null ? -10 : null })}
                                        className={`w-10 h-6 rounded-full relative transition-colors ${settings.audioTools.normalizeTargetDb !== null ? 'bg-apple-blue' : 'bg-gray-200'}`}
                                      >
                                        <motion.div className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full" animate={{ x: settings.audioTools.normalizeTargetDb !== null ? 16 : 0 }} />
                                      </button>
                                  </div>
                                </div>
                                
                                {settings.audioTools.normalizeTargetDb !== null && (
                                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input 
                                      type="range" 
                                      min="-40" 
                                      max="-1" 
                                      step="1"
                                      value={settings.audioTools.normalizeTargetDb}
                                      onChange={(e) => updateAudioTools({ normalizeTargetDb: parseInt(e.target.value) })}
                                      className="w-full h-1 bg-black/5 rounded-full appearance-none accent-apple-blue"
                                    />
                                    <div className="flex justify-between mt-2 px-1 text-[8px] font-bold text-apple-text-secondary uppercase">
                                      <span>Strict (-40dB)</span>
                                      <span>Peak (-1dB)</span>
                                    </div>
                                    <p className="mt-4 text-[9px] text-apple-text-secondary italic leading-relaxed">Limit tracks to a target peak level to prevent loudness jumps within playlists.</p>
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const PresetButton = ({ icon: Icon, label, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-3 p-4 bg-apple-card border border-black/[0.03] rounded-[2rem] hover:bg-gray-50 active:scale-95 transition-all"
  >
    <div className={`flex-shrink-0 w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-${color.split('-')[1]}/20`}>
      <Icon size={20} />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary truncate w-full text-center">{label}</span>
  </button>
);

const LayerOption = ({ icon: Icon, label, isEnabled, onToggle, vol, setVol, color, maxVol = 1, subtitle, children }: any) => {
  const [inputValue, setInputValue] = useState(Math.round(vol * 100).toString());

  // Sync input value with vol prop
  React.useEffect(() => {
    setInputValue(Math.round(vol * 100).toString());
  }, [vol]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    const num = parseInt(val);
    if (!isNaN(num)) {
      const normalized = Math.min(Math.max(num, 0), maxVol * 100) / 100;
      setVol(normalized);
    }
  };

  return (
    <div className="bg-apple-card p-5 rounded-[2.5rem] border border-black/[0.03] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`flex-shrink-0 w-10 h-10 ${isEnabled ? 'bg-white shadow-sm' : 'bg-gray-100'} rounded-2xl flex items-center justify-center ${isEnabled ? color : 'text-gray-300'} transition-all`}>
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-sm font-bold tracking-tight truncate">{label}</h5>
            {subtitle && <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-wider truncate">{subtitle}</p>}
          </div>
        </div>
        {label !== "Main Track" && (
          <div className="w-12 h-7 flex-shrink-0"> {/* Fixed width container for toggle */}
            <button 
              onClick={() => onToggle(!isEnabled)}
              className={`w-full h-full rounded-full relative transition-colors ${isEnabled ? (color.includes('blue') ? 'bg-apple-blue' : color.includes('purple') ? 'bg-purple-500' : color.includes('green') ? 'bg-green-500' : 'bg-orange-500') : 'bg-gray-200'}`}
            >
              <motion.div className="absolute top-1 left-1 bg-white w-5 h-5 rounded-full" animate={{ x: isEnabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </button>
          </div>
        )}
      </div>
      
      {isEnabled && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <input 
              type="range"
              min={0}
              max={maxVol}
              step={0.01}
              value={vol}
              onChange={(e) => setVol(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-black/5 rounded-full appearance-none accent-apple-text-primary touch-none"
            />
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-black/5">
              <input 
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-7 text-[10px] font-bold text-apple-text-primary bg-transparent text-right outline-none"
              />
              <span className="text-[10px] font-bold text-apple-text-secondary">%</span>
            </div>
          </div>
          
          {children}
        </div>
      )}
    </div>
  );
};

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
