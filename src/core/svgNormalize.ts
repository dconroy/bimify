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
      // Only update if dimensions are valid and positive to avoid division by zero later
      if (viewBoxValues[2] > 0) originalWidth = viewBoxValues[2];
      if (viewBoxValues[3] > 0) originalHeight = viewBoxValues[3];
    }
  }

  // Calculate scale factor from original to new viewBox
  // Math.max ensures we don't divide by zero even if one dimension is missing/invalid
  const scaleFactor = DEFAULT_VIEWBOX_SIZE / Math.max(originalWidth, originalHeight || 1);

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
  // Also preserve defs for gradients, filters, etc.
  const defsElements = Array.from(svgElement.querySelectorAll('defs'));
  
  // Extract style rules from style blocks for manual application
  const styleRules = extractStyleRules(svgElement);
  
  const contentElements = Array.from(svgElement.children).filter(
    el => {
      if (el.tagName === 'defs') return false; // Handled separately
      if (el.tagName === 'style') return false; // Styles should be inlined or handled via defs
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
      // Calculate scale to fit content into safe area
      // Content is measured in original viewBox coordinates
      // We need to scale it to fit in the safe area of the new 100x100 viewBox
      
      // First, calculate what the content dimensions would be in the new viewBox
      const scaledContentWidth = contentWidth * scaleFactor;
      const scaledContentHeight = contentHeight * scaleFactor;
      
      // Then calculate additional scale needed to fit into safe area
      const fitScaleX = safeWidth / scaledContentWidth;
      const fitScaleY = safeHeight / scaledContentHeight;
      const fitScale = Math.min(fitScaleX, fitScaleY);
      
      // Final scale: scaleFactor (original->new viewBox) * fitScale (fit to safe area)
      scale = scaleFactor * fitScale;
      
      // Center in safe area (accounting for original coordinates)
      // Calculate dimensions in the final coordinate system (100x100 viewBox)
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

  // Re-add defs
  defsElements.forEach(defs => {
    svgElement.appendChild(defs.cloneNode(true));
  });

  // Add content with transform
  // We need to apply our normalization transform, but preserve any existing transforms
  // by wrapping the content in a new group
  if (contentElements.length > 0) {
    // First, inline styles while elements are still in context with defs/styles
    // Create a temporary SVG with defs to properly compute styles
    const tempSvgForStyles = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvgForStyles.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
    tempSvgForStyles.style.position = 'absolute';
    tempSvgForStyles.style.visibility = 'hidden';
    tempSvgForStyles.style.width = '1px';
    tempSvgForStyles.style.height = '1px';
    document.body.appendChild(tempSvgForStyles);
    
    // Add defs to temp SVG so styles can be computed
    defsElements.forEach(defs => {
      tempSvgForStyles.appendChild(defs.cloneNode(true));
    });
    
    try {
      // Process each element: mount it, inline styles, then clone
      const processedElements: Element[] = [];
      for (const el of contentElements) {
        const cloned = el.cloneNode(true) as Element;
        tempSvgForStyles.appendChild(cloned);
        
        // Apply style rules from CSS classes
        applyStyleRules(cloned as SVGElement, styleRules);
        
        // Now that it's in the DOM with styles, inline any remaining computed styles
        inlineStyles(cloned as SVGElement);
        
        // Remove from temp and keep for final SVG
        tempSvgForStyles.removeChild(cloned);
        processedElements.push(cloned);
      }
      
      // Now add processed elements to the final SVG with transform
      const wrapperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wrapperGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
      
      processedElements.forEach(el => {
        wrapperGroup.appendChild(el);
      });
      
      svgElement.appendChild(wrapperGroup);
    } finally {
      document.body.removeChild(tempSvgForStyles);
    }
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
 * Extracts CSS rules from style blocks in the SVG
 */
function extractStyleRules(svgElement: Element): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  
  // Find all style blocks (in defs or at root)
  const styleBlocks = svgElement.querySelectorAll('style');
  
  for (const styleBlock of styleBlocks) {
    const cssText = styleBlock.textContent || '';
    
    // Simple CSS parser - matches .class-name { property: value; }
    const classRuleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = classRuleRegex.exec(cssText)) !== null) {
      const className = match[1];
      const propertiesText = match[2];
      
      if (!rules.has(className)) {
        rules.set(className, new Map());
      }
      
      const classRules = rules.get(className)!;
      
      // Parse properties (property: value;)
      const propertyRegex = /([a-zA-Z-]+):\s*([^;]+);?/g;
      let propMatch;
      
      while ((propMatch = propertyRegex.exec(propertiesText)) !== null) {
        const prop = propMatch[1].trim();
        const value = propMatch[2].trim();
        classRules.set(prop, value);
      }
    }
  }
  
  return rules;
}

