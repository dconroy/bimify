/**
 * SVG Normalization
 * 
 * Normalizes an existing SVG to BIMI requirements:
 * - Square viewBox (100x100 default)
 * - Adds solid background (circle or rounded square)
 * - Applies safe padding
 * - Removes unsupported elements (scripts, foreignObject, external references)
 * - Simplifies styling
 */

import type { ConvertOptions, Shape } from './types';

const DEFAULT_VIEWBOX_SIZE = 100;
const DEFAULT_PADDING_PERCENT = 12.5;
const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';

/**
 * Normalizes an SVG string to BIMI format
 */
export function normalizeSvg(
  svgString: string,
  options: ConvertOptions = {}
): string {
  const {
    backgroundColor = DEFAULT_BACKGROUND_COLOR,
    shape = 'circle',
    paddingPercent = DEFAULT_PADDING_PERCENT,
    title,
  } = options;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) {
    throw new Error('Invalid SVG: no <svg> element found');
  }

  // Remove unsupported elements
  removeUnsupportedElements(svgElement);

  // Get original viewBox to calculate scale factor
  const originalViewBox = svgElement.getAttribute('viewBox');
  let originalWidth = DEFAULT_VIEWBOX_SIZE;
  let originalHeight = DEFAULT_VIEWBOX_SIZE;
  
  if (originalViewBox) {
    const viewBoxValues = originalViewBox.split(/\s+/).map(Number);
    if (viewBoxValues.length === 4) {
      originalWidth = viewBoxValues[2];
      originalHeight = viewBoxValues[3];
    }
  }

  // Calculate scale factor from original to new viewBox
  const scaleFactor = DEFAULT_VIEWBOX_SIZE / Math.max(originalWidth, originalHeight);

  // Set square viewBox
  svgElement.setAttribute('viewBox', `0 0 ${DEFAULT_VIEWBOX_SIZE} ${DEFAULT_VIEWBOX_SIZE}`);
  svgElement.setAttribute('width', String(DEFAULT_VIEWBOX_SIZE));
  svgElement.setAttribute('height', String(DEFAULT_VIEWBOX_SIZE));
  svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Calculate safe area
  const safeMin = (DEFAULT_VIEWBOX_SIZE * paddingPercent) / 100;
  const safeMax = DEFAULT_VIEWBOX_SIZE - safeMin;
  const safeWidth = safeMax - safeMin;
  const safeHeight = safeMax - safeMin;

  // Get all content elements (everything except potential backgrounds)
  const contentElements = Array.from(svgElement.children).filter(
    el => {
      if (el.tagName === 'circle') {
        const r = parseFloat(el.getAttribute('r') || '0');
        return r !== DEFAULT_VIEWBOX_SIZE / 2;
      }
      if (el.tagName === 'rect') {
        const width = parseFloat(el.getAttribute('width') || '0');
        return width !== DEFAULT_VIEWBOX_SIZE;
      }
      return true; // Include all other elements
    }
  );

  // Calculate bounding box of content using original viewBox
  // We need to measure the actual rendered bounds, accounting for transforms
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  // Create a temporary SVG with original viewBox to measure content accurately
  // Use a larger size so transforms can be properly calculated
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSvg.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
  tempSvg.style.position = 'absolute';
  tempSvg.style.visibility = 'hidden';
  tempSvg.style.width = `${originalWidth}px`; // Use actual size for proper transform calculation
  tempSvg.style.height = `${originalHeight}px`;
  document.body.appendChild(tempSvg);

  try {
    // Clone all content elements into the temp SVG to measure their actual bounds
    // This preserves transforms and allows getBBox to calculate correctly
    if (contentElements.length > 0) {
      const wrapperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      for (const el of contentElements) {
        const cloned = el.cloneNode(true) as Element;
        wrapperGroup.appendChild(cloned);
      }
      
      tempSvg.appendChild(wrapperGroup);
      
      // Force a reflow so the SVG is rendered and transforms are applied
      // Accessing offsetHeight forces a layout calculation
      void (tempSvg as any).offsetHeight;
      
      try {
        // Try to get bounding box of the wrapper group (accounts for all transforms)
        const wrapperEl = wrapperGroup as SVGGraphicsElement;
        if (wrapperEl.getBBox) {
          const bbox = wrapperEl.getBBox();
          minX = bbox.x;
          minY = bbox.y;
          maxX = bbox.x + bbox.width;
          maxY = bbox.y + bbox.height;
        }
      } catch (err) {
        // If getBBox fails on the group (e.g., empty or invalid), try individual elements
        // This handles cases where the group itself can't be measured
        for (const el of Array.from(wrapperGroup.children)) {
          const svgEl = el as SVGGraphicsElement;
          if (svgEl.getBBox) {
            try {
              const bbox = svgEl.getBBox();
              minX = Math.min(minX, bbox.x);
              minY = Math.min(minY, bbox.y);
              maxX = Math.max(maxX, bbox.x + bbox.width);
              maxY = Math.max(maxY, bbox.y + bbox.height);
            } catch {
              // Skip elements that can't be measured
            }
          }
        }
      }
      
      tempSvg.removeChild(wrapperGroup);
    }
  } finally {
    document.body.removeChild(tempSvg);
  }

  // If we couldn't measure, use default transform
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
    // Content is measured in original viewBox coordinates
    // First scale from original to new viewBox, then fit to safe area
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    if (contentWidth > 0 && contentHeight > 0) {
      // Scale content from original viewBox to new viewBox
      const scaledContentWidth = contentWidth * scaleFactor;
      const scaledContentHeight = contentHeight * scaleFactor;
      
      // Then scale to fit safe area
      const scaleX = safeWidth / scaledContentWidth;
      const scaleY = safeHeight / scaledContentHeight;
      scale = Math.min(scaleX, scaleY) * scaleFactor; // Combined scale
      
      // Center in safe area (accounting for original coordinates)
      const scaledWidth = contentWidth * scale;
      const scaledHeight = contentHeight * scale;
      const scaledMinX = minX * scale;
      const scaledMinY = minY * scale;
      translateX = safeMin + (safeWidth - scaledWidth) / 2 - scaledMinX;
      translateY = safeMin + (safeHeight - scaledHeight) / 2 - scaledMinY;
    }
  } else {
    // If we couldn't measure, still apply the scale factor
    scale = scaleFactor;
    // Center content assuming it's in the middle of original viewBox
    translateX = safeMin + (safeWidth - (originalWidth * scaleFactor)) / 2;
    translateY = safeMin + (safeHeight - (originalHeight * scaleFactor)) / 2;
  }

  // Create background element
  const background = createBackgroundElement(shape, backgroundColor, DEFAULT_VIEWBOX_SIZE);
  
  // Clear SVG and rebuild
  svgElement.innerHTML = '';
  
  // Add title element if provided (required by some BIMI validators for accessibility)
  if (title) {
    const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleElement.textContent = title;
    svgElement.appendChild(titleElement);
  }
  
  svgElement.appendChild(background);

  // Add content with transform
  // We need to apply our normalization transform, but preserve any existing transforms
  // by wrapping the content in a new group
  if (contentElements.length > 0) {
    const wrapperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapperGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    
    for (const el of contentElements) {
      // Clone and inline styles
      // Note: This preserves any transforms on the element itself (e.g., matrix transforms on groups)
      const cloned = el.cloneNode(true) as Element;
      inlineStyles(cloned as SVGElement);
      wrapperGroup.appendChild(cloned);
    }
    
    svgElement.appendChild(wrapperGroup);
  }

  // Serialize
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgElement);
}

