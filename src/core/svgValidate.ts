/**
 * BIMI SVG Validation
 * 
 * Validates SVG files against BIMI (Brand Indicators for Message Identification) requirements:
 * - Square viewBox (minimum 64x64 logical size)
 * - No raster images (<image> tags)
 * - No scripts or foreign objects
 * - Solid, opaque background
 * - Artwork within safe padding area
 */

import type { ValidationResult } from './types';

/**
 * Validates an SVG string against BIMI requirements
 */
export function validateBimiSvg(svg: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    if (!svgElement) {
      result.valid = false;
      result.errors.push('No SVG element found');
      return result;
    }

    // Check viewBox is square
    const viewBox = svgElement.getAttribute('viewBox');
    if (!viewBox) {
      result.valid = false;
      result.errors.push('SVG must have a viewBox attribute');
      return result;
    }

    const viewBoxValues = viewBox.split(/\s+/).map(Number);
    if (viewBoxValues.length !== 4) {
      result.valid = false;
      result.errors.push('Invalid viewBox format');
      return result;
    }

    const [, , width, height] = viewBoxValues;
    if (width !== height) {
      result.valid = false;
      result.errors.push(`ViewBox is not square: ${width}x${height}`);
    }

    // Check minimum size (64x64)
    if (width < 64 || height < 64) {
      result.valid = false;
      result.errors.push(`ViewBox size ${width}x${height} is below minimum 64x64`);
    }

    // Check for raster images
    const images = svgElement.querySelectorAll('image');
    if (images.length > 0) {
      result.valid = false;
      result.errors.push(`Found ${images.length} <image> tag(s). BIMI requires vector-only SVG`);
    }

    // Check for scripts
    const scripts = svgElement.querySelectorAll('script');
    if (scripts.length > 0) {
      result.valid = false;
      result.errors.push(`Found ${scripts.length} <script> tag(s). Scripts are not allowed in BIMI SVG`);
    }

    // Check for foreignObject
    const foreignObjects = svgElement.querySelectorAll('foreignObject');
    if (foreignObjects.length > 0) {
      result.valid = false;
      result.errors.push(`Found ${foreignObjects.length} <foreignObject> tag(s). Foreign objects are not allowed`);
    }

    // Check for background
    // Look for circle or rect that covers the entire viewBox
    const backgroundCircle = svgElement.querySelector('circle[fill]');
    const backgroundRect = svgElement.querySelector('rect[fill]');
    
    let hasBackground = false;
    let backgroundHasAlpha = false;

    if (backgroundCircle) {
      const r = parseFloat(backgroundCircle.getAttribute('r') || '0');
      const cx = parseFloat(backgroundCircle.getAttribute('cx') || '0');
      const cy = parseFloat(backgroundCircle.getAttribute('cy') || '0');
      
      // Check if circle covers the viewBox (radius should be >= width/2, centered)
      if (Math.abs(cx - width / 2) < 1 && Math.abs(cy - height / 2) < 1 && r >= width / 2 - 1) {
        hasBackground = true;
        const fill = backgroundCircle.getAttribute('fill') || '';
        backgroundHasAlpha = hasAlphaChannel(fill);
      }
    }

    if (backgroundRect && !hasBackground) {
      const x = parseFloat(backgroundRect.getAttribute('x') || '0');
      const y = parseFloat(backgroundRect.getAttribute('y') || '0');
      const rectWidth = parseFloat(backgroundRect.getAttribute('width') || '0');
      const rectHeight = parseFloat(backgroundRect.getAttribute('height') || '0');
      
      // Check if rect covers the viewBox
      if (x <= 1 && y <= 1 && rectWidth >= width - 2 && rectHeight >= height - 2) {
        hasBackground = true;
        const fill = backgroundRect.getAttribute('fill') || '';
        backgroundHasAlpha = hasAlphaChannel(fill);
      }
    }

    if (!hasBackground) {
      result.valid = false;
      result.errors.push('No solid background shape found covering the entire viewBox');
    } else if (backgroundHasAlpha) {
      result.valid = false;
      result.errors.push('Background color has transparency (alpha channel). BIMI requires opaque background');
    }

    // Check for title element (recommended/required by some BIMI validators)
    const titleElement = svgElement.querySelector('title');
    if (!titleElement || !titleElement.textContent?.trim()) {
      result.warnings.push('SVG missing <title> element. Some BIMI validators require a title for accessibility.');
    }

    // Check artwork bounding box (approximate)
    // Get all elements except the background
    const allElements = Array.from(svgElement.querySelectorAll('*'));
    const nonBackgroundElements = allElements.filter(el => {
      if (el === backgroundCircle || el === backgroundRect) return false;
      if (el === svgElement) return false;
      return true;
    });

    if (nonBackgroundElements.length > 0) {
      // Approximate bounding box by checking if any elements are outside safe area
      // For a 100x100 viewBox with 12.5% padding, safe area is 12.5 to 87.5
      const paddingPercent = 12.5; // Default, could be calculated from actual padding
      const safeMin = (width * paddingPercent) / 100;
      const safeMax = width - safeMin;

      // Check a few key elements for position
      // This is an approximation - full bounding box calculation would require more complex logic
      for (const el of nonBackgroundElements.slice(0, 10)) { // Sample first 10 elements
        const svgEl = el as SVGGraphicsElement;
        if (svgEl.getBBox) {
          try {
            const bbox = svgEl.getBBox();
            if (bbox.x < safeMin || bbox.y < safeMin || 
                bbox.x + bbox.width > safeMax || bbox.y + bbox.height > safeMax) {
              result.warnings.push('Some artwork elements may extend outside the safe padding area');
              break;
            }
          } catch {
            // getBBox might fail for some elements, skip
          }
        }
      }
    }

    // Check for external references (warnings)
    const styleElements = svgElement.querySelectorAll('style');
    if (styleElements.length > 0) {
      result.warnings.push('SVG contains <style> tags. Inline styles are preferred for BIMI');
    }

    // Check for external font references
    const textElements = svgElement.querySelectorAll('text');
    if (textElements.length > 0) {
      for (const text of textElements) {
        const fontFamily = text.style.fontFamily || text.getAttribute('font-family');
        if (fontFamily && !fontFamily.includes('sans-serif') && !fontFamily.includes('serif')) {
          result.warnings.push('Text elements may use external fonts. Convert text to paths for better compatibility');
        }
      }
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Checks if a color string has an alpha channel (transparency)
 */
function hasAlphaChannel(color: string): boolean {
  // Check for rgba/rgb format
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\([^)]+\)/);
    if (match) {
      const values = match[0].match(/\d+\.?\d*/g);
      if (values && values.length >= 4) {
        const alpha = parseFloat(values[3]);
        return alpha < 1;
      }
    }
  }

  // Check for hex with alpha (#RRGGBBAA)
  if (color.startsWith('#') && color.length === 9) {
    const alpha = parseInt(color.slice(7, 9), 16);
    return alpha < 255;
  }

  // Check for hex shorthand with alpha (#RGBA)
  if (color.startsWith('#') && color.length === 5) {
    const alpha = parseInt(color[4], 16);
    return alpha < 15;
  }

  // Check for hsla
  if (color.startsWith('hsla')) {
    const match = color.match(/hsla\([^)]+\)/);
    if (match) {
      const values = match[0].match(/\d+\.?\d*/g);
      if (values && values.length >= 4) {
        const alpha = parseFloat(values[3]);
        return alpha < 1;
      }
    }
  }

  return false;
}