/**
 * Applies CSS class rules as inline attributes
 */
function applyStyleRules(element: SVGElement, styleRules: Map<string, Map<string, string>>): void {
  const classAttr = element.getAttribute('class');
  if (!classAttr) {
    // Recursively process children
    Array.from(element.children).forEach(child => {
      applyStyleRules(child as SVGElement, styleRules);
    });
    return;
  }
  
  // Split class names (can have multiple)
  const classNames = classAttr.split(/\s+/).filter(c => c);
  
  for (const className of classNames) {
    const classRule = styleRules.get(className);
    if (!classRule) continue;
    
    // Apply each property from the class
    for (const [prop, value] of classRule.entries()) {
      // Only set if not already set as attribute
      if (!element.hasAttribute(prop)) {
        // Convert CSS property names to SVG attribute names
        const attrName = prop === 'stroke-width' ? 'stroke-width' :
                        prop === 'fill' ? 'fill' :
                        prop === 'stroke' ? 'stroke' :
                        prop === 'opacity' ? 'opacity' :
                        prop === 'filter' ? 'filter' : prop;
        
        element.setAttribute(attrName, value);
      }
    }
  }
  
  // Recursively process children
  Array.from(element.children).forEach(child => {
    applyStyleRules(child as SVGElement, styleRules);
  });
}

/**
 * Inlines styles from style attributes and CSS classes
 * This function is called while elements are attached to the DOM so getComputedStyle works
 */
function inlineStyles(element: SVGElement): void {
  // Get computed styles (works because element is attached to DOM)
  const computedStyle = window.getComputedStyle(element);
  
  // Handle fill - preserve URL references for gradients
  const fill = computedStyle.fill;
  if (fill && fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)' && !element.hasAttribute('fill')) {
    // Check if it's a URL reference (gradient/filter)
    // getComputedStyle might return rgb() for gradients, so we need to check the actual style
    const styleAttr = element.getAttribute('style') || '';
    const classAttr = element.getAttribute('class') || '';
    
    // Try to preserve URL references from style attribute or class
    if (styleAttr.includes('url(') || classAttr) {
      // If element has a class, the fill might be from CSS - we'll keep the class
      // and let the style block handle it, OR try to get the actual fill value
      // For now, if computed fill is a color (not url), use it
      if (fill.startsWith('rgb') || fill.startsWith('#') || /^[a-f0-9]{6}$/i.test(fill)) {
        element.setAttribute('fill', fill);
      }
      // If it's a URL, the computed style might not show it - check style attribute
      else if (styleAttr.match(/fill:\s*url\([^)]+\)/)) {
        const urlMatch = styleAttr.match(/fill:\s*(url\([^)]+\))/);
        if (urlMatch) {
          element.setAttribute('fill', urlMatch[1]);
        }
      }
    } else {
      // No class/style, use computed fill
      element.setAttribute('fill', fill);
    }
  }
  
  // Handle stroke
  const stroke = computedStyle.stroke;
  if (stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)' && !element.hasAttribute('stroke')) {
    element.setAttribute('stroke', stroke);
  }
  
  // Handle stroke-width if present
  const strokeWidth = computedStyle.strokeWidth;
  if (strokeWidth && strokeWidth !== '0px' && !element.hasAttribute('stroke-width')) {
    element.setAttribute('stroke-width', strokeWidth);
  }
  
  // Handle opacity
  const opacity = computedStyle.opacity;
  if (opacity && opacity !== '1' && !element.hasAttribute('opacity')) {
    element.setAttribute('opacity', opacity);
  }

  // Recursively process children
  Array.from(element.children).forEach(child => {
    inlineStyles(child as SVGElement);
  });
}

