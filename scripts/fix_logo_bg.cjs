const { Jimp } = require('jimp');
const path = require('path');

const INPUT = 'C:/Users/hisak/.gemini/antigravity/brain/ed8da7f4-1ee8-4bbd-9276-cc4cf2b770df/logo_decorated_v1_1770010267787.png';
const OUTPUT = path.join(__dirname, '..', 'public', 'logo_v4.png');

// Target background color: #87CEEB = RGB(135, 206, 235)
const TARGET_R = 135;
const TARGET_G = 206;
const TARGET_B = 235;

async function fixBackground() {
    console.log('Processing logo to fix background color...');
    
    const img = await Jimp.read(INPUT);
    const w = img.getWidth();
    const h = img.getHeight();
    
    // Sample the corner color as the background to replace
    const cornerColor = img.getPixelColor(5, 5);
    const cornerRGBA = Jimp.intToRGBA(cornerColor);
    console.log('Corner color:', cornerRGBA);
    
    img.scan(0, 0, w, h, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // Check if similar to corner background color (within tolerance)
        const diffR = Math.abs(r - cornerRGBA.r);
        const diffG = Math.abs(g - cornerRGBA.g);
        const diffB = Math.abs(b - cornerRGBA.b);
        
        if (diffR < 30 && diffG < 30 && diffB < 30) {
            // Replace with exact target color
            this.bitmap.data[idx + 0] = TARGET_R;
            this.bitmap.data[idx + 1] = TARGET_G;
            this.bitmap.data[idx + 2] = TARGET_B;
        }
    });
    
    await img.writeAsync(OUTPUT);
    console.log('Done! Saved to:', OUTPUT);
}

fixBackground().catch(console.error);
