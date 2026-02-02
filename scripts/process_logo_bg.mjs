import pkg from 'jimp';
const Jimp = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = path.join(__dirname, '..', 'public', 'logo_v4.png');
const OUTPUT = path.join(__dirname, '..', 'public', 'logo_v4_clean.png');

async function removeBackground() {
    console.log('Processing logo to remove background...');
    
    const img = await Jimp.read(INPUT);
    const w = img.getWidth();
    const h = img.getHeight();
    
    // Get the background color from top-left corner (should be the checker pattern or solid)
    // We'll make gray tones transparent (the checker pattern is gray)
    
    img.scan(0, 0, w, h, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // Check if pixel is part of the checker pattern (gray tones)
        // Checker pattern typically alternates between light and dark gray
        const isGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15;
        const isLightGray = isGray && r > 100 && r < 220;
        const isDarkGray = isGray && r > 70 && r < 130;
        
        if (isLightGray || isDarkGray) {
            // Make transparent
            this.bitmap.data[idx + 3] = 0;
        }
    });
    
    await img.writeAsync(OUTPUT);
    console.log('Done! Saved to:', OUTPUT);
}

removeBackground().catch(console.error);
