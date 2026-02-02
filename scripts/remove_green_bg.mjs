import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = 'C:/Users/hisak/.gemini/antigravity/brain/ed8da7f4-1ee8-4bbd-9276-cc4cf2b770df/logo_greenscreen_1770010966858.png';
const OUTPUT = path.join(__dirname, '..', 'public', 'logo_v4.png');

async function removeGreenBackground() {
    console.log('Processing logo to remove green screen...');
    
    const img = await Jimp.read(INPUT);
    const { width, height } = img.bitmap;
    
    console.log(`Image size: ${width}x${height}`);

    img.scan(0, 0, width, height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // Green screen detection: High Green, Low Red/Blue
        // Pure green is 0, 255, 0
        
        // Condition: Green is dominant and bright
        if (g > 200 && r < 100 && b < 100) {
            this.bitmap.data[idx + 3] = 0; // Transparent
        } 
        // Semi-transparent edge handling (anti-aliasing)
        else if (g > r + 50 && g > b + 50) {
            // Feather the edge
            const alpha = 255 - (g - Math.max(r, b));
            if (alpha < 255) {
               // this.bitmap.data[idx + 3] = alpha; 
               // For safety, let's just make it transparent if it's too green to avoid halos
               if (g > 150) this.bitmap.data[idx + 3] = 0;
            }
        }
    });
    
    await img.write(OUTPUT);
    console.log('Done! Saved to:', OUTPUT);
}

removeGreenBackground().catch(console.error);
