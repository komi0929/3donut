import React, { useState, useEffect } from 'react';
import { fetchLeaderboard, fetchHallOfFame, submitScore, LeaderboardEntry, HallOfFameEntry } from '../services/supabase';
import { Send, RotateCcw, Home, Trophy, Medal } from 'lucide-react';

interface RankingProps {
  finalTime?: number;
  onRetry: () => void;
  onHome?: () => void;
  initialTab?: 'weekly' | 'hallOfFame';
}

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

export const Ranking: React.FC<RankingProps> = ({ finalTime, onRetry, onHome, initialTab = 'weekly' }) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'hallOfFame'>(initialTab);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [rank, setRank] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(true);

  // Read-only mode if no finalTime provided (accessed from TOP page)
  const isReadOnly = finalTime === undefined;
  const isRankIn = !isReadOnly && rank !== null && rank <= 10;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'weekly') {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
      
      if (!isReadOnly && finalTime !== undefined) {
        // Calculate Rank Logic for Result Screen
        let calculatedRank = 11;
        const potentialRank = data.findIndex(entry => finalTime < entry.clear_time);
        
        if (potentialRank !== -1) {
            calculatedRank = potentialRank + 1;
        } else if (data.length < 10) {
            calculatedRank = data.length + 1;
        } else {
            calculatedRank = 11; 
        }
        setRank(calculatedRank);
      }
    } else {
      const data = await fetchHallOfFame();
      setHallOfFame(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !finalTime) return;

    await submitScore(playerName, finalTime);
    setSubmitted(true);
    setShowNameInput(false);
    
    // Smooth update
    setLoading(true);
    const newData = await fetchLeaderboard();
    setLeaderboard(newData);
    setLoading(false);
  };

  const handleGoHome = () => {
    if (onHome) onHome();
    else window.location.reload();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
         style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #E0F4FF 100%)' }}>
        <style>{customStyles}</style>

        <div className="relative w-full max-w-sm mt-24">
            {/* Tab Switcher */}
            {!isReadOnly && (
                <div className="absolute -top-28 left-0 right-0 flex justify-center gap-4 z-10">
                    <button
                        onClick={() => {
                            setLoading(true);
                            setActiveTab('weekly');
                        }}
                        className={`px-4 py-2 rounded-full font-black text-xs border-2 transition-transform active:scale-95 ${
                            activeTab === 'weekly' 
                            ? 'bg-white text-[#5BB5E0] border-white shadow-lg scale-110' 
                            : 'bg-[#5BB5E0] text-white border-white/50 opacity-80'
                        }`}
                    >
                        今週のランキング
                    </button>
                    <button
                        onClick={() => {
                            setLoading(true);
                            setActiveTab('hallOfFame');
                        }}
                        className={`px-4 py-2 rounded-full font-black text-xs border-2 transition-transform active:scale-95 ${
                            activeTab === 'hallOfFame' 
                            ? 'bg-white text-[#FFD700] border-white shadow-lg scale-110' 
                            : 'bg-[#FFD700] text-white border-white/50 opacity-80'
                        }`}
                    >
                        殿堂入り
                    </button>
                </div>
            )}

            {/* Header Icon */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                {activeTab === 'hallOfFame' ? (
                     <img src="/ui_icon_rank_medal.png" alt="Hall of Fame" className="w-56 h-56 drop-shadow-2xl animate-poyon object-contain" />
                ) : (
                    loading ? (
                        <div className="w-56 h-56 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : isRankIn ? (
                        <img src="/ui_icon_rank_trophy.png" alt="Rank In" className="w-56 h-56 drop-shadow-2xl animate-poyon object-contain" />
                    ) : isReadOnly ? (
                        <img src="/ui_icon_rank_trophy.png" alt="Ranking" className="w-48 h-48 drop-shadow-2xl object-contain" />
                    ) : (
                        <div className="text-6xl animate-bounce drop-shadow-lg grayscale opacity-80">😢</div>
                    )
                )}
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white pt-36 pb-6 mt-4">
                
                {/* Result Display (Only in Game Over context and Weekly tab) */}
                {!isReadOnly && activeTab === 'weekly' && (
                    <div className="text-center px-6 mb-2">
                        <p className="text-6xl font-black text-[#5BB5E0] drop-shadow-sm font-mono mb-2">
                            {finalTime?.toFixed(1)}<span className="text-2xl text-[#87CEEB] ml-1">秒</span>
                        </p>
                        <div className="flex justify-center mb-4">
                            {loading ? (
                                <span className="bg-[#87CEEB] text-white font-bold py-1 px-4 rounded-full text-sm shadow-md animate-pulse">集計中...</span>
                            ) : isRankIn ? (
                                <div className="flex flex-col items-center animate-pop-highlight">
                                    <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-black py-2 px-8 rounded-full text-2xl shadow-lg border-2 border-white transform scale-110">
                                        今週 {rank} 位
                                    </span>
                                </div>
                            ) : (
                                <span className="bg-gray-400 text-white font-bold py-1 px-4 rounded-full text-sm shadow-md">ランク外...</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Name Input Logic (Only if Rank In) */}
                {!isReadOnly && activeTab === 'weekly' && isRankIn && !submitted && showNameInput && (
                    <div className="mx-6 mb-6 animate-slide-in-bottom bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="text-center mb-2">
                            <p className="text-[#5D4037] font-bold text-sm">お名前を記録しませんか？？</p>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowNameInput(false)} className="absolute -top-10 -right-2 w-8 h-8 btn-clay btn-clay-vanilla text-gray-500 rounded-full flex items-center justify-center z-10 text-lg font-black leading-none pb-1">×</button>
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
                                <button type="submit" disabled={!playerName.trim()} className="btn-clay btn-clay-soda p-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Send size={20} strokeWidth={3} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* List Display */}
                <div className="mx-6 mb-6">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-4 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400 animate-pulse font-bold">読み込み中...</div>
                        ) : activeTab === 'weekly' ? (
                            leaderboard.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 text-sm">今週はまだ記録がありません</div>
                            ) : (
                                leaderboard.slice(0, 50).map((entry, index) => { // Top 50 is fine
                                    const isMyEntry = !isReadOnly && submitted && entry.player_name === playerName && finalTime && Math.abs(entry.clear_time - finalTime) < 0.01;
                                    
                                    // Rich Design for Top 3
                                    let rankStyle = '';
                                    let rankIcon = null;
                                    let rankBadgeColor = 'bg-gray-200 text-gray-600';
                                    
                                    if (index === 0) {
                                        rankStyle = 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-[#FFD700] shadow-lg transform scale-[1.02] z-10';
                                        rankBadgeColor = 'bg-[#FFD700] text-white shadow-md ring-2 ring-yellow-200';
                                        rankIcon = <img src="/ui_icon_crown.png" className="w-5 h-5 absolute -top-2 -left-2 animate-bounce" alt="Crown" />;
                                    } else if (index === 1) {
                                        rankStyle = 'bg-white border-2 border-gray-300 shadow-md';
                                        rankBadgeColor = 'bg-gray-300 text-white shadow-sm';
                                    } else if (index === 2) {
                                        rankStyle = 'bg-white border-2 border-orange-200 shadow-md';
                                        rankBadgeColor = 'bg-[#CD7F32] text-white shadow-sm';
                                    } else {
                                        rankStyle = 'bg-white border border-transparent hover:bg-gray-50';
                                    }

                                    if (isMyEntry) {
                                        rankStyle = 'bg-[#FFF9C4] border-2 border-[#FFD700] scale-105 shadow-xl relative z-20';
                                    }

                                    return (
                                        <div key={index} className={`relative flex items-center justify-between p-3 rounded-xl transition-all duration-300 mb-1 ${rankStyle}`}>
                                            {rankIcon}
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-base font-black shrink-0 ${rankBadgeColor}`}>
                                                    {index + 1}
                                                </span>
                                                <span className={`font-bold text-sm truncate max-w-[120px] ${index < 3 ? 'text-[#5D4037] text-base' : 'text-gray-700'}`}>
                                                    {entry.player_name}
                                                </span>
                                            </div>
                                            <span className={`font-mono font-black text-sm whitespace-nowrap ${index < 3 ? 'text-[#FF8C00] text-lg' : 'text-[#5BB5E0]'}`}>
                                                {entry.clear_time.toFixed(1)}s
                                            </span>
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            // Hall of Fame: Name only
                            hallOfFame.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 text-sm">まだ殿堂入りはいません</div>
                            ) : (
                                hallOfFame.map((entry, index) => (
                                    <div key={index} className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-white border border-yellow-100 mb-2">
                                        <div className="flex items-center gap-2">
                                            <img src="/ui_icon_rank_medal.png" alt="Medal" className="w-8 h-8 object-contain" />
                                            <span className="font-black text-[#8D6E63] text-lg">{entry.player_name}</span>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 space-y-3">
                    {!isReadOnly && (
                        <button onClick={onRetry} className="btn-clay btn-clay-orange w-full text-xl py-4 flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                            <RotateCcw className="w-6 h-6" strokeWidth={3} />
                            <span>もう一度遊ぶ！</span>
                        </button>
                    )}
                    
                    <button onClick={handleGoHome} className="btn-clay btn-clay-vanilla w-full text-gray-500 text-lg py-3 flex items-center justify-center gap-2 border-2 border-transparent hover:border-gray-200 shadow-lg active:scale-95 transition-all">
                        <Home className="w-5 h-5" />
                        <span>{isReadOnly ? '閉じる' : 'TOPに戻る'}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
