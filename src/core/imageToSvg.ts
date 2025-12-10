/**
 * Image to SVG Conversion
 * 
 * Converts raster images (PNG, JPG) to SVG format.
 * 
 * LIMITATIONS:
 * - Browser-based vectorization is limited. This implementation uses a simple
 *   approach that traces the image to paths, but quality may vary.
 * - For production use, consider server-side vectorization tools like Potrace
 *   or ImageMagick for better quality.
 * - The output will be vector paths, but may not perfectly match the original
 *   raster image, especially for complex images with gradients or photos.
 */

import type { ConvertOptions } from './types';
import { normalizeSvg } from './svgNormalize';

/**
 * Converts a raster image file to BIMI-compliant SVG
 */
export async function imageToSvg(
  file: File,
  options: ConvertOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      try {
        const svg = rasterToSvg(img, options);
        resolve(svg);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Converts a loaded image to SVG using canvas-based tracing
 */
function rasterToSvg(img: HTMLImageElement, options: ConvertOptions): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to match image
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw image to canvas
  ctx.drawImage(img, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Simple vectorization: create paths from image data
  // This is a simplified approach - for better quality, use a proper tracing library
  const threshold = 10; // Lower threshold to capture more details (gradients, shadows)

  // Create a simple path by tracing the alpha channel
  // This is a very basic implementation - production would use more sophisticated algorithms
  const { paths: svgPaths, regions } = traceImageData(imageData, threshold);

  // Create SVG structure with viewBox matching image dimensions
  // The normalizeSvg function will later scale it to 100x100 and add padding
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);
  svg.setAttribute('width', String(canvas.width));
  svg.setAttribute('height', String(canvas.height));
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add paths as a group
  if (svgPaths.length > 0) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    for (let i = 0; i < svgPaths.length; i++) {
      const pathData = svgPaths[i];
      const region = regions[i]; // We need to keep track of regions to sample color
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      
      // Sample color from the region
      // We'll pick a few points inside the region and average their colors
      const color = sampleRegionColor(imageData, region);
      path.setAttribute('fill', color); 
      // Add a small stroke to close gaps
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '1');
      
      group.appendChild(path);
    }
    
    svg.appendChild(group);
  } else {
    // If no paths were created, create an empty group so normalizeSvg has something to work with
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(group);
  }

  // Normalize the SVG (adds background, padding, etc.)
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  
  return normalizeSvg(svgString, options);
}

/**
 * Simple image tracing - creates paths from image data
 * This is a basic implementation. For production, consider using a library
 * like potrace.js or similar for better quality vectorization.
 * 
 * This implementation uses a marching squares-like algorithm to trace contours
 * and create SVG paths from the image.
 */
function traceImageData(imageData: ImageData, threshold: number): { paths: string[], regions: Array<Array<[number, number]>> } {
  const { width, height, data } = imageData;
  const paths: string[] = [];

  // Convert to binary (opaque/transparent) based on threshold
  const binary: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    binary[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      binary[y][x] = alpha > threshold;
    }
  }

  // Find all connected regions and trace their contours
  const visited = new Set<string>();
  const regions: Array<Array<[number, number]>> = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (!visited.has(key) && binary[y] && binary[y][x]) {
        // Found a new region, trace its contour
        const contour = traceContour(binary, x, y, width, height, visited);
        if (contour.length > 0) {
          regions.push(contour);
        }
      }
    }
  }

  // Convert contours to SVG paths
  // Simplify paths to reduce complexity
  // We keep the original regions to sample colors later
  const processedRegions: Array<Array<[number, number]>> = [];
  
  for (const region of regions) {
    if (region.length < 3) continue; // Need at least 3 points for a path
    
    // Simplify the path (reduce points)
    const simplified = simplifyPath(region, 1.0);
    
    if (simplified.length >= 3) {
      // Create SVG path data
      let pathData = `M ${simplified[0][0]} ${simplified[0][1]}`;
      for (let i = 1; i < simplified.length; i++) {
        pathData += ` L ${simplified[i][0]} ${simplified[i][1]}`;
      }
      pathData += ' Z';
      paths.push(pathData);
      processedRegions.push(region);
    }
  }

  return { paths, regions: processedRegions };
}

/**
 * Samples the average color of a region from the image data
 */
