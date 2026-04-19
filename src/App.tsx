import { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './AudioContext';
import AudioEngine from './components/AudioEngine';
import TabBar from './components/TabBar';
import LibraryView from './views/LibraryView';
import PlayerView from './views/PlayerView';
import SettingsView from './views/SettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, AlertCircle, RefreshCcw } from 'lucide-react';
import { GlobalSafetyManager, LoadingPlaceholder } from './components/Safety';

export type TabType = 'library' | 'player' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('player');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isLoading, initError } = useAudio();

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

  if (isLoading) return <LoadingPlaceholder />;

  if (initError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-apple-bg p-8 text-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-2xl">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Startup Issue</h2>
          <p className="text-apple-text-secondary text-sm mb-8">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-apple-text-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCcw size={20} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'library': return <LibraryView />;
      case 'player': return <PlayerView />;
      case 'settings': return <SettingsView />;
      default: return <PlayerView />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col pt-12">
      <AudioEngine />
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
  );
}

export default function App() {
  return (
    <GlobalSafetyManager>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </GlobalSafetyManager>
  );
}
