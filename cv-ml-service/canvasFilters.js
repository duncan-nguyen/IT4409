/**
 * Canvas-based Image Filters
 * Implements basic image processing filters using Canvas API
 */

import { VIDEO_CONFIG } from './constants.js';

/**
 * Applies grayscale filter to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function applyGrayscale(ctx) {
    const imageData = ctx.getImageData(0, 0, VIDEO_CONFIG.WIDTH, VIDEO_CONFIG.HEIGHT);
    const data = imageData.data;
    
    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Calculate grayscale using luminosity method
        const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
        
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        // Alpha channel (data[i + 3]) remains unchanged
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Applies blur filter to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} radius - Blur radius (default: 5)
 */
export function applyBlur(ctx, radius = 5) {
    const imageData = ctx.getImageData(0, 0, VIDEO_CONFIG.WIDTH, VIDEO_CONFIG.HEIGHT);
    const blurred = boxBlur(imageData, radius);
    ctx.putImageData(blurred, 0, 0);
}

/**
 * Box blur algorithm for blur effect
 * @param {ImageData} imageData - Source image data
 * @param {number} radius - Blur radius
 * @returns {ImageData} - Blurred image data
 */
function boxBlur(imageData, radius) {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            for (let kx = -radius; kx <= radius; kx++) {
                const px = Math.min(width - 1, Math.max(0, x + kx));
                const offset = (y * width + px) * 4;
                
                r += src[offset];
                g += src[offset + 1];
                b += src[offset + 2];
                a += src[offset + 3];
                count++;
            }
            
            const dstOffset = (y * width + x) * 4;
            dst[dstOffset] = r / count;
            dst[dstOffset + 1] = g / count;
            dst[dstOffset + 2] = b / count;
            dst[dstOffset + 3] = a / count;
        }
    }
    
    // Vertical pass
    const temp = new Uint8ClampedArray(dst);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            for (let ky = -radius; ky <= radius; ky++) {
                const py = Math.min(height - 1, Math.max(0, y + ky));
                const offset = (py * width + x) * 4;
                
                r += temp[offset];
                g += temp[offset + 1];
                b += temp[offset + 2];
                a += temp[offset + 3];
                count++;
            }
            
            const dstOffset = (y * width + x) * 4;
            dst[dstOffset] = r / count;
            dst[dstOffset + 1] = g / count;
            dst[dstOffset + 2] = b / count;
            dst[dstOffset + 3] = a / count;
        }
    }
    
    return new ImageData(dst, width, height);
}

/**
 * Applies brightness adjustment
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} brightness - Brightness value (-255 to 255)
 */
export function applyBrightness(ctx, brightness) {
    const imageData = ctx.getImageData(0, 0, VIDEO_CONFIG.WIDTH, VIDEO_CONFIG.HEIGHT);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + brightness));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Applies contrast adjustment
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} contrast - Contrast value (0 to 2, 1 = no change)
 */
export function applyContrast(ctx, contrast) {
    const imageData = ctx.getImageData(0, 0, VIDEO_CONFIG.WIDTH, VIDEO_CONFIG.HEIGHT);
    const data = imageData.data;
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
    
    ctx.putImageData(imageData, 0, 0);
}

