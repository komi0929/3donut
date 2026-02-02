
import { Jimp } from 'jimp';

const processImage = async (inputPath, outputPath, resizeConfig = null) => {
  try {
    console.log(`Processing: ${inputPath}`);
    const image = await Jimp.read(inputPath);
    
    // Scan all pixels for Green Screen removal
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // Target LIME GREEN (#00FF00)
      if (green > 150 && red < 100 && blue < 100) {
        this.bitmap.data[idx + 3] = 0; // Transparent
      } else if (green > red + 50 && green > blue + 50) {
        this.bitmap.data[idx + 3] = 0;
      }
    });

    // Crop transparent pixels
    image.autocrop();

    if (resizeConfig) {
        let { w, h } = resizeConfig;
        const currentW = image.bitmap.width;
        const currentH = image.bitmap.height;

        console.log(`Original Size: ${currentW}x${currentH}, Target: ${w}x${h}`);

        if (h === -1) {
            h = Math.round(currentH * (w / currentW));
        } else if (w === -1) {
            w = Math.round(currentW * (h / currentH));
        }
        
        console.log(`Resizing to: ${w}x${h}`);
        if(w > 0 && h > 0) {
            image.resize({ w: w, h: h });
        }
    }

    await image.write(outputPath);
    console.log(`Saved transparent image to: ${outputPath}`);
  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err);
  }
};

const run = async () => {
    const assets = [
        {
            input: 'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/ui_btn_start_green_bg_v2_1769990652231.png',
            output: 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/ui_btn_start.png',
            resize: { w: 300, h: -1 } // -1 means Jimp.AUTO
        },
        {
            input: 'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/ui_btn_retry_green_bg_1769990422168.png',
            output: 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/ui_btn_retry.png',
            resize: { w: 300, h: -1 }
        },
        {
            input: 'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/ui_icon_trophy_green_bg_1769990438006.png',
            output: 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/ui_icon_trophy.png',
            resize: { w: 128, h: 128 }
        },
        {
            input: 'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/ui_icon_timer_green_bg_1769990452214.png',
            output: 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/ui_icon_timer.png',
            resize: { w: 64, h: 64 }
        },
        {
            input: 'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/ui_icon_crown_green_bg_1769990485803.png',
            output: 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/ui_icon_crown.png',
            resize: { w: 64, h: 64 }
        }
    ];

    for (const asset of assets) {
        await processImage(asset.input, asset.output, asset.resize);
    }
};

run();
