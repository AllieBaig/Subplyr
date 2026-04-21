import { useState, useEffect, useMemo } from 'react';
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
import { AnimationStyle } from './types';

export type TabType = 'library' | 'player' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isLoading, initError, toast, settings, swStatus, showToast } = useAudio();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Online: System Synced");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Offline: All features active");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Handle SW updates
  useEffect(() => {
    if (swStatus === 'waiting') {
      showToast("Update Ready: Reload to apply");
    }
  }, [swStatus, showToast]);

  const getAnimationProps = (style: AnimationStyle) => {
    if (style === 'off' || !style) return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
    
    let currentStyle: AnimationStyle = style;
    if (style === 'random') {
      const styles: AnimationStyle[] = ['slide-up', 'slide-down', 'slide-left', 'slide-right'];
      currentStyle = styles[Math.floor(Math.random() * styles.length)];
    }

    switch (currentStyle) {
      case 'slide-up': return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
      case 'slide-down': return { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } };
      case 'slide-left': return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
      case 'slide-right': return { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } };
      default: return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
    }
  };

  const animationProps = useMemo(() => getAnimationProps(settings.animationStyle), [settings.animationStyle, activeTab]);

  return (
    <div 
      className={`fixed inset-0 bg-apple-bg overflow-hidden flex flex-col pt-safe select-none h-[100dvh] transition-[padding,background] duration-500 ease-in-out ${settings.miniMode ? 'p-1' : ''} ${settings.bigTouchMode ? 'big-touch-mode' : ''}`}
    >
      <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col overflow-hidden relative">
        <AudioEngine />
        
        {/* Dynamic Status Overlays */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 12, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-[200] bg-black/80 backdrop-blur-md text-white py-1.5 px-4 rounded-full flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] shadow-lg border border-white/10"
            >
              <WifiOff size={10} />
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
              className={`fixed ${settings.menuPosition === 'bottom' ? (settings.miniMode ? 'bottom-20' : 'bottom-28') : 'top-28'} left-1/2 -translate-x-1/2 z-[150] bg-black/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl text-xs font-semibold shadow-2xl border border-white/10`}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {settings.menuPosition === 'top' && !isLoading && !initError && (
            <div className="fixed top-0 left-0 right-0 flex items-center justify-center h-20 px-4 pt-4 z-[150] transition-all duration-300 pointer-events-none">
              <div className="w-full max-w-md pointer-events-auto">
                <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex-1 px-4 md:px-8 lg:px-12">
              <div className="max-w-2xl mx-auto h-full text-white">
                <LoadingPlaceholder />
              </div>
            </div>
          ) : initError ? (
            <div className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-12">
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
            <div className="flex-1 relative overflow-hidden">
              {/* Base Layer: Library */}
              <div className={`h-full overflow-y-auto no-scrollbar px-4 md:px-8 lg:px-12 pt-6 transition-all duration-500 ${settings.menuPosition === 'bottom' ? 'pb-80' : 'pb-32'}`}>
                <LibraryView />
              </div>

              {/* Mini Player - Only show when NOT in Settings/Full Player */}
              <AnimatePresence>
                {activeTab === 'library' && (
                  <div className={`fixed left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[80] transition-all duration-500 ${settings.menuPosition === 'bottom' ? 'bottom-24' : 'bottom-6'}`}>
                    <MiniPlayer onExpand={() => setActiveTab('player')} />
                  </div>
                )}
              </AnimatePresence>

              {/* Player Overlay (Full Screen Sheet) */}
              <AnimatePresence>
                {activeTab === 'player' && (
                  <motion.div
                    key="player"
                    {...animationProps}
                    transition={{ duration: settings.animationStyle === 'off' ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className={`fixed left-0 right-0 top-0 z-[100] bg-white overflow-hidden shadow-2xl ${settings.menuPosition === 'bottom' ? 'bottom-24' : 'bottom-0 mt-20'}`}
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
                    {...animationProps}
                    transition={{ duration: settings.animationStyle === 'off' ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className={`fixed left-0 right-0 top-0 z-[110] bg-white overflow-y-auto no-scrollbar ${settings.menuPosition === 'bottom' ? 'bottom-24' : 'bottom-0 mt-20'}`}
                  >
                    <div className="w-full px-4 md:px-8 lg:px-12 py-6 min-h-full pb-32">
                       <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-8">
                         <button 
                           onClick={() => setActiveTab('library')}
                           className={`px-6 py-2 bg-gray-50 border border-black/[0.03] rounded-full text-xs font-bold active:scale-95 transition-transform ${settings.bigTouchMode ? 'scale-110 px-8 py-3' : ''}`}
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
        
        {settings.menuPosition === 'bottom' && !isLoading && !initError && (
          <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center h-24 pointer-events-none px-4 pb-4 z-[150] transition-all duration-300">
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
