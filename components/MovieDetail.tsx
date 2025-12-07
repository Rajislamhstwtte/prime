
import React, { useState, useEffect } from 'react';
import { ContentItem, Season, Episode, ViewingHistoryItem } from '../types';
import { getRecommendations, getSeasonDetails, getSimilarByGenre, getMovieDetails } from '../services/movieService';
import { PlayIcon, CloseIcon, StarIcon, LoadingSpinner, PlusIcon, CheckIcon, ShareIcon, DownloadIcon, MegaphoneIcon, ChevronDownIcon, BackIcon } from './IconComponents';
import MovieCard from './MovieCard';
import { adManager } from '../services/adManager';
import SocialShareModal from './SocialShareModal';
import Poll from './Poll';
import Newsletter from './Newsletter';
import { useSEO } from '../hooks/useSEO';

interface MovieDetailProps {
  content: ContentItem;
  onClose: () => void;
  onSmartPlay: (content: ContentItem) => void;
  onPlayEpisode: (content: ContentItem, season?: number, episode?: number) => void;
  onDownload: (content: ContentItem, season?: number, episode?: number) => void;
  isLoading: boolean;
  isItemInList: boolean;
  onAddItem: (content: ContentItem) => void;
  onRemoveItem: (content: ContentItem) => void;
  onSelectRecommendation: (content: ContentItem) => void;
  viewingHistory: ViewingHistoryItem[];
  showToast: (message: string) => void;
}

type Tab = 'overview' | 'cast' | 'episodes' | 'universe' | 'media';

