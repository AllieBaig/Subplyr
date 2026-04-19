import React from 'react';
import { useAudio } from '../AudioContext';
import { Upload, Plus, Trash2, Share } from 'lucide-react';

export default function LibraryView() {
  const { tracks, addTrack, removeTrack, setCurrentTrackIndex, setIsPlaying, currentTrackIndex, showToast } = useAudio();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      for (const file of filesArray) {
        await addTrack(file);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-apple-text-secondary">Your offline collection</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => showToast("Tip: Share any audio file from 'Files' app to this app directly!")}
            className="bg-apple-card shadow-sm border border-black/5 p-3 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors text-apple-blue"
            title="How to Import via Share Sheet"
          >
            <Share size={20} />
          </button>
          <label className="bg-apple-card shadow-sm border border-black/5 p-3 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
            <Plus size={20} />
            <input type="file" multiple accept="audio/*, .mp3, .m4a, .aac, .wav, audio/mp4, audio/x-m4a" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      {tracks.length === 0 ? (
        <div className="bg-apple-card rounded-[2.5rem] p-12 border border-black/5 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 bg-apple-bg rounded-full flex items-center justify-center text-apple-text-secondary">
             <Upload size={32} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No music yet</h3>
            <p className="text-sm text-apple-text-secondary px-6">Upload your favorite tracks (MP3, M4A, WAV, AAC) to listen offline.</p>
          </div>
          <label className="mt-2 text-apple-blue font-medium cursor-pointer">
            Select files
            <input type="file" multiple accept="audio/*, .mp3, .m4a, .aac, .wav, audio/mp4, audio/x-m4a" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((track, index) => (
            <div 
              key={track.id}
              className={`group flex items-center gap-4 p-4 rounded-3xl transition-all duration-200 ${
                currentTrackIndex === index 
                ? 'bg-apple-blue/5 border-apple-blue/10' 
                : 'hover:bg-apple-card/60'
              }`}
            >
              <button 
                onClick={() => {
                  setCurrentTrackIndex(index);
                  setIsPlaying(true);
                }}
                className="flex-1 flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
                   {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <Music className="text-gray-400" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate ${currentTrackIndex === index ? 'text-apple-blue' : ''}`}>
                    {track.name}
                  </h4>
                  <p className="text-xs text-apple-text-secondary truncate">{track.artist}</p>
                </div>
              </button>
              <button 
                onClick={() => removeTrack(track.id)}
                className="p-2 text-apple-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
