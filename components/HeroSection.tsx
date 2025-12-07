
import React, { useState, useEffect, useMemo } from 'react';
import { ContentItem, Genre } from '../types';
import { PlayIcon, InfoIcon, StarIcon } from './IconComponents';
import { adManager } from '../services/adManager';

interface HeroSectionProps {
  items: ContentItem[];
  genres?: Genre[];
  onSmartPlay: (content: ContentItem) => void;
  onShowDetails: (content: ContentItem) => void;
  onPlayTrailer: (content: ContentItem) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ items, genres = [], onSmartPlay, onShowDetails, onPlayTrailer }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reverted to 5 seconds (5000ms) for a better balance
  const SLIDE_DURATION = 5000; 

  useEffect(() => {
    const autoplayEnabled = JSON.parse(localStorage.getItem('cineStreamAutoplay') || 'true');
    
    if (!items || items.length <= 1 || isPaused || !autoplayEnabled) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [items, isPaused, currentIndex]); 
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleWatchClick = (item: ContentItem) => {
      adManager.triggerSmartLink();
      onSmartPlay(item);
  };

  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  const trailer = useMemo(() => {
    if (!currentItem?.videos?.results) return null;
    return currentItem.videos.results.find(
      (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
    );
  }, [currentItem]);

  const displayGenres = useMemo(() => {
      if (currentItem.genres && currentItem.genres.length > 0) {
          return currentItem.genres;
      }
      if (currentItem.genre_ids && genres.length > 0) {
          return currentItem.genre_ids.map(id => genres.find(g => g.id === id)).filter(Boolean) as Genre[];
      }
      return [];
  }, [currentItem, genres]);

  return (
    <div 
        className="relative h-screen min-h-[600px] w-full overflow-hidden bg-black group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={item.backdrop_path}
            alt={item.title}
            className="w-full h-full object-cover object-top"
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
          />
          {/* Classic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
        </div>
      ))}

      <div className="relative z-20 flex flex-col justify-end h-full p-6 md:p-12 pb-24 md:pb-32 container mx-auto">
        <div key={currentIndex} className="max-w-3xl w-full animate-fade-in-up">
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl leading-tight mb-4">
                {currentItem.title}
            </h2>

            <div className="flex items-center flex-wrap gap-4 text-sm md:text-base text-gray-200 font-semibold mb-6">
                <span className="text-green-400 font-bold">{currentItem.vote_average.toFixed(1)} Match</span>
                <span>{currentItem.release_date?.split('-')[0]}</span>
                <span className="uppercase border border-white/30 px-2 py-0.5 rounded text-xs">{currentItem.media_type}</span>
                {displayGenres.slice(0, 3).map(g => (
                    <span key={g.id} className="text-gray-300 hidden sm:inline">• {g.name}</span>
                ))}
            </div>
            
            <p className="text-base md:text-lg text-gray-300 drop-shadow-md line-clamp-3 mb-8 max-w-2xl leading-relaxed">
                {currentItem.overview}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => handleWatchClick(currentItem)}
                className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
              >
                <PlayIcon className="w-6 h-6 mr-2" />
                Play Now
              </button>
              <button 
                onClick={() => onShowDetails(currentItem)}
                className="flex items-center justify-center bg-gray-500/30 hover:bg-gray-500/50 text-white font-bold px-8 py-3.5 rounded-xl backdrop-blur-md transition-all transform hover:scale-105 active:scale-95"
              >
                <InfoIcon className="w-6 h-6 mr-2" />
                More Info
              </button>
            </div>
        </div>
      </div>
      
       {/* Centered Slider Indicators */}
       <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 space-x-2 items-center">
          {items.map((_, index) => (
              <button 
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ease-out shadow-sm ${index === currentIndex ? 'w-8 bg-red-600' : 'w-2 bg-white/40 hover:bg-white/80'}`}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
          ))}
      </div>

    </div>
  );
};

export default React.memo(HeroSection);