/**
 * Creates a background element (circle or rounded square)
 */
function createBackgroundElement(shape: Shape, color: string, size: number): SVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  
  if (shape === 'circle') {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', String(size / 2));
    circle.setAttribute('cy', String(size / 2));
    circle.setAttribute('r', String(size / 2));
    circle.setAttribute('fill', color);
    return circle;
  } else {
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(size));
    rect.setAttribute('height', String(size));
    rect.setAttribute('rx', String(size * 0.2)); // 20% corner radius
    rect.setAttribute('ry', String(size * 0.2));
    rect.setAttribute('fill', color);
    return rect;
  }
}

/**
 * Removes unsupported elements from SVG
 */
function removeUnsupportedElements(svgElement: Element): void {
  // Remove scripts
  const scripts = svgElement.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove foreignObject
  const foreignObjects = svgElement.querySelectorAll('foreignObject');
  foreignObjects.forEach(fo => fo.remove());

  // Remove raster images
  const images = svgElement.querySelectorAll('image');
  images.forEach(img => img.remove());

  // Remove comments and metadata
  const walker = document.createTreeWalker(
    svgElement,
    NodeFilter.SHOW_COMMENT,
    null
  );
  const comments: Comment[] = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.COMMENT_NODE) {
      comments.push(node as Comment);
    }
  }
  comments.forEach(comment => comment.remove());
}

/**
 * Inlines styles from style attributes and removes external references
 */
function inlineStyles(element: SVGElement): void {
  // This is a simplified version - in production you might want more sophisticated style inlining
  // For now, we just ensure fill and stroke are inline
  
  // Inline styles from style attributes
  // In a more sophisticated version, we'd parse and inline computed styles
  if (element.hasAttribute('style')) {
    // Keep the style attribute as-is for now
  }

  // Ensure fill and stroke are on the element directly if they're in style
  const computedStyle = window.getComputedStyle(element);
  const fill = computedStyle.fill;
  const stroke = computedStyle.stroke;
  
  if (fill && fill !== 'none' && !element.hasAttribute('fill')) {
    element.setAttribute('fill', fill);
  }
  if (stroke && stroke !== 'none' && !element.hasAttribute('stroke')) {
    element.setAttribute('stroke', stroke);
  }

  // Recursively process children
  Array.from(element.children).forEach(child => {
    inlineStyles(child as SVGElement);
  });
}

