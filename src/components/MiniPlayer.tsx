import { useAudio } from '../AudioContext';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MiniPlayerProps {
  onExpand: () => void;
}

export default function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const { currentTrackIndex, isPlaying, setIsPlaying, playNext, settings, currentPlaybackList } = useAudio();
  const currentTrack = currentTrackIndex !== null ? currentPlaybackList[currentTrackIndex] : null;

  if (!currentTrack) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={`fixed ${settings.miniMode ? 'bottom-20' : 'bottom-28'} left-4 right-4 z-40`}
      onClick={onExpand}
    >
      <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2rem] p-2 flex items-center gap-3 active:scale-[0.98] transition-transform">
        {/* Artwork */}
        <div className="w-12 h-12 rounded-[1.25rem] bg-gray-100 flex-shrink-0 overflow-hidden shadow-sm">
          {currentTrack.artwork ? (
            <img src={currentTrack.artwork} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={20} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-xs font-bold text-apple-text-primary truncate">{currentTrack.name}</h4>
          <p className="text-[10px] font-bold text-apple-text-secondary uppercase tracking-widest truncate">{currentTrack.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 pr-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-10 h-10 flex items-center justify-center text-apple-text-primary hover:bg-black/5 rounded-full transition-colors"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" stroke="none" /> : <Play size={20} fill="currentColor" stroke="none" className="ml-0.5" />}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="w-10 h-10 flex items-center justify-center text-apple-text-primary hover:bg-black/5 rounded-full transition-colors"
          >
            <SkipForward size={20} fill="currentColor" stroke="none" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
