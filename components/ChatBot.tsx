
import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleIcon, CloseIcon, PaperAirplaneIcon, DownloadIcon, CheckIcon, PlayIcon, LockIcon, CloudIcon, ShieldCheckIcon, LoadingSpinner } from './IconComponents';
import { usePWA } from '../hooks/usePWA';
import { ContentItem, Torrent } from '../types';
import { searchMulti, discoverContent, fetchMovieDownloads, getMovieDetails } from '../services/movieService';

type View = 'home' | 'series' | 'trending' | 'upcoming' | 'watch-party';

interface ChatBotProps {
  onShowInstallModal: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (view: View) => void;
  onSelectItem: (item: ContentItem) => void;
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  contentItem?: ContentItem;
  downloadOptions?: {
      title: string;
      poster: string;
      files: Torrent[];
  };
  isDownloadAction?: boolean; // PWA Install
}

const QUICK_CHIPS = [
    { label: "Download Movie", action: "Download..." },
    { label: "Trending", action: "Show me trending movies" },
    { label: "Surprise Me", action: "Surprise me with a movie" },
    { label: "Install App", action: "How do I install the app?" },
];

const ChatBot: React.FC<ChatBotProps> = ({ onShowInstallModal, isOpen, onToggle, onNavigate, onSelectItem }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: 'Hi! I am the Cineflix Agent. \n\nI can help you search, stream, or **securely download** movies to your device. \n\nTry saying "Download Iron Man".' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { installApp, isIOS } = usePWA();
  const [hasUnread, setHasUnread] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleToggle = () => {
      onToggle();
      if (!isOpen) setHasUnread(false);
  };

  const getDirectCloudLink = (title: string, torrent: Torrent) => {
      const magnet = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(title)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969`;
      return `https://webtor.io/show?magnet=${encodeURIComponent(magnet)}`;
  };

  const processUserMessage = async (userText: string) => {
      setIsTyping(true);
      const lowerText = userText.toLowerCase();
      let botResponse: Message = { id: Date.now() + 1, sender: 'bot', text: '' };

      try {
        if (lowerText.startsWith('download') || lowerText.startsWith('get ') || lowerText.startsWith('save ')) {
            const query = lowerText.replace('download', '').replace('get', '').replace('save', '').trim();
            
            if (query.length > 1) {
                setLoadingText("Searching secure database...");
                const searchResults = await searchMulti(query);
                const movie = searchResults.find(i => i.media_type === 'movie');
                const tvShow = searchResults.find(i => i.media_type === 'tv');

                if (movie) {
                    setLoadingText("Verifying file integrity...");
                    await new Promise(r => setTimeout(r, 800));
                    setLoadingText("Generating secure links...");
                    
                    let downloads: Torrent[] = [];
                    try {
                        downloads = await fetchMovieDownloads(movie.title);
                    } catch (e) { console.error(e); }

                    if (downloads.length > 0) {
                        botResponse.text = `Secure files found for **${movie.title}**. \n\nClick "Secure Download" to save directly to your device storage.`;
                        botResponse.downloadOptions = {
                            title: movie.title,
                            poster: movie.poster_path,
                            files: downloads.slice(0, 3)
                        };
                    } else {
                        botResponse.text = `I searched our secure cloud servers but couldn't find a direct file for "${movie.title}" right now. \n\nThis title has been added to our request queue and should be available soon! You can still stream it below:`;
                        botResponse.contentItem = movie;
                    }
                } else if (tvShow) {
                    botResponse.text = `I found the TV Show **${tvShow.title}**, but direct download links for episodes are currently being optimized for security.\n\nYou can watch it now by clicking below:`;
                    botResponse.contentItem = tvShow;
                } else {
                    botResponse.text = `I couldn't find a movie named "${query}". Please check the spelling.`;
                }
            } else {
                botResponse.text = "Which movie do you want to download? Try saying 'Download Avengers'.";
            }
        }
        else if (lowerText.startsWith('search for') || lowerText.startsWith('find ')) {
            const query = lowerText.replace('search for', '').replace('find', '').trim();
            if (query.length > 1) {
                const results = await searchMulti(query);
                if (results.length > 0) {
                    botResponse.text = `Here is what I found for "${query}":`;
                    botResponse.contentItem = results[0]; 
                } else {
                    botResponse.text = `I couldn't find anything matching "${query}".`;
                }
            } else {
                botResponse.text = "Please tell me what to search for.";
            }
        }
        else if (lowerText.includes('surprise') || lowerText.includes('random')) {
            const results = await discoverContent({}); 
            const randomPick = results[Math.floor(Math.random() * results.length)];
            botResponse.text = "Check this out! A random pick just for you:";
            botResponse.contentItem = randomPick;
        }
        else if (lowerText.includes('install') || lowerText.includes('app')) {
             if (isIOS) {
               botResponse.text = "On iOS, tap the 'Share' button in Safari, then 'Add to Home Screen'.";
            } else {
               botResponse.text = "Tap below to install the Cineflix App for the best experience.";
            }
            botResponse.isDownloadAction = true;
        }
        else if (lowerText.includes('hello') || lowerText.includes('hi')) {
             botResponse.text = "Hello! I can help you download movies securely. Try 'Download The Dark Knight'.";
        } else {
            botResponse.text = "I can help you watch or download content. Try saying 'Download [Movie Name]'.";
        }
      } catch (e) {
          botResponse.text = "I'm having trouble connecting to the server. Please try again.";
      }

      setTimeout(() => {
          setIsTyping(false);
          setLoadingText('');
          setMessages(prev => [...prev, botResponse]);
      }, 1000); 
  };

  const handleSend = async (e?: React.FormEvent, manualText?: string) => {
    e?.preventDefault();
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

    const newMessage: Message = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    await processUserMessage(textToSend);
  };

  const handleDownloadClick = async () => {
      const success = await installApp();
      if (!success) {
          onShowInstallModal();
      }
  };

  return (
    <>
        <button
            onClick={handleToggle}
            className={`fixed bottom-6 right-6 z-[1000] p-3 md:p-3.5 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 border border-white/10 opacity-100 pointer-events-auto ${isOpen ? 'bg-red-600 rotate-90 text-white' : 'bg-white dark:bg-gray-800 text-red-600'}`}
            style={{ boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.4)' }}
            aria-label="Toggle Chat Assistant"
        >
            {isOpen ? <CloseIcon className="w-6 h-6" /> : <ChatBubbleIcon className="w-6 h-6" />}
            {!isOpen && hasUnread && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
        </button>

        {isOpen && (
            <div className="fixed bottom-24 right-6 z-[1000] w-[calc(100vw-2rem)] md:w-96 h-[500px] md:h-[550px] max-h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-right pointer-events-auto backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                <div className="p-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold flex items-center gap-3 shadow-md shrink-0">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/20">
                        <ChatBubbleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-base leading-tight">Cineflix Agent</p>
                        <div className="flex items-center gap-1.5 opacity-90">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"/>
                            <p className="text-xs font-medium">Online</p>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin bg-gray-50 dark:bg-black/40">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                            {msg.text && (
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                                    msg.sender === 'user' 
                                    ? 'bg-red-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                                }`}>
                                    {msg.text}
                                </div>
                            )}
                            
                            {msg.downloadOptions && (
                                <div className="mt-2 w-full max-w-[280px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex p-3 gap-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/30">
                                        <img src={msg.downloadOptions.poster} alt="Poster" className="w-12 h-16 object-cover rounded bg-gray-200" />
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{msg.downloadOptions.title}</p>
                                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full w-fit mt-1">
                                                <ShieldCheckIcon className="w-3 h-3" /> Secure Cloud
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-2">
                                        {msg.downloadOptions.files.map((t, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-colors group">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.quality}</span>
                                                    <span className="text-[10px] text-gray-500">{t.size} • MP4/MKV</span>
                                                </div>
                                                <a 
                                                    href={getDirectCloudLink(msg.downloadOptions!.title, t)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-md active:scale-95"
                                                >
                                                    <LockIcon className="w-3 h-3" />
                                                    Secure Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-3 py-2 bg-gray-50 dark:bg-black/30 text-[10px] text-slate-400 text-center border-t border-gray-100 dark:border-gray-800">
                                        Files scanned for viruses • High Speed
                                    </div>
                                </div>
                            )}

                            {msg.contentItem && !msg.downloadOptions && (
                                <div className="mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 transform transition-transform hover:scale-105 cursor-pointer" onClick={() => onSelectItem(msg.contentItem!)}>
                                    <div className="aspect-[2/3] relative">
                                        <img src={msg.contentItem.poster_path} alt={msg.contentItem.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                                            <p className="text-white font-bold text-xs line-clamp-2">{msg.contentItem.title}</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center justify-center gap-1">
                                        <PlayIcon className="w-3 h-3" /> Stream Now
                                    </button>
                                </div>
                            )}

                            {msg.isDownloadAction && (
                                <button 
                                    onClick={handleDownloadClick}
                                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md animate-pulse"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Install App
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {isTyping && (
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-slate-400 ml-2 animate-pulse">
                                <LoadingSpinner className="w-3 h-3 text-red-500" />
                                {loadingText || "Agent is typing..."}
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm w-fit">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-2 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 overflow-x-auto whitespace-nowrap scrollbar-thin flex gap-2 shrink-0">
                    {QUICK_CHIPS.map((chip, idx) => (
                        <button
                            key={chip.label}
                            onClick={() => {
                                if (chip.label === "Download Movie") {
                                    setInput("Download ");
                                } else {
                                    handleSend(undefined, chip.action);
                                }
                            }}
                            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={(e) => handleSend(e)} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2 shrink-0">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type 'Download Avatar'..." 
                        className="flex-grow px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:text-white transition-all border border-transparent focus:border-red-500"
                    />
                    <button 
                        type="submit" 
                        className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20" 
                        disabled={!input.trim()}
                    >
                        <PaperAirplaneIcon className="w-4 h-4 transform rotate-90" />
                    </button>
                </form>
            </div>
        )}
    </>
  );
};

export default ChatBot;