
import React, { useState, useEffect } from 'react';
import { CheckIcon } from './IconComponents';

interface PollProps {
    id: number;
    title: string;
}

const Poll: React.FC<PollProps> = ({ id, title }) => {
    const [voted, setVoted] = useState<string | null>(null);
    const [votes, setVotes] = useState({
        exciting: 45,
        emotional: 20,
        funny: 15,
        boring: 5
    });

    useEffect(() => {
        const savedVote = localStorage.getItem(`cineflix_poll_${id}`);
        if (savedVote) setVoted(savedVote);
    }, [id]);

    const handleVote = (option: keyof typeof votes) => {
        if (voted) return;
        setVotes(prev => ({ ...prev, [option]: prev[option] + 1 }));
        setVoted(option);
        localStorage.setItem(`cineflix_poll_${id}`, option);
    };

    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

    const getPercentage = (count: number) => {
        return Math.round((count / totalVotes) * 100);
    };

    return (
        <div className="bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Community Poll</h3>
            <p className="text-slate-400 text-sm mb-4">How would you describe "{title}"?</p>
            
            <div className="space-y-3">
                {Object.entries(votes).map(([key, count]) => {
                    const isSelected = voted === key;
                    const percent = getPercentage(count);
                    
                    return (
                        <button
                            key={key}
                            onClick={() => handleVote(key as any)}
                            disabled={!!voted}
                            className={`relative w-full h-12 rounded-lg overflow-hidden transition-all group ${voted ? 'cursor-default' : 'hover:bg-white/10'}`}
                        >
                            {/* Background Bar */}
                            {voted && (
                                <div 
                                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isSelected ? 'bg-red-600/40' : 'bg-gray-700/40'}`}
                                    style={{ width: `${percent}%` }}
                                />
                            )}
                            
                            <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                <span className={`capitalize font-medium ${isSelected ? 'text-red-500' : 'text-slate-300'}`}>
                                    {key}
                                </span>
                                {voted && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">{percent}%</span>
                                        {isSelected && <CheckIcon className="w-4 h-4 text-red-500" />}
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-right">{totalVotes} votes</p>
        </div>
    );
};

export default Poll;
