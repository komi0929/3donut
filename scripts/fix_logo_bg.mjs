import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = 'C:/Users/hisak/.gemini/antigravity/brain/ed8da7f4-1ee8-4bbd-9276-cc4cf2b770df/logo_no_shadow_v1_1770010586687.png';
const OUTPUT = path.join(__dirname, '..', 'public', 'logo_v4.png');

// Target background color: #87CEEB = RGB(135, 206, 235)
const TARGET_R = 135;
const TARGET_G = 206;
const TARGET_B = 235;

async function fixBackground() {
    console.log('Processing logo to fix background color...');
    
    const img = await Jimp.read(INPUT);
    const { width, height } = img.bitmap;
    
    // Sample the corner color as the background to replace
    const cornerIdx = 0; // top-left pixel
    const cornerR = img.bitmap.data[cornerIdx + 0];
    const cornerG = img.bitmap.data[cornerIdx + 1];
    const cornerB = img.bitmap.data[cornerIdx + 2];
    console.log('Corner color:', { r: cornerR, g: cornerG, b: cornerB });
    
    img.scan(0, 0, width, height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // Check if similar to corner background color (within tolerance)
        const diffR = Math.abs(r - cornerR);
        const diffG = Math.abs(g - cornerG);
        const diffB = Math.abs(b - cornerB);
        
        if (diffR < 25 && diffG < 25 && diffB < 25) {
            // Replace with exact target color
            this.bitmap.data[idx + 0] = TARGET_R;
            this.bitmap.data[idx + 1] = TARGET_G;
            this.bitmap.data[idx + 2] = TARGET_B;
        }
    });
    
    await img.write(OUTPUT);
    console.log('Done! Saved to:', OUTPUT);
}

fixBackground().catch(console.error);
