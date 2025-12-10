import { useState, useMemo } from 'react';
import type { ConvertOptions } from '../core/types';

interface OriginalPreviewProps {
  originalFile: File | null;
  originalPreview: string | null;
  options: ConvertOptions;
}

export function OriginalPreview({ originalFile, originalPreview, options }: OriginalPreviewProps) {
  const [zoom, setZoom] = useState(1);

  const {
    backgroundColor = '#FFFFFF',
    shape = 'circle',
  } = options;

  // Create a preview SVG showing the original logo inside the BIMI background shape
  // This shows how it would look BEFORE conversion (potentially off-center)
  const previewSvg = useMemo(() => {
    if (!originalPreview) return null;

    const size = 100;
    const viewBox = `0 0 ${size} ${size}`;
    
    // Create background shape
    let backgroundElement = '';
    if (shape === 'circle') {
      backgroundElement = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${backgroundColor}"/>`;
    } else {
      const radius = size * 0.2;
      backgroundElement = `<rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${backgroundColor}"/>`;
    }

    // Create a clip path matching the background shape
    let clipPath = '';
    if (shape === 'circle') {
      clipPath = `<clipPath id="bimi-clip"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></clipPath>`;
    } else {
      const radius = size * 0.2;
      clipPath = `<clipPath id="bimi-clip"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></clipPath>`;
    }

    // Determine if it's an SVG or raster image
    const isSvg = originalFile?.type === 'image/svg+xml' || originalFile?.name.toLowerCase().endsWith('.svg');
    
    let imageElement = '';
    if (isSvg) {
      // For SVG, embed it directly (it will be scaled/positioned as-is)
      imageElement = `<g clip-path="url(#bimi-clip)"><image href="${originalPreview}" x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/></g>`;
    } else {
      // For raster images, embed as image element
      imageElement = `<g clip-path="url(#bimi-clip)"><image href="${originalPreview}" x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/></g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}">
      <defs>${clipPath}</defs>
      ${backgroundElement}
      ${imageElement}
    </svg>`;
  }, [originalPreview, backgroundColor, shape, originalFile]);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Original Logo</h3>
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button>
        </div>
      </div>
      
      {originalPreview ? (
        <div className="preview-modes">
          <div className="preview-mode">
            <div className="preview-mode-label">Raw Upload</div>
            <div className="preview-container">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={originalPreview} alt="Original logo" />
              </div>
            </div>
          </div>
          <div className="preview-mode">
            <div className="preview-mode-label">In BIMI Shape (Before Conversion)</div>
            <div className="preview-container preview-light">
              {previewSvg && (
                <div 
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="preview-placeholder">
          {originalFile ? 'Loading...' : 'No file selected'}
        </div>
      )}
    </div>
  );
}

