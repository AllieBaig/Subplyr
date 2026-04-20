import React, { useMemo, useState, useCallback } from 'react';
import { useAudio } from '../AudioContext';
import { 
  Upload, Plus, Trash2, Share, SortAsc, 
  LayoutGrid, List, Calendar, CheckCircle2, 
  Circle, X, FolderPlus, ListPlus, Zap,
  AlertCircle, Link
} from 'lucide-react';
import { Track, SortOption, GroupOption } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function LibraryView() {
  const { 
    tracks, 
    addTrack, 
    removeTrack, 
    setCurrentTrackIndex, 
    setIsPlaying, 
    currentTrackIndex, 
    showToast,
    settings,
    updateLibrarySettings,
    updateSubliminalSettings,
    playlists,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    addTracksToPlaylist,
    relinkTrack
  } = useAudio();

  const [view, setView] = useState<'tracks' | 'playlists'>('tracks');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [showBulkAddMenu, setShowBulkAddMenu] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      for (const file of filesArray) {
        await addTrack(file);
      }
    }
  };

  const toggleSelectAll = (ids: string[]) => {
    const allSelected = ids.every(id => selectedTrackIds.has(id));
    const next = new Set(selectedTrackIds);
    if (allSelected) {
      ids.forEach(id => next.delete(id));
    } else {
      ids.forEach(id => next.add(id));
    }
    setSelectedTrackIds(next);
  };

  const toggleTrackSelection = useCallback((id: string) => {
    setSelectedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sortedTracks = useMemo(() => {
    const sorted = [...tracks];
    const { sort } = settings.library;

    if (sort === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'date' || sort === 'recent') {
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return sorted;
  }, [tracks, settings.library.sort]);

  const groupedTracks = useMemo(() => {
    const { group } = settings.library;
    if (group === 'none') return [{ label: '', items: sortedTracks }];

    const groups: { [key: string]: Track[] } = {};
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    sortedTracks.forEach(track => {
      const diff = now - (track.createdAt || 0);
      let label = 'Older';

      if (group === 'day') {
        if (diff < dayMs) label = 'Today';
        else if (diff < 2 * dayMs) label = 'Yesterday';
        else label = new Date(track.createdAt).toLocaleDateString(undefined, { weekday: 'long' });
      } else if (group === 'week') {
        if (diff < 7 * dayMs) label = 'This Week';
        else label = 'Earlier';
      } else if (group === 'month') {
        label = new Date(track.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(track);
    });

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }, [sortedTracks, settings.library.group]);

  const handleBulkAddToPlaylist = async (pid: string) => {
    await addTracksToPlaylist(Array.from(selectedTrackIds), pid);
    setIsSelectMode(false);
    setSelectedTrackIds(new Set());
    setShowBulkAddMenu(false);
  };

  const handleBulkCreatePlaylist = async () => {
    const name = prompt("Playlist name:");
    if (name) {
      await createPlaylist(name, Array.from(selectedTrackIds));
      setIsSelectMode(false);
      setSelectedTrackIds(new Set());
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto no-scrollbar relative ${settings.miniMode ? 'gap-3' : 'gap-6'}`}>
      <header className={`flex justify-between items-end sticky top-0 bg-apple-bg/80 backdrop-blur-md z-20 ${settings.miniMode ? 'pt-2 pb-1' : 'pt-4 pb-2'}`}>
        <div>
          <h1 className={`${settings.miniMode ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight`}>Library</h1>
          <div className={`flex gap-4 ${settings.miniMode ? 'mt-0' : 'mt-1'}`}>
            <button 
              onClick={() => { setView('tracks'); setIsSelectMode(false); setSelectedTrackIds(new Set()); }}
              className={`text-sm font-semibold transition-colors ${view === 'tracks' ? 'text-apple-text-primary' : 'text-apple-text-secondary hover:text-apple-text-primary'}`}
            >
              Tracks
            </button>
            <button 
              onClick={() => { setView('playlists'); setIsSelectMode(false); setSelectedTrackIds(new Set()); }}
              className={`text-sm font-semibold transition-colors ${view === 'playlists' ? 'text-apple-text-primary' : 'text-apple-text-secondary hover:text-apple-text-primary'}`}
            >
              Playlists
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {view === 'tracks' && tracks.length > 0 && (
            <button 
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedTrackIds(new Set());
              }}
              className={`text-sm font-bold tracking-tight px-4 py-2 rounded-full transition-all border ${isSelectMode ? 'bg-apple-blue text-white border-apple-blue shadow-lg' : 'text-apple-blue border-transparent hover:bg-apple-blue/10 font-semibold'}`}
            >
              {isSelectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          {view === 'tracks' && !isSelectMode && (
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`bg-apple-card border border-black/5 p-3 flex-shrink-0 transition-colors ${settings.miniMode ? 'p-2 rounded-xl' : 'p-3 rounded-2xl shadow-sm'} ${showSortMenu ? 'text-apple-blue font-bold' : 'text-apple-text-secondary'}`}
            >
              <SortAsc size={settings.miniMode ? 18 : 20} />
            </button>
          )}
          {!isSelectMode && (
            <label className={`bg-apple-card border border-black/5 p-3 flex-shrink-0 cursor-pointer hover:bg-gray-50 transition-colors ${settings.miniMode ? 'p-2 rounded-xl' : 'p-3 rounded-2xl shadow-sm'}`}>
              <Plus size={settings.miniMode ? 18 : 20} />
              <input type="file" multiple accept="audio/*, .mp3, .m4a, .aac, .wav, audio/mp4, audio/x-m4a" className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>
      </header>

      {showSortMenu && view === 'tracks' && !isSelectMode && (
        <div className={`bg-apple-card border border-black/5 flex flex-col shadow-sm animate-in fade-in slide-in-from-top-2 ${settings.miniMode ? 'rounded-2xl p-3 gap-3' : 'rounded-3xl p-4 gap-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary">Sort By</span>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['recent', 'alphabetical'] as SortOption[]).map(s => (
                <button
                  key={s}
                  onClick={() => updateLibrarySettings({ sort: s })}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${settings.library.sort === s ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary">Group By</span>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['none', 'day', 'week', 'month'] as GroupOption[]).map(g => (
                <button
                  key={g}
                  onClick={() => updateLibrarySettings({ group: g })}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${settings.library.group === g ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'tracks' ? (
        tracks.length === 0 ? (
          <EmptyState onFileUpload={handleFileUpload} />
        ) : (
          <div className={`flex flex-col gap-6 ${isSelectMode ? 'pb-32' : 'pb-8'}`}>
            {groupedTracks.map((group, gIdx) => (
              <div key={gIdx} className="flex flex-col gap-2">
                {group.label && (
                  <div className="flex items-center justify-between px-2 mt-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[.2em] text-apple-text-secondary">
                      {group.label}
                    </h3>
                    {isSelectMode && (
                      <button 
                        onClick={() => toggleSelectAll(group.items.map(t => t.id))}
                        className="text-[10px] font-bold text-apple-blue uppercase tracking-widest"
                      >
                        {group.items.every(t => selectedTrackIds.has(t.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                )}
                {group.items.map((track) => {
                  const trueIndex = tracks.findIndex(t => t.id === track.id);
                  return (
                    <TrackItem 
                      key={track.id} 
                      track={track} 
                      isActive={currentTrackIndex === trueIndex}
                      isSelectMode={isSelectMode}
                      isSelected={selectedTrackIds.has(track.id)}
                      onSelect={() => toggleTrackSelection(track.id)}
                      onPlay={() => {
                        if (isSelectMode) {
                          toggleTrackSelection(track.id);
                        } else {
                          setCurrentTrackIndex(trueIndex);
                          setIsPlaying(true);
                        }
                      }}
                      onRemove={() => removeTrack(track.id)}
                      playlists={playlists}
                      onAddToPlaylist={(pid) => addTrackToPlaylist(track.id, pid)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )
      ) : (
        <PlaylistView 
          playlists={playlists} 
          onCreate={() => {
            const name = prompt("Playlist name:");
            if (name) createPlaylist(name);
          }}
          onDelete={deletePlaylist}
          tracks={tracks}
          onTrackPlay={(id) => {
            const idx = tracks.findIndex(t => t.id === id);
            if (idx !== -1) {
              setCurrentTrackIndex(idx);
              setIsPlaying(true);
            }
          }}
        />
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-[100] flex flex-col gap-3 px-6 py-5 bg-black/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{selectedTrackIds.size} Selected</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const allIds = tracks.map(t => t.id);
                    const allSelected = allIds.every(id => selectedTrackIds.has(id));
                    if (allSelected) setSelectedTrackIds(new Set());
                    else setSelectedTrackIds(new Set(allIds));
                  }}
                  className="text-[10px] font-bold text-apple-blue uppercase tracking-widest active:opacity-50"
                >
                  {tracks.every(t => selectedTrackIds.has(t.id)) ? 'Deselect All' : 'Select All'}
                </button>
                <button 
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedTrackIds(new Set());
                  }}
                  className="text-[10px] font-bold text-white/60 uppercase tracking-widest active:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <div className="h-px bg-white/10 w-full" />

            <div className="flex gap-3 mt-1">
              <button 
                onClick={() => {
                  if (selectedTrackIds.size > 0) setShowBulkAddMenu(!showBulkAddMenu);
                  else showToast("Select tracks first");
                }}
                disabled={selectedTrackIds.size === 0}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-lg ${selectedTrackIds.size > 0 ? 'bg-apple-blue text-white shadow-apple-blue/20' : 'bg-white/5 text-white/20'}`}
              >
                <ListPlus size={16} />
                <span>Add to Playlist</span>
              </button>
              <button 
                onClick={handleBulkCreatePlaylist}
                disabled={selectedTrackIds.size === 0}
                className={`flex items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${selectedTrackIds.size > 0 ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/20'}`}
                title="Create New Playlist"
              >
                <FolderPlus size={20} />
              </button>
            </div>

            <AnimatePresence>
              {showBulkAddMenu && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-4 left-0 right-0 bg-white shadow-2xl rounded-[2.5rem] p-6 text-apple-text-primary z-50 border border-black/5"
                >
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="font-bold text-lg">Add to Playlist</h3>
                    <button onClick={() => setShowBulkAddMenu(false)} className="text-apple-text-secondary"><X size={20} /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto no-scrollbar">
                    {playlists.length === 0 ? (
                       <p className="text-center py-8 text-apple-text-secondary text-sm italic">No playlists created yet</p>
                    ) : (
                      playlists.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => handleBulkAddToPlaylist(p.id)}
                          className="w-full text-left px-5 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] flex items-center justify-between font-bold text-sm transition-all active:scale-[0.98]"
                        >
                          <span>{p.name}</span>
                          <span className="text-[10px] text-apple-text-secondary lowercase">{p.trackIds.length} tracks</span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const EmptyState = ({ onFileUpload }: any) => (
  <div className="bg-apple-card rounded-[2.5rem] p-12 border border-black/5 flex flex-col items-center justify-center text-center gap-4">
    <div className="w-16 h-16 bg-apple-bg rounded-full flex items-center justify-center text-apple-text-secondary">
       <Upload size={32} />
    </div>
    <div>
      <h3 className="font-semibold text-lg">No music yet</h3>
      <p className="text-sm text-apple-text-secondary px-6">Upload your favorite tracks to listen offline.</p>
    </div>
    <label className="mt-2 text-apple-blue font-medium cursor-pointer">
      Select files
      <input type="file" multiple accept="audio/*, .mp3, .m4a, .aac, .wav, audio/mp4, audio/x-m4a" className="hidden" onChange={onFileUpload} />
    </label>
  </div>
);

const TrackItem = React.memo(({ track, isActive, onPlay, onRemove, playlists, onAddToPlaylist, isSelectMode, isSelected, onSelect }: any) => {
  const [showActions, setShowActions] = useState(false);
  const { settings, updateSubliminalSettings, showToast, relinkTrack } = useAudio();

  const handleRelink = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await relinkTrack(track.id, e.target.files[0], false);
    }
  };

  return (
    <div className={`group flex flex-col transition-all duration-300 ${settings.miniMode ? 'rounded-xl' : 'rounded-3xl'} ${isActive ? 'bg-apple-blue/5 border border-apple-blue/10' : 'hover:bg-apple-card/60 border border-transparent'} ${track.isMissing ? 'opacity-80' : ''}`}>
      <div className={`flex items-center gap-4 ${settings.miniMode ? 'p-2' : 'p-4'}`}>
        {isSelectMode && (
          <button 
            onClick={onSelect}
            disabled={track.isMissing}
            className={`flex-shrink-0 transition-all duration-300 transform ${isSelected ? 'scale-110' : 'scale-100'} ${isSelected ? 'text-apple-blue' : 'text-gray-300'} ${track.isMissing ? 'grayscale opacity-50' : ''}`}
          >
            {isSelected ? (
              <div className="bg-apple-blue rounded-full p-0.5">
                <CheckCircle2 size={24} className="text-white" fill="currentColor" stroke="none" />
              </div>
            ) : (
              <Circle size={24} className="text-gray-200" />
            )}
          </button>
        )}
        <button 
          onClick={() => !track.isMissing && onPlay()} 
          className={`flex-1 flex items-center ${settings.miniMode ? 'gap-3' : 'gap-4'} text-left min-w-0 ${track.isMissing ? 'cursor-default' : ''}`}
        >
          <div className={`flex-shrink-0 ${settings.miniMode ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl'} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-sm relative`}>
             {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-400" size={settings.miniMode ? 16 : 20} />}
             {track.isMissing && (
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                 <AlertCircle size={settings.miniMode ? 14 : 18} className="text-white" />
               </div>
             )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold truncate text-sm ${isActive ? 'text-apple-blue' : 'text-apple-text-primary'}`}>
                {track.name}
              </h4>
              {track.isMissing && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">Missing</span>
              )}
            </div>
            <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-wider">{track.artist}</p>
          </div>
        </button>
        <div className="flex gap-1 flex-shrink-0">
          {track.isMissing ? (
            <label className="p-2 text-apple-blue hover:bg-apple-blue/5 rounded-full transition-colors cursor-pointer" title="Relink File">
              <Link size={16} />
              <input type="file" accept="audio/*" className="hidden" onChange={handleRelink} />
            </label>
          ) : (
            !isSelectMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                className={`p-2 rounded-full transition-colors ${showActions ? 'bg-apple-blue/10 text-apple-blue' : 'text-apple-text-secondary hover:bg-gray-100'}`}
              >
                <Plus size={16} />
              </button>
            )
          )}
          {!settings.miniMode && !isSelectMode && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 text-apple-text-secondary hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {showActions && !isSelectMode && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
          <div className="bg-white/50 backdrop-blur rounded-2xl p-4 border border-black/5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-apple-text-secondary px-1">Quick Actions</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  updateSubliminalSettings({ selectedTrackId: track.id, isEnabled: true });
                  showToast(`"${track.name}" set as subliminal layer`);
                  setShowActions(false);
                }}
                className="flex items-center gap-3 w-full p-2 bg-apple-blue/10 text-apple-blue rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
              >
                <Zap size={14} fill="currentColor" />
                <span>Play as Subliminal Layer</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-apple-text-secondary px-1">Add to Playlist</p>
              {playlists.length === 0 ? (
                <p className="text-[10px] text-apple-text-secondary px-2 py-2 italic text-center">No playlists yet</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {playlists.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onAddToPlaylist(p.id);
                        setShowActions(false);
                      }}
                      className="whitespace-nowrap px-3 py-1.5 bg-apple-card border border-black/5 text-apple-text-primary rounded-xl text-[10px] font-bold"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const PlaylistView = ({ playlists, onCreate, onDelete, tracks, onTrackPlay }: any) => (
  <div className="flex flex-col gap-6">
    <button 
      onClick={onCreate}
      className="w-full p-6 bg-apple-card border border-dashed border-apple-blue/30 rounded-[2rem] flex flex-col items-center gap-2 text-apple-blue hover:bg-apple-blue/5 transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-apple-blue/10 flex items-center justify-center">
        <Plus size={24} />
      </div>
      <span className="font-bold text-sm">Create New Playlist</span>
    </button>

    <div className="grid grid-cols-1 gap-4">
      {playlists.map((playlist: any) => (
        <div key={playlist.id} className="bg-apple-card rounded-[2.5rem] p-6 border border-black/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight">{playlist.name}</h3>
              <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-widest">{playlist.trackIds.length} tracks</p>
            </div>
            <button onClick={() => onDelete(playlist.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {playlist.trackIds.map((tid: string) => {
              const track = tracks.find((t: any) => t.id === tid);
              if (!track) return null;
              return (
                <button 
                  key={tid}
                  onClick={() => onTrackPlay(tid)}
                  className="flex items-center gap-3 p-2 hover:bg-apple-bg rounded-2xl text-left transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-300" size={12} />}
                  </div>
                  <span className="text-xs font-semibold truncate flex-1">{track.name}</span>
                </button>
              );
            })}
            {playlist.trackIds.length === 0 && (
              <p className="text-[10px] text-apple-text-secondary italic text-center py-4 bg-apple-bg rounded-2xl border border-dashed border-gray-100">No tracks in this playlist yet</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Music = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);
