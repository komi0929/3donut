import React from 'react';
import { DonutType } from '../types';
import { DONUT_COLORS } from '../constants';

interface DonutProps {
  type: DonutType;
  imageUrl?: string;
  isSelected: boolean;
  isMatched: boolean;
  special?: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'RAINBOW';
}

export const Donut: React.FC<DonutProps> = ({ type, isSelected, isMatched, special }) => {
  const colors = DONUT_COLORS[type];

  const getSpecialClass = () => {
    switch (type) {
      case DonutType.GOLD: return 'effect-gold';
      case DonutType.SILVER: return 'effect-silver';
      case DonutType.RAINBOW: return 'effect-rainbow';
      default: return '';
    }
  };

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center transition-all duration-300 gpu-layer ${
        isMatched ? 'animate-clear' : isSelected ? 'scale-110' : 'animate-wobble'
      }`}
      style={{
        transform: isSelected ? 'translate3d(0, -10px, 0)' : 'translate3d(0,0,0)',
        filter: isSelected ? 'drop-shadow(0 20px 25px rgba(0,0,0,0.25))' : 'none',
      }}
    >
      {/* 選択時の後光 */}
      {isSelected && (
        <div className="absolute inset-[-10%] bg-white/40 rounded-full animate-pulse blur-2xl z-[-1]" />
      )}
      
      {/* 3D Asset Image */}
      <div className="w-full h-full relative">
          <img 
            src={colors.img} 
            alt={type} 
            className={`w-full h-full object-contain drop-shadow-md ${getSpecialClass()}`}
          />

          {/* Sparkle effects for special donuts */}
          {(type === DonutType.GOLD || type === DonutType.SILVER) && (
            <div className="absolute inset-0 pointer-events-none sparkle-overlay">
              {/* Star sparkles */}
              <div className="absolute top-[10%] left-[20%] text-xl twinkle" style={{ animationDelay: '0s' }}>✦</div>
              <div className="absolute top-[30%] right-[15%] text-lg twinkle" style={{ animationDelay: '0.3s' }}>✧</div>
              <div className="absolute bottom-[20%] left-[15%] text-sm twinkle" style={{ animationDelay: '0.5s' }}>✦</div>
              <div className="absolute bottom-[35%] right-[25%] text-xs twinkle" style={{ animationDelay: '0.7s' }}>✧</div>
            </div>
          )}

          {type === DonutType.RAINBOW && (
            <div className="absolute inset-[-15%] pointer-events-none">
              {/* Rainbow glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-conic from-red-500 via-yellow-500 via-green-500 via-blue-500 to-red-500 opacity-30 blur-lg animate-spin-slow" />
              {/* Sparkles */}
              <div className="absolute inset-0 sparkle-overlay">
                <div className="absolute top-[5%] left-[50%] text-xl twinkle text-yellow-300" style={{ animationDelay: '0s' }}>★</div>
                <div className="absolute top-[50%] right-[5%] text-lg twinkle text-pink-300" style={{ animationDelay: '0.2s' }}>★</div>
                <div className="absolute bottom-[5%] left-[50%] text-xl twinkle text-cyan-300" style={{ animationDelay: '0.4s' }}>★</div>
                <div className="absolute top-[50%] left-[5%] text-lg twinkle text-green-300" style={{ animationDelay: '0.6s' }}>★</div>
              </div>
            </div>
          )}

          {/* Special Effects Overlay */}
          {special === 'HORIZONTAL' && (
            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                <div className="w-[120%] h-1 bg-white animate-pulse blur-[1px] shadow-[0_0_10px_white]" />
                <div className="absolute w-[140%] h-[2px] bg-white opacity-80" />
            </div>
          )}
          {special === 'VERTICAL' && (
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                <div className="h-[120%] w-1 bg-white animate-pulse blur-[1px] shadow-[0_0_10px_white]" />
                <div className="absolute h-[140%] w-[2px] bg-white opacity-80" />
            </div>
          )}
          {special === 'RAINBOW' && (
            <div className="absolute inset-[-10%] rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 opacity-40 mix-blend-overlay animate-spin-slow pointer-events-none" style={{ filter: 'blur(4px)' }} />
          )}
      </div>
    </div>
  );
};