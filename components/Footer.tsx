import React from 'react';

interface FooterProps {
  hideLinks?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ hideLinks = false }) => {
  return (
    <footer className="w-full py-4 px-4 text-xs mt-auto bg-white/0 backdrop-blur-0 text-white border-none">
      <div className="max-w-md mx-auto flex flex-col items-center gap-2">
        
        {/* Links - Hidden on Title Screen if requested */}


        {/* Branding */}
        <div className="text-center opacity-80 mt-2">
          <p className="mb-0 text-[8px] uppercase tracking-widest opacity-70 font-sans">Produced by</p>
          <a 
            href="https://soystories.jp/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-lg font-bold tracking-wider hover:text-[#fff] transition-colors font-['M_PLUS_Rounded_1c']"
          >
            SoyStories
          </a>
        </div>
        
      </div>
    </footer>
  );
};
