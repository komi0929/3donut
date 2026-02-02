
import { Jimp } from 'jimp';

const run = async () => {
    const input = 'C:/Users/hisak/.gemini/antigravity/brain/ed8da7f4-1ee8-4bbd-9276-cc4cf2b770df/donut_rainbow_topdown_magenta_bg_1769997087682.png';
    const output = 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/favicon.png';

    try {
        console.log(`Processing: ${input}`);
        const image = await Jimp.read(input);

        // Remove Magenta Background
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            
            // MAGENTA (#FF00FF) logic
            if (red > 200 && blue > 200 && green < 100) {
                this.bitmap.data[idx + 3] = 0;
            } else if (red > 150 && blue > 150 && red > green + 60) {
                 this.bitmap.data[idx + 3] = 0;
            }
        });

        image.autocrop({ tolerance: 0.05 });
        
        // Resize to standard favicon size
        image.resize({ w: 64, h: 64 });

        await image.write(output);
        console.log(`Saved favicon to: ${output}`);

    } catch (err) {
        console.error('Error generating favicon:', err);
    }
};

run();
