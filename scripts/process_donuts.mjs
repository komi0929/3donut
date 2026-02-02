import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

// Target size - matches the "good" donuts (256x256 is standard)
const TARGET_SIZE = 256;

const processImage = async (inputPath, outputPath, bgColor = 'green', scaleBoost = null) => {
  try {
    console.log(`Processing: ${path.basename(inputPath)}`);
    const image = await Jimp.read(inputPath);
    const { width, height } = image.bitmap;

    // 1. CHROMA KEY - Remove background
    image.scan(0, 0, width, height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      let isBackground = false;

      if (bgColor === 'green') {
        // Green screen removal - be aggressive
        if (green > red + 15 && green > blue + 15 && green > 40) {
          isBackground = true;
        }
      } else if (bgColor === 'magenta') {
        // Magenta screen removal
        if (red > green + 15 && blue > green + 15 && red > 80 && blue > 80) {
          isBackground = true;
        }
      }

      if (isBackground) {
        this.bitmap.data[idx + 3] = 0;
      }
    });

    // 2. AUTOCROP - Remove transparent edges
    image.autocrop({ tolerance: 0.002, cropOnlyFrames: false });
    
    const croppedW = image.bitmap.width;
    const croppedH = image.bitmap.height;
    console.log(`  Cropped to: ${croppedW}x${croppedH}`);

    // 3. FORCE RESIZE TO EXACT TARGET
    // Use cover to ensure it fills the space, then center-crop if needed
    // Or better: resize to fit, then pad with transparent pixels
    
    // Calculate scale to make the donut fill ~90% of the target (small margin)
    const usableSize = Math.floor(TARGET_SIZE * 0.92); // Allow 8% margin for shadows/effects
    let scale = usableSize / Math.max(croppedW, croppedH);
    
    // Apply boost for specific assets that appear smaller
    if (scaleBoost) {
      scale *= scaleBoost;
      console.log(`  Applied scale boost: ${scaleBoost}`);
    }
    
    const newW = Math.round(croppedW * scale);
    const newH = Math.round(croppedH * scale);
    
    image.resize({ w: newW, h: newH });
    console.log(`  Resized to: ${newW}x${newH}`);

    // 4. CENTER ON TRANSPARENT CANVAS
    const canvas = new Jimp({ width: TARGET_SIZE, height: TARGET_SIZE, color: 0x00000000 });
    const xOffset = Math.floor((TARGET_SIZE - newW) / 2);
    const yOffset = Math.floor((TARGET_SIZE - newH) / 2);
    
    canvas.composite(image, xOffset, yOffset);

    await canvas.write(outputPath);
    console.log(`  Saved: ${path.basename(outputPath)} (${TARGET_SIZE}x${TARGET_SIZE})`);

  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err);
  }
};

const run = async () => {
    const brainDir = 'C:/Users/hisak/.gemini/antigravity/brain';
    const outputDir = 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public';
    
    // All assets with correct paths
    const assets = [
        // Original 6 donuts (from previous conversation)
        {
            input: `${brainDir}/67e7dfef-c26c-4df3-9b27-13e3e1133803/donut_chocolate_v2_1769993409700.png`,
            output: `${outputDir}/donut_chocolate.png`,
            bg: 'green'
        },
        {
            input: `${brainDir}/67e7dfef-c26c-4df3-9b27-13e3e1133803/donut_blue_v5_1769994587209.png`,
            output: `${outputDir}/donut_soda.png`,
            bg: 'green'
        },
        {
            input: `${brainDir}/67e7dfef-c26c-4df3-9b27-13e3e1133803/donut_strawberry_v2_1769993441738.png`,
            output: `${outputDir}/donut_strawberry.png`,
            bg: 'green'
        },
        {
            input: `${brainDir}/67e7dfef-c26c-4df3-9b27-13e3e1133803/donut_lemon_v2_1769993456016.png`,
            output: `${outputDir}/donut_lemon.png`,
            bg: 'green'
        },
        {
            input: `${brainDir}/67e7dfef-c26c-4df3-9b27-13e3e1133803/donut_vanilla_v2_1769993473940.png`,
            output: `${outputDir}/donut_vanilla.png`,
            bg: 'green'
        },
        {
            input: `${brainDir}/67e7dfef-c26c-4df3-9b27-13e3e1133803/donut_matcha_v5_magenta_1769994572030.png`,
            output: `${outputDir}/donut_matcha.png`,
            bg: 'magenta'
        },
        // Special donuts (V3 from current conversation)
        {
            input: `${brainDir}/ed8da7f4-1ee8-4bbd-9276-cc4cf2b770df/donut_gold_v3_1769998299149.png`,
            output: `${outputDir}/donut_gold.png`,
            bg: 'green',
            boost: 1.06  // Gold is narrower, boost by 6%
        },
        {
            input: `${brainDir}/ed8da7f4-1ee8-4bbd-9276-cc4cf2b770df/donut_silver_v3_1769998316088.png`,
            output: `${outputDir}/donut_silver.png`,
            bg: 'green'
        },
        {
            input: `${brainDir}/ed8da7f4-1ee8-4bbd-9276-cc4cf2b770df/donut_rainbow_v3_1769998330566.png`,
            output: `${outputDir}/donut_rainbow.png`,
            bg: 'magenta'
        }
    ];

    console.log("Starting donut processing with FIXED sizing...\n");

    for (const asset of assets) {
        if (fs.existsSync(asset.input)) {
            await processImage(asset.input, asset.output, asset.bg, asset.boost || null);
        } else {
            console.error(`MISSING: ${path.basename(asset.input)}`);
        }
    }
    
    console.log("\n=== Processing complete ===");
};

run();
