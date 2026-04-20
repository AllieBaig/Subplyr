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
  const { isLoading, initError, toast, settings } = useAudio();

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

  // Defensive State Guard: Ensure settings and tracks exist before heavy rendering
  // If isLoading is true, we still render the shell but put Placeholder in main
  // If initError exists, we show error UI in main but keep TabBar for navigation (if possible) or just focus on repair

  return (
    <div 
      className={`fixed inset-0 bg-apple-bg overflow-hidden flex flex-col pt-safe select-none h-[100dvh] transition-[padding,background] duration-500 ease-in-out ${settings.miniMode ? 'p-1' : ''}`}
    >
      <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col overflow-hidden relative">
        <AudioEngine />
        
        {/* Dynamic Status Overlays */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-[100] bg-apple-text-primary text-apple-card py-2 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
              <WifiOff size={12} />
              <span>Offline Mode</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`fixed ${settings.miniMode ? 'bottom-20' : 'bottom-28'} left-1/2 -translate-x-1/2 z-[150] bg-black/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl text-xs font-semibold shadow-2xl border border-white/10`}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                 key="loader"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="h-full px-4 md:px-8 lg:px-12"
              >
                <div className="max-w-2xl mx-auto h-full">
                  <LoadingPlaceholder />
                </div>
              </motion.div>
            ) : initError ? (
              <motion.div 
                 key="error"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="h-full flex items-center justify-center px-4 md:px-8 lg:px-12"
              >
                <div className={`w-full max-w-lg bg-white ${settings.miniMode ? 'rounded-2xl p-6' : 'rounded-[2.5rem] p-8'} border border-black/5 shadow-2xl text-center`}>
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
                    <span>Retry System</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 'library' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeTab === 'library' ? 20 : -20 }}
                transition={{ 
                  duration: settings.miniMode ? 0.35 : 0.5, 
                  ease: [0.23, 1, 0.32, 1] 
                }} 
                className={`h-full flex flex-col overflow-y-auto no-scrollbar pb-32`}
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="w-full px-4 md:px-8 lg:px-12 py-6">
                  {renderView()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {!isLoading && !initError && (
          <div className="absolute bottom-0 left-0 right-0 h-24 flex items-center justify-center pointer-events-none px-4 pb-4">
            <div className="w-full max-w-md pointer-events-auto">
              <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>
        )}
      </div>
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
