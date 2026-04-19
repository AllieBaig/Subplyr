import React, { useState } from 'react';
import { useAudio } from '../AudioContext';
import { ChevronRight, ChevronDown, Check, Plus, Trash2, Ear, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsView() {
  const { 
    subliminalTracks, 
    addSubliminalTrack, 
    removeSubliminalTrack,
    settings, 
    updateSubliminalSettings,
    updateBinauralSettings,
    updateSettings 
  } = useAudio();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSubliminalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addSubliminalTrack(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-apple-text-secondary">Configure your audio experience</p>
      </header>

      {/* Subliminal Section */}
      <section className="bg-apple-card rounded-[2.5rem] overflow-hidden border border-black/5 shadow-sm">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-apple-blue/10 text-apple-blue rounded-full flex items-center justify-center">
                <Ear size={20} />
             </div>
             <div>
                <h3 className="font-semibold">Subliminal Layer</h3>
                <p className="text-xs text-apple-text-secondary">Mix secondary audio</p>
             </div>
          </div>
          <button 
            onClick={() => updateSubliminalSettings({ isEnabled: !settings.subliminal.isEnabled })}
            className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${settings.subliminal.isEnabled ? 'bg-apple-blue' : 'bg-gray-200'}`}
          >
            <motion.div 
              className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full"
              animate={{ x: settings.subliminal.isEnabled ? 16 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {/* Subliminal Track Selection */}
          <div className="flex flex-col gap-3">
             <label className="text-xs font-semibold uppercase tracking-widest text-apple-text-secondary ml-1">
                Audio Track
             </label>
             <div className="flex flex-col gap-2">
                {subliminalTracks.map(track => (
                  <button 
                    key={track.id}
                    onClick={() => updateSubliminalSettings({ selectedTrackId: track.id })}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      settings.subliminal.selectedTrackId === track.id 
                      ? 'border-apple-blue bg-apple-blue/5' 
                      : 'border-black/5 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium truncate ${settings.subliminal.selectedTrackId === track.id ? 'text-apple-blue' : ''}`}>
                      {track.name}
                    </span>
                    <div className="flex items-center gap-3">
                       {settings.subliminal.selectedTrackId === track.id && <Check size={16} className="text-apple-blue" />}
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSubliminalTrack(track.id);
                        }}
                        className="text-apple-text-secondary opacity-40 hover:opacity-100"
                        >
                        <Trash2 size={14} />
                       </button>
                    </div>
                  </button>
                ))}
                <label className="flex items-center justify-center p-4 rounded-2xl border border-dashed border-black/10 hover:border-black/20 hover:bg-gray-50 cursor-pointer transition-all gap-2 text-sm font-medium text-apple-text-secondary">
                  <Plus size={16} />
                  <span>Add subliminal track</span>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleSubliminalUpload} />
                </label>
             </div>
          </div>

          {/* Volume Balance Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end ml-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-apple-text-secondary">
                Overlay Volume
              </label>
              <span className="text-[10px] font-bold text-apple-blue bg-apple-blue/10 px-2 py-0.5 rounded-full">
                {Math.round(settings.subliminal.volume * 100)}% Subtle
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range"
                min={0}
                max={0.3}
                step={0.01}
                value={settings.subliminal.volume}
                onChange={(e) => updateSubliminalSettings({ volume: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-black/5 rounded-full appearance-none cursor-pointer accent-apple-blue"
              />
            </div>
          </div>

          {/* Other Toggles */}
          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => updateSubliminalSettings({ isLooping: !settings.subliminal.isLooping })}
                className={`flex flex-col gap-1 p-4 rounded-3xl border transition-all text-left ${settings.subliminal.isLooping ? 'bg-apple-blue/5 border-apple-blue/20' : 'bg-apple-bg/50 border-black/5'}`}
             >
                <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Loop</span>
                <span className={`text-sm font-semibold ${settings.subliminal.isLooping ? 'text-apple-blue' : ''}`}>
                  {settings.subliminal.isLooping ? 'Continuous' : 'Once'}
                </span>
             </button>
             <button 
                onClick={() => {
                  const options = [0, 5000, 10000, 30000];
                  const currentIndex = options.indexOf(settings.subliminal.delayMs);
                  const nextIndex = (currentIndex + 1) % options.length;
                  updateSubliminalSettings({ delayMs: options[nextIndex] });
                }}
                className="flex flex-col gap-1 p-4 rounded-3xl border border-black/5 bg-apple-bg/50 text-left"
             >
                <span className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Start Delay</span>
                <span className="text-sm font-semibold">
                  {settings.subliminal.delayMs === 0 ? 'Instant' : `${settings.subliminal.delayMs / 1000}s`}
                </span>
             </button>
          </div>
        </div>
      </section>

      {/* Binaural Section */}
      <section className="bg-apple-card rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center">
                <Activity size={20} />
             </div>
             <div>
                <h3 className="font-semibold">Binaural Beats</h3>
                <p className="text-xs text-apple-text-secondary">Stereo frequency layer</p>
             </div>
          </div>
          <button 
            onClick={() => updateBinauralSettings({ isEnabled: !settings.binaural.isEnabled })}
            className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${settings.binaural.isEnabled ? 'bg-purple-500' : 'bg-gray-200'}`}
          >
            <motion.div 
              className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full"
              animate={{ x: settings.binaural.isEnabled ? 16 : 0 }}
            />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Left Freq (Hz)</label>
              <input 
                type="number" 
                value={settings.binaural.leftFreq}
                onChange={(e) => {
                   const val = parseInt(e.target.value) || 0;
                   updateBinauralSettings({ leftFreq: val });
                }}
                className="w-full bg-apple-bg px-4 py-3 rounded-2xl border border-black/5 font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Right Freq (Hz)</label>
              <input 
                type="number" 
                value={settings.binaural.rightFreq}
                onChange={(e) => {
                   const val = parseInt(e.target.value) || 0;
                   updateBinauralSettings({ rightFreq: val });
                }}
                className="w-full bg-apple-bg px-4 py-3 rounded-2xl border border-black/5 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Binaural Volume</label>
                <span className="text-[10px] font-bold text-purple-600">{Math.round(settings.binaural.volume * 100)}%</span>
             </div>
             <input 
                type="range"
                min={0}
                max={0.2}
                step={0.01}
                value={settings.binaural.volume}
                onChange={(e) => updateBinauralSettings({ volume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-black/5 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-apple-text-secondary">Quick Presets</label>
            <div className="grid grid-cols-4 gap-2">
               {[
                 { label: 'Delta', l: 200, r: 202 },
                 { label: 'Theta', l: 200, r: 206 },
                 { label: 'Alpha', l: 200, r: 210 },
                 { label: 'Beta', l: 200, r: 220 }
               ].map(preset => (
                 <button 
                  key={preset.label}
                  onClick={() => updateBinauralSettings({ leftFreq: preset.l, rightFreq: preset.r })}
                  className="bg-apple-bg border border-black/5 rounded-xl py-2 text-[10px] font-bold hover:bg-apple-blue hover:text-white transition-colors"
                 >
                   {preset.label}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Section */}
      <section className="bg-apple-card rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Advanced Controls</h3>
          </div>
          {isAdvancedOpen ? <ChevronDown size={20} className="text-apple-text-secondary" /> : <ChevronRight size={20} className="text-apple-text-secondary" />}
        </button>

        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-black/5"
            >
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fade In/Out</span>
                  <button 
                    onClick={() => updateSettings({ fadeInOut: !settings.fadeInOut })}
                    className={`w-8 h-5 rounded-full relative transition-colors ${settings.fadeInOut ? 'bg-apple-blue' : 'bg-gray-200'}`}
                  >
                    <motion.div 
                      className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full"
                      animate={{ x: settings.fadeInOut ? 12 : 0 }}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sync Playback</span>
                  <button 
                    onClick={() => updateSettings({ syncPlayback: !settings.syncPlayback })}
                    className={`w-8 h-5 rounded-full relative transition-colors ${settings.syncPlayback ? 'bg-apple-blue' : 'bg-gray-200'}`}
                  >
                    <motion.div 
                      className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full"
                      animate={{ x: settings.syncPlayback ? 12 : 0 }}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
