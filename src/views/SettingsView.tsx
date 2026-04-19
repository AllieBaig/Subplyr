import React, { useState } from 'react';
import { useAudio } from '../AudioContext';
import { ChevronRight, ChevronDown, Check, Plus, Trash2, Ear, Activity, Wind, CloudRain, Download, Settings as SettingsIcon, Music, RotateCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsView() {
  const { 
    subliminalTracks, 
    addSubliminalTrack, 
    removeSubliminalTrack,
    settings, 
    updateSubliminalSettings,
    updateBinauralSettings,
    updateNatureSettings,
    updateNoiseSettings,
    updateSettings,
    exportAppData,
    resetUISettings,
    clearAppCache,
    showToast
  } = useAudio();

  const [expandedSection, setExpandedSection] = useState<string | null>('subliminal');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleSubliminalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addSubliminalTrack(e.target.files[0]);
    }
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Selected Track</label>
            <div className="flex flex-col gap-2">
              {subliminalTracks.map(track => (
                <button 
                  key={track.id}
                  onClick={() => updateSubliminalSettings({ selectedTrackId: track.id })}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    settings.subliminal.selectedTrackId === track.id 
                    ? 'border-apple-blue bg-apple-blue/5' 
                    : 'border-black/5 bg-white'
                  }`}
                >
                  <span className={`text-xs font-medium truncate ${settings.subliminal.selectedTrackId === track.id ? 'text-apple-blue' : ''}`}>
                    {track.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {settings.subliminal.selectedTrackId === track.id && <Check size={14} className="text-apple-blue" />}
                    <button onClick={(e) => { e.stopPropagation(); removeSubliminalTrack(track.id); }} className="text-apple-text-secondary opacity-30 hover:opacity-100"><Trash2 size={12} /></button>
                  </div>
                </button>
              ))}
              <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-black/10 hover:bg-white cursor-pointer text-xs font-semibold text-apple-text-secondary gap-2">
                <Plus size={14} /> <span>Upload Audio (M4A Supported)</span>
                <input type="file" accept="audio/*, .mp3, .m4a, .aac, .wav, audio/mp4, audio/x-m4a" className="hidden" onChange={handleSubliminalUpload} />
              </label>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Subliminal Intensity</label>
              <span className="text-[10px] font-bold text-apple-blue">{Math.round(settings.subliminal.volume * 100)}%</span>
            </div>
            <input 
              type="range" min={0.1} max={0.3} step={0.01} 
              value={settings.subliminal.volume} 
              onChange={(e) => updateSubliminalSettings({ volume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-black/5 rounded-full appearance-none accent-apple-blue"
            />
            <p className="text-[9px] text-apple-text-secondary italic">Volume is limited to 30% for safety.</p>
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
          <div className="grid grid-cols-2 gap-2">
            {['rain', 'ocean', 'forest', 'wind'].map(type => (
              <button 
                key={type}
                onClick={() => updateNatureSettings({ type: type as any })}
                className={`p-3 rounded-xl border capitalize text-xs font-semibold ${settings.nature.type === type ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'bg-white border-black/5 hover:bg-gray-50'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Volume</label>
                <span className="text-[10px] font-bold text-green-600">{Math.round(settings.nature.volume * 100)}%</span>
             </div>
             <input 
                type="range" min={0} max={1} step={0.01} 
                value={settings.nature.volume} 
                onChange={(e) => updateNatureSettings({ volume: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-black/5 rounded-full appearance-none accent-green-500"
              />
          </div>
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
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Masking Level</label>
                <span className="text-[10px] font-bold text-orange-600">{Math.round(settings.noise.volume * 100)}%</span>
             </div>
             <input 
                type="range" min={0} max={0.5} step={0.01} 
                value={settings.noise.volume} 
                onChange={(e) => updateNoiseSettings({ volume: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-black/5 rounded-full appearance-none accent-orange-500"
              />
          </div>
        </div>
      </Section>

      {/* 5. Advanced & Tools */}
      <div className="mt-8 pt-8 border-t border-black/5">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary mb-4 ml-2">App Management</h4>
        
        <div className="bg-apple-card rounded-3xl border border-black/5 overflow-hidden">
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

          <button 
            onClick={exportAppData}
            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-apple-blue"
          >
            <div className="w-8 h-8 bg-apple-blue/10 rounded-xl flex items-center justify-center">
              <Download size={16} />
            </div>
            <span className="text-sm font-semibold">Export All Data (JSON)</span>
          </button>
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
    </div>
  );
}
