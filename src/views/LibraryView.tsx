import React, { useMemo, useState, useCallback } from 'react';
import { useAudio } from '../AudioContext';
import { 
  Upload, Plus, Trash2, Share, SortAsc, 
  LayoutGrid, List, Calendar, CheckCircle2, 
  Circle, X, FolderPlus, ListPlus, Zap,
  AlertCircle, Link, ArrowLeft, MoreVertical, Edit2
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
    removeTracksFromPlaylist,
    relinkTrack,
    renamePlaylist
  } = useAudio();

  const [view, setView] = useState<'tracks' | 'playlists' | 'playlist_detail'>('tracks');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [showBulkAddMenu, setShowBulkAddMenu] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'add' | 'move'>('add');
  const [playlistSort, setPlaylistSort] = useState<'none' | 'recent' | 'alphabetical' | 'date'>('none');
  const [showPlaylistSettings, setShowPlaylistSettings] = useState(false);

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
    const ids = Array.from(selectedTrackIds);
    const targetPlaylistId = editingPlaylistId || activePlaylistId;
    
    if (bulkActionType === 'move' && targetPlaylistId) {
      await addTracksToPlaylist(ids, pid);
      await removeTracksFromPlaylist(ids, targetPlaylistId);
      showToast(`Moved ${ids.length} tracks to "${playlists.find(p => p.id === pid)?.name}"`);
    } else {
      await addTracksToPlaylist(ids, pid);
    }
    
    setIsSelectMode(false);
    setSelectedTrackIds(new Set());
    setEditingPlaylistId(null);
    setShowBulkAddMenu(false);
  };

  const handleBulkRemoveFromPlaylist = async () => {
    const targetPlaylistId = editingPlaylistId || activePlaylistId;
    if (!targetPlaylistId) return;
    
    const ids = Array.from(selectedTrackIds);
    const pName = playlists.find(p => p.id === targetPlaylistId)?.name;
    if (confirm(`Remove ${ids.length} tracks from "${pName}"?`)) {
      await removeTracksFromPlaylist(ids, targetPlaylistId);
      setIsSelectMode(false);
      setSelectedTrackIds(new Set());
      setEditingPlaylistId(null);
      showToast(`Removed ${ids.length} tracks from selection`);
    }
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
              onClick={() => { setView('tracks'); setIsSelectMode(false); setSelectedTrackIds(new Set()); setEditingPlaylistId(null); setActivePlaylistId(null); }}
              className={`text-sm font-semibold transition-colors ${view === 'tracks' ? 'text-apple-text-primary' : 'text-apple-text-secondary hover:text-apple-text-primary'}`}
            >
              Tracks
            </button>
            <button 
              onClick={() => { setView('playlists'); setIsSelectMode(false); setSelectedTrackIds(new Set()); setEditingPlaylistId(null); setActivePlaylistId(null); }}
              className={`text-sm font-semibold transition-colors ${view === 'playlists' || view === 'playlist_detail' ? 'text-apple-text-primary' : 'text-apple-text-secondary hover:text-apple-text-primary'}`}
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

      {view === 'playlist_detail' && activePlaylistId ? (
         <PlaylistDetailView 
            playlist={playlists.find(p => p.id === activePlaylistId)!}
            tracks={tracks}
            onBack={() => {
              setView('playlists');
              setActivePlaylistId(null);
              setIsSelectMode(false);
              setSelectedTrackIds(new Set());
            }}
            onTrackPlay={(id) => {
              const idx = tracks.findIndex(t => t.id === id);
              if (idx !== -1) {
                setCurrentTrackIndex(idx);
                setIsPlaying(true);
              }
            }}
            onRename={(id, name) => renamePlaylist(id, name)}
            onDelete={(id) => {
              deletePlaylist(id);
              setView('playlists');
            }}
            onRemoveTrack={(tid: string) => removeTracksFromPlaylist([tid], activePlaylistId!)}
            onAddToPlaylist={addTrackToPlaylist}
            isSelectMode={isSelectMode}
            onEnterSelect={() => setIsSelectMode(true)}
            selectedTrackIds={selectedTrackIds}
            onToggleSelection={(tid) => toggleTrackSelection(tid)}
            sort={playlistSort}
            onSort={setPlaylistSort}
            showSettings={showPlaylistSettings}
            onToggleSettings={() => setShowPlaylistSettings(!showPlaylistSettings)}
            playlists={playlists}
         />
      ) : view === 'tracks' ? (
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
          onOpen={(id) => {
            setActivePlaylistId(id);
            setView('playlist_detail');
          }}
          isSelectMode={isSelectMode}
          editingPlaylistId={editingPlaylistId}
          selectedTrackIds={selectedTrackIds}
          onToggleSelection={(tid: string, pid: string) => {
            if (!isSelectMode) {
               setIsSelectMode(true);
               setEditingPlaylistId(pid);
               setSelectedTrackIds(new Set([tid]));
            } else if (editingPlaylistId === pid) {
               toggleTrackSelection(tid);
            } else {
               // Switching playlist focus
               setEditingPlaylistId(pid);
               setSelectedTrackIds(new Set([tid]));
            }
          }}
          onEnterSelect={(pid: string) => {
            setIsSelectMode(true);
            setEditingPlaylistId(pid);
            setSelectedTrackIds(new Set());
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
                    let allIds: string[] = [];
                    if (editingPlaylistId) {
                      allIds = playlists.find(p => p.id === editingPlaylistId)?.trackIds || [];
                    } else if (activePlaylistId) {
                      allIds = playlists.find(p => p.id === activePlaylistId)?.trackIds || [];
                    } else {
                      allIds = tracks.map(t => t.id);
                    }
                    const allSelected = allIds.length > 0 && allIds.every(id => selectedTrackIds.has(id));
                    if (allSelected) {
                      const next = new Set(selectedTrackIds);
                      allIds.forEach(id => next.delete(id));
                      setSelectedTrackIds(next);
                    } else {
                      setSelectedTrackIds(new Set([...Array.from(selectedTrackIds), ...allIds]));
                    }
                  }}
                  className="text-[10px] font-bold text-apple-blue uppercase tracking-widest active:opacity-50"
                >
                  {(editingPlaylistId ? (playlists.find(p => p.id === editingPlaylistId)?.trackIds.every(id => selectedTrackIds.has(id))) : (activePlaylistId ? (playlists.find(p => p.id === activePlaylistId)?.trackIds.every(id => selectedTrackIds.has(id))) : (tracks.every(t => selectedTrackIds.has(t.id))))) ? 'Deselect All' : 'Select All'}
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
                  if (selectedTrackIds.size > 0) {
                    setBulkActionType('add');
                    setShowBulkAddMenu(!showBulkAddMenu);
                  } else showToast("Select tracks first");
                }}
                disabled={selectedTrackIds.size === 0}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-lg ${selectedTrackIds.size > 0 ? 'bg-apple-blue text-white shadow-apple-blue/20' : 'bg-white/5 text-white/20'}`}
              >
                <ListPlus size={16} />
                <span>{(editingPlaylistId || activePlaylistId) ? 'Copy' : 'Add'}</span>
              </button>
              
              {(editingPlaylistId || activePlaylistId) && (
                <button 
                  onClick={() => {
                    if (selectedTrackIds.size > 0) {
                      setBulkActionType('move');
                      setShowBulkAddMenu(!showBulkAddMenu);
                    }
                  }}
                  disabled={selectedTrackIds.size === 0}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold bg-purple-600 text-white transition-all active:scale-95 shadow-lg shadow-purple-600/20`}
                >
                  <Share size={16} />
                  <span>Move</span>
                </button>
              )}

              {(editingPlaylistId || activePlaylistId) && (
                <button 
                  onClick={handleBulkRemoveFromPlaylist}
                  disabled={selectedTrackIds.size === 0}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-red-500 text-white transition-all active:scale-95 shadow-lg shadow-red-500/20"
                  title="Remove from Playlist"
                >
                  <Trash2 size={20} />
                </button>
              )}

              {!(editingPlaylistId || activePlaylistId) && (
                <button 
                  onClick={handleBulkCreatePlaylist}
                  disabled={selectedTrackIds.size === 0}
                  className={`flex items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${selectedTrackIds.size > 0 ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/20'}`}
                  title="Create New Playlist"
                >
                  <FolderPlus size={20} />
                </button>
              )}
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

