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
      <div className="bg-white/95 backdrop-blur-3xl border border-black/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[1.75rem] p-2 flex items-center gap-3 active:scale-[0.98] transition-transform">
        {/* Artwork */}
        <div className="w-11 h-11 rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden border border-black/[0.02]">
          {currentTrack.artwork ? (
            <img src={currentTrack.artwork} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={18} className="text-gray-200" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-extrabold text-black truncate tracking-tight">{currentTrack.name}</h4>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">{currentTrack.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 pr-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-10 h-10 flex items-center justify-center text-black hover:bg-black/5 rounded-full transition-colors"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" stroke="none" /> : <Play size={20} fill="currentColor" stroke="none" className="ml-0.5" />}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="w-10 h-10 flex items-center justify-center text-black hover:bg-black/5 rounded-full transition-colors"
          >
            <SkipForward size={20} fill="currentColor" stroke="none" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
