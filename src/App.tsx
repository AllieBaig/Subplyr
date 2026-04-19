/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AudioProvider } from './AudioContext';
import AudioEngine from './components/AudioEngine';
import TabBar from './components/TabBar';
import LibraryView from './views/LibraryView';
import PlayerView from './views/PlayerView';
import SettingsView from './views/SettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';

export type TabType = 'library' | 'player' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('player');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case 'library': return <LibraryView />;
      case 'player': return <PlayerView />;
      case 'settings': return <SettingsView />;
      default: return <PlayerView />;
    }
  };

  return (
    <AudioProvider>
      <AudioEngine />
      <div className="max-w-md mx-auto min-h-screen relative flex flex-col pt-12">
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-[100] bg-apple-text-primary text-apple-card py-2 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <WifiOff size={12} />
              <span>Offline Mode</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <main className="flex-1 px-6 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
        
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </AudioProvider>
  );
}