const PlaylistView = ({ playlists, onCreate, onDelete, tracks, onTrackPlay, isSelectMode, editingPlaylistId, selectedTrackIds, onToggleSelection, onEnterSelect, onOpen }: any) => (
  <div className="flex flex-col gap-6">
    <button 
      onClick={onCreate}
      className={`w-full p-6 bg-apple-card border border-dashed border-apple-blue/30 rounded-[2rem] flex flex-col items-center gap-2 text-apple-blue hover:bg-apple-blue/5 transition-colors ${isSelectMode ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="w-12 h-12 rounded-full bg-apple-blue/10 flex items-center justify-center">
        <Plus size={24} />
      </div>
      <span className="font-bold text-sm">Create New Playlist</span>
    </button>

    <div className="grid grid-cols-1 gap-4">
      {playlists.map((playlist: any) => {
        const isEditingThis = isSelectMode && editingPlaylistId === playlist.id;
        
        return (
          <div key={playlist.id} className={`bg-apple-card rounded-[2.5rem] p-6 border transition-all duration-500 ${isEditingThis ? 'border-apple-blue shadow-xl shadow-apple-blue/5 scale-[1.02]' : 'border-black/5 shadow-sm opacity-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <button 
                onClick={() => !isSelectMode && onOpen(playlist.id)}
                className="flex-1 min-w-0 text-left cursor-pointer group"
              >
                <h3 className="text-xl font-bold tracking-tight truncate group-hover:text-apple-blue transition-colors">{playlist.name}</h3>
                <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-widest">{playlist.trackIds.length} tracks</p>
              </button>
              <div className="flex gap-2">
                {playlist.trackIds.length > 0 && (
                  <button 
                    onClick={() => onEnterSelect(playlist.id)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${isEditingThis ? 'bg-apple-blue text-white' : 'text-apple-blue bg-apple-blue/5 hover:bg-apple-blue/10'}`}
                  >
                    {isEditingThis ? 'Editing' : 'Select'}
                  </button>
                )}
                {!isSelectMode && (
                  <button onClick={() => onDelete(playlist.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {playlist.trackIds.slice(0, 3).map((tid: string) => {
                const track = tracks.find((t: any) => t.id === tid);
                if (!track) return null;
                const isSelected = selectedTrackIds.has(tid) && editingPlaylistId === playlist.id;

                return (
                  <button 
                    key={tid}
                    onClick={() => {
                      if (isSelectMode) onToggleSelection(tid, playlist.id);
                      else onTrackPlay(tid);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-2xl text-left transition-all group relative ${isSelected ? 'bg-apple-blue/5' : 'hover:bg-apple-bg'}`}
                  >
                    {isSelectMode && editingPlaylistId === playlist.id && (
                      <div className={`flex-shrink-0 transition-transform ${isSelected ? 'scale-110' : 'scale-100'}`}>
                        {isSelected ? (
                          <CheckCircle2 size={18} className="text-apple-blue" fill="currentColor" stroke="white" />
                        ) : (
                          <Circle size={18} className="text-gray-300" />
                        )}
                      </div>
                    )}
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-300" size={12} />}
                    </div>
                    <span className={`text-xs font-semibold truncate flex-1 ${isSelected ? 'text-apple-blue font-bold' : 'text-apple-text-primary'}`}>{track.name}</span>
                    {!isSelectMode && (
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-apple-blue uppercase tracking-widest transition-opacity">Play</span>
                    )}
                  </button>
                );
              })}
              {playlist.trackIds.length > 3 && (
                <button 
                  onClick={() => onOpen(playlist.id)}
                  className="text-[10px] font-bold text-apple-text-secondary uppercase tracking-widest text-center py-2 hover:text-apple-blue transition-colors"
                >
                   + {playlist.trackIds.length - 3} more tracks
                </button>
              )}
              {playlist.trackIds.length === 0 && (
                <p className="text-[10px] text-apple-text-secondary italic text-center py-4 bg-apple-bg rounded-2xl border border-dashed border-gray-100">No tracks in this playlist yet</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const PlaylistDetailView = ({ 
  playlist, 
  tracks, 
  onBack, 
  onTrackPlay, 
  onRename, 
  onDelete, 
  isSelectMode, 
  onEnterSelect,
  selectedTrackIds,
  onToggleSelection,
  sort,
  onSort,
  showSettings,
  onToggleSettings,
  playlists
}: any) => {
  
  const sortedTracks = useMemo(() => {
    let list = playlist.trackIds.map((tid: string) => tracks.find((t: any) => t.id === tid)).filter(Boolean);
    
    if (sort === 'alphabetical') {
      list.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else if (sort === 'date') {
      list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sort === 'recent') {
      // Assuming recently added means last in array if we don't have per-item timestamps
      // But if we want recently added to playlist, we just reverse the trackIds order
      list = [...list].reverse();
    }
    
    return list;
  }, [playlist.trackIds, tracks, sort]);

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-32">
      <header className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-2 bg-white rounded-full border border-black/5 shadow-sm text-apple-text-primary active:scale-90 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight truncate">{playlist.name}</h2>
          <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-widest">{playlist.trackIds.length} tracks</p>
        </div>
        <div className="flex gap-2">
          {!isSelectMode && playlist.trackIds.length > 0 && (
             <button 
                onClick={onEnterSelect}
                className="text-[10px] font-bold text-apple-blue uppercase tracking-widest px-3 py-1.5 bg-apple-blue/5 rounded-full"
              >
                Select
              </button>
          )}
          <button 
             onClick={onToggleSettings}
             className={`p-2 rounded-full border transition-all ${showSettings ? 'bg-apple-text-primary text-white border-apple-text-primary' : 'bg-white text-apple-text-secondary border-black/5 shadow-sm'}`}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-apple-card border border-black/5 rounded-[2.5rem] p-6 flex flex-col gap-6 shadow-sm mx-2">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary">Playlist Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      const name = prompt("Rename playlist:", playlist.name);
                      if (name && name !== playlist.name) onRename(playlist.id, name);
                    }}
                    className="flex items-center justify-center gap-2 p-3 bg-white border border-black/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50"
                  >
                    <Edit2 size={14} />
                    <span>Rename</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Delete "${playlist.name}"?`)) onDelete(playlist.id);
                    }}
                    className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-secondary">Sort Tracks</span>
                <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                  {[
                    { id: 'none', label: 'Default' },
                    { id: 'recent', label: 'Recent' },
                    { id: 'alphabetical', label: 'A-Z' },
                    { id: 'date', label: 'Oldest' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => onSort(s.id as any)}
                      className={`flex-1 whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${sort === s.id ? 'bg-white shadow-sm text-apple-blue' : 'text-apple-text-secondary'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        {sortedTracks.map(track => {
          const isSelected = selectedTrackIds.has(track.id);
          return (
            <div key={track.id} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${isSelected ? 'bg-apple-blue/5' : 'hover:bg-apple-card/60'}`}>
              {isSelectMode && (
                <button 
                  onClick={() => onToggleSelection(track.id)}
                  className={`flex-shrink-0 transition-transform ${isSelected ? 'scale-110' : 'scale-100'}`}
                >
                  {isSelected ? (
                    <CheckCircle2 size={24} className="text-apple-blue" fill="currentColor" stroke="white" />
                  ) : (
                    <Circle size={24} className="text-gray-200" />
                  )}
                </button>
              )}
              <button 
                onClick={() => !isSelectMode && onTrackPlay(track.id)}
                className="flex-1 flex items-center gap-4 text-left min-w-0"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                   {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-300" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold truncate text-sm ${isSelected ? 'text-apple-blue' : 'text-apple-text-primary'}`}>{track.name}</h4>
                  <p className="text-[10px] text-apple-text-secondary uppercase font-bold tracking-wider">{track.artist}</p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
