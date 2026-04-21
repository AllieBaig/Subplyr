import React, { useState } from 'react';
import { useAudio } from '../AudioContext';
import { NATURE_SOUNDS, AUDIO_ACCEPT_STRING, SUPPORTED_AUDIO_FORMATS } from '../constants';
import { ChevronRight, ChevronDown, Check, Plus, Trash2, Ear, Activity, Wind, CloudRain, Download, Settings as SettingsIcon, Music, RotateCw, RotateCcw, ShieldCheck, Link, Upload, Sliders, Flame, Droplets, Waves, Trees } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsView({ onBack }: { onBack?: () => void }) {
  const { 
    tracks,
    playlists,
    subliminalTracks, 
    addSubliminalTrack, 
    removeSubliminalTrack,
    settings, 
    updateSubliminalSettings,
    updateBinauralSettings,
    updateNatureSettings,
    updateNoiseSettings,
    updateLibrarySettings,
    updateAudioTools,
    updateSettings,
    exportAppData,
    importAppData,
    relinkTrack,
    resetUISettings,
    clearAppCache,
    swStatus,
    swSupported,
    resetServiceWorker,
    clearCacheStorage,
    clearDatabase,
    fullAppReset,
    showToast
  } = useAudio();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  if (!settings) return null;

  const toggleSection = (id: string) => {
    if (id === 'subliminal') {
      updateSettings({ subliminalExpanded: !settings.subliminalExpanded });
    } else {
      setExpandedSection(expandedSection === id ? null : id);
    }
  };

  const isSectionExpanded = (id: string) => {
    if (id === 'subliminal') return settings.subliminalExpanded;
    return expandedSection === id;
  };

  const handleSubliminalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addSubliminalTrack(e.target.files[0]);
    }
  };

  const VolumeSlider = ({ label, value, onChange, min = 0, max = 1, step = 0.01, color = 'apple-blue' }: any) => {
    const [inputValue, setInputValue] = useState(Math.round(value * 100).toString());

    React.useEffect(() => {
      setInputValue(Math.round(value * 100).toString());
    }, [value]);

    const handleTextChange = (val: string) => {
      setInputValue(val);
      const num = parseInt(val);
      if (!isNaN(num)) {
        const normalized = Math.min(Math.max(num, 0), max * 100) / 100;
        onChange(normalized);
      }
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">{label}</label>
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-black/5">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-7 text-[10px] font-bold text-apple-text-primary bg-transparent text-right outline-none"
            />
            <span className="text-[10px] font-bold text-apple-text-secondary">%</span>
          </div>
        </div>
        <input 
          type="range" min={min} max={max} step={step} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-black/5 rounded-full appearance-none accent-${color}`}
        />
      </div>
    );
  };

  const DbSlider = ({ label, value, onChange, min = -60, max = 0, unit = 'dB' }: any) => {
    const [inputValue, setInputValue] = useState(value.toString());

    React.useEffect(() => {
      setInputValue(value.toString());
    }, [value]);

    const handleTextChange = (val: string) => {
      setInputValue(val);
      const num = parseInt(val);
      if (!isNaN(num)) {
        const validated = Math.min(Math.max(num, min), max);
        onChange(validated);
      }
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">{label}</label>
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-black/5">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-8 text-[10px] font-bold text-apple-text-primary bg-transparent text-right outline-none"
            />
            <span className="text-[10px] font-bold text-apple-text-secondary">{unit}</span>
          </div>
        </div>
        <input 
          type="range" min={min} max={max} step={1} 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-black/5 rounded-full appearance-none accent-gray-700"
        />
      </div>
    );
  };

  const Section = ({ id, title, subtitle, icon: Icon, color, children, isEnabled, onToggle }: any) => {
    const isExpanded = isSectionExpanded(id);
    return (
      <div className={`bg-apple-card rounded-[2rem] border border-black/5 shadow-sm overflow-hidden mb-4 transition-all duration-300 ${settings.bigTouchMode ? 'rounded-[2.5rem]' : ''}`}>
        <div className={`flex items-center ${settings.bigTouchMode ? 'min-h-[88px]' : 'min-h-[72px]'}`}>
          <button 
            onClick={() => toggleSection(id)}
            className={`flex-1 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors h-full ${settings.bigTouchMode ? 'p-6' : 'p-5'}`}
          >
            <div className={`${settings.bigTouchMode ? 'w-12 h-12 rounded-[1.25rem]' : 'w-10 h-10 rounded-2xl'} ${color} flex-shrink-0 flex items-center justify-center`}>
              <Icon size={settings.bigTouchMode ? 24 : 20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${settings.bigTouchMode ? 'text-base' : 'text-sm'}`}>{title}</h3>
              <p className={`text-apple-text-secondary font-medium uppercase tracking-wider truncate ${settings.bigTouchMode ? 'text-[11px]' : 'text-[10px]'}`}>{subtitle}</p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0"
            >
              <ChevronRight size={settings.bigTouchMode ? 22 : 18} className="text-apple-text-secondary" />
            </motion.div>
          </button>
          {onToggle && (
            <div className={`${settings.bigTouchMode ? 'pr-6' : 'pr-5'} flex-shrink-0 h-full flex items-center`}>
              <button 
                onClick={() => onToggle(!isEnabled)}
                className={`${settings.bigTouchMode ? 'w-12 h-7' : 'w-10 h-6'} rounded-full relative transition-colors duration-200 ${isEnabled ? (color.includes('blue') ? 'bg-apple-blue' : color.includes('purple') ? 'bg-purple-500' : color.includes('green') ? 'bg-green-500' : 'bg-orange-500') : 'bg-gray-200'}`}
              >
                <motion.div 
                  className={`absolute top-1 left-1 bg-white rounded-full ${settings.bigTouchMode ? 'w-5 h-5' : 'w-4 h-4'}`}
                  animate={{ x: isEnabled ? (settings.bigTouchMode ? 20 : 16) : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          )}
        </div>
        
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 35, mass: 0.8 }}
              className="border-t border-black/5 bg-gray-50/30 overflow-hidden"
            >
              <div className={settings.bigTouchMode ? 'p-8' : 'p-6'}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col pb-12 w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {/* Row 1: Core Layers */}
        <div className="flex flex-col gap-6">
          {/* 1. Subliminal Layer */}
          <Section 
            id="subliminal"
            title="Subliminal Audio"
            subtitle="Secondary Layer"
            icon={Ear}
            color="bg-apple-blue/10 text-apple-blue"
            isEnabled={settings.subliminal.isEnabled}
            onToggle={(val: boolean) => updateSubliminalSettings({ isEnabled: val })}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Subliminal Mode</label>
                <div className="bg-gray-100 p-1 rounded-2xl flex items-center h-10">
                  <button 
                    onClick={() => updateSubliminalSettings({ isPlaylistMode: false })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${!settings.subliminal.isPlaylistMode ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                  >
                    Track
                  </button>
                  <button 
                    onClick={() => updateSubliminalSettings({ isPlaylistMode: true })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.subliminal.isPlaylistMode ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                  >
                    Playlist
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">
                  {settings.subliminal.isPlaylistMode ? 'Source Playlist' : 'Selected Track'}
                </label>
                <div className="flex flex-col gap-2">
                  {settings.subliminal.isPlaylistMode ? (
                    <div className="flex flex-col gap-2">
                      {playlists.length === 0 ? (
                        <p className="text-[10px] text-apple-text-secondary italic px-2 py-4 bg-white/50 border border-dashed border-black/5 rounded-xl text-center">No playlists created yet</p>
                      ) : (
                        playlists.map(playlist => (
                          <button
                            key={playlist.id}
                            onClick={() => updateSubliminalSettings({ sourcePlaylistId: playlist.id })}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${settings.subliminal.sourcePlaylistId === playlist.id ? 'border-apple-blue bg-apple-blue/5' : 'border-black/5 bg-white'}`}
                          >
                            <div>
                               <p className={`text-xs font-bold ${settings.subliminal.sourcePlaylistId === playlist.id ? 'text-apple-blue' : ''}`}>{playlist.name}</p>
                               <p className="text-[9px] font-bold text-apple-text-secondary uppercase tracking-widest">{playlist.trackIds.length} tracks</p>
                            </div>
                            {settings.subliminal.sourcePlaylistId === playlist.id && <Check size={14} className="text-apple-blue" />}
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <>
                      {subliminalTracks.map(track => (
                        <div 
                          key={track.id}
                          className={`flex flex-col rounded-xl border transition-all ${
                            settings.subliminal.selectedTrackId === track.id 
                            ? 'border-apple-blue bg-apple-blue/5' 
                            : 'border-black/5 bg-white'
                          }`}
                        >
                          <button 
                            onClick={() => !track.isMissing && updateSubliminalSettings({ selectedTrackId: track.id })}
                            className={`flex items-center justify-between p-3 w-full text-left ${track.isMissing ? 'cursor-default opacity-60' : ''}`}
                          >
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium truncate ${settings.subliminal.selectedTrackId === track.id ? 'text-apple-blue' : ''}`}>
                                  {track.name}
                                </span>
                                {track.isMissing && (
                                  <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1 rounded uppercase">Missing</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!track.isMissing && settings.subliminal.selectedTrackId === track.id && <Check size={14} className="text-apple-blue" />}
                              <button onClick={(e) => { e.stopPropagation(); removeSubliminalTrack(track.id); }} className="text-apple-text-secondary opacity-30 hover:opacity-100"><Trash2 size={12} /></button>
                            </div>
                          </button>
                          {track.isMissing && (
                            <label className="mx-3 mb-3 p-2 bg-apple-blue/10 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold text-apple-blue hover:bg-apple-blue/20 cursor-pointer transition-colors">
                              <Link size={12} />
                              <span>RELINK FILE</span>
                              <input 
                                type="file" 
                                accept={AUDIO_ACCEPT_STRING} 
                                className="hidden" 
                                onChange={(e) => e.target.files && relinkTrack(track.id, e.target.files[0], true)} 
                              />
                            </label>
                          )}
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-black/10 hover:bg-white cursor-pointer group transition-all">
                        <div className="flex items-center gap-2 text-xs font-semibold text-apple-text-secondary group-hover:text-apple-blue">
                          <Plus size={14} /> <span>Upload Audio</span>
                        </div>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5">{SUPPORTED_AUDIO_FORMATS.join(' • ')}</p>
                        <input type="file" accept={AUDIO_ACCEPT_STRING} className="hidden" onChange={handleSubliminalUpload} />
                      </label>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <VolumeSlider 
                  label="Subliminal Intensity"
                  value={settings.subliminal.volume}
                  onChange={(v: number) => updateSubliminalSettings({ volume: v })}
                  max={0.3}
                  color="apple-blue"
                />
                <p className="text-[9px] text-apple-text-secondary italic">Volume is limited to 30% for safety.</p>
              </div>

              <div className="flex flex-col gap-4 p-4 bg-white/50 rounded-2xl border border-black/[0.03]">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-xs font-semibold">Continuous Loop</p>
                       <p className="text-[9px] text-apple-text-secondary font-bold uppercase tracking-widest mt-0.5">Repeat subliminal layer</p>
                    </div>
                    <button 
                      onClick={() => updateSubliminalSettings({ isLooping: !settings.subliminal.isLooping })}
                      className={`w-8 h-5 rounded-full relative transition-colors ${settings.subliminal.isLooping ? 'bg-apple-blue' : 'bg-gray-200'}`}
                    >
                      <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.subliminal.isLooping ? 12 : 0 }} />
                    </button>
                 </div>
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                       <p className="text-[10px] font-bold text-apple-text-secondary uppercase tracking-widest">Start Delay</p>
                       <span className="text-[10px] font-bold text-apple-blue">{settings.subliminal.delayMs}ms</span>
                    </div>
                    <input 
                      type="range" min={0} max={5000} step={100} 
                      value={settings.subliminal.delayMs} 
                      onChange={(e) => updateSubliminalSettings({ delayMs: parseInt(e.target.value) })}
                      className="w-full h-1 bg-black/5 rounded-full appearance-none accent-apple-blue"
                    />
                 </div>
              </div>
            </div>
          </Section>

          {/* 2. Binaural Beats */}
          <Section
            id="binaural"
            title="Binaural Beats"
            subtitle="Stereo Frequency"
            icon={Activity}
            color="bg-purple-500/10 text-purple-600"
            isEnabled={settings.binaural.isEnabled}
            onToggle={(val: boolean) => updateBinauralSettings({ isEnabled: val })}
          >
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-apple-text-secondary uppercase tracking-tight">Left (Hz)</label>
                  <input 
                    type="number" value={settings.binaural.leftFreq} 
                    onChange={(e) => updateBinauralSettings({ leftFreq: parseInt(e.target.value) || 0 })}
                    className="bg-white px-3 py-2 rounded-xl border border-black/5 font-mono text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-apple-text-secondary uppercase tracking-tight">Right (Hz)</label>
                  <input 
                    type="number" value={settings.binaural.rightFreq} 
                    onChange={(e) => updateBinauralSettings({ rightFreq: parseInt(e.target.value) || 0 })}
                    className="bg-white px-3 py-2 rounded-xl border border-black/5 font-mono text-sm"
                  />
                </div>
              </div>
              
              <VolumeSlider 
                label="Beats Volume"
                value={settings.binaural.volume}
                onChange={(v: number) => updateBinauralSettings({ volume: v })}
                max={0.2}
                color="purple-500"
              />
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'Sleep', l: 150, r: 152 }, { label: 'Relax', l: 200, r: 208 }, { label: 'Focus', l: 200, r: 214 }].map(p => (
                  <button key={p.label} onClick={() => updateBinauralSettings({ leftFreq: p.l, rightFreq: p.r })} className="bg-white border border-black/5 rounded-xl py-2 text-[10px] font-bold hover:bg-purple-500 hover:text-white transition-all">{p.label}</button>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* Column 2: Environmental Layers */}
        <div className="flex flex-col gap-6">
          {/* 3. Nature Sounds */}
          <Section
            id="nature"
            title="Nature Ambience"
            subtitle="Environmental Loop"
            icon={CloudRain}
            color="bg-green-500/10 text-green-600"
            isEnabled={settings.nature.isEnabled}
            onToggle={(val: boolean) => updateNatureSettings({ isEnabled: val })}
          >
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-2">
                {NATURE_SOUNDS.map(sound => {
                  const Icon = sound.id === 'rain' ? CloudRain : sound.id === 'ocean' ? Waves : sound.id === 'forest' ? Trees : sound.id === 'wind' ? Wind : sound.id === 'fire' ? Flame : Droplets;
                  return (
                    <button 
                      key={sound.id}
                      onClick={() => updateNatureSettings({ type: sound.id as any })}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${settings.nature.type === sound.id ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'bg-white border-black/5 hover:bg-gray-50'}`}
                    >
                      <Icon size={14} className={settings.nature.type === sound.id ? 'text-white' : 'text-green-600'} />
                      <span className="text-[11px] font-bold truncate">{sound.name}</span>
                    </button>
                  );
                })}
              </div>
              <VolumeSlider 
                 label="Ambience Volume"
                 value={settings.nature.volume}
                 onChange={(v: number) => updateNatureSettings({ volume: v })}
                 color="green-500"
              />
            </div>
          </Section>

          {/* 4. White Noise */}
          <Section
            id="noise"
            title="Noise Colors"
            subtitle="Synthetic Masking"
            icon={Wind}
            color="bg-orange-500/10 text-orange-600"
            isEnabled={settings.noise.isEnabled}
            onToggle={(val: boolean) => updateNoiseSettings({ isEnabled: val })}
          >
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-2">
                {['white', 'pink', 'brown'].map(type => (
                  <button 
                    key={type}
                    onClick={() => updateNoiseSettings({ type: type as any })}
                    className={`p-3 rounded-xl border capitalize text-[10px] font-bold tracking-wide ${settings.noise.type === type ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white border-black/5'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <VolumeSlider 
                 label="Masking Level"
                 value={settings.noise.volume}
                 onChange={(v: number) => updateNoiseSettings({ volume: v })}
                 max={0.5}
                 color="orange-500"
              />
            </div>
          </Section>
        </div>

        {/* Column 3: Advanced Tools & Management */}
        <div className="flex-1 flex flex-col gap-6">
          {/* 5. Personalization */}
          <Section 
            id="personalization"
            title="Personalization"
            subtitle="UI & Animations"
            icon={Sliders}
            color="bg-apple-blue/10 text-apple-blue"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Menu Position</label>
                <div className="bg-gray-100 p-1 rounded-2xl flex items-center h-10">
                  <button 
                    onClick={() => updateSettings({ menuPosition: 'top' })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.menuPosition === 'top' ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                  >
                    Top
                  </button>
                  <button 
                    onClick={() => updateSettings({ menuPosition: 'bottom' })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.menuPosition === 'bottom' ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                  >
                    Bottom
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">Big Touch Mode</p>
                    <p className="text-[9px] text-apple-text-secondary font-bold uppercase tracking-widest mt-0.5">Larger hit areas</p>
                  </div>
                  <button 
                    onClick={() => updateSettings({ bigTouchMode: !settings.bigTouchMode })}
                    className={`w-8 h-5 rounded-full relative transition-colors ${settings.bigTouchMode ? 'bg-apple-blue' : 'bg-gray-200'}`}
                  >
                    <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.bigTouchMode ? 12 : 0 }} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Animation Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['slide-up', 'slide-down', 'slide-left', 'slide-right', 'random', 'off'] as const).map(style => (
                    <button 
                      key={style}
                      onClick={() => updateSettings({ animationStyle: style })}
                      className={`px-3 py-2.5 rounded-xl border capitalize text-[10px] font-bold transition-all ${settings.animationStyle === style ? 'bg-apple-blue text-white border-apple-blue shadow-sm' : 'bg-white border-black/5 text-apple-text-secondary hover:bg-gray-50'}`}
                    >
                      {style.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* 6. Audio Tools */}
          <Section
            id="audio-tools"
            title="Audio Tools"
            subtitle="Advanced Effects"
            icon={Sliders}
            color="bg-gray-700/10 text-gray-700"
          >
            <div className="flex flex-col gap-8">
              <DbSlider 
                label="Output Gain"
                value={settings.audioTools.gainDb}
                onChange={(v: number) => updateAudioTools({ gainDb: v })}
                min={-60}
                max={0}
              />
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-apple-text-primary">Normalization</h4>
                    <button 
                      onClick={() => updateAudioTools({ normalizeTargetDb: settings.audioTools.normalizeTargetDb === null ? -20 : null })}
                      className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${settings.audioTools.normalizeTargetDb === null ? 'bg-gray-100 text-gray-400' : 'bg-gray-700 text-white'}`}
                    >
                       {settings.audioTools.normalizeTargetDb === null ? 'Off' : 'On'}
                    </button>
                 </div>
                 {settings.audioTools.normalizeTargetDb !== null && (
                   <DbSlider 
                     label="Target dB"
                     value={settings.audioTools.normalizeTargetDb}
                     onChange={(v: number) => updateAudioTools({ normalizeTargetDb: v })}
                     min={-40}
                     max={0}
                   />
                 )}
              </div>
            </div>
          </Section>

          <div className="mt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4 ml-2">App Management</h4>
            <div className="bg-apple-card rounded-[2rem] border border-black/5 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-black/5 bg-gray-50/20">
                <VolumeSlider 
                  label="Master Music Volume"
                  value={settings.mainVolume}
                  onChange={(v: number) => updateSettings({ mainVolume: v })}
                  color="apple-text-primary"
                />
              </div>

              <button 
                onClick={() => updateSettings({ miniMode: !settings.miniMode })}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-black/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-apple-card rounded-xl border border-black/5 flex items-center justify-center text-apple-text-primary">
                    <Music size={14} />
                  </div>
                  <span className="text-sm font-medium">Mini Mode</span>
                </div>
                <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.miniMode ? 'bg-apple-blue' : 'bg-gray-200'}`}>
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.miniMode ? 12 : 0 }} />
                </div>
              </button>

              <button 
                onClick={() => updateSettings({ showArtwork: !settings.showArtwork })}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-black/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-apple-card rounded-xl border border-black/5 flex items-center justify-center text-apple-text-primary">
                    <Music size={14} />
                  </div>
                  <span className="text-sm font-medium">Show Artwork</span>
                </div>
                <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.showArtwork ? 'bg-apple-blue' : 'bg-gray-200'}`}>
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.showArtwork ? 12 : 0 }} />
                </div>
              </button>

              <button 
                onClick={exportAppData}
                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-apple-blue border-b border-black/5"
              >
                <Download size={16} />
                <span className="text-sm font-semibold">Export All Data</span>
              </button>

              <label className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-apple-blue cursor-pointer">
                <Upload size={16} />
                <span className="text-sm font-semibold">Import All Data</span>
                <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files && importAppData(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-black/5">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4 ml-2">App Maintenance</h4>
            <div className="bg-apple-card rounded-3xl border border-black/5 overflow-hidden flex flex-col">
              <button 
                onClick={() => clearAppCache()}
                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-black/5"
              >
                <ShieldCheck size={16} className="text-amber-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">Clear Cache</p>
                  <p className="text-[10px] text-apple-text-secondary">Removes temporary data</p>
                </div>
              </button>
              <button 
                onClick={() => resetUISettings()}
                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500"
              >
                <RotateCcw size={16} />
                <p className="text-sm font-medium">Reset UI Settings</p>
              </button>
            </div>
          </div>

          {swSupported && (
            <div className="mt-8 pt-8 border-t border-black/5">
              <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex items-center justify-between px-2 mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary">Advanced Developer Tools</h4>
                <ChevronRight size={14} className={`text-apple-text-secondary ${isAdvancedOpen ? 'rotate-90' : ''}`} />
              </button>
              {isAdvancedOpen && (
                <div className="bg-apple-card rounded-3xl border border-black/5 overflow-hidden flex flex-col mb-4">
                   <button onClick={resetServiceWorker} className="p-4 border-b border-black/5 text-xs font-bold uppercase text-center hover:bg-gray-50">Unregister SW</button>
                   <button onClick={fullAppReset} className="p-4 bg-red-500 text-white font-bold text-xs uppercase">Full Factory Reset</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
