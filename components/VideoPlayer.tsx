
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ContentItem, StreamingSource } from '../types';
import { getStreamingSources } from '../services/movieService';
import { CloseIcon, BackIcon, RefreshIcon, SettingsIcon } from './IconComponents';

interface VideoPlayerProps {
  content: ContentItem;
  seasonNumber?: number;
  episodeNumber?: number;
  onClose: () => void;
  initialMode?: 'trailer' | 'sources';
}

type PlayerMode = 'trailer' | 'sources';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ content, seasonNumber = 1, episodeNumber = 1, onClose, initialMode = 'sources' }) => {
  const [sources, setSources] = useState<StreamingSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const controlsTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trailer = useMemo(() => {
    return content.videos?.results.find(
      (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
    );
  }, [content.videos]);

  const resolvedInitialMode = useMemo(() => {
    if (initialMode === 'trailer' && trailer) {
      return 'trailer';
    }
    return 'sources';
  }, [initialMode, trailer]);
  
  const [playerMode, setPlayerMode] = useState<PlayerMode>(resolvedInitialMode);

  useEffect(() => {
    const movieSources = getStreamingSources(content.id, content.media_type, seasonNumber, episodeNumber);
    setSources(movieSources);
    setCurrentSourceIndex(0);
    setPlayerMode(resolvedInitialMode);
  }, [content.id, content.media_type, seasonNumber, episodeNumber, resolvedInitialMode]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isServerMenuOpen) {
          setShowControls(false);
      }
    }, 3000);
  }, [isServerMenuOpen]);

  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    window.addEventListener('mousemove', handleMouseMove);
    resetControlsTimeout(); 

    // Cleanup function to remove event listener and prevent memory leaks
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  const handleSwitchSource = (index: number) => {
    setCurrentSourceIndex(index);
    setIframeKey(prev => prev + 1);
    setIsServerMenuOpen(false);
  };
  
  const handleReload = () => {
      setIframeKey(prev => prev + 1);
  };

  const currentSource = sources[currentSourceIndex];
  
  const playerTitle = content.media_type === 'tv' 
    ? `${content.title} - S${seasonNumber} E${episodeNumber}`
    : content.title;

  const renderPlayer = () => {
    if (playerMode === 'trailer' && trailer) {
      return (
        <iframe
          key={`trailer-${iframeKey}`}
          src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}`}
          allowFullScreen
          allow="autoplay; encrypted-media"
          className="w-full h-full border-0"
          title="Movie Trailer"
        ></iframe>
      );
    }
    
    if (playerMode === 'sources' && currentSource) {
      return (
        <iframe
          key={`source-${currentSourceIndex}-${iframeKey}`}
          src={currentSource.url}
          allowFullScreen
          referrerPolicy="origin"
          scrolling="no"
          frameBorder="0"
          className="w-full h-full border-0 bg-black"
          title="Movie Player"
        ></iframe>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-white text-lg animate-pulse font-medium">
          {playerMode === 'trailer' ? 'No trailer available.' : 'Loading stream...'}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] overflow-hidden w-full h-full flex flex-col" ref={containerRef}>
      
      <div 
        className={`absolute top-0 left-0 right-0 p-4 z-50 flex items-start justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} pointer-events-none`}
      >
          <div className="flex items-center gap-3 pointer-events-auto">
              <button 
                onClick={onClose} 
                className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-all backdrop-blur-sm"
              >
                  <BackIcon className="w-6 h-6" />
              </button>
              <div className="bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <h1 className="text-sm md:text-base font-bold text-white shadow-black drop-shadow-md">{playerTitle}</h1>
              </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
               <button 
                    onClick={handleReload}
                    className="p-2 bg-black/50 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
                    title="Reload Stream"
               >
                   <RefreshIcon className="w-5 h-5" />
               </button>

               <div className="relative">
                   <button 
                        onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
                        className={`p-2 bg-black/50 rounded-full transition-all backdrop-blur-sm ${isServerMenuOpen ? 'bg-red-600 text-white' : 'text-white/90 hover:bg-white/20'}`}
                        title="Change Server"
                   >
                       <SettingsIcon className="w-5 h-5" />
                   </button>

                   {isServerMenuOpen && (
                       <div className="absolute top-full right-0 mt-2 w-56 bg-black/90 border border-white/10 rounded-xl backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in-up origin-top-right">
                           <div className="p-3 border-b border-white/10 bg-white/5">
                               <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Select Source</span>
                           </div>
                           <div className="max-h-60 overflow-y-auto scrollbar-thin py-1">
                               {sources.map((source, idx) => (
                                   <button
                                        key={idx}
                                        onClick={() => handleSwitchSource(idx)}
                                        className={`w-full text-left px-4 py-3 text-xs md:text-sm font-medium transition-colors flex items-center justify-between ${currentSourceIndex === idx ? 'bg-white/10 text-red-500' : 'text-white/80 hover:bg-white/10'}`}
                                   >
                                       <span>{source.name.split(':')[0]}</span>
                                       {currentSourceIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-red-600"/>}
                                   </button>
                               ))}
                           </div>
                       </div>
                   )}
               </div>
          </div>
      </div>

      <div className="flex-grow w-full h-full relative bg-black">
         {renderPlayer()}
      </div>

    </div>
  );
};

export default VideoPlayer;