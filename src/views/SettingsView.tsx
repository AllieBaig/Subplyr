import React, { useState } from 'react';
import { useAudio } from '../AudioContext';
import { NATURE_SOUNDS, AUDIO_ACCEPT_STRING, SUPPORTED_AUDIO_FORMATS } from '../constants';
import { ChevronRight, ChevronDown, Check, Plus, Trash2, Ear, Activity, Wind, CloudRain, Download, Settings as SettingsIcon, Music, RotateCw, RotateCcw, ShieldCheck, Link, Upload, Sliders, Flame, Droplets, Waves, Trees, History, Sun, Moon, Monitor, Palette, Timer, Repeat, Repeat1 } from 'lucide-react';

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
    updateAppearanceSettings,
    updateAudioTools,
    updateSettings,
    updateSleepTimer,
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
          <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">{label}</label>
          <div className="flex items-center gap-1 bg-system-background px-2 py-0.5 rounded-lg border border-apple-border">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-7 text-[10px] font-bold text-system-label bg-transparent text-right outline-none"
            />
            <span className="text-[10px] font-bold text-system-secondary-label">%</span>
          </div>
        </div>
        <input 
          type="range" min={min} max={max} step={step} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-secondary-system-background rounded-full appearance-none accent-${color}`}
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
          <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">{label}</label>
          <div className="flex items-center gap-1 bg-system-background px-2 py-0.5 rounded-lg border border-apple-border">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-8 text-[10px] font-bold text-system-label bg-transparent text-right outline-none"
            />
            <span className="text-[10px] font-bold text-system-secondary-label">{unit}</span>
          </div>
        </div>
        <input 
          type="range" min={min} max={max} step={1} 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-secondary-system-background rounded-full appearance-none accent-gray-700"
        />
      </div>
    );
  };

  const Section = ({ id, title, subtitle, icon: Icon, color, children, isEnabled, onToggle }: any) => {
    const isExpanded = isSectionExpanded(id);
    return (
      <div className={`bg-apple-card rounded-[2rem] border border-apple-border shadow-sm overflow-hidden mb-4 transition-all duration-300 ${settings.bigTouchMode ? 'rounded-[2.5rem]' : ''}`}>
        <div className={`flex items-center ${settings.bigTouchMode ? 'min-h-[88px]' : 'min-h-[72px]'}`}>
          <button 
            onClick={() => toggleSection(id)}
            className={`flex-1 flex items-center gap-4 text-left hover:bg-secondary-system-background transition-colors h-full ${settings.bigTouchMode ? 'p-6' : 'p-5'}`}
          >
            <div className={`${settings.bigTouchMode ? 'w-12 h-12 rounded-[1.25rem]' : 'w-10 h-10 rounded-2xl'} ${color} flex-shrink-0 flex items-center justify-center`}>
              <Icon size={settings.bigTouchMode ? 24 : 20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate text-system-label ${settings.bigTouchMode ? 'text-base' : 'text-sm'}`}>{title}</h3>
              <p className={`text-system-secondary-label font-medium uppercase tracking-wider truncate ${settings.bigTouchMode ? 'text-[11px]' : 'text-[10px]'}`}>{subtitle}</p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0"
            >
              <ChevronRight size={settings.bigTouchMode ? 22 : 18} className="text-system-secondary-label" />
            </motion.div>
          </button>
          {onToggle && (
            <div className={`${settings.bigTouchMode ? 'pr-6' : 'pr-5'} flex-shrink-0 h-full flex items-center`}>
              <button 
                onClick={() => onToggle(!isEnabled)}
                className={`${settings.bigTouchMode ? 'w-12 h-7' : 'w-10 h-6'} rounded-full relative transition-colors duration-200 ${isEnabled ? (color.includes('blue') ? 'bg-apple-blue' : color.includes('purple') ? 'bg-purple-500' : color.includes('green') ? 'bg-green-500' : 'bg-orange-500') : 'bg-system-tertiary-label'}`}
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
              className="border-t border-apple-border bg-secondary-system-background/30 overflow-hidden"
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

  const VersionHistory = () => {
    const isExpanded = expandedSection === 'history';
    return (
      <div className="bg-apple-card rounded-[2rem] border border-apple-border shadow-sm overflow-hidden mb-8">
        <button 
          onClick={() => toggleSection('history')}
          className="w-full flex items-center gap-4 text-left p-5 hover:bg-secondary-system-background transition-colors"
        >
          <div className="w-10 h-10 rounded-2xl bg-secondary-system-background text-system-secondary-label flex-shrink-0 flex items-center justify-center">
            <History size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-system-label">App Version History</h3>
            <p className="text-[10px] text-system-secondary-label font-bold uppercase tracking-wider">Ver {settings.versionHistory[0]?.version || '0.0.0'}</p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            className="flex-shrink-0"
          >
            <ChevronRight size={18} className="text-system-secondary-label" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="border-t border-apple-border bg-secondary-system-background/30 overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-8">
                {settings.versionHistory.map((entry, idx) => (
                  <div key={entry.version} className="relative pl-6 border-l border-apple-border last:border-0 pb-2">
                    <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-apple-blue shadow-[0_0_0_4px_var(--system-background)]" />
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-black tracking-tight text-system-label">v{entry.version}</span>
                      <span className="text-[9px] font-bold text-system-secondary-label bg-secondary-system-background px-2 py-0.5 rounded-full uppercase tracking-widest">{entry.date}</span>
                      {idx === 0 && <span className="text-[8px] font-black bg-apple-blue text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">New</span>}
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {entry.changes.added && entry.changes.added.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1.5">Added</p>
                          <ul className="space-y-1">
                            {entry.changes.added.map((c, i) => (
                              <li key={i} className="text-[11px] font-medium text-system-label leading-snug flex gap-2">
                                <span className="text-system-secondary-label inline-block">•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.changes.improved && entry.changes.improved.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-apple-blue uppercase tracking-widest mb-1.5">Improved</p>
                          <ul className="space-y-1">
                            {entry.changes.improved.map((c, i) => (
                              <li key={i} className="text-[11px] font-medium text-system-label leading-snug flex gap-2">
                                <span className="text-system-secondary-label">•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.changes.fixed && entry.changes.fixed.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Fixed</p>
                          <ul className="space-y-1">
                            {entry.changes.fixed.map((c, i) => (
                              <li key={i} className="text-[11px] font-medium text-system-label leading-snug flex gap-2">
                                <span className="text-system-secondary-label">•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col pb-12 w-full max-w-7xl mx-auto">
      <VersionHistory />

      <Section
        id="appearance"
        title="Appearance"
        subtitle="Themes & Mode"
        icon={Palette}
        color="bg-pink-500/10 text-pink-600"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-system-label">Follow System</p>
                <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Sync with device theme</p>
              </div>
              <button 
                onClick={() => updateAppearanceSettings({ followSystem: !settings.appearance.followSystem })}
                className={`w-8 h-5 rounded-full relative transition-colors ${settings.appearance.followSystem ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}
              >
                <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.appearance.followSystem ? 12 : 0 }} />
              </button>
            </div>
          </div>

          {!settings.appearance.followSystem && (
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Manual Theme</label>
              <div className="bg-secondary-system-background p-1 rounded-2xl flex items-center h-10">
                <button 
                  onClick={() => updateAppearanceSettings({ theme: 'light' })}
                  className={`flex-1 h-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.appearance.theme === 'light' ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                >
                  <Sun size={12} /> Light
                </button>
                <button 
                  onClick={() => updateAppearanceSettings({ theme: 'dark' })}
                  className={`flex-1 h-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.appearance.theme === 'dark' ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                >
                  <Moon size={12} /> Dark
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Dark Mode Style</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateAppearanceSettings({ darkModeStyle: 'soft-purple' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all ${settings.appearance.darkModeStyle === 'soft-purple' ? 'bg-[#AF9CF3] text-white border-[#AF9CF3]' : 'bg-system-background border-apple-border text-system-secondary-label'}`}
              >
                Soft Purple
              </button>
              <button 
                onClick={() => updateAppearanceSettings({ darkModeStyle: 'soft-blue' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all ${settings.appearance.darkModeStyle === 'soft-blue' ? 'bg-[#9CC8F3] text-white border-[#9CC8F3]' : 'bg-system-background border-apple-border text-system-secondary-label'}`}
              >
                Soft Blue
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="playback"
        title="Playback & Control"
        subtitle="Timer & Loop Settings"
        icon={Timer}
        color="bg-blue-500/10 text-blue-600"
      >
        <div className="flex flex-col gap-6">
          {/* Loop Mode */}
          <div className="flex flex-col gap-3">
             <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Loop Options</label>
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => updateSettings({ loop: settings.loop === 'all' ? 'none' : 'all' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${settings.loop === 'all' ? 'bg-blue-500 border-blue-500 text-white shadow-sm' : 'bg-system-background border-apple-border text-system-secondary-label hover:bg-secondary-system-background'}`}
                >
                  <Repeat size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Playlist</span>
                </button>
                <button 
                  onClick={() => updateSettings({ loop: settings.loop === 'one' ? 'none' : 'one' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${settings.loop === 'one' ? 'bg-blue-500 border-blue-500 text-white shadow-sm' : 'bg-system-background border-apple-border text-system-secondary-label hover:bg-secondary-system-background'}`}
                >
                  <Repeat1 size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Single</span>
                </button>
             </div>
          </div>

          <div className="h-px bg-apple-border/50" />

          {/* Sleep Timer */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-system-label">Sleep Timer</p>
                  <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Auto-stop playback</p>
                </div>
                <button 
                  onClick={() => updateSleepTimer({ isEnabled: !settings.sleepTimer.isEnabled, remainingSeconds: !settings.sleepTimer.isEnabled ? settings.sleepTimer.minutes * 60 : null })}
                  className={`w-8 h-5 rounded-full relative transition-colors ${settings.sleepTimer.isEnabled ? 'bg-indigo-500' : 'bg-system-tertiary-label'}`}
                >
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.sleepTimer.isEnabled ? 12 : 0 }} />
                </button>
             </div>

             <div className="flex items-center gap-3">
                <input 
                  type="number"
                  min="1"
                  max="240"
                  value={settings.sleepTimer.minutes}
                  onChange={(e) => updateSleepTimer({ minutes: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-20 h-10 bg-secondary-system-background rounded-xl border-none text-xs font-bold text-center focus:ring-1 focus:ring-indigo-500 text-system-label"
                />
                <span className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest">Minutes</span>
                {settings.sleepTimer.isEnabled && settings.sleepTimer.remainingSeconds !== null && (
                  <div className="ml-auto flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-600 tabular-nums">
                      {Math.floor(settings.sleepTimer.remainingSeconds / 60)}:{(settings.sleepTimer.remainingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
             </div>
          </div>

          <div className="h-px bg-apple-border/50" />

          {/* Display Stay Awake */}
          <div className="flex items-center justify-between">
             <div>
               <p className="text-xs font-semibold text-system-label">Display Always ON</p>
               <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Prevent screen sleep</p>
             </div>
             <button 
               onClick={() => updateSettings({ displayAlwaysOn: !settings.displayAlwaysOn })}
               className={`w-8 h-5 rounded-full relative transition-colors ${settings.displayAlwaysOn ? 'bg-amber-500' : 'bg-system-tertiary-label'}`}
             >
               <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.displayAlwaysOn ? 12 : 0 }} />
             </button>
          </div>
        </div>
      </Section>

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
                <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Subliminal Mode</label>
                <div className="bg-secondary-system-background p-1 rounded-2xl flex items-center h-10">
                  <button 
                    onClick={() => updateSubliminalSettings({ isPlaylistMode: false })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${!settings.subliminal.isPlaylistMode ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                  >
                    Track
                  </button>
                  <button 
                    onClick={() => updateSubliminalSettings({ isPlaylistMode: true })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.subliminal.isPlaylistMode ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                  >
                    Playlist
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">
                  {settings.subliminal.isPlaylistMode ? 'Source Playlist' : 'Selected Track'}
                </label>
                <div className="flex flex-col gap-2">
                  {settings.subliminal.isPlaylistMode ? (
                    <div className="flex flex-col gap-2">
                      {playlists.length === 0 ? (
                        <p className="text-[10px] text-system-secondary-label italic px-2 py-4 bg-system-background/50 border border-dashed border-apple-border rounded-xl text-center">No playlists created yet</p>
                      ) : (
                        playlists.map(playlist => (
                          <button
                            key={playlist.id}
                            onClick={() => updateSubliminalSettings({ sourcePlaylistId: playlist.id })}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${settings.subliminal.sourcePlaylistId === playlist.id ? 'border-apple-blue bg-apple-blue/5' : 'border-apple-border bg-system-background'}`}
                          >
                            <div className="min-w-0">
                               <p className={`text-xs font-bold truncate ${settings.subliminal.sourcePlaylistId === playlist.id ? 'text-apple-blue' : 'text-system-label'}`}>{playlist.name}</p>
                               <p className="text-[9px] font-bold text-system-secondary-label uppercase tracking-widest">{playlist.trackIds.length} tracks</p>
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
                            : 'border-apple-border bg-system-background'
                          }`}
                        >
                          <button 
                            onClick={() => !track.isMissing && updateSubliminalSettings({ selectedTrackId: track.id })}
                            className={`flex items-center justify-between p-3 w-full text-left ${track.isMissing ? 'cursor-default opacity-60' : ''}`}
                          >
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium truncate ${settings.subliminal.selectedTrackId === track.id ? 'text-apple-blue' : 'text-system-label'}`}>
                                  {track.name}
                                </span>
                                {track.isMissing && (
                                  <span className="text-[8px] font-bold bg-amber-100/10 text-amber-600 px-1 rounded uppercase">Missing</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!track.isMissing && settings.subliminal.selectedTrackId === track.id && <Check size={14} className="text-apple-blue" />}
                              <button onClick={(e) => { e.stopPropagation(); removeSubliminalTrack(track.id); }} className="text-system-tertiary-label hover:text-system-label active:scale-90 transition-all"><Trash2 size={12} /></button>
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
                      <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-apple-border hover:bg-secondary-system-background cursor-pointer group transition-all">
                        <div className="flex items-center gap-2 text-xs font-semibold text-system-secondary-label group-hover:text-apple-blue">
                          <Plus size={14} /> <span>Upload Audio</span>
                        </div>
                        <p className="text-[8px] text-system-tertiary-label font-bold uppercase tracking-[0.2em] mt-1.5">{SUPPORTED_AUDIO_FORMATS.join(' • ')}</p>
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
                <p className="text-[9px] text-system-secondary-label italic">Volume is limited to 30% for safety.</p>
              </div>

              <div className="flex flex-col gap-4 p-4 bg-system-background/50 rounded-2xl border border-apple-border">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-xs font-semibold text-system-label">Continuous Loop</p>
                       <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Repeat subliminal layer</p>
                    </div>
                    <button 
                      onClick={() => updateSubliminalSettings({ isLooping: !settings.subliminal.isLooping })}
                      className={`w-8 h-5 rounded-full relative transition-colors ${settings.subliminal.isLooping ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}
                    >
                      <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.subliminal.isLooping ? 12 : 0 }} />
                    </button>
                 </div>
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                       <p className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest">Start Delay</p>
                       <span className="text-[10px] font-bold text-apple-blue">{settings.subliminal.delayMs}ms</span>
                    </div>
                    <input 
                      type="range" min={0} max={5000} step={100} 
                      value={settings.subliminal.delayMs} 
                      onChange={(e) => updateSubliminalSettings({ delayMs: parseInt(e.target.value) })}
                      className="w-full h-1 bg-secondary-system-background rounded-full appearance-none accent-apple-blue"
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
                  <label className="text-[10px] font-bold text-system-secondary-label uppercase tracking-tight">Left (Hz)</label>
                  <input 
                    type="number" value={settings.binaural.leftFreq} 
                    onChange={(e) => updateBinauralSettings({ leftFreq: parseInt(e.target.value) || 0 })}
                    className="bg-system-background text-system-label px-3 py-2 rounded-xl border border-apple-border font-mono text-sm outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-system-secondary-label uppercase tracking-tight">Right (Hz)</label>
                  <input 
                    type="number" value={settings.binaural.rightFreq} 
                    onChange={(e) => updateBinauralSettings({ rightFreq: parseInt(e.target.value) || 0 })}
                    className="bg-system-background text-system-label px-3 py-2 rounded-xl border border-apple-border font-mono text-sm outline-none focus:border-purple-500 transition-colors"
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
                  <button key={p.label} onClick={() => updateBinauralSettings({ leftFreq: p.l, rightFreq: p.r })} className="bg-system-background text-system-secondary-label border border-apple-border rounded-xl py-2 text-[10px] font-bold hover:bg-purple-500 hover:text-white transition-all active:scale-95">{p.label}</button>
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
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${settings.nature.type === sound.id ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'bg-system-background border-apple-border text-system-secondary-label hover:bg-secondary-system-background'}`}
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
                    className={`p-3 rounded-xl border capitalize text-[10px] font-bold tracking-wide transition-all ${settings.noise.type === type ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-system-background border-apple-border text-system-secondary-label hover:bg-secondary-system-background'}`}
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Menu Position</label>
                <div className="bg-secondary-system-background p-1 rounded-2xl flex items-center h-10">
                  <button 
                    onClick={() => updateSettings({ menuPosition: 'top' })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.menuPosition === 'top' ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                  >
                    Top
                  </button>
                  <button 
                    onClick={() => updateSettings({ menuPosition: 'bottom' })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.menuPosition === 'bottom' ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                  >
                    Bottom
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-system-label">Big Touch Mode</p>
                    <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Larger hit areas</p>
                  </div>
                  <button 
                    onClick={() => updateSettings({ bigTouchMode: !settings.bigTouchMode })}
                    className={`w-8 h-5 rounded-full relative transition-colors ${settings.bigTouchMode ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}
                  >
                    <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.bigTouchMode ? 12 : 0 }} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Animation Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['slide-up', 'slide-down', 'slide-left', 'slide-right', 'random', 'off'] as const).map(style => (
                    <button 
                      key={style}
                      onClick={() => updateSettings({ animationStyle: style })}
                      className={`px-3 py-2.5 rounded-xl border capitalize text-[10px] font-bold transition-all ${settings.animationStyle === style ? 'bg-apple-blue text-white border-apple-blue shadow-sm' : 'bg-system-background border-apple-border text-system-secondary-label hover:bg-secondary-system-background'}`}
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
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-system-label">Normalization</h4>
                    <button 
                      onClick={() => updateAudioTools({ normalizeTargetDb: settings.audioTools.normalizeTargetDb === null ? -20 : null })}
                      className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-all ${settings.audioTools.normalizeTargetDb === null ? 'bg-secondary-system-background text-system-tertiary-label' : 'bg-gray-700 text-white'}`}
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
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-system-secondary-label mb-4 ml-2">App Management</h4>
            <div className="bg-apple-card rounded-[2rem] border border-apple-border overflow-hidden shadow-sm">
              <div className="p-4 border-b border-apple-border bg-secondary-system-background/20">
                <VolumeSlider 
                  label="Master Music Volume"
                  value={settings.mainVolume}
                  onChange={(v: number) => updateSettings({ mainVolume: v })}
                  color="system-label"
                />
              </div>

              <button 
                onClick={() => updateSettings({ miniMode: !settings.miniMode })}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary-system-background transition-colors border-b border-apple-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-system-background rounded-xl border border-apple-border flex items-center justify-center text-system-label">
                    <Music size={14} />
                  </div>
                  <span className="text-sm font-medium text-system-label">Mini Mode</span>
                </div>
                <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.miniMode ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}>
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.miniMode ? 12 : 0 }} />
                </div>
              </button>

              <button 
                onClick={() => updateSettings({ showArtwork: !settings.showArtwork })}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary-system-background transition-colors border-b border-apple-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-system-background rounded-xl border border-apple-border flex items-center justify-center text-system-label">
                    <Music size={14} />
                  </div>
                  <span className="text-sm font-medium text-system-label">Show Artwork</span>
                </div>
                <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.showArtwork ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}>
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.showArtwork ? 12 : 0 }} />
                </div>
              </button>

              <button 
                onClick={exportAppData}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary-system-background transition-colors text-apple-blue border-b border-apple-border font-semibold shadow-inner-sm active:scale-[0.98]"
              >
                <Download size={16} />
                <span className="text-sm ">Export All Data</span>
              </button>

              <label className="w-full p-4 flex items-center gap-3 hover:bg-secondary-system-background transition-colors text-apple-blue cursor-pointer font-semibold active:scale-[0.98]">
                <Upload size={16} />
                <span className="text-sm ">Import All Data</span>
                <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files && importAppData(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-apple-border">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-system-secondary-label mb-4 ml-2">App Maintenance</h4>
            <div className="bg-apple-card rounded-3xl border border-apple-border overflow-hidden flex flex-col">
              <button 
                onClick={() => clearAppCache()}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary-system-background transition-colors border-b border-apple-border"
              >
                <ShieldCheck size={16} className="text-amber-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-system-label">Clear Cache</p>
                  <p className="text-[10px] text-system-secondary-label">Removes temporary data</p>
                </div>
              </button>
              <button 
                onClick={() => resetUISettings()}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary-system-background transition-colors text-red-500 font-medium active:scale-[0.98]"
              >
                <RotateCcw size={16} />
                <p className="text-sm">Reset UI Settings</p>
              </button>
            </div>
          </div>

          {swSupported && (
            <div className="mt-8 pt-8 border-t border-apple-border">
              <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex items-center justify-between px-2 mb-4 group">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-system-secondary-label group-hover:text-system-label transition-colors">Advanced Developer Tools</h4>
                <ChevronRight size={14} className={`text-system-secondary-label transition-transform duration-300 ${isAdvancedOpen ? 'rotate-90 text-system-label' : ''}`} />
              </button>
              <AnimatePresence>
                {isAdvancedOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-apple-card rounded-3xl border border-apple-border overflow-hidden flex flex-col mb-4"
                  >
                     <button onClick={resetServiceWorker} className="p-4 border-b border-apple-border text-xs font-bold uppercase text-center hover:bg-secondary-system-background text-system-label active:scale-[0.98] transition-all">Unregister SW</button>
                     <button onClick={fullAppReset} className="p-4 bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 active:scale-[0.98] transition-all">Full Factory Reset</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
