import { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './AudioContext';
import AudioEngine from './components/AudioEngine';
import TabBar from './components/TabBar';
import LibraryView from './views/LibraryView';
import PlayerView from './views/PlayerView';
import SettingsView from './views/SettingsView';
import MiniPlayer from './components/MiniPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, AlertCircle, RefreshCcw } from 'lucide-react';
import { GlobalSafetyManager, LoadingPlaceholder } from './components/Safety';

export type TabType = 'library' | 'player' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('library');
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
        
        <main className="flex-1 relative overflow-hidden">
          {isLoading ? (
            <div className="h-full px-4 md:px-8 lg:px-12">
              <div className="max-w-2xl mx-auto h-full">
                <LoadingPlaceholder />
              </div>
            </div>
          ) : initError ? (
            <div className="h-full flex items-center justify-center px-4 md:px-8 lg:px-12">
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
            </div>
          ) : (
            <div className="h-full relative overflow-hidden">
              {/* Base Layer: Library */}
              <div className="h-full overflow-y-auto no-scrollbar pb-64 px-4 md:px-8 lg:px-12 pt-6">
                <LibraryView />
              </div>

              {/* Mini Player - Only show when NOT in Settings/Full Player */}
              <AnimatePresence>
                {activeTab === 'library' && (
                  <MiniPlayer onExpand={() => setActiveTab('player')} />
                )}
              </AnimatePresence>

              {/* Player Overlay (Full Screen Sheet) */}
              <AnimatePresence>
                {activeTab === 'player' && (
                  <motion.div
                    key="player"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className="fixed inset-0 z-[100] bg-white overflow-hidden shadow-2xl"
                  >
                    <PlayerView onBack={() => setActiveTab('library')} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Settings Overlay (Full Screen Sheet) */}
              <AnimatePresence>
                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[110] bg-white overflow-y-auto no-scrollbar"
                  >
                    <div className="w-full px-4 md:px-8 lg:px-12 py-6 min-h-full pb-32">
                       <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-8">
                         <button 
                           onClick={() => setActiveTab('library')}
                           className="px-6 py-2 bg-gray-50 border border-black/[0.03] rounded-full text-xs font-bold active:scale-95 transition-transform"
                         >
                           Done
                         </button>
                         <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-text-secondary">System Settings</h2>
                       </div>
                       <SettingsView onBack={() => setActiveTab('library')} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </main>
        
        {!isLoading && !initError && (
          <div className="absolute bottom-0 left-0 right-0 h-24 flex items-center justify-center pointer-events-none px-4 pb-4 z-50">
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
