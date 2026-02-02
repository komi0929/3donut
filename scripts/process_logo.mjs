
import { Jimp } from 'jimp';

const processImage = async (inputPath, outputPath) => {
  try {
    console.log(`Processing: ${inputPath}`);
    const image = await Jimp.read(inputPath);
    
    // Scan all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // Target LIME GREEN (#00FF00)
      // Green is high, Red and Blue are low.
      // E.g. R < 100, B < 100, G > 200
      
      /*
        Tolerance logic:
        Pure green is (0, 255, 0).
        Let's be generous but careful not to kill pastel green (if any).
        Pastel colors usually have high R and B too.
        Pure/Lime green has low R/B.
      */
      
      if (green > 150 && red < 100 && blue < 100) {
        this.bitmap.data[idx + 3] = 0; // Transparent
      } else {
        // Also catch "anti-aliased" green edges.
        // If green is significantly dominant over R and B
        if (green > red + 50 && green > blue + 50) {
             // A bit riskier, let's just do semi-transparency or hard cut?
             // Hard cut is cleaner for logos usually.
             this.bitmap.data[idx + 3] = 0;
        }
      }
    });

    await image.write(outputPath);
    console.log(`Saved transparent image to: ${outputPath}`);
  } catch (err) {
    console.error('Error processing image:', err);
  }
};

const run = async () => {
    // Generate new filenames to bust cache
    const logoOutput = 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/logo_v3.png';
    const faviconOutput = 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/favicon_v3.png';

    // Logo
    await processImage(
        'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/logo_source_green_bg_1769990221545.png',
        logoOutput
    );

    // Favicon
    try {
        const faviconInput = 'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/favicon_source_green_bg_1769990235117.png';
        const image = await Jimp.read(faviconInput);
        
        // Remove green
         image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            
            if (green > 150 && red < 100 && blue < 100) {
                this.bitmap.data[idx + 3] = 0;
            } else if (green > red + 50 && green > blue + 50) {
                 this.bitmap.data[idx + 3] = 0;
            }
        });
        
        await image.resize({ w: 64, h: 64 }).write(faviconOutput);
        console.log(`Saved transparent favicon to: ${faviconOutput}`);
    } catch(err) {
        console.error('Error processing favicon:', err);
    }
};

run();
