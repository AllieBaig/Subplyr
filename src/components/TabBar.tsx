import { ReactNode } from 'react';
import { useAudio } from '../AudioContext';
import { TabType } from '../App';
import { Music, Play, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  const { settings } = useAudio();
  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'library', label: 'Library', icon: Music },
    { id: 'player', label: 'Player', icon: Play },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-apple-card/80 backdrop-blur-xl border-t border-black/5 flex justify-between items-center z-50",
      settings.miniMode ? "px-4 pb-2 pt-2 h-16" : "px-6 pb-8 pt-3 h-24"
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex flex-col items-center gap-1 transition-colors duration-200",
              isActive ? "text-apple-blue" : "text-apple-text-secondary"
            )}
          >
            <Icon size={settings.miniMode ? 20 : 24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn(
              "font-medium tracking-wide",
              settings.miniMode ? "text-[9px]" : "text-[10px]"
            )}>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={cn(
                  "absolute rounded-full bg-apple-blue",
                  settings.miniMode ? "-top-2 w-1 h-1" : "-top-3 w-1.5 h-1.5"
                )}
                transition={{ 
                  type: 'spring', 
                  stiffness: settings.miniMode ? 600 : 500, 
                  damping: 30 
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
