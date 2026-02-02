import React, { useState, useEffect } from 'react';
import { fetchLeaderboard, submitScore, LeaderboardEntry } from '../services/supabase';
import { Send, RotateCcw, Home } from 'lucide-react';

interface RankingProps {
  finalTime: number;
  onRetry: () => void;
  onHome?: () => void;
}

// Tailwind animation styles needed for the new effects
// Usually these would go in index.css, only inline here for context
const customStyles = `
  @keyframes slide-in-bottom {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  @keyframes pop-highlight {
    0% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
    50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); background-color: rgba(255, 215, 0, 0.2); }
    100% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
  }
  .animate-slide-in-bottom { animation: slide-in-bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  .animate-pop-highlight { animation: pop-highlight 0.6s ease-in-out forwards; }
`;

export const Ranking: React.FC<RankingProps> = ({ finalTime, onRetry, onHome }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [rank, setRank] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(true);

  // Derived state for easier logic
  const isRankIn = rank !== null && rank <= 10;

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    
    // Simulate current user inclusion for ranking determination
    // Standard Supabase query usually returns top 100 or so.
    // If we haven't submitted yet, we calculate where we WOULD be.
    let calculatedRank = 11; // Default to rank out
    const potentialRank = data.findIndex(entry => finalTime < entry.clear_time);
    
    if (potentialRank !== -1) {
        // If we found someone slower than us, our rank is that index + 1
        calculatedRank = potentialRank + 1;
    } else if (data.length < 10) {
        // If list isn't full and we are slower than everyone (findIndex -1), we are last + 1
        calculatedRank = data.length + 1;
    } else {
        // List is full (>=10) and we are slower than everyone
        calculatedRank = 11; 
    }

    setLeaderboard(data);
    setRank(calculatedRank);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    await submitScore(playerName, finalTime);
    setSubmitted(true);
    setShowNameInput(false);
    
    // Smooth update: Fetch again to show the user in the list with animation
    setLoading(true);
    const newData = await fetchLeaderboard();
    setLeaderboard(newData);
    setLoading(false);
  };

  const handleSkip = () => {
    setShowNameInput(false);
  };

  const handleGoHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
         style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #E0F4FF 100%)' }}>
        <style>{customStyles}</style>

        {/* Main Card */}
        <div className="relative w-full max-w-sm">
            {/* Trophy Icon Logic */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
                {loading ? (
                    <div className="text-6xl animate-bounce drop-shadow-lg opacity-80">🤔</div>
                ) : isRankIn ? (
                    <img src="/ui_icon_trophy.png" alt="" className="w-24 h-24 drop-shadow-2xl animate-poyon" />
                ) : (
                    <div className="text-6xl animate-bounce drop-shadow-lg grayscale opacity-80">😢</div>
                )}
            </div>
            
            {/* Card Container */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white pt-16 pb-6 mt-4">
                
                {/* Result Display */}
                <div className="text-center px-6 mb-2">
                    {/* Time */}
                    <p className="text-6xl font-black text-[#5BB5E0] drop-shadow-sm font-mono mb-2">
                        {finalTime.toFixed(1)}<span className="text-2xl text-[#87CEEB] ml-1">秒</span>
                    </p>

                    {/* Rank Badge / Status */}
                    <div className="flex justify-center mb-4">
                        {loading ? (
                             <span className="bg-[#87CEEB] text-white font-bold py-1 px-4 rounded-full text-sm shadow-md animate-pulse">
                                集計中...
                            </span>
                        ) : isRankIn ? (
                            <div className="flex flex-col items-center animate-pop-highlight">
                                <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-black py-2 px-8 rounded-full text-2xl shadow-lg border-2 border-white transform scale-110">
                                    歴代 {rank} 位
                                </span>
                            </div>
                        ) : (
                            <span className="bg-gray-400 text-white font-bold py-1 px-4 rounded-full text-sm shadow-md">
                                ランク外...
                            </span>
                        )}
                    </div>
                </div>

                {/* Rank In Action: Name Input */}
                {isRankIn && !submitted && showNameInput && (
                    <div className="mx-6 mb-6 animate-slide-in-bottom bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="text-center mb-2">
                            <p className="text-[#5D4037] font-bold text-sm">
                                お名前を記録しませんか？？
                            </p>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={handleSkip}
                                className="absolute -top-10 -right-2 w-8 h-8 btn-clay btn-clay-vanilla text-gray-500 rounded-full flex items-center justify-center z-10 text-lg font-black leading-none pb-1"
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
                                    className="flex-1 bg-white border-2 border-[#87CEEB] focus:border-[#5BB5E0] rounded-xl px-4 py-3 font-bold text-[#5D4037] outline-none transition-all placeholder:text-gray-400 text-center"
                                    autoFocus
                                />
                                <button 
                                    type="submit" 
                                    disabled={!playerName.trim()}
                                    className="btn-clay btn-clay-soda p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} strokeWidth={3} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Leaderboard List */}
                <div className="mx-6 mb-6">
                    <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400 animate-pulse font-bold">読み込み中...</div>
                        ) : leaderboard.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm">まだ記録がありません</div>
                        ) : (
                            leaderboard.slice(0, 10).map((entry, index) => {
                                // Check if this entry is the one we just submitted
                                const isMyEntry = submitted && entry.player_name === playerName && Math.abs(entry.clear_time - finalTime) < 0.01;
                                
                                return (
                                <div 
                                    key={index} 
                                    className={`flex items-center justify-between p-2 rounded-lg transition-all duration-500 ${
                                        isMyEntry
                                            ? 'bg-[#FFF9C4] border-2 border-[#FFD700] animate-pop-highlight z-10 scale-105 shadow-md' 
                                            : 'bg-gray-50 border border-transparent'
                                    }`}
                                    style={{
                                        // Stagger animation for list items if needed, but simple slide-in is safer
                                        transformOrigin: 'center'
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black shrink-0 ${
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
                                    <span className="font-mono font-bold text-[#5BB5E0] text-sm whitespace-nowrap">{entry.clear_time.toFixed(1)}s</span>
                                </div>
                            )})
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 space-y-3">
                    <button 
                        onClick={onRetry}
                        className="btn-clay btn-clay-orange w-full text-xl py-4 flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-6 h-6" strokeWidth={3} />
                        <span>もう一度</span>
                    </button>
                    
                    <button 
                        onClick={handleGoHome}
                        className="btn-clay btn-clay-vanilla w-full text-gray-500 text-lg py-3 flex items-center justify-center gap-2 border-2 border-transparent hover:border-gray-200"
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