function sampleRegionColor(imageData: ImageData, region: Array<[number, number]>): string {
  if (!region || region.length === 0) return '#000000';

  // Calculate bounding box of the region
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of region) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  // Sample a few points within the bounding box
  // A simple heuristic: sample the center point. 
  // For better results, we'd check if the point is actually inside the polygon (ray casting)
  // but for now, let's try the center of the bounding box.
  
  const centerX = Math.floor((minX + maxX) / 2);
  const centerY = Math.floor((minY + maxY) / 2);
  
  const idx = (centerY * imageData.width + centerX) * 4;
  
  // Ensure we are within bounds
  if (idx >= 0 && idx < imageData.data.length) {
    const r = imageData.data[idx];
    const g = imageData.data[idx + 1];
    const b = imageData.data[idx + 2];
    
    // Convert to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  return '#333333';
}

/**
 * Traces the contour of a connected region using a simple boundary following algorithm
 */
function traceContour(
  binary: boolean[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  visited: Set<string>
): Array<[number, number]> {
  const contour: Array<[number, number]> = [];
  const localVisited = new Set<string>();
  
  // Simple flood fill to find all pixels in the region
  const stack: Array<[number, number]> = [[startX, startY]];
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    
    if (localVisited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (!binary[y] || !binary[y][x]) continue;
    
    localVisited.add(key);
    visited.add(key);
    
    // Check if this is a boundary pixel (has a transparent neighbor)
    const isBoundary = 
      (x === 0 || !binary[y][x - 1]) ||
      (x === width - 1 || !binary[y][x + 1]) ||
      (y === 0 || !binary[y - 1] || !binary[y - 1][x]) ||
      (y === height - 1 || !binary[y + 1] || !binary[y + 1][x]);
    
    if (isBoundary) {
      contour.push([x, y]);
    }
    
    // Add neighbors
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
  
  // Sort contour points to form a continuous path
  if (contour.length > 0) {
    return sortContourPoints(contour);
  }
  
  return contour;
}

/**
 * Sorts contour points to form a continuous path
 */
function sortContourPoints(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length <= 1) return points;
  
  const sorted: Array<[number, number]> = [points[0]];
  const remaining = new Set(points.slice(1).map(p => `${p[0]},${p[1]}`));
  
  let current = points[0];
  
  while (remaining.size > 0) {
    let nearest: [number, number] | null = null;
    let nearestDist = Infinity;
    
    for (const key of remaining) {
      const [x, y] = key.split(',').map(Number);
      const dist = Math.abs(x - current[0]) + Math.abs(y - current[1]);
      
      if (dist < nearestDist && dist <= 2) { // Only consider adjacent pixels
        nearestDist = dist;
        nearest = [x, y];
      }
    }
    
    if (nearest) {
      sorted.push(nearest);
      remaining.delete(`${nearest[0]},${nearest[1]}`);
      current = nearest;
    } else {
      // No adjacent point found, pick the nearest one
      for (const key of remaining) {
        const [x, y] = key.split(',').map(Number);
        const dist = Math.sqrt(
          Math.pow(x - current[0], 2) + Math.pow(y - current[1], 2)
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = [x, y];
        }
      }
      if (nearest) {
        sorted.push(nearest);
        remaining.delete(`${nearest[0]},${nearest[1]}`);
        current = nearest;
      } else {
        break;
      }
    }
  }
  
  return sorted;
}

/**
 * Simplifies a path using the Douglas-Peucker algorithm (simplified version)
 */
function simplifyPath(
  points: Array<[number, number]>,
  tolerance: number
): Array<[number, number]> {
  if (points.length <= 2) return points;
  
  // Simple simplification: remove points that are too close to the line
  // between their neighbors
  const simplified: Array<[number, number]> = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Calculate distance from current point to line between prev and next
    const dist = pointToLineDistance(curr, prev, next);
    
    if (dist > tolerance) {
      simplified.push(curr);
    }
  }
  
  simplified.push(points[points.length - 1]);
  
  return simplified;
}

/**
 * Calculates the distance from a point to a line segment
 */
function pointToLineDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Alternative: Use canvas toImageData and create a more detailed tracing
 * This could be enhanced with a proper tracing library
 */
export async function advancedImageToSvg(
  file: File,
  options: ConvertOptions = {}
): Promise<string> {
  // Placeholder for more advanced vectorization
  // Could integrate with a library like:
  // - potrace.js (JavaScript port of Potrace)
  // - autotrace.js
  // - Or call a backend service for better quality
  
  // For now, fall back to simple method
  return imageToSvg(file, options);
}

