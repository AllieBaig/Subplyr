import React, { useState } from 'react';
import { useAudio } from '../AudioContext';
import { NATURE_SOUNDS, AUDIO_ACCEPT_STRING, SUPPORTED_AUDIO_FORMATS } from '../constants';
import { ChevronRight, ChevronDown, Check, Plus, Trash2, Ear, Activity, Wind, CloudRain, Download, Settings as SettingsIcon, Music, RotateCw, RotateCcw, ShieldCheck, Link, Upload, Sliders, Flame, Droplets, Waves, Trees, History, Sun, Moon, Monitor, Palette, Timer, Repeat, Repeat1, Focus as FocusIcon, Wrench, Terminal } from 'lucide-react';

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
    updateDidgeridooSettings,
    updateLibrarySettings,
    updateAppearanceSettings,
    updateVisibilitySettings,
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (!settings) return null;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        // Accordion behavior: only one group open at a time
        next.clear();
        next.add(groupId);
      }
      return next;
    });
  };

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
      <div className="flex flex-col gap-3 w-full">
        <div className="flex justify-between items-baseline px-1">
          <label className="text-[11px] font-bold uppercase tracking-widest text-system-secondary-label">{label}</label>
          <div className="flex items-center gap-1">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-8 text-[12px] font-black text-system-label bg-transparent text-right outline-none"
            />
            <span className="text-[10px] font-bold text-system-tertiary-label">%</span>
          </div>
        </div>
        <input 
          type="range" min={min} max={max} step={step} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-secondary-system-background rounded-full appearance-none accent-${color} cursor-pointer`}
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
      <div className="flex flex-col gap-3 w-full">
        <div className="flex justify-between items-baseline px-1">
          <label className="text-[11px] font-bold uppercase tracking-widest text-system-secondary-label">{label}</label>
          <div className="flex items-center gap-1">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-10 text-[12px] font-black text-system-label bg-transparent text-right outline-none"
            />
            <span className="text-[10px] font-bold text-system-tertiary-label">{unit}</span>
          </div>
        </div>
        <input 
          type="range" min={min} max={max} step={1} 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-secondary-system-background rounded-full appearance-none accent-gray-700 cursor-pointer"
        />
      </div>
    );
  };

  const Section = ({ id, title, subtitle, icon: Icon, color, children, isEnabled, onToggle }: any) => {
    const isExpanded = isSectionExpanded(id);
    return (
      <div className={`bg-apple-card rounded-[1.5rem] border border-apple-border shadow-sm overflow-hidden mb-4 transition-all duration-300`}>
        <div className={`flex items-center min-h-[64px]`}>
          <button 
            onClick={() => toggleSection(id)}
            className={`flex-1 flex items-center gap-4 text-left hover:bg-secondary-system-background transition-colors h-full px-5 py-4`}
          >
            <div className={`w-9 h-9 rounded-xl ${color} flex-shrink-0 flex items-center justify-center shadow-sm`}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold truncate text-system-label text-[14px]`}>{title}</h3>
              <p className={`text-system-secondary-label font-bold uppercase tracking-widest truncate text-[9px]`}>{subtitle}</p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 ml-2"
            >
              <ChevronRight size={16} className="text-system-tertiary-label" />
            </motion.div>
          </button>
          {onToggle && (
            <div className={`pr-5 flex-shrink-0 h-full flex items-center`}>
              <button 
                onClick={() => onToggle(!isEnabled)}
                className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${isEnabled ? (color.includes('blue') ? 'bg-apple-blue' : color.includes('purple') ? 'bg-purple-500' : color.includes('green') ? 'bg-green-500' : 'bg-orange-500') : 'bg-system-tertiary-label'}`}
              >
                <motion.div 
                   className={`absolute top-1 left-1 bg-white rounded-full w-4 h-4 shadow-sm`}
                   animate={{ x: isEnabled ? 16 : 0 }}
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
               className="border-t border-apple-border bg-secondary-system-background/20"
            >
              <div className="p-5 flex flex-col gap-6">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Group = ({ title, icon: Icon, color, children, isExpanded, onToggle }: any) => {
    return (
      <div className="flex flex-col mb-4">
        <button 
          onClick={onToggle}
          className="w-full flex items-center justify-between p-4 bg-apple-card border border-apple-border rounded-2xl shadow-sm transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg shadow-black/5 group-hover:scale-105 transition-transform`}>
              <Icon size={20} />
            </div>
            <h3 className="text-sm font-black tracking-tight text-system-label">{title}</h3>
          </div>
          <ChevronRight size={18} className={`text-system-tertiary-label transition-transform duration-300 ${isExpanded ? 'rotate-90 text-apple-blue' : ''}`} />
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 flex flex-col gap-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const AppManagement = () => (
    <Section 
      id="app-management"
      title="App Management"
      subtitle="Volumes & View Mode"
      icon={Music}
      color="bg-gray-100 text-gray-700"
    >
      <div className="flex flex-col gap-6">
        <VolumeSlider 
          label="Master Music Volume"
          value={settings.mainVolume}
          onChange={(v: number) => updateSettings({ mainVolume: v })}
          color="system-label"
        />

        <div className="h-px bg-apple-border/50" />

        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => updateSettings({ miniMode: !settings.miniMode })}
            className="w-full p-4 flex items-center justify-between hover:bg-secondary-system-background transition-colors bg-system-background rounded-2xl border border-apple-border"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-system-label">Mini Mode</span>
            </div>
            <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.miniMode ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}>
              <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.miniMode ? 12 : 0 }} />
            </div>
          </button>

          <button 
            onClick={() => updateSettings({ showArtwork: !settings.showArtwork })}
            className="w-full p-4 flex items-center justify-between hover:bg-secondary-system-background transition-colors bg-system-background rounded-2xl border border-apple-border"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-system-label">Show Artwork</span>
            </div>
            <div className={`w-8 h-5 rounded-full relative transition-colors ${settings.showArtwork ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}>
              <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.showArtwork ? 12 : 0 }} />
            </div>
          </button>
        </div>

        <div className="h-px bg-apple-border/50" />

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={exportAppData}
            className="flex-1 p-4 flex flex-col items-center gap-2 bg-system-background text-apple-blue border border-apple-border rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            <Download size={16} />
            Export Data
          </button>

          <label className="flex-1 p-4 flex flex-col items-center gap-2 bg-system-background text-apple-blue border border-apple-border rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all cursor-pointer">
            <Upload size={16} />
            Import Data
            <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files && importAppData(e.target.files[0])} />
          </label>
        </div>
      </div>
    </Section>
  );

  const AppMaintenance = () => (
    <Section
      id="maintenance"
      title="App Maintenance"
      subtitle="Cache & Reset"
      icon={Wrench}
      color="bg-amber-100 text-amber-600"
    >
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => clearAppCache()}
          className="w-full p-4 flex items-center justify-between hover:bg-secondary-system-background transition-colors bg-system-background rounded-2xl border border-apple-border"
        >
          <div className="text-left">
            <p className="text-xs font-semibold text-system-label">Clear Cache</p>
            <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest">Removes temporary data</p>
          </div>
          <ChevronRight size={14} className="text-system-tertiary-label" />
        </button>

        <button 
          onClick={() => resetUISettings()}
          className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors bg-system-background rounded-2xl border border-red-100 text-red-500"
        >
          <p className="text-xs font-bold uppercase tracking-widest">Reset UI Settings</p>
          <ChevronRight size={14} className="opacity-40" />
        </button>
      </div>
    </Section>
  );

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

  const MinimalSettings = () => {
    return (
      <Section
        id="minimal"
        title="Minimal Settings"
        subtitle="UI Visibility Control"
        icon={FocusIcon}
        color="bg-purple-500/10 text-purple-600"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-system-label">Audio Layers</p>
              <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Subliminal, Binaural, Nature, Noise</p>
            </div>
            <button 
              onClick={() => updateVisibilitySettings({ audioLayers: !settings.visibility.audioLayers })}
              className={`w-8 h-5 rounded-full relative transition-colors ${settings.visibility.audioLayers ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}
            >
              <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.visibility.audioLayers ? 12 : 0 }} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-system-label">App Control</p>
              <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Management & Maintenance</p>
            </div>
            <button 
              onClick={() => updateVisibilitySettings({ appControl: !settings.visibility.appControl })}
              className={`w-8 h-5 rounded-full relative transition-colors ${settings.visibility.appControl ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}
            >
              <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.visibility.appControl ? 12 : 0 }} />
            </button>
          </div>
        </div>
      </Section>
    );
  };

  return (
    <div className="flex flex-col pb-12 w-full max-w-7xl mx-auto">
      <VersionHistory />

      <MinimalSettings />

      <div className="h-px bg-apple-border/50 my-6" />

      {/* Audio Layers Group */}
      <Group 
        title="Audio Layers" 
        icon={Ear} 
        color="bg-apple-blue/10 text-apple-blue"
        isExpanded={expandedGroups.has('audio')}
        onToggle={() => toggleGroup('audio')}
      >
        <div className="flex flex-col gap-2">
          {/* Subliminal Audio is ALWAYS visible inside this group */}
          <Section
            id="subliminal"
            title="Subliminal Audio"
            subtitle="Mindful Layer"
            icon={Ear}
            color="bg-apple-blue/10 text-apple-blue"
            isEnabled={settings.subliminal.isEnabled}
            onToggle={(val: boolean) => updateSubliminalSettings({ isEnabled: val })}
          >
            <div className="flex flex-col gap-6">
              {/* 1. Mode Selector (Segmented Control) */}
              <div className="flex flex-col gap-2.5">
                <div className="bg-secondary-system-background p-1 rounded-2xl flex items-center h-10 shadow-inner">
                  <button 
                    onClick={() => updateSubliminalSettings({ isPlaylistMode: false })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${!settings.subliminal.isPlaylistMode ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                  >
                    Single Track
                  </button>
                  <button 
                    onClick={() => updateSubliminalSettings({ isPlaylistMode: true })}
                    className={`flex-1 h-full text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${settings.subliminal.isPlaylistMode ? 'bg-system-background shadow-sm text-apple-blue' : 'text-system-secondary-label'}`}
                  >
                    Full Playlist
                  </button>
                </div>
              </div>

              {/* 2. Source Selection */}
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest px-1">Source Playlist</p>
                <div className="flex flex-col gap-2">
                  {playlists.length === 0 ? (
                    <div className="p-6 border border-dashed border-apple-border rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                       <Music className="text-system-tertiary-label mb-1" size={18} />
                       <p className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest">No Playlists Available</p>
                    </div>
                  ) : (
                    playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => updateSubliminalSettings({ sourcePlaylistId: playlist.id })}
                        className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between min-h-[56px] ${settings.subliminal.sourcePlaylistId === playlist.id ? 'border-apple-blue bg-apple-blue/5' : 'border-apple-border bg-system-background'}`}
                      >
                        <div className="min-w-0">
                          <p className={`text-[13px] font-bold truncate ${settings.subliminal.sourcePlaylistId === playlist.id ? 'text-apple-blue' : 'text-system-label'}`}>{playlist.name}</p>
                          <p className="text-[9px] font-bold text-system-secondary-label uppercase tracking-widest mt-0.5">{playlist.trackIds.length} tracks</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${settings.subliminal.sourcePlaylistId === playlist.id ? 'bg-apple-blue border-apple-blue' : 'border-apple-border'}`}>
                          {settings.subliminal.sourcePlaylistId === playlist.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Track List (Only in Single Track mode) */}
              {!settings.subliminal.isPlaylistMode && settings.subliminal.sourcePlaylistId && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest px-1">Active Track</p>
                  <div className="bg-system-background rounded-2xl border border-apple-border divide-y divide-apple-border/50 overflow-hidden">
                    {playlists.find(p => p.id === settings.subliminal.sourcePlaylistId)?.trackIds.map(tid => {
                      const t = tracks.find(mt => mt.id === tid);
                      if (!t) return null;
                      const isSelected = settings.subliminal.selectedTrackId === tid;
                      return (
                        <button
                          key={tid}
                          onClick={() => updateSubliminalSettings({ selectedTrackId: tid })}
                          className={`w-full p-4 flex items-center justify-between transition-colors min-h-[56px] text-left ${isSelected ? 'bg-apple-blue/5 shadow-inner' : 'hover:bg-secondary-system-background'}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-apple-blue text-white' : 'bg-secondary-system-background text-system-tertiary-label'}`}>
                              <Music size={12} />
                            </div>
                            <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-apple-blue' : 'text-system-label'}`}>{t.name}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-apple-blue" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Controls (Full Width Rows) */}
              <div className="flex flex-col gap-8 pt-4">
                <VolumeSlider 
                  label="Subliminal Intensity"
                  value={settings.subliminal.volume}
                  onChange={(v: number) => updateSubliminalSettings({ volume: v })}
                  max={0.3}
                  color="apple-blue"
                />
                <DbSlider 
                  label="Precision Output"
                  value={settings.subliminal.gainDb}
                  onChange={(v: number) => updateSubliminalSettings({ gainDb: v })}
                  min={-60}
                  max={12}
                />

                <div className="flex flex-col gap-5 bg-secondary-system-background/30 p-5 rounded-2xl border border-apple-border mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-bold text-system-label">Loop Content</p>
                      <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Continuous meditation flow</p>
                    </div>
                    <button 
                      onClick={() => updateSubliminalSettings({ isLooping: !settings.subliminal.isLooping })}
                      className={`w-10 h-6 rounded-full relative transition-colors ${settings.subliminal.isLooping ? 'bg-apple-blue' : 'bg-system-tertiary-label'}`}
                    >
                      <motion.div className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm" animate={{ x: settings.subliminal.isLooping ? 16 : 0 }} />
                    </button>
                  </div>

                  <div className="h-px bg-apple-border/30" />

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-baseline px-1">
                      <label className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest">Entrance Delay</label>
                      <span className="text-[12px] font-black text-apple-blue tabular-nums">{settings.subliminal.delayMs}ms</span>
                    </div>
                    <input 
                      type="range" min={0} max={5000} step={100} 
                      value={settings.subliminal.delayMs} 
                      onChange={(e) => updateSubliminalSettings({ delayMs: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-system-background rounded-full appearance-none accent-apple-blue border border-apple-border cursor-pointer hover:accent-apple-blue/80"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Other audio layers are conditional */}
            {settings.visibility.audioLayers && (
              <>
              <Section
                id="binaural"
                title="Binaural Beats"
                subtitle="Brain Entrainment"
                icon={Activity}
                color="bg-purple-500/10 text-purple-600"
                isEnabled={settings.binaural.isEnabled}
                onToggle={(val: boolean) => updateBinauralSettings({ isEnabled: val })}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest px-1">Frequency Preset</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: 'Sleep', l: 150, r: 152 }, { label: 'Relax', l: 200, r: 208 }, { label: 'Focus', l: 200, r: 214 }].map(p => (
                        <button 
                          key={p.label} 
                          onClick={() => updateBinauralSettings({ leftFreq: p.l, rightFreq: p.r })} 
                          className="bg-secondary-system-background text-system-label border border-apple-border rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all active:scale-95 text-center"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-bold text-system-secondary-label uppercase tracking-widest px-1">Left Channel</label>
                      <div className="flex items-center bg-system-background border border-apple-border rounded-xl px-3 py-2">
                        <input 
                          type="number" value={settings.binaural.leftFreq} 
                          onChange={(e) => updateBinauralSettings({ leftFreq: parseInt(e.target.value) || 0 })}
                          className="flex-1 bg-transparent text-system-label font-mono text-sm outline-none"
                        />
                        <span className="text-[10px] font-bold text-system-tertiary-label ml-1">Hz</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-bold text-system-secondary-label uppercase tracking-widest px-1">Right Channel</label>
                      <div className="flex items-center bg-system-background border border-apple-border rounded-xl px-3 py-2">
                        <input 
                          type="number" value={settings.binaural.rightFreq} 
                          onChange={(e) => updateBinauralSettings({ rightFreq: parseInt(e.target.value) || 0 })}
                          className="flex-1 bg-transparent text-system-label font-mono text-sm outline-none"
                        />
                        <span className="text-[10px] font-bold text-system-tertiary-label ml-1">Hz</span>
                      </div>
                    </div>
                  </div>
                  
                  <VolumeSlider 
                    label="Tone Intensity"
                    value={settings.binaural.volume}
                    onChange={(v: number) => updateBinauralSettings({ volume: v })}
                    max={0.2}
                    color="purple-500"
                  />
                </div>
              </Section>

            <Section
              id="nature"
              title="Nature Ambience"
              subtitle="Environment Loop"
              icon={CloudRain}
              color="bg-green-500/10 text-green-600"
              isEnabled={settings.nature.isEnabled}
              onToggle={(val: boolean) => updateNatureSettings({ isEnabled: val })}
            >
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-2">
                  {NATURE_SOUNDS.map(sound => {
                    const Icon = sound.id === 'rain' ? CloudRain : sound.id === 'ocean' ? Waves : sound.id === 'forest' ? Trees : sound.id === 'wind' ? Wind : sound.id === 'fire' ? Flame : Droplets;
                    const isActive = settings.nature.type === sound.id;
                    return (
                      <button 
                        key={sound.id}
                        onClick={() => updateNatureSettings({ type: sound.id as any })}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all min-h-[52px] ${isActive ? 'bg-green-500 text-white border-green-500 shadow-md' : 'bg-system-background border-apple-border text-system-secondary-label hover:bg-secondary-system-background'}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-green-500/10'}`}>
                          <Icon size={14} className={isActive ? 'text-white' : 'text-green-600'} />
                        </div>
                        <span className="text-[11px] font-bold truncate tracking-tight">{sound.name}</span>
                      </button>
                    );
                  })}
                </div>
                <VolumeSlider 
                  label="Ambience Mix"
                  value={settings.nature.volume}
                  onChange={(v: number) => updateNatureSettings({ volume: v })}
                  color="green-500"
                />
              </div>
            </Section>

            <Section
              id="noise"
              title="Noise Colors"
              subtitle="Focus Masking"
              icon={Wind}
              color="bg-orange-500/10 text-orange-600"
              isEnabled={settings.noise.isEnabled}
              onToggle={(val: boolean) => updateNoiseSettings({ isEnabled: val })}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2.5">
                  <div className="bg-secondary-system-background p-1 rounded-2xl flex items-center h-10 shadow-inner">
                    {['white', 'pink', 'brown'].map(type => (
                      <button 
                        key={type}
                        onClick={() => updateNoiseSettings({ type: type as any })}
                        className={`flex-1 h-full text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${settings.noise.type === type ? 'bg-system-background shadow-sm text-orange-600' : 'text-system-secondary-label'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <VolumeSlider 
                  label="Masking Strength"
                  value={settings.noise.volume}
                  onChange={(v: number) => updateNoiseSettings({ volume: v })}
                  max={0.5}
                  color="orange-500"
                />
              </div>
            </Section>

            <Section
              id="didgeridoo"
              title="Didgeridoo"
              subtitle="Vibrational Drone"
              icon={Music}
              color="bg-amber-700/10 text-amber-800"
              isEnabled={settings.didgeridoo.isEnabled}
              onToggle={(val: boolean) => updateDidgeridooSettings({ isEnabled: val })}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-8">
                  <VolumeSlider 
                    label="Drone Volume"
                    value={settings.didgeridoo.volume}
                    onChange={(v: number) => updateDidgeridooSettings({ volume: v })}
                    max={1.0}
                    color="amber-700"
                  />
                  <DbSlider 
                    label="Output Level"
                    value={settings.didgeridoo.gainDb}
                    onChange={(v: number) => updateDidgeridooSettings({ gainDb: v })}
                    min={-60}
                    max={0}
                  />
                </div>

                <div className="flex flex-col gap-5 bg-secondary-system-background/30 p-5 rounded-2xl border border-apple-border mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-bold text-system-label">Loop Mode</p>
                      <p className="text-[9px] text-system-secondary-label font-bold uppercase tracking-widest mt-0.5">Continuous oscillation</p>
                    </div>
                    <button 
                      onClick={() => updateDidgeridooSettings({ isLooping: !settings.didgeridoo.isLooping })}
                      className={`w-10 h-6 rounded-full relative transition-colors ${settings.didgeridoo.isLooping ? 'bg-amber-800' : 'bg-system-tertiary-label'}`}
                    >
                      <motion.div className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm" animate={{ x: settings.didgeridoo.isLooping ? 16 : 0 }} />
                    </button>
                  </div>

                  <div className="h-px bg-apple-border/30" />

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-baseline px-1">
                      <label className="text-[10px] font-bold text-system-secondary-label uppercase tracking-widest">Base Frequency</label>
                      <span className="text-[12px] font-black text-amber-800 tabular-nums">{Math.round(65 * settings.didgeridoo.playbackRate)}Hz</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" min={0.5} max={2.0} step={0.1} 
                        value={settings.didgeridoo.playbackRate} 
                        onChange={(e) => updateDidgeridooSettings({ playbackRate: parseFloat(e.target.value) })}
                        className="flex-1 h-1.5 bg-system-background rounded-full appearance-none accent-amber-800 border border-apple-border cursor-pointer"
                      />
                      <button 
                        onClick={() => updateDidgeridooSettings({ playbackRate: 1.0 })}
                        className="text-[9px] font-black text-amber-800 uppercase tracking-widest hover:bg-amber-800/10 px-2 py-1 rounded-lg transition-colors border border-amber-800/20"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </Group>

    {/* Playback Group (Independent) */}
      <Group
        title="Playback"
        icon={Timer}
        color="bg-blue-500/10 text-blue-600"
        isExpanded={expandedGroups.has('playback')}
        onToggle={() => toggleGroup('playback')}
      >
        <div className="flex flex-col gap-2">
          <Section
            id="playback"
            title="Timing & Playback"
            subtitle="Timer & Speed"
            icon={Timer}
            color="bg-blue-500/10 text-blue-600"
          >
            <div className="flex flex-col gap-6">
              {/* Playback Speed */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Playback Speed</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 1.5, 2, 2.5].map(speed => (
                    <button 
                      key={speed}
                      onClick={() => updateSettings({ playbackRate: speed })}
                      className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${settings.playbackRate === speed ? 'bg-apple-blue text-white border-apple-blue shadow-sm' : 'bg-system-background border-apple-border text-system-secondary-label hover:bg-secondary-system-background'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-apple-border/50" />

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
        </div>
      </Group>

      {/* App Control Group (Independent) */}
      <Group
        title="App Control"
        icon={SettingsIcon}
        color="bg-gray-700/10 text-gray-700"
        isExpanded={expandedGroups.has('control')}
        onToggle={() => toggleGroup('control')}
      >
        <div className="flex flex-col gap-2">
          <AppManagement />
          
          {settings.visibility.appControl && (
            <>
              <AppMaintenance />
              
              {swSupported && (
                <Section
                  id="advanced"
                  title="Advanced System"
                  subtitle="Recovery Tools"
                  icon={Terminal}
                  color="bg-red-500/10 text-red-600"
                >
                  <div className="flex flex-col gap-3">
                    <button onClick={resetServiceWorker} className="w-full p-4 border border-apple-border rounded-xl text-xs font-bold uppercase hover:bg-secondary-system-background text-system-label active:scale-[0.98] transition-all">Unregister SW</button>
                    <button onClick={fullAppReset} className="w-full p-4 bg-red-500 text-white font-bold text-xs uppercase rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all">Full Factory Reset</button>
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </Group>

      <div className="h-px bg-apple-border/50 my-6" />

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

    </div>
  );
}
