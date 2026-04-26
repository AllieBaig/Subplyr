import React from 'react';
import { useSettings } from '../SettingsContext';
import { Group, Section } from './SettingsUI';
import { Palette, Sun, Moon, Monitor, Layout, Zap, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface AppearanceSettingsProps {
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const AppearanceSettings = ({ isExpanded = false, onToggle = () => {} }: AppearanceSettingsProps) => {
  const { settings, updateSettings, updateAppearanceSettings } = useSettings();

  return (
    <Group 
      title="Appearance" 
      icon={Palette} 
      color="bg-pink-500/10 text-pink-600"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-3">
        <Section
          id="theme"
          title="Theme & Style"
          subtitle="Appearance"
          icon={Layout}
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
                  className={`w-8 h-5 rounded-full relative transition-colors ${settings.appearance.followSystem ? 'bg-pink-500' : 'bg-system-tertiary-label'}`}
                >
                  <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.appearance.followSystem ? 12 : 0 }} />
                </button>
              </div>

              {!settings.appearance.followSystem && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => updateAppearanceSettings({ theme: 'light' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${settings.appearance.theme === 'light' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-system-background border-apple-border text-system-secondary-label'}`}
                  >
                    <Sun size={14} />
                    <span className="text-[10px] font-black uppercase">Light</span>
                  </button>
                  <button 
                    onClick={() => updateAppearanceSettings({ theme: 'dark' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${settings.appearance.theme === 'dark' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-system-background border-apple-border text-system-secondary-label'}`}
                  >
                    <Moon size={14} />
                    <span className="text-[10px] font-black uppercase">Dark</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-system-secondary-label">Dark Mode Style</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => updateAppearanceSettings({ darkModeStyle: 'soft-purple' })}
                  className={`py-3 rounded-xl border transition-all ${settings.appearance.darkModeStyle === 'soft-purple' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-system-background border-apple-border text-system-secondary-label'}`}
                >
                  <span className="text-[10px] font-black uppercase">Soft Purple</span>
                </button>
                <button 
                  onClick={() => updateAppearanceSettings({ darkModeStyle: 'soft-blue' })}
                  className={`py-3 rounded-xl border transition-all ${settings.appearance.darkModeStyle === 'soft-blue' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-system-background border-apple-border text-system-secondary-label'}`}
                >
                  <span className="text-[10px] font-black uppercase">Soft Blue</span>
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="visuals"
          title="Visual Features"
          subtitle="Buttons & Art"
          icon={Zap}
          color="bg-amber-500/10 text-amber-600"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-system-label">Hide Artwork Default</p>
              </div>
              <button 
                onClick={() => updateSettings({ showArtwork: !settings.showArtwork })}
                className={`w-8 h-5 rounded-full relative transition-colors ${!settings.showArtwork ? 'bg-amber-500' : 'bg-system-tertiary-label'}`}
              >
                <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: !settings.showArtwork ? 12 : 0 }} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-system-label">Big Touch Buttons</p>
              </div>
              <button 
                onClick={() => updateSettings({ bigTouchMode: !settings.bigTouchMode })}
                className={`w-8 h-5 rounded-full relative transition-colors ${settings.bigTouchMode ? 'bg-amber-500' : 'bg-system-tertiary-label'}`}
              >
                <motion.div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full" animate={{ x: settings.bigTouchMode ? 12 : 0 }} />
              </button>
            </div>
          </div>
        </Section>
      </div>
    </Group>
  );
};
