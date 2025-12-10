import { useState, useMemo } from 'react';

interface PreviewPanelProps {
  originalFile: File | null;
  originalPreview: string | null;
  bimiSvg: string | null;
}

/**
 * Creates a dark mode version of the SVG by replacing the background color
 */
function createDarkModeSvg(svgString: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) return svgString;

    // Find and replace background circle or rect with dark color
    const backgroundCircle = svgElement.querySelector('circle[fill]');
    const backgroundRect = svgElement.querySelector('rect[fill]');
    
    // Use a dark gray/black background for dark mode
    const darkBackgroundColor = '#1a1a1a';
    
    if (backgroundCircle) {
      backgroundCircle.setAttribute('fill', darkBackgroundColor);
    } else if (backgroundRect) {
      backgroundRect.setAttribute('fill', darkBackgroundColor);
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
  } catch (err) {
    // If parsing fails, return original
    console.debug('Could not create dark mode SVG:', err);
    return svgString;
  }
}

export function PreviewPanel({ originalFile, originalPreview, bimiSvg }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(1);

  // Create dark mode version of SVG
  const darkModeSvg = useMemo(() => {
    if (!bimiSvg) return null;
    return createDarkModeSvg(bimiSvg);
  }, [bimiSvg]);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Preview</h3>
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button>
        </div>
      </div>
      
      <div className="preview-grid">
        <div className="preview-item">
          <h4>Original</h4>
          {originalPreview ? (
            <div className="preview-container" style={{ transform: `scale(${zoom})` }}>
              <img src={originalPreview} alt="Original logo" />
            </div>
          ) : (
            <div className="preview-placeholder">
              {originalFile ? 'Loading...' : 'No file selected'}
            </div>
          )}
        </div>

        <div className="preview-item">
          <h4>BIMI Version</h4>
          {bimiSvg ? (
            <>
              <div className="preview-modes">
                <div className="preview-mode">
                  <div className="preview-mode-label">Light Mode</div>
                  <div 
                    className="preview-container preview-light" 
                    style={{ transform: `scale(${zoom})` }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: bimiSvg }} />
                  </div>
                </div>
                <div className="preview-mode">
                  <div className="preview-mode-label">Dark Mode</div>
                  <div 
                    className="preview-container preview-dark" 
                    style={{ transform: `scale(${zoom})` }}
                  >
                    {darkModeSvg && (
                      <div dangerouslySetInnerHTML={{ __html: darkModeSvg }} />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="preview-placeholder">
              Convert to see BIMI version
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

