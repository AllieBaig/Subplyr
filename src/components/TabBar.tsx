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
      "w-full bg-white/80 backdrop-blur-3xl border-none rounded-xl flex justify-center items-center z-50 transition-all shadow-sm",
      settings.miniMode ? "px-4 py-2 h-12 gap-16" : "px-6 py-3 h-16 gap-20",
      settings.bigTouchMode && !settings.miniMode && "h-20"
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 transition-all duration-300",
              isActive ? "text-apple-blue" : "text-gray-300"
            )}
          >
            <div className="p-1 px-4 rounded-full transition-all">
              <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="font-bold text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
