import React, { useState, useEffect } from 'react';
import { fetchLeaderboard, submitScore, LeaderboardEntry } from '../services/supabase';
import { Send, RotateCcw, Home } from 'lucide-react';

interface RankingProps {
  finalTime: number;
  onRetry: () => void;
  onHome?: () => void;
}

export const Ranking: React.FC<RankingProps> = ({ finalTime, onRetry, onHome }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [rank, setRank] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setLeaderboard(data);
    
    const qualifyIndex = data.findIndex(entry => finalTime < entry.clear_time);
    if (qualifyIndex !== -1 || data.length < 10) {
        setRank(qualifyIndex === -1 ? data.length + 1 : qualifyIndex + 1);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    await submitScore(playerName, finalTime);
    setSubmitted(true);
    setShowNameInput(false);
    await loadLeaderboard();
  };

  const handleSkip = () => {
    setShowNameInput(false);
    setRank(null);
  };

  const handleGoHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.reload();
    }
  };

  return (
    // Light blue gradient matching TOP page
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
         style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #E0F4FF 100%)' }}>

        {/* Main Card */}
        <div className="relative w-full max-w-sm">
            {/* Trophy floating above */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
                <img src="/ui_icon_trophy.png" alt="" className="w-20 h-20 drop-shadow-2xl animate-poyon" />
            </div>
            
            {/* Card Container */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white pt-14 pb-6">
                
                {/* Header - Just time, minimal */}
                <div className="text-center px-6 mb-4">
                    <p className="text-6xl font-black text-[#5BB5E0] drop-shadow-sm font-mono">
                        {finalTime.toFixed(1)}<span className="text-2xl text-[#87CEEB] ml-1">秒</span>
                    </p>
                    {rank && !submitted && showNameInput && (
                        <div className="mt-3">
                            <span className="bg-[#FFD700] text-white font-black py-1 px-4 rounded-full text-sm shadow-md">
                                🏆 {rank}位!
                            </span>
                        </div>
                    )}
                </div>

                {/* Name Entry Form */}
                {rank && !submitted && showNameInput && (
                    <div className="mx-6 mb-4 animate-slide-up relative">
                        <button 
                            onClick={handleSkip}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10 text-sm font-bold"
                            aria-label="スキップ"
                        >
                            ×
                        </button>
                        
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input 
                                type="text" 
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="名前を入力"
                                maxLength={10}
                                className="flex-1 bg-white border-2 border-[#87CEEB] focus:border-[#5BB5E0] rounded-xl px-4 py-3 font-bold text-[#5D4037] outline-none transition-all placeholder:text-gray-400"
                                autoFocus
                            />
                            <button 
                                type="submit" 
                                disabled={!playerName.trim()}
                                className="bg-[#5BB5E0] hover:bg-[#4AA5D0] text-white p-3 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                )}

                {/* Leaderboard List */}
                <div className="mx-6 mb-4">
                    <div className="space-y-1 max-h-[180px] overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400 animate-pulse font-bold">読み込み中...</div>
                        ) : leaderboard.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm">まだ記録がありません</div>
                        ) : (
                            leaderboard.slice(0, 10).map((entry, index) => (
                                <div 
                                    key={index} 
                                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                                        submitted && entry.player_name === playerName && Math.abs(entry.clear_time - finalTime) < 0.1
                                            ? 'bg-[#FFD700]/20 border border-[#FFD700]' 
                                            : 'bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                                            index === 0 ? 'bg-[#FFD700] text-white' :
                                            index === 1 ? 'bg-[#C0C0C0] text-white' :
                                            index === 2 ? 'bg-[#CD7F32] text-white' :
                                            'bg-gray-200 text-gray-600'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <span className="font-bold text-gray-700 text-sm truncate max-w-[100px]">
                                            {entry.player_name || '---'}
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-[#5BB5E0] text-sm">{entry.clear_time.toFixed(1)}s</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 space-y-3">
                    {/* Retry Button - Orange like TOP page START button */}
                    <button 
                        onClick={onRetry}
                        className="w-full bg-gradient-to-b from-[#FFB347] to-[#FF8C00] hover:from-[#FFC56B] hover:to-[#FFA500] text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" strokeWidth={3} />
                        <span>もう一度</span>
                    </button>
                    
                    {/* Home Button */}
                    <button 
                        onClick={handleGoHome}
                        className="w-full bg-white hover:bg-gray-50 text-gray-500 font-bold text-base py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 border border-gray-200"
                    >
                        <Home className="w-5 h-5" />
                        <span>TOPに戻る</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