const MovieDetail: React.FC<MovieDetailProps> = ({ 
  content: initialContent, onClose, onSmartPlay, onPlayEpisode, onDownload, isLoading: parentIsLoading, 
  isItemInList, onAddItem, onRemoveItem, onSelectRecommendation, viewingHistory,
  showToast
}) => {
  const [content, setContent] = useState<ContentItem>(initialContent);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isFullDetailsLoading, setIsFullDetailsLoading] = useState(false);

  useSEO(content);

  useEffect(() => {
    // This effect runs if the component receives partial data and needs to fetch the rest.
    const needsFetching = !content.credits || (content.media_type === 'tv' && !content.seasons?.length) || !content.images;
    if (!needsFetching) return;

    const fetchFullDetails = async () => {
        setIsFullDetailsLoading(true);
        try {
            const fullData = await getMovieDetails(initialContent.id, initialContent.media_type);
            setContent(prev => ({ ...prev, ...fullData }));
        } catch (e) {
            console.error("Failed to load full details", e);
            showToast("Could not load all details for this title.");
        } finally {
            setIsFullDetailsLoading(false);
        }
    };
    fetchFullDetails();
  }, [initialContent.id, initialContent.media_type, showToast]);

  useEffect(() => {
    if (!content?.id) return;

    const initData = async () => {
        let seasonToShow = 1;
        const historyItem = viewingHistory.find(item => item.content.id === content.id);
        if (historyItem && historyItem.lastSeason) {
            seasonToShow = historyItem.lastSeason;
        }

        if (content.media_type === 'tv') {
            const existingSeason = content.seasons?.find(s => s.season_number === seasonToShow);
            if (existingSeason && existingSeason.episodes?.length) {
                setSelectedSeason(existingSeason);
            } else if (content.number_of_seasons && content.number_of_seasons > 0) {
                setIsSeasonLoading(true);
                try {
                    const seasonData = await getSeasonDetails(content.id, seasonToShow);
                    setSelectedSeason(seasonData);
                } catch (e) { console.error("Season load failed", e); } 
                finally { setIsSeasonLoading(false); }
            }
        }

        try {
            const recs = await getRecommendations(content.id, content.media_type);
            if (recs.length > 0) {
                setRecommendations(recs);
            } else if (content.genres?.length) {
                const similarItems = await getSimilarByGenre(content.id, content.media_type, content.genres);
                setRecommendations(similarItems);
            }
        } catch (error) { console.error(error); }
    };

    initData();
  }, [content.id, content.media_type, viewingHistory, content.seasons, content.number_of_seasons, content.genres]); 

  const handleRecommendationClick = (item: ContentItem) => {
      onClose();
      setTimeout(() => onSelectRecommendation(item), 300);
  };

  const handleSeasonChange = async (seasonNumber: number) => {
    if (content?.id && selectedSeason?.season_number !== seasonNumber) {
        setIsSeasonLoading(true);
        try {
            const seasonDetails = await getSeasonDetails(content.id, seasonNumber);
            setSelectedSeason(seasonDetails);
        } catch (error) { console.error(error); } finally { setIsSeasonLoading(false); }
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?id=${content.id}&type=${content.media_type}`;
    const shareData = { title: content.title, text: `Watch ${content.title} on Cineflix!`, url: shareUrl };
    try {
        if (navigator.share) await navigator.share(shareData);
        else throw new Error("Share not supported");
    } catch {
        navigator.clipboard.writeText(shareUrl);
        showToast('Link copied!');
    }
  };

  const getPlayButtonText = () => {
    if (content.media_type === 'movie') return 'Watch Movie';
    const historyItem = viewingHistory.find(item => item.content.id === content.id);
    if (historyItem && historyItem.lastSeason && historyItem.lastEpisode && historyItem.progress < 0.95) {
        return `Resume S${historyItem.lastSeason} E${historyItem.lastEpisode}`;
    }
    return 'Start Watching';
  };

  const downloadImage = (url: string) => {
      const a = document.createElement('a');
      a.href = `https://image.tmdb.org/t/p/original${url}`;
      a.download = `cineflix-${content.title}-wallpaper.jpg`;
      a.target = '_blank';
      a.click();
  }

  const renderTabs = () => (
      <div className="flex border-b border-gray-800 mb-6 overflow-x-auto scrollbar-thin">
          {[
              { id: 'overview', label: 'Overview' },
              content.media_type === 'tv' && { id: 'episodes', label: 'Episodes' },
              { id: 'cast', label: 'Cast' },
              { id: 'universe', label: 'Universe' },
              { id: 'media', label: 'Wallpapers' },
          ].filter(Boolean).map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 ${
                    activeTab === tab.id 
                    ? 'border-red-600 text-white' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                  {tab.label}
              </button>
          ))}
      </div>
  );

  const renderOverview = () => (
      <div className="grid md:grid-cols-3 gap-8 animate-fade-in-up">
          <div className="md:col-span-2 space-y-8">
              <div>
                  <h3 className="text-white font-bold text-xl mb-3">Storyline</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">{content.overview || "No overview available."}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                  {content.genres?.map(g => (
                      <span key={g.id} className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm border border-white/10">
                          {g.name}
                      </span>
                  ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                  <Poll id={content.id} title={content.title} />
                  <Newsletter />
              </div>
          </div>
          
          <div className="space-y-6">
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">Details</h4>
                  <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                          <span className="text-gray-500">Rating</span>
                          <span className="text-white font-bold flex items-center gap-1"><StarIcon className="w-3 h-3 text-yellow-500"/> {content.vote_average.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-500">Release Date</span>
                          <span className="text-white">{content.release_date || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className="text-white">{content.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderEpisodes = () => (
      <div className="animate-fade-in-up">
          <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-thin mb-4">
            {Array.from({ length: content.number_of_seasons || selectedSeason?.season_number || 1 }, (_, i) => i + 1).map(num => (
                <button
                    key={num}
                    onClick={() => handleSeasonChange(num)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex-shrink-0 transition-colors ${
                        selectedSeason?.season_number === num ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    Season {num}
                </button>
            ))}
          </div>
          {isSeasonLoading ? <LoadingSpinner className="w-10 h-10 text-red-500 mx-auto" /> : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                  {selectedSeason?.episodes?.map(ep => (
                      <div key={ep.id} className="flex gap-4 p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer border border-transparent hover:border-white/10" onClick={() => { adManager.triggerSmartLink(); onPlayEpisode(content, selectedSeason.season_number, ep.episode_number)}}>
                          <div className="w-32 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                              <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : 'https://via.placeholder.com/300x169'} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlayIcon className="w-8 h-8 text-white"/></div>
                          </div>
                          <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-white truncate">{ep.episode_number}. {ep.name}</h4>
                                  <button onClick={(e) => { e.stopPropagation(); onDownload(content, selectedSeason.season_number, ep.episode_number)}} className="text-gray-500 hover:text-white"><DownloadIcon className="w-5 h-5"/></button>
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-2 mt-1">{ep.overview}</p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );

  const renderCast = () => (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in-up max-h-[600px] overflow-y-auto scrollbar-thin">
          {content.credits?.cast?.slice(0, 15).map(person => (
              <div key={person.id} className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-800 hover:border-gray-600 transition-colors">
                  <img 
                    src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : 'https://via.placeholder.com/200x200'} 
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-gray-700" 
                  />
                  <h4 className="text-white font-bold text-sm truncate">{person.name}</h4>
                  <p className="text-gray-500 text-xs truncate">{person.character}</p>
              </div>
          ))}
          {!content.credits && <p className="text-gray-500">Cast information unavailable.</p>}
      </div>
  );

  const renderUniverse = () => {
      const featurettes = content.videos?.results.filter(v => v.type === 'Featurette' || v.type === 'Behind the Scenes').slice(0, 6) || [];
      return (
          <div className="animate-fade-in-up space-y-6">
              <h3 className="text-white font-bold text-xl">Behind the Scenes</h3>
              {featurettes.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                      {featurettes.map(vid => (
                          <div key={vid.id} className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                              <iframe 
                                src={`https://www.youtube.com/embed/${vid.key}`} 
                                className="w-full h-full" 
                                title={vid.name} 
                                allowFullScreen
                              />
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-gray-500">No behind-the-scenes footage available for this title.</p>
              )}
          </div>
      )
  };

  const renderMedia = () => {
      const backdrops = content.images?.backdrops?.slice(0, 8) || [];
      return (
          <div className="animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-xl">Official Wallpapers</h3>
                  <span className="text-xs text-gray-500">{backdrops.length} Images available</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto scrollbar-thin">
                  {backdrops.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-gray-800">
                          <img src={`https://image.tmdb.org/t/p/w780${img.file_path}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => downloadImage(img.file_path)}
                                className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-200"
                              >
                                  <DownloadIcon className="w-4 h-4" /> Download HD
                              </button>
                          </div>
                      </div>
                  ))}
                  {backdrops.length === 0 && <p className="text-gray-500">No wallpapers available.</p>}
              </div>
          </div>
      )
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 animate-fade-in-up">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] md:rounded-2xl shadow-2xl overflow-hidden h-full md:max-h-[90vh] flex flex-col border border-white/5">
        
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
             <div />
             <button onClick={onClose} className="pointer-events-auto p-2 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all">
                <CloseIcon className="w-6 h-6" />
             </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-grow">
            <div className="relative h-[50vh] md:h-[60vh] w-full">
                <img src={content.backdrop_path} alt={content.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col md:flex-row gap-8 items-end">
                    <img src={content.poster_path} className="hidden md:block w-48 rounded-xl shadow-2xl border-4 border-white/10" />
                    
                    <div className="flex-grow text-white">
                        <h1 className="text-4xl md:text-6xl font-black mb-2 drop-shadow-2xl">{content.title}</h1>
                        <div className="flex items-center gap-4 text-sm font-semibold text-gray-300 mb-6">
                            <span>{content.release_date?.split('-')[0]}</span>
                            <span>•</span>
                            <span className="uppercase">{content.media_type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-yellow-400"><StarIcon className="w-4 h-4"/> {content.vote_average.toFixed(1)}</span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => { adManager.triggerSmartLink(); onSmartPlay(content) }}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all transform hover:scale-105"
                            >
                                <PlayIcon className="w-5 h-5" /> {getPlayButtonText()}
                            </button>
                            
                            <button 
                                onClick={() => isItemInList ? onRemoveItem(content) : onAddItem(content)}
                                className={`px-4 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
                                    isItemInList ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                }`}
                            >
                                {isItemInList ? <CheckIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                            </button>

                            <button 
                                onClick={handleShare}
                                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold flex items-center gap-2 border border-white/20 transition-all"
                            >
                                {isSharing ? 'Copied!' : <ShareIcon className="w-5 h-5" />}
                            </button>

                            <button 
                                onClick={() => setIsSocialModalOpen(true)}
                                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full font-bold flex items-center gap-2 shadow-lg"
                            >
                                <MegaphoneIcon className="w-5 h-5" /> Promote
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-10">
                {renderTabs()}
                
                <div className="min-h-[300px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'cast' && renderCast()}
                    {activeTab === 'episodes' && renderEpisodes()}
                    {activeTab === 'universe' && renderUniverse()}
                    {activeTab === 'media' && renderMedia()}
                </div>

                {recommendations.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-6">You Might Also Like</h3>
                        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin">
                            {recommendations.map(item => (
                                <div key={item.id} className="w-40 flex-shrink-0">
                                    <MovieCard 
                                        content={item} 
                                        onSelectMovie={handleRecommendationClick}
                                        onSmartPlay={onSmartPlay}
                                        onDownload={onDownload}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
    <SocialShareModal 
        isOpen={isSocialModalOpen} 
        onClose={() => setIsSocialModalOpen(false)} 
        content={content} 
    />
    </>
  );
};

export default MovieDetail;