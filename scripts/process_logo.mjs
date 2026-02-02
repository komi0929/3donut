
import { Jimp } from 'jimp';

const processImage = async (inputPath, outputPath) => {
  try {
    console.log(`Processing: ${inputPath}`);
    const image = await Jimp.read(inputPath);
    
    // Sample background color from top-left pixel
    const bgR = image.bitmap.data[0];
    const bgG = image.bitmap.data[1];
    const bgB = image.bitmap.data[2];
    
    // STANDARD FLOOD FILL (BFS) WITH DONUT WALLS
    // 1. Start from corners.
    // 2. Spread to neighbors if color is similar to BG.
    // 3. STOP if color looks like a Donut (Wall).

    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Base BG
    const baseR = image.bitmap.data[0];
    const baseG = image.bitmap.data[1];
    const baseB = image.bitmap.data[2];
    const baseA = image.bitmap.data[3];
    
    console.log(`Base BG: ${baseR}, ${baseG}, ${baseB}, Alpha: ${baseA}`);

    if (baseA === 0) {
        console.log("Image is already transparent. Skipping removal.");
        await image.write(outputPath);
        return;
    }

    const visited = new Int8Array(width * height); // 0: unvisited, 1: visited/erased
    const queue = [];

    // Helper: Push
    const push = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        const idx = y * width + x;
        if (visited[idx]) return;
        visited[idx] = 1;
        queue.push(idx);
    };

    // Helper: Is this a Donut? (Wall)
    const isDonut = (r, g, b) => {
        // 0. If it matches Background (or close to it), it is NOT a donut wall.
        // This ensures that even if BG is White (and matches White Guard), we treat it as BG.
        const diff = Math.sqrt(
            Math.pow(r - baseR, 2) + 
            Math.pow(g - baseG, 2) + 
            Math.pow(b - baseB, 2)
        );
        if (diff < 60) return false; 

        // Warm (Pink, Yellow, Brown) - Red dominant over Blue
        if (r > b + 30) return true;
        // Green
        if (g > b + 20 && g > r + 10) return true;
        // Blue Guard (The tricky one)
        // BG: R167, G223, B236. (B is highest, but R is high too).
        // Donut: R should be LOW, B should be HIGH.
        // 3. Blue Guard (The tricky one)
        // BG: R167, G223, B236. (B is highest, but R is high too).
        // Donut: R should be LOW, B should be HIGH.
        // Saturation check: B must be > R + 70.
        else if (b > g + 20 && b > r + 90) {
             // STRICTER RED CAP:
             // BG R(~123) + Noise must not trigger this.
             // We require R < 90 and B > R + 90 (High saturation).
             if (r < 90) { 
                 isDonut = true;
             }
        }
        // White (Frosting)
        if (r > 240 && g > 240 && b > 240) return true;
        return false;
    };

    // FORCE ERASE BORDERS (Break any noise seal)
    // 5px margin
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < 5; y++) {
             // Top
             let idx = y * width + x;
             image.bitmap.data[idx * 4 + 3] = 0;
             visited[idx] = 1;
             queue.push(idx);
             
             // Bottom
             let y2 = height - 1 - y;
             idx = y2 * width + x;
             image.bitmap.data[idx * 4 + 3] = 0;
             visited[idx] = 1;
             queue.push(idx);
        }
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < 5; x++) {
             // Left
             let idx = y * width + x;
             image.bitmap.data[idx * 4 + 3] = 0;
             visited[idx] = 1;
             queue.push(idx);
             
             // Right
             let x2 = width - 1 - x;
             idx = y * width + x2;
             image.bitmap.data[idx * 4 + 3] = 0;
             visited[idx] = 1;
             queue.push(idx);
        }
    }

    while (queue.length > 0) {
        const idx = queue.shift();
        const x = idx % width;
        const y = Math.floor(idx / width);
        const imgIdx = idx * 4;

        const r = image.bitmap.data[imgIdx + 0];
        const g = image.bitmap.data[imgIdx + 1];
        const b = image.bitmap.data[imgIdx + 2];

        // CHECK: Is this a wall?
        if (isDonut(r, g, b)) {
            // It's a donut. Do NOT erase. Do NOT spread.
            continue;
        }
        
        // CHECK: Is it Background-ish?
        const diff = Math.sqrt(
            Math.pow(r - baseR, 2) + 
            Math.pow(g - baseG, 2) + 
            Math.pow(b - baseB, 2)
        );

        // Tolerance 70: Eat noise/shadows, but stop at hard edges.
        if (diff < 70) {
            // ERASE
            image.bitmap.data[imgIdx + 3] = 0;
            
            // SPREAD
            push(x + 1, y);
            push(x - 1, y);
            push(x, y + 1);
            push(x, y - 1);
        }
    }

    await image.write(outputPath);
    console.log(`Saved transparent image to: ${outputPath}`);
  } catch (err) {
    console.error('Error processing image:', err);
  }
};

const run = async () => {
    // Check for command line arguments
    const inputArg = process.argv[2];
    const outputArg = process.argv[3];

    // Defaults (Legacy)
    const defaultInput = 'C:/Users/hisak/.gemini/antigravity/brain/67e7dfef-c26c-4df3-9b27-13e3e1133803/logo_source_green_bg_1769990221545.png';
    const defaultOutput = 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/logo_v3.png';

    const inputPath = inputArg || defaultInput;
    const outputPath = outputArg || defaultOutput;

    // Logo
    await processImage(inputPath, outputPath);

    // Favicon (only run if no args provided or specifically requested, otherwise we might overwrite favicon with logo logic)
    // For now, let's just skip favicon if we are processing a specific logo file via args to keep it simple and safe.
    if (!inputArg) {
        // ... legacy favicon logic ...
        try {
            const faviconOutput = 'c:/Users/hisak/OneDrive/デスクトップ/dounut3/public/favicon_v3.png';
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
            // console.error('Error processing favicon:', err);
        }
    }
};

run();
