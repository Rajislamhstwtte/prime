
import React, { useState } from 'react';
import { PaperAirplaneIcon } from './IconComponents';

const Newsletter: React.FC = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            // In a real app, send to API
        }
    };

    if (subscribed) {
        return (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 text-center animate-fade-in-up">
                <h3 className="text-green-400 font-bold mb-2">Welcome to the Inner Circle!</h3>
                <p className="text-slate-400 text-sm">You'll be the first to know about new releases and exclusive content.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-red-900/20 to-black border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">Join the Cineflix Universe</h3>
                <p className="text-slate-400 text-sm mb-6">Get exclusive behind-the-scenes content, wallpapers, and release updates delivered to your inbox.</p>
                
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-grow bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:border-red-600 outline-none transition-colors"
                        required
                    />
                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg transition-colors">
                        <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Newsletter;
