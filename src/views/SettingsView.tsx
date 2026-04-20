import React, { useState } from 'react';
import { useAudio } from '../AudioContext';
import { NATURE_SOUNDS } from '../constants';
import { ChevronRight, ChevronDown, Check, Plus, Trash2, Ear, Activity, Wind, CloudRain, Download, Settings as SettingsIcon, Music, RotateCw, RotateCcw, ShieldCheck, Link, Upload, Sliders, Flame, Droplets, Waves, Trees } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsView() {
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

  const [expandedSection, setExpandedSection] = useState<string | null>('subliminal');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  if (!settings) return null;

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
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

  const Section = ({ id, title, subtitle, icon: Icon, color, children, isEnabled, onToggle }: any) => (
    <div className="bg-apple-card rounded-[2rem] border border-black/5 shadow-sm overflow-hidden mb-4 transition-all duration-300">
      <div className="flex items-center min-h-[72px]">
        <button 
          onClick={() => toggleSection(id)}
          className="flex-1 p-5 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors h-full"
        >
          <div className={`w-10 h-10 ${color} rounded-2xl flex-shrink-0 flex items-center justify-center`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{title}</h3>
            <p className="text-[10px] text-apple-text-secondary font-medium uppercase tracking-wider truncate">{subtitle}</p>
          </div>
          <motion.div
            animate={{ rotate: expandedSection === id ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0"
          >
            <ChevronRight size={18} className="text-apple-text-secondary" />
          </motion.div>
        </button>
        {onToggle && (
          <div className="pr-5 flex-shrink-0 h-full flex items-center">
            <button 
              onClick={() => onToggle(!isEnabled)}
              className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${isEnabled ? (color.includes('blue') ? 'bg-apple-blue' : color.includes('purple') ? 'bg-purple-500' : color.includes('green') ? 'bg-green-500' : 'bg-orange-500') : 'bg-gray-200'}`}
            >
              <motion.div 
                className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full"
                animate={{ x: isEnabled ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        )}
      </div>
      
      <AnimatePresence initial={false}>
        {expandedSection === id && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 35, mass: 0.8 }}
            className="border-t border-black/5 bg-gray-50/30 overflow-hidden"
          >
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col pb-24 max-w-2xl mx-auto w-full px-4 pt-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Audio Settings</h1>
        <p className="text-apple-text-secondary text-sm mt-1">Configure your 5-layer sound engine</p>
      </header>

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
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => e.target.files && relinkTrack(track.id, e.target.files[0], true)} 
                      />
                    </label>
                  )}
                </div>
              ))}
              <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-black/10 hover:bg-white cursor-pointer text-xs font-semibold text-apple-text-secondary gap-2">
                <Plus size={14} /> <span>Upload Audio (M4A Supported)</span>
                <input type="file" accept="audio/*, .mp3, .m4a, .aac, .wav, audio/mp4, audio/x-m4a" className="hidden" onChange={handleSubliminalUpload} />
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

             <div className="flex items-center justify-between">
                <div>
                   <p className="text-xs font-semibold">Sync Main Timing</p>
                   <p className="text-[9px] text-apple-text-secondary font-bold uppercase tracking-widest mt-0.5">Match progress with music</p>
                </div>
                <button 
                  onClick={() => updateSettings({ syncPlayback: !settings.syncPlayback })}
                  className={`w-8 h-5 rounded-full relative transition-colors ${settings.syncPlayback ? 'bg-apple-blue' : 'bg-gray-200'}`}
                >
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.syncPlayback ? 12 : 0 }} />
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
          <p className="text-[9px] text-apple-text-secondary italic">Volume is limited to 20% for pure frequencies.</p>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Quick Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Sleep', l: 150, r: 152 },
                { label: 'Relax', l: 200, r: 208 },
                { label: 'Focus', l: 200, r: 214 },
              ].map(p => (
                <button key={p.label} onClick={() => updateBinauralSettings({ leftFreq: p.l, rightFreq: p.r })} className="bg-white border border-black/5 rounded-xl py-2 text-[10px] font-bold hover:bg-purple-500 hover:text-white transition-all">{p.label}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

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
          {NATURE_SOUNDS.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {NATURE_SOUNDS.map(sound => {
                const Icon = sound.id === 'rain' ? CloudRain : 
                           sound.id === 'ocean' ? Waves : 
                           sound.id === 'forest' ? Trees : 
                           sound.id === 'wind' ? Wind : 
                           sound.id === 'fire' ? Flame : 
                           sound.id === 'stream' ? Droplets : CloudRain;
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
          ) : (
            <div className="bg-gray-50 border border-dashed border-black/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2">
              <CloudRain size={32} className="text-gray-300" />
              <p className="text-xs text-apple-text-secondary font-medium">No nature sounds found</p>
            </div>
          )}
          
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

      {/* 5. Audio Tools (Audacity-like) */}
      <Section
        id="audio-tools"
        title="Audio Tools"
        subtitle="Advanced Effects"
        icon={Sliders}
        color="bg-gray-700/10 text-gray-700"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-apple-text-primary">Gain Control</h4>
                <div className="px-2 py-0.5 bg-gray-100 rounded-md text-[8px] font-bold text-gray-500 uppercase">Non-Destructive</div>
             </div>
             <DbSlider 
               label="Output Gain"
               value={settings.audioTools.gainDb}
               onChange={(v: number) => updateAudioTools({ gainDb: v })}
               min={-60}
               max={0}
             />
             <p className="text-[9px] text-apple-text-secondary leading-relaxed italic">
                Reduces total output volume in decibels. 0dB is original level.
             </p>
          </div>

          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-apple-text-primary">Normalization</h4>
                <button 
                  onClick={() => updateAudioTools({ normalizeTargetDb: settings.audioTools.normalizeTargetDb === null ? -20 : null })}
                  className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors ${settings.audioTools.normalizeTargetDb === null ? 'bg-gray-100 text-gray-400' : 'bg-gray-700 text-white'}`}
                >
                   {settings.audioTools.normalizeTargetDb === null ? 'Disabled' : 'Enabled'}
                </button>
             </div>
             
             {settings.audioTools.normalizeTargetDb !== null ? (
               <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <DbSlider 
                    label="Target Level (Upper Limit)"
                    value={settings.audioTools.normalizeTargetDb}
                    onChange={(v: number) => updateAudioTools({ normalizeTargetDb: v })}
                    min={-40}
                    max={0}
                  />
                  <p className="text-[9px] text-apple-text-secondary leading-relaxed italic">
                    Ensures all tracks don't exceed this dB level. Useful for consistent playlist volume.
                  </p>
               </div>
             ) : (
               <p className="text-[10px] text-apple-text-secondary py-2 italic bg-gray-100/50 rounded-xl px-4 border border-dashed border-black/5">
                 Enable normalization to keep playlist tracks at a consistent target level.
               </p>
             )}
          </div>
        </div>
      </Section>
      <div className="mt-8 pt-8 border-t border-black/5">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4 ml-2">App Management</h4>
        
        <div className="bg-apple-card rounded-3xl border border-black/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 bg-gray-50/20">
            <VolumeSlider 
              label="Master Music Volume"
              value={settings.mainVolume}
              onChange={(v: number) => updateSettings({ mainVolume: v })}
              color="apple-text-primary"
            />
          </div>

          <div className="p-4 border-b border-black/5 bg-gray-50/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white rounded-xl border border-black/5 flex items-center justify-center text-apple-text-primary">
                <Activity size={14} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Playback Speed</p>
            </div>
            <div className="flex gap-2">
               {[1, 1.5, 2, 2.5].map(rate => (
                 <button
                   key={rate}
                   onClick={() => updateSettings({ playbackRate: rate })}
                   className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold transition-all border ${settings.playbackRate === rate ? 'bg-apple-text-primary text-white border-apple-text-primary shadow-md' : 'bg-white text-apple-text-secondary border-black/5 hover:bg-gray-100'}`}
                 >
                   {rate}x
                 </button>
               ))}
            </div>
          </div>

          <button 
            onClick={() => updateSettings({ miniMode: !settings.miniMode })}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-black/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-apple-card rounded-xl border border-black/5 flex items-center justify-center text-apple-text-primary">
                <Music size={14} className={settings.miniMode ? "scale-90" : ""} />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium">Mini Mode</span>
                {settings.miniMode && <p className="text-[10px] text-apple-blue font-bold">Optimized for 60fps</p>}
              </div>
            </div>
            <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.miniMode ? 'bg-apple-blue' : 'bg-gray-200'}`}>
              <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.miniMode ? 12 : 0 }} />
            </div>
          </button>

          <button 
            onClick={() => updateSettings({ fadeInOut: !settings.fadeInOut })}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-black/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-apple-text-primary">
                <SettingsIcon size={16} />
              </div>
              <span className="text-sm font-medium">Smooth Fade (3s)</span>
            </div>
            <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.fadeInOut ? 'bg-apple-blue' : 'bg-gray-200'}`}>
              <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.fadeInOut ? 12 : 0 }} />
            </div>
          </button>

          <div className="w-full p-4 flex items-center justify-between border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-apple-text-primary">
                <Sliders size={16} />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium">Panel Position</span>
                <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-widest">Now Playing Layers</p>
              </div>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
               {['top', 'bottom'].map(pos => (
                 <button
                   key={pos}
                   onClick={() => updateSettings({ hiddenLayersPosition: pos as any })}
                   className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${settings.hiddenLayersPosition === pos ? 'bg-white shadow-sm text-apple-blue' : 'text-gray-400'}`}
                 >
                   {pos}
                 </button>
               ))}
            </div>
          </div>

          <button 
            onClick={exportAppData}
            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-apple-blue border-b border-black/5"
          >
            <div className="w-8 h-8 bg-apple-blue/10 rounded-xl flex items-center justify-center">
              <Download size={16} />
            </div>
            <span className="text-sm font-semibold">Export All Data (JSON)</span>
          </button>

          <label className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-apple-blue cursor-pointer">
            <div className="w-8 h-8 bg-apple-blue/10 rounded-xl flex items-center justify-center">
              <Upload size={16} />
            </div>
            <span className="text-sm font-semibold">Import All Data (JSON)</span>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={(e) => e.target.files && importAppData(e.target.files[0])} 
            />
          </label>
        </div>
      </div>

      {/* 6. App Maintenance */}
      <div className="mt-8 pt-8 border-t border-black/5">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4 ml-2">App Maintenance</h4>
        
        <div className="bg-apple-card rounded-3xl border border-black/5 overflow-hidden flex flex-col">
          <button 
            onClick={() => {
              showToast("Refreshing UI...");
              setTimeout(() => window.location.reload(), 500);
            }}
            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-black/5"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-apple-text-primary">
              <RotateCw size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Refresh App UI</p>
              <p className="text-[10px] text-apple-text-secondary">Reloads all components instantly</p>
            </div>
          </button>

          <button 
            onClick={clearAppCache}
            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-black/5"
          >
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <ShieldCheck size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Clear Cache</p>
              <p className="text-[10px] text-apple-text-secondary">Removes temporary data & logs</p>
            </div>
          </button>

          <button 
            onClick={resetUISettings}
            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500"
          >
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <RotateCcw size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium font-semibold">Reset UI Settings</p>
              <p className="text-[10px] text-red-400">Revert theme & layout to default</p>
            </div>
          </button>
        </div>
        <p className="mt-4 px-2 text-[10px] text-apple-text-secondary text-center leading-relaxed italic">
          Maintenance actions do not affect your saved tracks or playlists.
        </p>
      </div>

      {/* 7. Advanced Service Worker Tools */}
      {swSupported && (
        <div className="mt-8 pt-8 border-t border-black/5">
          <button 
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between px-2 mb-4"
          >
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary">Advanced Developer Tools</h4>
            <ChevronRight size={14} className={`text-apple-text-secondary transition-transform ${isAdvancedOpen ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {isAdvancedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-apple-card rounded-3xl border border-black/5 overflow-hidden flex flex-col mb-4">
                  <div className="p-4 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full animate-pulse bg-green-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-apple-text-primary">Service Worker</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase p-1 px-2 rounded-md ${
                      swStatus === 'active' ? 'bg-green-100 text-green-700' : 
                      swStatus === 'none' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {swStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 border-b border-black/5">
                    <button 
                      onClick={resetServiceWorker}
                      className="p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors border-r border-black/5"
                    >
                      <RotateCw size={18} className="text-apple-text-secondary" />
                      <span className="text-[10px] font-bold uppercase text-center">Unregister SW</span>
                    </button>
                    <button 
                      onClick={clearCacheStorage}
                      className="p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Download size={18} className="text-apple-text-secondary rotate-180" />
                      <span className="text-[10px] font-bold uppercase text-center">Wipe Cache</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 border-b border-black/5">
                    <button 
                      onClick={clearDatabase}
                      className="p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors border-r border-black/5 text-amber-600"
                    >
                      <Trash2 size={18} />
                      <span className="text-[10px] font-bold uppercase text-center">Clear DB</span>
                    </button>
                    <button 
                      onClick={() => {
                        showToast("Hard reloading...");
                        setTimeout(() => window.location.reload(), 500);
                      }}
                      className="p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw size={18} className="text-apple-text-secondary" />
                      <span className="text-[10px] font-bold uppercase text-center">Hard Reload</span>
                    </button>
                  </div>

                  <button 
                    onClick={fullAppReset}
                    className="w-full p-4 flex items-center justify-center gap-3 bg-red-500 text-white hover:bg-red-600 transition-colors font-bold text-xs uppercase tracking-widest"
                  >
                    <ShieldCheck size={18} />
                    <span>Full Factory Reset</span>
                  </button>
                </div>
                <p className="px-4 text-[9px] text-apple-text-secondary text-center leading-relaxed mb-8">
                  Use these tools only if the app is stuck or displaying a blank screen. Full Factory Reset will delete all offline content.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
