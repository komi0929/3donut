import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { EffectsLayer, EffectsLayerHandle } from './components/EffectsLayer';
import { FeverGauge } from './components/FeverGauge';
import { GameState } from './types';
import { COLORS, TARGET_CLEARS, TIME_LIMIT } from './constants';
import { Play, RotateCcw, Star, Trophy, Medal, Timer, AlertTriangle } from 'lucide-react';
import { soundManager } from './services/audio';
import { Footer } from './components/Footer';
import { Ranking } from './components/Ranking';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INIT);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [clearedCount, setClearedCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  
  // Fever state
  const [feverValue, setFeverValue] = useState(0);
  const [isFever, setIsFever] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(TIME_LIMIT);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number>(0);
  
  // Effects layer ref
  const effectsRef = useRef<EffectsLayerHandle>(null);

  // Timer & Emergency SFX Loop
  useEffect(() => {
    let timerInterval: number;
    
    if (gameState === GameState.PLAYING) {
      timerInterval = window.setInterval(() => {
         setTimeLeft(prev => {
           const next = prev - 0.1;

           // Time Up Check
           if (next <= 0) {
             soundManager.playTimeUp();
             setGameState(GameState.GAME_OVER);
             return 0;
           }

           // Audio Cues
           if (next <= 10 && Math.floor(next) < Math.floor(prev)) {
              if (next <= 5) soundManager.playAlarm();
              else soundManager.playTick();
           }
           
           return next;
         });
      }, 100);
    }

    return () => clearInterval(timerInterval);
  }, [gameState]);

  useEffect(() => {
    let feverInterval: number;
    if (isFever) {
      feverInterval = window.setInterval(() => {
        setFeverValue(prev => {
          if (prev <= 0) {
            setIsFever(false);
            return 0;
          }
          return prev - 0.5; // Drain speed
        });
      }, 50);
    }
    return () => clearInterval(feverInterval);
  }, [isFever]);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  // Urgency Logic: 0 (Safe), 1 (Caution: <10s), 2 (Danger: <5s)
  // 背景色: 通常(青) -> 注意(オレンジ/紫) -> 危険(赤/黒)
  // PLAYING状態以外ではurgencyLevelを0にリセット
  const urgencyLevel = gameState === GameState.PLAYING 
    ? (timeLeft <= 5 ? 2 : (timeLeft <= 15 ? 1 : 0))
    : 0;
  
  const getBackgroundColor = () => {
    if (urgencyLevel === 2) return `linear-gradient(to bottom, #330000 0%, #cc0000 100%)`;
    if (urgencyLevel === 1) return `linear-gradient(to bottom, #4A148C 0%, #FF8C00 100%)`; // Evening/Sunset tension
    if (isFever) return `linear-gradient(to bottom, #2c003e 0%, #ff007f 100%)`;
    return `linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 100%)`;
  };

  const appStyle: React.CSSProperties = {
    background: assets['background'] 
      ? `url(${assets['background']}) no-repeat center center / cover` 
      : getBackgroundColor(),
    transition: 'background 1s ease',
    fontFamily: '"Varela Round", "M PLUS Rounded 1c", sans-serif',
    color: COLORS.text,
    touchAction: 'none',
  };

  const startGame = () => {
    setClearedCount(0);
    setFeverValue(0);
    setIsFever(false);
    setTimeLeft(TIME_LIMIT);
    setStartTime(Date.now());
    setFinalTime(0);
    setGameState(GameState.PLAYING);
  };

  const handleClear = useCallback((count: number, comboCount: number) => {
    // Fever Gauge Logic
    if (!isFever) {
       setFeverValue(prev => {
         const gain = count * (comboCount + 1) * 1.5;
         const next = Math.min(100, prev + gain);
         if (next >= 100) {
            setIsFever(true);
            soundManager.playFeverStart();
         }
         return next;
       });
    }

    setClearedCount(prev => {
        const newCount = prev + count;
        if (newCount >= TARGET_CLEARS && gameState === GameState.PLAYING) {
             const endTime = Date.now();
             setFinalTime((endTime - startTime) / 1000);
             // 勝利サウンド再生
             soundManager.playWin();
             setTimeout(() => setGameState(GameState.WIN), 500);
        }
        return newCount;
    });
  }, [gameState, startTime, isFever]);

  // パーティクル発生ハンドラ
  const handleParticle = useCallback((x: number, y: number, color: string, count?: number) => {
    effectsRef.current?.spawnParticles(x, y, color, count);
  }, []);

  // シェイクハンドラ
  const handleShake = useCallback(() => {
    setIsShaking(true);
    effectsRef.current?.triggerShake();
    setTimeout(() => setIsShaking(false), 300);
  }, []);

  const renderInit = () => (
    <div className="flex flex-col items-center justify-center h-full pb-32 pt-20 text-center animate-fade-in relative z-10 w-full max-w-md mx-auto select-none pointer-events-none">
        
        {/* HERO SECTION: Logo & Title */}
        <div className="flex-1 flex flex-col justify-center items-center w-full min-h-[40vh]">
            <img 
                src="/logo_v8.png" 
                alt="3DONUT" 
                className="w-[90%] drop-shadow-2xl animate-poyon object-contain mx-auto" 
            />
            
            {/* Catchcopy / Description */}
            <div className="mt-8 space-y-2">

                <p className="text-white font-bold text-lg drop-shadow-sm opacity-90 whitespace-pre-wrap leading-relaxed">
                    同じドーナツを3つ並べて{'\n'}どんどん消していこう！！
                </p>
            </div>
        </div>

        {/* ACTION SECTION: Start Button */}
        <div className="w-full px-12 pt-8 pointer-events-auto flex justify-center">
            <button
                onClick={startGame}
                className="btn-clay btn-clay-strawberry w-full max-w-[260px] text-4xl py-6 transition-transform duration-200 active:scale-95 animate-poyon-delay"
            >
                <Play className="w-10 h-10 mr-2" fill="white" />
                START
            </button>
        </div>
    </div>
  );



  return (
    <div 
      className={`relative w-full h-[100dvh] overflow-hidden select-none ${isShaking ? 'animate-shake' : ''} ${urgencyLevel === 2 ? 'animate-pulse-red' : ''}`} 
      style={appStyle}
    >
      {/* Effects Canvas Layer */}
      <EffectsLayer ref={effectsRef} onShakeChange={setIsShaking} />

      {/* Fever Gauge */}
      {gameState === GameState.PLAYING && (
          <FeverGauge value={feverValue} isActive={isFever} />
      )}

      {/* HUD */}
      {gameState === GameState.PLAYING && (
        <header className="absolute top-4 left-0 right-0 px-6 z-20 pointer-events-none">
            <div className={`bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl border-4 flex items-center justify-between max-w-md mx-auto transition-colors duration-300 ${urgencyLevel === 2 ? 'border-red-500 bg-red-100' : 'border-white'}`}>
                {/* Score */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-[#8D6E63]">{urgencyLevel === 2 ? "HURRY UP!" : "Objective"}</span>
                  <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#FF6347]">{clearedCount}</span>
                      <span className="text-lg font-bold text-[#8D6E63]">/ {TARGET_CLEARS}</span>
                  </div>
                </div>

                {/* Timer */}
                <div className={`flex flex-col items-end ml-4 transition-transform duration-300 ${urgencyLevel > 0 ? 'scale-110' : ''}`}>
                  <span className="text-[10px] font-black uppercase text-[#8D6E63]">{urgencyLevel === 2 ? "DANGER!" : (urgencyLevel === 1 ? "HURRY!" : "TIME LIMIT")}</span>
                  <div className={`flex items-center gap-1 text-3xl font-black transition-colors ${urgencyLevel === 2 ? 'text-red-600 animate-pulse' : (urgencyLevel === 1 ? 'text-orange-500' : 'text-[#5D4037]')}`}>
                      <img src="/ui_icon_timer.png" alt="Timer" className={`w-8 h-8 object-contain ${urgencyLevel > 0 ? 'animate-bounce' : ''}`} />
                      {Math.ceil(timeLeft)}
                  </div>
                </div>
            </div>
        </header>
      )}

      <main className="w-full h-full flex flex-col items-center justify-center">
          {gameState === GameState.INIT && renderInit()}
          {gameState === GameState.PLAYING && (
              <div className="mt-20 w-full">
                  <GameBoard 
                    assets={assets} 
                    onClear={handleClear} 
                    onMove={() => {}} 
                    isInteractable={true} 
                    clearedCount={clearedCount}
                    onParticle={handleParticle}
                    onShake={handleShake}
                    isFever={isFever}
                  />
              </div>
          )}
      </main>

      {/* Game Over Screen (Time Up) - Matching TOP page blue gradient */}
      {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
               style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #E0F4FF 100%)' }}>

              {/* Main Card */}
              <div className="relative w-full max-w-sm">
                  {/* Sad emoji floating above */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
                      <div className="text-6xl animate-bounce drop-shadow-lg">😢</div>
                  </div>
                  
                  {/* Card Container */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white pt-14 pb-6">
                      
                      {/* Header - minimal */}
                      <div className="text-center px-6 mb-4">
                          <h2 className="text-2xl font-black text-gray-500">
                              タイムアップ
                          </h2>
                      </div>

                      {/* Score Display */}
                      <div className="mx-6 mb-6 text-center">
                          <div className="flex items-baseline justify-center gap-1">
                              <span className="text-6xl font-black text-[#5BB5E0] font-mono">{clearedCount}</span>
                              <span className="text-2xl font-bold text-gray-400">/ {TARGET_CLEARS}</span>
                          </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-6 space-y-3">
                          {/* Retry Button - Orange like TOP page */}
                          {/* Retry Button - Clay Orange */}
                          <button 
                              onClick={startGame}
                              className="btn-clay btn-clay-orange w-full text-xl py-4 flex items-center justify-center gap-2"
                          >
                              <RotateCcw className="w-6 h-6" strokeWidth={3} />
                              <span>もう一度</span>
                          </button>
                          
                          {/* Home Button */}
                          {/* Home Button - Clay White/Vanilla */}
                          <button 
                              onClick={() => setGameState(GameState.INIT)}
                              className="btn-clay btn-clay-vanilla w-full text-gray-500 text-lg py-3 flex items-center justify-center gap-2 border-2 border-transparent hover:border-gray-200"
                          >
                              <span>🏠</span>
                              <span>TOPに戻る</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* WIN -> Ranking Display */}
      {gameState === GameState.WIN && (
          <Ranking finalTime={finalTime} onRetry={startGame} onHome={() => setGameState(GameState.INIT)} />
      )}

      {/* Footer */}
      <div className="absolute bottom-0 w-full z-40">
        <Footer hideLinks={gameState === GameState.INIT} />
      </div>
    </div>
  );
};

export default App;