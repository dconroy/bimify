/**
 * SVG Normalization - Minimally Destructive Approach
 * 
 * Normalizes an existing SVG to BIMI requirements while preserving:
 * - Original structure and shapes
 * - <defs> (gradients, filters, clipPaths)
 * - <style> blocks and class attributes
 * - Grouping (<g>) and transforms
 * 
 * Only removes truly unsafe elements:
 * - <script>
 * - <foreignObject>
 * - External <image> references
 * 
 * Uses a wrapper <g> transform instead of rewriting coordinates
 * to preserve gradients, filters, and relative positions.
 */

import type { ConvertOptions, Shape } from './types';

const DEFAULT_VIEWBOX_SIZE = 100;
const DEFAULT_PADDING_PERCENT = 12.5;
const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';

/**
 * Normalizes an SVG string to BIMI format using minimal transformation
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
  const originalSvg = doc.querySelector('svg');

  if (!originalSvg) {
    throw new Error('Invalid SVG: no <svg> element found');
  }

  // Remove only truly unsafe elements (don't touch structure)
  removeUnsafeElements(originalSvg);

  // Get original viewBox
  const originalViewBox = originalSvg.getAttribute('viewBox');
  let originalWidth = DEFAULT_VIEWBOX_SIZE;
  let originalHeight = DEFAULT_VIEWBOX_SIZE;
  
  if (originalViewBox) {
    const viewBoxValues = originalViewBox.split(/\s+/).map(Number);
    if (viewBoxValues.length === 4 && viewBoxValues[2] > 0 && viewBoxValues[3] > 0) {
      originalWidth = viewBoxValues[2];
      originalHeight = viewBoxValues[3];
    }
  }

  // Create new BIMI SVG root with square viewBox
  const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  newSvg.setAttribute('viewBox', `0 0 ${DEFAULT_VIEWBOX_SIZE} ${DEFAULT_VIEWBOX_SIZE}`);
  newSvg.setAttribute('width', String(DEFAULT_VIEWBOX_SIZE));
  newSvg.setAttribute('height', String(DEFAULT_VIEWBOX_SIZE));
  newSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add title if provided
  if (title) {
    const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleElement.textContent = title;
    newSvg.appendChild(titleElement);
  }

  // Copy all <defs> from original (gradients, filters, clipPaths, etc.)
  const defsElements = Array.from(originalSvg.querySelectorAll('defs'));
  defsElements.forEach(defs => {
    newSvg.appendChild(defs.cloneNode(true));
  });

  // Copy all <style> blocks from original
  const styleElements = Array.from(originalSvg.querySelectorAll('style'));
  styleElements.forEach(style => {
    newSvg.appendChild(style.cloneNode(true));
  });

  // Create a single group containing all visible content
  const logoGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  logoGroup.setAttribute('id', 'logo');

  // Get all visible content (everything except defs, style, title, script, foreignObject, image)
  const visibleContent = Array.from(originalSvg.children).filter(el => {
    const tagName = el.tagName.toLowerCase();
    return !['defs', 'style', 'title', 'script', 'foreignobject', 'image'].includes(tagName);
  });

  // Clone all visible content into the logo group (preserving structure)
  visibleContent.forEach(el => {
    logoGroup.appendChild(el.cloneNode(true));
  });

  // Calculate bounding box using browser APIs
  const { scale, translateX, translateY } = calculateTransform(
    logoGroup,
    originalWidth,
    originalHeight,
    paddingPercent
  );

  // Apply single transform to the logo group
  logoGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);

  // Create background element
  const background = createBackgroundElement(shape, backgroundColor, DEFAULT_VIEWBOX_SIZE);

  // Build final SVG structure:
  // 1. Title (already added)
  // 2. Defs (already added)
  // 3. Style blocks (already added)
  // 4. Background shape
  // 5. Logo group with transform
  newSvg.appendChild(background);
  newSvg.appendChild(logoGroup);

  // Serialize
  const serializer = new XMLSerializer();
  return serializer.serializeToString(newSvg);
}

/**
 * Calculates the transform needed to fit content into safe area
 * Uses browser getBBox() API for accurate measurement
 */
