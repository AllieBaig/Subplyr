/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AudioProvider } from './AudioContext';
import AudioEngine from './components/AudioEngine';
import TabBar from './components/TabBar';
import LibraryView from './views/LibraryView';
import PlayerView from './views/PlayerView';
import SettingsView from './views/SettingsView';
import { motion, AnimatePresence } from 'motion/react';

export type TabType = 'library' | 'player' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('player');

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

