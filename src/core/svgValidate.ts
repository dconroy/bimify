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

import type { ValidationResult, ValidationCheck } from './types';

/**
 * Validates an SVG string against BIMI requirements
 */
export function validateBimiSvg(svg: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: [],
  };

  const checks: ValidationCheck[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    if (!svgElement) {
      result.valid = false;
      result.errors.push('No SVG element found');
      checks.push({ name: 'SVG element exists', passed: false, message: 'No SVG element found' });
      result.checks = checks;
      return result;
    }
    checks.push({ name: 'SVG element exists', passed: true });

    // Check viewBox is square
    const viewBox = svgElement.getAttribute('viewBox');
    if (!viewBox) {
      result.valid = false;
      result.errors.push('SVG must have a viewBox attribute');
      checks.push({ name: 'Has viewBox attribute', passed: false, message: 'SVG must have a viewBox attribute' });
      result.checks = checks;
      return result;
    }

    const viewBoxValues = viewBox.split(/\s+/).map(Number);
    if (viewBoxValues.length !== 4) {
      result.valid = false;
      result.errors.push('Invalid viewBox format');
      checks.push({ name: 'Valid viewBox format', passed: false, message: 'Invalid viewBox format' });
      result.checks = checks;
      return result;
    }

    const [, , width, height] = viewBoxValues;
    if (width !== height) {
      result.valid = false;
      result.errors.push(`ViewBox is not square: ${width}x${height}`);
      checks.push({ name: 'Square viewBox', passed: false, message: `ViewBox is not square: ${width}x${height}` });
    } else {
      checks.push({ name: 'Square viewBox', passed: true, message: `${width}x${height}` });
    }

    // Check minimum size (64x64)
    if (width < 64 || height < 64) {
      result.valid = false;
      result.errors.push(`ViewBox size ${width}x${height} is below minimum 64x64`);
      checks.push({ name: 'Minimum size (64x64)', passed: false, message: `Size ${width}x${height} is below minimum` });
    } else {
      checks.push({ name: 'Minimum size (64x64)', passed: true, message: `${width}x${height}` });
    }

    // Check for raster images
    const images = svgElement.querySelectorAll('image');
    if (images.length > 0) {
      result.valid = false;
      result.errors.push(`Found ${images.length} <image> tag(s). BIMI requires vector-only SVG`);
      checks.push({ name: 'No raster images', passed: false, message: `Found ${images.length} <image> tag(s)` });
    } else {
      checks.push({ name: 'No raster images', passed: true });
    }

    // Check for scripts
    const scripts = svgElement.querySelectorAll('script');
    if (scripts.length > 0) {
      result.valid = false;
      result.errors.push(`Found ${scripts.length} <script> tag(s). Scripts are not allowed in BIMI SVG`);
      checks.push({ name: 'No scripts', passed: false, message: `Found ${scripts.length} <script> tag(s)` });
    } else {
      checks.push({ name: 'No scripts', passed: true });
    }

    // Check for foreignObject
    const foreignObjects = svgElement.querySelectorAll('foreignObject');
    if (foreignObjects.length > 0) {
      result.valid = false;
      result.errors.push(`Found ${foreignObjects.length} <foreignObject> tag(s). Foreign objects are not allowed`);
      checks.push({ name: 'No foreign objects', passed: false, message: `Found ${foreignObjects.length} <foreignObject> tag(s)` });
    } else {
      checks.push({ name: 'No foreign objects', passed: true });
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

    // Always add both background checks for consistency
    if (!hasBackground) {
      result.valid = false;
      result.errors.push('No solid background shape found covering the entire viewBox');
      checks.push({ name: 'Solid background', passed: false, message: 'No background shape found' });
      checks.push({ name: 'Opaque background', passed: false, message: 'Cannot check opacity without background' });
    } else {
      // Background exists, check both solid and opaque
      checks.push({ name: 'Solid background', passed: true });
      
      if (backgroundHasAlpha) {
        result.valid = false;
        result.errors.push('Background color has transparency (alpha channel). BIMI requires opaque background');
        checks.push({ name: 'Opaque background', passed: false, message: 'Background has transparency' });
      } else {
        checks.push({ name: 'Opaque background', passed: true });
      }
    }

    // Check for title element (recommended/required by some BIMI validators)
    const titleElement = svgElement.querySelector('title');
    if (!titleElement || !titleElement.textContent?.trim()) {
      result.warnings.push('SVG missing <title> element. Some BIMI validators require a title for accessibility.');
      checks.push({ name: 'Has title element', passed: false, message: 'Missing <title> element (recommended)' });
    } else {
      checks.push({ name: 'Has title element', passed: true });
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
      // Check if content is properly contained within safe padding area
      // For a 100x100 viewBox with 12.5% padding, safe area is 12.5 to 87.5
      const paddingPercent = 12.5; // Default, could be calculated from actual padding
      const safeMin = (width * paddingPercent) / 100;
      const safeMax = width - safeMin;
      const tolerance = width * 0.02; // 2% tolerance to avoid false positives

      // Try to get the overall bounding box of all content elements
      // Check if the content group (if it exists) is within bounds
      let contentGroup: SVGGraphicsElement | null = null;
      for (const el of nonBackgroundElements) {
        if (el.tagName === 'g' && (el as Element).getAttribute('transform')) {
          contentGroup = el as SVGGraphicsElement;
          break;
        }
      }

      // If we found a content group, check its bounding box
      if (contentGroup && contentGroup.getBBox) {
        try {
          const bbox = contentGroup.getBBox();
          // Only warn if a significant portion extends outside (more than tolerance)
          if (bbox.x < safeMin - tolerance || bbox.y < safeMin - tolerance || 
              bbox.x + bbox.width > safeMax + tolerance || bbox.y + bbox.height > safeMax + tolerance) {
            result.warnings.push('Some artwork elements may extend outside the safe padding area');
          }
        } catch {
          // getBBox might fail, skip this check
        }
      } else {
        // Fallback: check individual elements, but be more lenient
        let elementsOutside = 0;
        let elementsChecked = 0;
        
        for (const el of nonBackgroundElements.slice(0, 20)) { // Check more elements
          const svgEl = el as SVGGraphicsElement;
          if (svgEl.getBBox) {
            try {
              elementsChecked++;
              const bbox = svgEl.getBBox();
              // Only count as "outside" if significantly outside (more than tolerance)
              if (bbox.x < safeMin - tolerance || bbox.y < safeMin - tolerance || 
                  bbox.x + bbox.width > safeMax + tolerance || bbox.y + bbox.height > safeMax + tolerance) {
                elementsOutside++;
              }
            } catch {
              // getBBox might fail for some elements, skip
            }
          }
        }
        
        // Only warn if more than 30% of checked elements are significantly outside
        if (elementsChecked > 0 && elementsOutside / elementsChecked > 0.3) {
          result.warnings.push('Some artwork elements may extend outside the safe padding area');
        }
      }
    }

    // Check for filters, gradients, masks, clipPaths (warnings, not errors)
    const hasFilters = svgElement.querySelectorAll('filter').length > 0;
    const hasGradients = svgElement.querySelectorAll('linearGradient, radialGradient').length > 0;
    const hasMasks = svgElement.querySelectorAll('mask').length > 0;
    const hasClipPaths = svgElement.querySelectorAll('clipPath').length > 0;
    
    if (hasFilters || hasGradients || hasMasks || hasClipPaths) {
      const features = [];
      if (hasFilters) features.push('filters');
      if (hasGradients) features.push('gradients');
      if (hasMasks) features.push('masks');
      if (hasClipPaths) features.push('clipPaths');
      
      result.warnings.push(
        `This logo uses ${features.join(', ')}. Some mailbox providers may render these differently. For maximum compatibility, consider a simplified version.`
      );
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
    checks.push({ name: 'Validation completed', passed: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }

  result.checks = checks;
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

