import React from 'react';
import { Zap } from 'lucide-react';

interface FeverGaugeProps {
  value: number; // 0-100
  isActive: boolean;
}

export const FeverGauge: React.FC<FeverGaugeProps> = ({ value, isActive }) => {
  return (
    <div className="absolute top-24 right-4 z-20 flex flex-col items-center pointer-events-none">
      <div className="relative h-48 w-6 bg-black/20 rounded-full border-2 border-white overflow-hidden shadow-inner">
        {/* Background strip */}
        <div className="absolute inset-0 bg-white/10" />
        
        {/* Gauge Fill */}
        <div 
          className={`absolute bottom-0 w-full transition-all duration-300 ${isActive ? 'animate-pulse' : ''}`}
          style={{ 
            height: `${value}%`,
            background: isActive 
              ? 'linear-gradient(to top, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)' 
              : 'linear-gradient(to top, #FFD700, #FFA500)'
          }}
        >
          {/* Glare */}
          <div className="absolute top-0 w-full h-1 bg-white/50 blur-[1px]" />
        </div>

        {/* Icons */}
        <div className="absolute bottom-2 w-full flex justify-center text-white/50">
           {/* Removed Zap icon */}
        </div>
      </div>
      
      {/* Label or MAX Display */}
      {isActive && (
        <div className="absolute -bottom-8 animate-bounce">
            <span className="text-xl font-black text-[#FFD700] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">FEVER!</span>
        </div>
      )}
    </div>
  );
};
