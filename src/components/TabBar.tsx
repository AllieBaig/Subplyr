import { ReactNode } from 'react';
import { useAudio } from '../AudioContext';
import { TabType } from '../App';
import { Music, Settings as SettingsIcon } from 'lucide-react';
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
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className={cn(
      "w-full bg-white/95 backdrop-blur-3xl border border-black/[0.03] rounded-[2rem] flex justify-center items-center z-50 transition-all shadow-xl shadow-black/5",
      settings.miniMode ? "px-4 py-2 h-14 gap-16" : "px-6 py-3 h-20 gap-20",
      settings.bigTouchMode && !settings.miniMode && "h-24 scale-105"
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex flex-col items-center gap-1 group transition-all duration-300",
              isActive ? "text-black scale-105" : "text-gray-400"
            )}
          >
            <div className="p-2 transition-all">
              <Icon size={settings.miniMode ? 18 : 22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn(
              "font-bold tracking-[0.05em] uppercase",
              settings.miniMode ? "text-[8px]" : "text-[9px]"
            )}>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-black shadow-sm"
                transition={{ 
                  type: 'spring', 
                  stiffness: 500, 
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