function calculateTransform(
  logoGroup: SVGGraphicsElement,
  originalWidth: number,
  originalHeight: number,
  paddingPercent: number
): { scale: number; translateX: number; translateY: number } {
  // Calculate safe area
  const safeMin = (DEFAULT_VIEWBOX_SIZE * paddingPercent) / 100;
  const safeMax = DEFAULT_VIEWBOX_SIZE - safeMin;
  const safeWidth = safeMax - safeMin;
  const safeHeight = safeMax - safeMin;

  // Create a hidden SVG in the DOM to measure bounding box
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSvg.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
  tempSvg.style.position = 'absolute';
  tempSvg.style.visibility = 'hidden';
  tempSvg.style.width = `${originalWidth}px`;
  tempSvg.style.height = `${originalHeight}px`;
  document.body.appendChild(tempSvg);

  try {
    // Clone the logo group into temp SVG
    const clonedGroup = logoGroup.cloneNode(true) as SVGGraphicsElement;
    tempSvg.appendChild(clonedGroup);

    // Force a reflow
    void (tempSvg as any).offsetHeight;

    // Get bounding box
    let bbox: DOMRect;
    try {
      bbox = clonedGroup.getBBox();
    } catch {
      // If getBBox fails, try measuring individual elements
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const el of Array.from(clonedGroup.children)) {
        const svgEl = el as SVGGraphicsElement;
        if (svgEl.getBBox) {
          try {
            const elBbox = svgEl.getBBox();
            minX = Math.min(minX, elBbox.x);
            minY = Math.min(minY, elBbox.y);
            maxX = Math.max(maxX, elBbox.x + elBbox.width);
            maxY = Math.max(maxY, elBbox.y + elBbox.height);
          } catch {
            // Skip elements that can't be measured
          }
        }
      }
      if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
        bbox = new DOMRect(minX, minY, maxX - minX, maxY - minY);
      } else {
        // Fallback: use viewBox dimensions
        bbox = new DOMRect(0, 0, originalWidth, originalHeight);
      }
    }

    // Calculate scale to fit content into safe area
    const contentWidth = bbox.width;
    const contentHeight = bbox.height;
    
    if (contentWidth > 0 && contentHeight > 0) {
      // Scale to fit the larger dimension into safe area
      const scaleX = safeWidth / contentWidth;
      const scaleY = safeHeight / contentHeight;
      const scale = Math.min(scaleX, scaleY);

      // Calculate translation to center content in safe area
      // Content is measured in original viewBox coordinates
      // We need to scale it and center it in the safe area
      
      // Center of content in original coordinates
      const contentCenterX = bbox.x + contentWidth / 2;
      const contentCenterY = bbox.y + contentHeight / 2;
      
      // Center of safe area in new coordinates
      const safeCenterX = safeMin + safeWidth / 2;
      const safeCenterY = safeMin + safeHeight / 2;
      
      // Translation: move content center to safe area center, accounting for scale
      const translateX = safeCenterX - (contentCenterX * scale);
      const translateY = safeCenterY - (contentCenterY * scale);

      return { scale, translateX, translateY };
    }
  } finally {
    document.body.removeChild(tempSvg);
  }

  // Fallback: center and scale to fit
  const scale = Math.min(safeWidth / originalWidth, safeHeight / originalHeight);
  const translateX = safeMin + (safeWidth - originalWidth * scale) / 2;
  const translateY = safeMin + (safeHeight - originalHeight * scale) / 2;
  
  return { scale, translateX, translateY };
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
 * Removes only truly unsafe elements (script, foreignObject, external images)
 * Does NOT remove or modify structure, styles, classes, defs, etc.
 */
function removeUnsafeElements(svgElement: Element): void {
  // Remove scripts
  const scripts = svgElement.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove foreignObject
  const foreignObjects = svgElement.querySelectorAll('foreignObject');
  foreignObjects.forEach(fo => fo.remove());

  // Remove external image references (but keep embedded data URIs)
  const images = svgElement.querySelectorAll('image');
  images.forEach(img => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
    // Only remove if it's an external reference (not a data URI)
    if (href && !href.startsWith('data:')) {
      img.remove();
    }
  });

  // Remove comments (optional, but keeps output clean)
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
