import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useAudio } from '../AudioContext';
import { 
  Upload, Plus, Trash2, Share, SortAsc, 
  LayoutGrid, List, Calendar, CheckCircle2, 
  Circle, X, FolderPlus, ListPlus, Zap,
  AlertCircle, Link, ArrowLeft, MoreVertical, Edit2,
  Play, Pause, Search
} from 'lucide-react';
import { Track, SortOption, GroupOption } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AUDIO_ACCEPT_STRING, SUPPORTED_AUDIO_FORMATS } from '../constants';

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
    renamePlaylist,
    playingPlaylistId,
    setPlayingPlaylistId,
    resumePlaylist,
    isPlaying
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
  const [searchQuery, setSearchQuery] = useState('');

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
    let sorted = [...tracks];
    const { sort } = settings.library;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      sorted = sorted.filter(t => 
        t.name.toLowerCase().includes(q) || 
        (t.artist && t.artist.toLowerCase().includes(q))
      );
    }

    if (sort === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'date' || sort === 'recent') {
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return sorted;
  }, [tracks, settings.library.sort, searchQuery]);

  const groupedTracks = useMemo(() => {
    const { group } = settings.library;
    if (group === 'none') return [{ label: '', items: sortedTracks }];

    const groups: { [key: string]: Track[] } = {};
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    sortedTracks.forEach(track => {
      let label = 'Older';

      if (group === 'alphabetical') {
        const firstChar = track.name[0]?.toUpperCase() || '#';
        if (/[A-Z]/.test(firstChar)) label = firstChar;
        else label = '#';
      } else {
        const diff = now - (track.createdAt || 0);
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
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(track);
    });

    // If grouping by alphabetical, sort labels A-Z, then #
    const entries = Object.entries(groups);
    if (group === 'alphabetical') {
      entries.sort(([a], [b]) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      });
    }

    return entries.map(([label, items]) => ({ label, items }));
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

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery) return playlists;
    const q = searchQuery.toLowerCase();
    return playlists.filter(p => p.name.toLowerCase().includes(q));
  }, [playlists, searchQuery]);

  return (
    <div className={`flex flex-col relative w-full max-w-7xl mx-auto px-4`}>
      <header className={`flex flex-col bg-apple-bg py-6 gap-6`}>
        <div className="flex justify-between items-end px-1">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black">Library</h1>
            <div className={`flex gap-6 mt-3`}>
              <button 
                onClick={() => { setView('tracks'); setIsSelectMode(false); setSelectedTrackIds(new Set()); setEditingPlaylistId(null); setActivePlaylistId(null); }}
                className={`text-sm font-bold transition-colors ${view === 'tracks' ? 'text-apple-blue' : 'text-gray-400 hover:text-black'}`}
              >
                Tracks
              </button>
              <button 
                onClick={() => { setView('playlists'); setIsSelectMode(false); setSelectedTrackIds(new Set()); setEditingPlaylistId(null); setActivePlaylistId(null); }}
                className={`text-sm font-bold transition-colors ${view === 'playlists' || view === 'playlist_detail' ? 'text-apple-blue' : 'text-gray-400 hover:text-black'}`}
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
                className={`text-xs font-bold tracking-tight px-4 py-2 rounded-full transition-all ${isSelectMode ? 'bg-apple-blue text-white' : 'text-apple-blue bg-apple-blue/5 hover:bg-apple-blue/10'}`}
              >
                {isSelectMode ? 'Cancel' : 'Select'}
              </button>
            )}
            {!isSelectMode && (
              <div className="flex flex-col items-end">
                <label className={`w-10 h-10 flex items-center justify-center bg-gray-50 border border-black/[0.02] cursor-pointer hover:bg-gray-100 transition-colors rounded-full active:scale-95`}>
                  <Plus size={20} />
                  <input type="file" multiple accept={AUDIO_ACCEPT_STRING} className="hidden" onChange={handleFileUpload} />
                </label>
                <div className="hidden md:block mt-1 mr-1">
                   <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{SUPPORTED_AUDIO_FORMATS.join(' • ')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar - Minimal */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search size={16} />
          </div>
          <input 
            type="text"
            placeholder={`Search ${view === 'tracks' ? 'tracks' : 'playlists'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-gray-50/50 border border-transparent pl-11 pr-4 py-2.5 rounded-2xl text-[13px] font-medium outline-none focus:bg-gray-50 focus:ring-1 focus:ring-black/5 transition-all placeholder:text-gray-300"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200/50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </header>

      {showSortMenu && view === 'tracks' && !isSelectMode && (
        <div className={`bg-apple-card border border-black/5 flex flex-col shadow-sm animate-in fade-in slide-in-from-top-2 mx-6 ${settings.miniMode ? 'rounded-2xl p-3 gap-3' : 'rounded-3xl p-4 gap-4'}`}>
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
              {(['none', 'alphabetical', 'day', 'week', 'month'] as GroupOption[]).map(g => (
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
              const p = playlists.find(p => p.id === activePlaylistId);
              if (p) {
                const idx = p.trackIds.findIndex(tid => tid === id);
                if (idx !== -1) {
                  setPlayingPlaylistId(activePlaylistId);
                  setCurrentTrackIndex(idx);
                  setIsPlaying(true);
                }
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
            settings={settings}
            resumePlaylist={resumePlaylist}
            playingPlaylistId={playingPlaylistId}
            currentTrackIndex={currentTrackIndex}
            isPlaying={isPlaying}
         />
      ) : view === 'tracks' ? (
        tracks.length === 0 ? (
          <EmptyState onFileUpload={handleFileUpload} />
        ) : sortedTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 px-12 text-center gap-4">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                <Search size={32} />
             </div>
             <p className="text-sm font-medium text-apple-text-secondary">No tracks found matching "{searchQuery}"</p>
             <button 
               onClick={() => setSearchQuery('')}
               className="text-xs font-bold text-apple-blue uppercase tracking-widest"
             >
               Clear Search
             </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 ${isSelectMode ? 'pb-32' : 'pb-8'} mt-4`}>
            {groupedTracks.map((group, gIdx) => (
              <div key={gIdx} className="flex flex-col gap-2 relative">
                {group.label && (
                  <button 
                    onClick={() => toggleSelectAll(group.items.map(t => t.id))}
                    className="flex items-center justify-between py-2 -mx-2 px-2 hover:bg-gray-50 transition-colors rounded-xl group/header"
                  >
                    <h3 className="text-[11px] font-bold uppercase tracking-[.25em] text-apple-text-secondary group-hover/header:text-apple-blue transition-colors">
                      {group.label}
                    </h3>
                    <div className="flex items-center gap-3">
                      {isSelectMode && (
                        <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest bg-apple-blue/5 px-2 py-0.5 rounded-full">
                          {group.items.filter(t => selectedTrackIds.has(t.id)).length}/{group.items.length}
                        </span>
                      )}
                      <span className="opacity-0 group-hover/header:opacity-100 text-[9px] font-bold text-apple-blue uppercase tracking-widest transition-opacity">
                        {group.items.every(t => selectedTrackIds.has(t.id)) ? 'Deselect group' : 'Select group'}
                      </span>
                    </div>
                  </button>
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
                          setPlayingPlaylistId(null);
                          setCurrentTrackIndex(trueIndex);
                          setIsPlaying(true);
                        }
                      }}
                      onRemove={() => removeTrack(track.id)}
                      playlists={playlists}
                      onAddToPlaylist={(pid) => addTrackToPlaylist(track.id, pid)}
                      searchQuery={searchQuery}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )
      ) : (
        <PlaylistView 
          playlists={filteredPlaylists} 
          onCreate={() => {
            const name = prompt("Playlist name:");
            if (name) createPlaylist(name);
          }}
          onDelete={deletePlaylist}
          tracks={tracks}
          onTrackPlay={(id) => {
            const idx = tracks.findIndex(t => t.id === id);
            if (idx !== -1) {
              setPlayingPlaylistId(null);
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
          searchQuery={searchQuery}
        />
      )}

      {/* Bulk Action Bar - Minimal & Fluid */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-28 left-4 right-4 z-[100] flex flex-col gap-4 px-6 py-6 bg-black/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{selectedTrackIds.size} Selected</span>
              <div className="flex gap-5">
                <button 
                  onClick={() => {
                    let allIds: string[] = [];
                    const list = editingPlaylistId ? (playlists.find(p => p.id === editingPlaylistId)?.trackIds || []) : (activePlaylistId ? (playlists.find(p => p.id === activePlaylistId)?.trackIds || []) : tracks.map(t => t.id));
                    const allSelected = list.length > 0 && list.every(id => selectedTrackIds.has(id));
                    if (allSelected) {
                      const next = new Set(selectedTrackIds);
                      list.forEach(id => next.delete(id));
                      setSelectedTrackIds(next);
                    } else {
                      setSelectedTrackIds(new Set([...Array.from(selectedTrackIds), ...list]));
                    }
                  }}
                  className="text-[10px] font-bold text-apple-blue uppercase tracking-[0.1em]"
                >
                  {((editingPlaylistId ? (playlists.find(p => p.id === editingPlaylistId)?.trackIds) : (activePlaylistId ? (playlists.find(p => p.id === activePlaylistId)?.trackIds) : tracks.map(t => t.id)))?.every(id => selectedTrackIds.has(id))) ? 'Deselect All' : 'Select All'}
                </button>
                <button 
                  onClick={() => { setIsSelectMode(false); setSelectedTrackIds(new Set()); }}
                  className="text-[10px] font-bold text-white/60 uppercase tracking-[0.1em]"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => { if (selectedTrackIds.size > 0) { setBulkActionType('add'); setShowBulkAddMenu(!showBulkAddMenu); } }}
                disabled={selectedTrackIds.size === 0}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-20"
              >
                <ListPlus size={20} />
                <span className="text-[9px] font-bold uppercase tracking-tight">{(editingPlaylistId || activePlaylistId) ? 'Copy' : 'Add'}</span>
              </button>
              
              {(editingPlaylistId || activePlaylistId) && (
                <button 
                  onClick={() => { if (selectedTrackIds.size > 0) { setBulkActionType('move'); setShowBulkAddMenu(!showBulkAddMenu); } }}
                  disabled={selectedTrackIds.size === 0}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Share size={20} />
                  <span className="text-[9px] font-bold uppercase tracking-tight">Move</span>
                </button>
              )}

              {(editingPlaylistId || activePlaylistId) ? (
                <button 
                  onClick={handleBulkRemoveFromPlaylist}
                  disabled={selectedTrackIds.size === 0}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 size={20} />
                  <span className="text-[9px] font-bold uppercase tracking-tight">Remove</span>
                </button>
              ) : (
                <button 
                  onClick={handleBulkCreatePlaylist}
                  disabled={selectedTrackIds.size === 0}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-20"
                >
                  <FolderPlus size={20} />
                  <span className="text-[9px] font-bold uppercase tracking-tight">New List</span>
                </button>
              )}

              <button 
                onClick={async () => {
                   if (confirm(`Delete ${selectedTrackIds.size} tracks from device?`)) {
                      for (const id of Array.from(selectedTrackIds)) await removeTrack(id);
                      setIsSelectMode(false);
                      setSelectedTrackIds(new Set());
                   }
                }}
                disabled={selectedTrackIds.size === 0}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors text-red-400 disabled:opacity-20"
              >
                <Trash2 size={20} />
                <span className="text-[9px] font-bold uppercase tracking-tight">Delete</span>
              </button>
            </div>

            <AnimatePresence>
              {showBulkAddMenu && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-6 left-0 right-0 bg-white rounded-[2.5rem] p-6 text-black z-50 border border-black/5 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6 px-1">
                    <h3 className="font-bold text-lg tracking-tight">Select Playlist</h3>
                    <button onClick={() => setShowBulkAddMenu(false)} className="text-gray-400 p-2"><X size={20} /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto no-scrollbar">
                    {playlists.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => handleBulkAddToPlaylist(p.id)}
                        className="w-full text-left px-5 py-4 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-between font-bold text-sm transition-all active:scale-[0.98]"
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{p.trackIds.length} tracks</span>
                      </button>
                    ))}
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
  <div className="py-24 px-12 flex flex-col items-center justify-center text-center gap-6">
    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
       <Upload size={40} />
    </div>
    <div className="max-w-xs">
      <h3 className="font-bold text-xl text-black">Your Library is Empty</h3>
      <p className="text-sm text-gray-500 mt-2">Upload your favorite tracks to begin your mindful audio session.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {SUPPORTED_AUDIO_FORMATS.map(f => (
          <span key={f} className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{f}</span>
        ))}
      </div>
    </div>
    <label className="mt-4 px-8 py-3 bg-black text-white rounded-full text-xs font-bold tracking-tight active:scale-95 transition-transform cursor-pointer group shadow-lg shadow-black/10">
      Add High-Quality Audio
      <input type="file" multiple accept={AUDIO_ACCEPT_STRING} className="hidden" onChange={onFileUpload} />
    </label>
    <p className="mt-4 text-[10px] text-gray-400 font-medium">Compatible with iPhone Files & Dropbox</p>
  </div>
);

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="text-apple-blue font-bold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const TrackItem = React.memo(({ track, isActive, onPlay, onRemove, playlists, onAddToPlaylist, isSelectMode, isSelected, onSelect, searchQuery }: any) => {
  const [showActions, setShowActions] = useState(false);
  const { settings, updateSubliminalSettings, showToast, relinkTrack } = useAudio();

  const handleRelink = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await relinkTrack(track.id, e.target.files[0], false);
    }
  };

  return (
    <div className={`group flex flex-col transition-all duration-300 border-b border-black/[0.02] ${track.isMissing ? 'opacity-60' : ''} ${settings.bigTouchMode ? 'py-2' : ''}`}>
      <div className={`flex items-center gap-4 py-3 px-1 ${settings.bigTouchMode ? 'py-5 px-2' : 'py-3 px-1'}`}>
        {isSelectMode && (
          <button 
            onClick={onSelect}
            disabled={track.isMissing}
            className={`flex-shrink-0 transition-all duration-300 transform ${isSelected ? 'scale-110' : 'scale-100'} ${isSelected ? 'text-apple-blue' : 'text-gray-300'} ${track.isMissing ? 'grayscale opacity-50' : ''}`}
          >
            {isSelected ? (
              <div className="bg-apple-blue rounded-full p-0.5 shadow-sm shadow-apple-blue/30">
                <CheckCircle2 size={settings.bigTouchMode ? 28 : 24} className="text-white" fill="currentColor" stroke="none" />
              </div>
            ) : (
              <Circle size={settings.bigTouchMode ? 28 : 24} className="text-gray-200" />
            )}
          </button>
        )}
        <button 
          onClick={() => !track.isMissing && onPlay()} 
          className={`flex-1 flex items-center gap-4 text-left min-w-0 ${track.isMissing ? 'cursor-default' : ''} ${settings.bigTouchMode ? 'gap-6' : 'gap-4'}`}
        >
          <div className={`flex-shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden relative border border-black/[0.01] ${settings.bigTouchMode ? 'w-14 h-14' : 'w-11 h-11'}`}>
             {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-200" size={settings.bigTouchMode ? 22 : 18} />}
             {track.isMissing && (
               <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                 <AlertCircle size={settings.bigTouchMode ? 20 : 14} className="text-white" />
               </div>
             )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold truncate tracking-tight ${settings.bigTouchMode ? 'text-base' : 'text-[13px]'} ${isActive ? 'text-apple-blue font-bold' : 'text-black'}`}>
              <HighlightText text={track.name} highlight={searchQuery} />
            </h4>
            <p className={`text-gray-400 font-bold uppercase tracking-[0.1em] mt-0.5 ${settings.bigTouchMode ? 'text-[11px]' : 'text-[10px]'}`}>
              <HighlightText text={track.artist || 'Unknown Artist'} highlight={searchQuery} />
            </p>
          </div>
        </button>
        <div className={`flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isSelectMode ? 'hidden' : 'flex'}`}>
          {track.isMissing ? (
            <label className="p-2 text-gray-400 hover:text-apple-blue transition-colors cursor-pointer" title="Relink File">
              <Link size={settings.bigTouchMode ? 20 : 16} />
              <input type="file" accept={AUDIO_ACCEPT_STRING} className="hidden" onChange={handleRelink} />
            </label>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className={`p-2 rounded-full transition-colors ${showActions ? 'bg-apple-blue/10 text-apple-blue' : 'text-gray-300 hover:text-black hover:bg-gray-50'}`}
            >
              <Plus size={settings.bigTouchMode ? 20 : 16} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showActions && !isSelectMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-1 pb-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSubliminalSettings({ selectedTrackId: track.id, isEnabled: true });
                    showToast(`Layered: ${track.name}`);
                    setShowActions(false);
                  }}
                  className="flex items-center gap-3 w-full p-2.5 bg-apple-blue/5 text-apple-blue rounded-xl text-[11px] font-bold tracking-tight transition-all active:scale-[0.98]"
                >
                  <Zap size={14} fill="currentColor" />
                  <span>Use as Subliminal Layer</span>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1">Add to Playlist</p>
                {playlists.length === 0 ? (
                  <p className="text-[10px] text-gray-300 italic px-1">Create a playlist to organize tracks</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {playlists.map((p: any) => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          onAddToPlaylist(p.id);
                          setShowActions(false);
                        }}
                        className="px-3 py-1.5 bg-gray-50 text-gray-500 hover:text-black rounded-lg text-[10px] font-bold transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove Track
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const PlaylistView = ({ playlists, onCreate, onDelete, tracks, onTrackPlay, isSelectMode, editingPlaylistId, selectedTrackIds, onToggleSelection, onEnterSelect, onOpen, searchQuery }: any) => {
  const { settings } = useAudio();
  return (
    <div className={`flex flex-col gap-8 w-full max-w-7xl mx-auto ${settings.bigTouchMode ? 'gap-12' : 'gap-8'}`}>
      <button 
        onClick={onCreate}
        className={`w-full bg-apple-card border border-apple-blue/30 rounded-[2.5rem] flex flex-col items-center gap-3 text-apple-blue hover:bg-apple-blue/5 transition-all active:scale-[0.99] border-dashed ${isSelectMode ? 'opacity-50 pointer-events-none' : ''} ${settings.bigTouchMode ? 'p-12 mb-4' : 'p-8'}`}
      >
        <div className={`rounded-full bg-apple-blue/10 flex items-center justify-center ${settings.bigTouchMode ? 'w-20 h-20' : 'w-14 h-14'}`}>
          <Plus size={settings.bigTouchMode ? 36 : 28} />
        </div>
        <span className={`font-bold tracking-tight ${settings.bigTouchMode ? 'text-lg' : 'text-base'}`}>Create New Playlist</span>
      </button>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${settings.bigTouchMode ? 'gap-12' : 'gap-8'}`}>
        {playlists.map((playlist: any) => {
          const isEditingThis = isSelectMode && editingPlaylistId === playlist.id;
          
          return (
            <div key={playlist.id} className={`flex flex-col gap-4 border-b border-black/[0.03] pb-8 transition-opacity ${isSelectMode && !isEditingThis ? 'opacity-40' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <button 
                  onClick={() => !isSelectMode && onOpen(playlist.id)}
                  className="flex-1 min-w-0 text-left group"
                >
                  <h3 className={`font-extrabold tracking-tight truncate group-hover:text-apple-blue transition-colors ${settings.bigTouchMode ? 'text-2xl' : 'text-xl'}`}>
                    <HighlightText text={playlist.name} highlight={searchQuery} />
                  </h3>
                  <p className={`text-gray-400 uppercase font-bold tracking-[0.15em] mt-1 ${settings.bigTouchMode ? 'text-[11px]' : 'text-[10px]'}`}>{playlist.trackIds.length} tracks</p>
                </button>
                <div className="flex gap-4">
                  {playlist.trackIds.length > 0 && (
                    <button 
                      onClick={() => onEnterSelect(playlist.id)}
                      className={`font-bold uppercase tracking-widest rounded-full transition-all ${isEditingThis ? 'bg-apple-blue text-white' : 'text-apple-blue bg-apple-blue/5 hover:bg-apple-blue/10'} ${settings.bigTouchMode ? 'text-xs px-5 py-2.5' : 'text-[10px] px-3 py-1.5'}`}
                    >
                      {isEditingThis ? 'Editing' : 'Select'}
                    </button>
                  )}
                  {!isSelectMode && (
                    <button onClick={() => onDelete(playlist.id)} className={`text-gray-200 hover:text-red-500 transition-colors ${settings.bigTouchMode ? 'p-3' : 'p-2'}`}>
                      <Trash2 size={settings.bigTouchMode ? 20 : 16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
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
                      className={`flex items-center gap-4 rounded-xl text-left transition-all group relative ${isSelected ? 'bg-apple-blue/5' : 'hover:bg-gray-50'} ${settings.bigTouchMode ? 'p-4' : 'p-2'}`}
                    >
                      {isSelectMode && editingPlaylistId === playlist.id && (
                        <div className={`flex-shrink-0 transition-transform ${isSelected ? 'scale-110' : 'scale-100'}`}>
                          {isSelected ? (
                            <CheckCircle2 size={settings.bigTouchMode ? 22 : 18} className="text-apple-blue" fill="currentColor" stroke="white" />
                          ) : (
                            <Circle size={settings.bigTouchMode ? 22 : 18} className="text-gray-300" />
                          )}
                        </div>
                      )}
                      <div className={`flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 ${settings.bigTouchMode ? 'w-10 h-10' : 'w-8 h-8'}`}>
                        {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-200" size={settings.bigTouchMode ? 16 : 12} />}
                      </div>
                      <span className={`font-semibold truncate flex-1 ${isSelected ? 'text-apple-blue font-bold' : 'text-black'} ${settings.bigTouchMode ? 'text-sm' : 'text-[13px]'}`}>{track.name}</span>
                    </button>
                  );
                })}
                {playlist.trackIds.length > 3 && (
                  <button 
                    onClick={() => onOpen(playlist.id)}
                    className={`font-bold text-apple-text-secondary uppercase tracking-widest text-center hover:text-apple-blue transition-colors ${settings.bigTouchMode ? 'text-xs py-4' : 'text-[10px] py-2'}`}
                  >
                     + {playlist.trackIds.length - 3} more tracks
                  </button>
                )}
                {playlist.trackIds.length === 0 && (
                  <p className={`text-apple-text-secondary italic text-center bg-apple-bg rounded-2xl border border-dashed border-gray-100 ${settings.bigTouchMode ? 'text-xs py-8' : 'text-[10px] py-4'}`}>No tracks in this playlist yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  playlists,
  settings,
  resumePlaylist,
  playingPlaylistId,
  currentTrackIndex,
  isPlaying
}: any) => {
  const activeTrackRef = React.useRef<HTMLDivElement>(null);
  const memory = settings?.playlistMemory?.[playlist.id];

  const sortedTracks = useMemo(() => {
    let list = playlist.trackIds.map((tid: string) => tracks.find((t: any) => t.id === tid)).filter(Boolean);
    
    if (sort === 'alphabetical') {
      list.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else if (sort === 'date') {
      list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sort === 'recent') {
      list = [...list].reverse();
    }
    
    return list;
  }, [playlist.trackIds, tracks, sort]);

  // Autoscroll to active track
  useEffect(() => {
    if (activeTrackRef.current && playingPlaylistId === playlist.id) {
       activeTrackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTrackIndex, playingPlaylistId, playlist.id]);

  return (
    <div className={`flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-32 ${settings.bigTouchMode ? 'p-10 gap-8' : 'p-6 gap-6'}`}>
      <header className={`flex items-center gap-4 px-2 ${settings.bigTouchMode ? 'mb-4' : ''}`}>
        <button 
          onClick={onBack} 
          className={`bg-white rounded-full border border-black/5 shadow-sm text-apple-text-primary active:scale-90 transition-transform flex items-center justify-center ${settings.bigTouchMode ? 'w-12 h-12' : 'p-2'}`}
        >
          <ArrowLeft size={settings.bigTouchMode ? 24 : 20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className={`font-extrabold tracking-tight truncate ${settings.bigTouchMode ? 'text-2xl' : 'text-xl'}`}>{playlist.name}</h2>
          <p className={`text-apple-text-secondary uppercase font-bold tracking-widest ${settings.bigTouchMode ? 'text-[11px]' : 'text-[10px]'}`}>{playlist.trackIds.length} tracks</p>
        </div>
        <div className="flex gap-2">
          {!isSelectMode && memory && (
             <button 
                onClick={() => resumePlaylist(playlist.id)}
                className={`flex items-center gap-2 font-bold text-white uppercase tracking-widest bg-apple-blue rounded-full shadow-lg shadow-apple-blue/20 active:scale-95 transition-all ${settings.bigTouchMode ? 'text-[11px] px-6 py-2.5' : 'text-[10px] px-4 py-1.5'}`}
              >
                <Zap size={settings.bigTouchMode ? 14 : 12} fill="currentColor" />
                Resume
              </button>
          )}
          {!isSelectMode && playlist.trackIds.length > 0 && (
             <button 
                onClick={onEnterSelect}
                className={`font-bold text-apple-blue uppercase tracking-widest bg-apple-blue/5 rounded-full ${settings.bigTouchMode ? 'text-[11px] px-5 py-2.5' : 'text-[10px] px-3 py-1.5'}`}
              >
                Select
              </button>
          )}
          <button 
             onClick={onToggleSettings}
             className={`rounded-full border transition-all flex items-center justify-center ${showSettings ? 'bg-apple-text-primary text-white border-apple-text-primary' : 'bg-white text-apple-text-secondary border-black/5 shadow-sm'} ${settings.bigTouchMode ? 'w-12 h-12' : 'p-2'}`}
          >
            <MoreVertical size={settings.bigTouchMode ? 24 : 20} />
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
        {sortedTracks.map((track, sIdx) => {
          const isSelected = selectedTrackIds.has(track.id);
          const isLastPlayed = memory?.trackId === track.id;
          
          // Determine if this specific track is the one playing in THIS playlist
          const isActuallyPlaying = playingPlaylistId === playlist.id && 
                                   currentTrackIndex !== null && 
                                   playlist.trackIds[currentTrackIndex] === track.id;

          return (
            <div 
              key={track.id} 
              ref={isActuallyPlaying ? activeTrackRef : null}
              className={`flex items-center gap-4 p-3 rounded-[1.5rem] transition-all relative ${isSelected ? 'bg-apple-blue shadow-lg scale-[1.02] text-white' : isActuallyPlaying ? 'bg-apple-blue/10 ring-2 ring-apple-blue shadow-sm' : isLastPlayed && !isSelectMode ? 'bg-apple-blue/[0.03] ring-1 ring-apple-blue/10' : 'hover:bg-apple-card/60'}`}
            >
               {isActuallyPlaying && isPlaying && (
                 <div className="absolute top-2 right-4">
                    <div className="flex items-end gap-[2px] h-3">
                       {[0.6, 1, 0.4, 0.8].map((h, i) => (
                         <motion.div 
                           key={i}
                           animate={{ height: ['40%', '100%', '40%'] }} 
                           transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                           className="w-[2px] bg-apple-blue rounded-full"
                         />
                       ))}
                    </div>
                 </div>
               )}
               {!isActuallyPlaying && isLastPlayed && !isSelectMode && (
                 <div className="absolute top-1 right-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
                 </div>
               )}
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
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                   {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-300" size={20} />}
                   {isActuallyPlaying && (
                     <div className="absolute inset-0 bg-apple-blue/20 flex items-center justify-center">
                        {isPlaying ? <Pause size={20} className="text-apple-blue" fill="currentColor" /> : <Play size={20} className="text-apple-blue" fill="currentColor" />}
                     </div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold truncate text-sm ${isSelected ? 'text-white' : isActuallyPlaying ? 'text-apple-blue font-extrabold' : 'text-apple-text-primary'}`}>{track.name}</h4>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-white/70' : 'text-apple-text-secondary'}`}>{track.artist}</p>
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
