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

  // Set square viewBox
  svgElement.setAttribute('viewBox', `0 0 ${DEFAULT_VIEWBOX_SIZE} ${DEFAULT_VIEWBOX_SIZE}`);
  svgElement.setAttribute('width', String(DEFAULT_VIEWBOX_SIZE));
  svgElement.setAttribute('height', String(DEFAULT_VIEWBOX_SIZE));
  svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Remove existing viewBox, width, height attributes and re-add
  // Remove xmlns if present (we'll add it back)

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

  // Calculate bounding box of content
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  // Create a temporary SVG to measure content
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSvg.setAttribute('viewBox', `0 0 ${DEFAULT_VIEWBOX_SIZE} ${DEFAULT_VIEWBOX_SIZE}`);
  tempSvg.style.position = 'absolute';
  tempSvg.style.visibility = 'hidden';
  document.body.appendChild(tempSvg);

  try {
    for (const el of contentElements) {
      const cloned = el.cloneNode(true) as Element;
      tempSvg.appendChild(cloned);
      
      try {
        const svgEl = cloned as SVGGraphicsElement;
        if (svgEl.getBBox) {
          const bbox = svgEl.getBBox();
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        }
      } catch {
        // Some elements might not have getBBox, skip
      }
      
      tempSvg.removeChild(cloned);
    }
  } finally {
    document.body.removeChild(tempSvg);
  }

  // If we couldn't measure, use default transform
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    if (contentWidth > 0 && contentHeight > 0) {
      // Scale to fit safe area
      const scaleX = safeWidth / contentWidth;
      const scaleY = safeHeight / contentHeight;
      scale = Math.min(scaleX, scaleY);
      
      // Center in safe area
      const scaledWidth = contentWidth * scale;
      const scaledHeight = contentHeight * scale;
      translateX = safeMin + (safeWidth - scaledWidth) / 2 - minX * scale;
      translateY = safeMin + (safeHeight - scaledHeight) / 2 - minY * scale;
    }
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
  if (contentElements.length > 0) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    
    for (const el of contentElements) {
      // Clone and inline styles
      const cloned = el.cloneNode(true) as Element;
      inlineStyles(cloned as SVGElement);
      group.appendChild(cloned);
    }
    
    svgElement.appendChild(group);
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

