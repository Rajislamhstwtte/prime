
import React, { useEffect, useState } from 'react';
import { ContentItem, Torrent } from '../types';
import { fetchMovieDownloads, getMovieDetails } from '../services/movieService';
import { CloseIcon, MagnetIcon, LoadingSpinner, ServerIcon, FileIcon, CloudIcon, SearchIcon } from './IconComponents';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem;
  season?: number;
  episode?: number;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, content, season, episode }) => {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && content.media_type === 'movie') {
      const loadTorrents = async () => {
        setIsLoading(true);
        setTorrents([]); // Clear previous results

        let results: Torrent[] = [];

        // Strategy 1: Try finding by IMDB ID (Most Accurate)
        let query = content.imdb_id;
        
        // If ID is missing, try to fetch it first
        if (!query) {
            try {
                const fullDetails = await getMovieDetails(content.id, 'movie');
                query = fullDetails.imdb_id;
            } catch (e) {
                console.warn("Could not fetch external ID for download lookup", e);
            }
        }

        if (query) {
            results = await fetchMovieDownloads(query);
        }

        // Strategy 2: If ID search failed/empty, try finding by Title (Broader)
        if (results.length === 0) {
            console.log("No results by ID, retrying with title...");
            results = await fetchMovieDownloads(content.title);
        }

        setTorrents(results);
        setIsLoading(false);
      };
      loadTorrents();
    }
  }, [isOpen, content]);

  if (!isOpen) return null;

  const getMagnetLink = (torrent: Torrent) => {
      return `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(content.title)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969`;
  };

  const getWebTorLink = (torrent: Torrent) => {
      // Direct WebTor player/downloader link
      return `https://webtor.io/show?magnet=${encodeURIComponent(getMagnetLink(torrent))}`;
  };

  const getFilePursuitQuery = () => {
    const base = content.title;
    if (content.media_type === 'tv') {
        // e.g. "Breaking Bad S01E01"
        const s = season?.toString().padStart(2, '0');
        const e = episode?.toString().padStart(2, '0');
        return `${base} S${s}E${e} video`;
    }
    // e.g. "Inception 2010 video"
    return `${base} ${content.release_date?.split('-')[0] || ''} video`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Download Manager</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {content.title} {content.media_type === 'tv' ? `- S${season} E${episode}` : ''}
             </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto scrollbar-thin">

            {/* MOVIE TORRENTS (P2P + Cloud) */}
            {content.media_type === 'movie' ? (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MagnetIcon className="w-5 h-5 text-red-500" />
                        High Quality Sources
                    </h3>
                    
                    {isLoading ? (
                        <div className="flex justify-center py-8"><LoadingSpinner className="w-10 h-10 text-red-500" /></div>
                    ) : torrents.length > 0 ? (
                        <div className="grid gap-3">
                            {torrents.map((torrent, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 transition-colors group gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-black p-2 rounded-lg font-bold text-sm text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 min-w-[60px] text-center">
                                            {torrent.quality}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{torrent.type.toUpperCase()}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{torrent.size} • {torrent.seeds} Seeds</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                        <a 
                                            href={getWebTorLink(torrent)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-transform transform active:scale-95 shadow-md"
                                            title="Play/Download in Browser without software"
                                        >
                                            <CloudIcon className="w-4 h-4" />
                                            <span>Cloud Play/DL</span>
                                        </a>
                                        <a 
                                            href={getMagnetLink(torrent)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-bold text-sm transition-colors"
                                            title="Requires Torrent Client"
                                        >
                                            <MagnetIcon className="w-4 h-4" />
                                            <span>Magnet</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            No direct P2P sources found. Please use the External Search options below.
                        </div>
                    )}
                </div>
            ) : null}

            {/* EXTERNAL SEARCH / DIRECT FILES */}
            <div className={`${content.media_type === 'movie' ? 'pt-6 border-t border-gray-200 dark:border-gray-800' : ''}`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">External Download Search</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* FilePursuit - Real File Search */}
                    <a 
                        href={`https://filepursuit.com/pursuit?q=${encodeURIComponent(getFilePursuitQuery())}&type=video`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-1 md:col-span-2 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                    >
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                             <SearchIcon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Search Direct Files
                                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Recommended</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Search FilePursuit for direct MP4/MKV links</p>
                        </div>
                    </a>

                    <a 
                        href={`https://bitsearch.to/search?q=${encodeURIComponent(`${content.title} ${content.media_type === 'tv' ? `S${season?.toString().padStart(2,'0')}E${episode?.toString().padStart(2,'0')}` : ''}`)}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                        <FileIcon className="w-6 h-6 text-green-600" />
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">BitSearch</p>
                            <p className="text-xs text-slate-500">Best for TV Episodes</p>
                        </div>
                    </a>
                    <a 
                        href={`https://1337x.to/search/${encodeURIComponent(`${content.title} ${content.media_type === 'tv' ? `S${season?.toString().padStart(2,'0')}E${episode?.toString().padStart(2,'0')}` : ''}`)}/1/`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    >
                        <MagnetIcon className="w-6 h-6 text-orange-500" />
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">1337x</p>
                            <p className="text-xs text-slate-500">General Source</p>
                        </div>
                    </a>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
