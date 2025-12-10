import { useState } from 'react';

interface PreviewPanelProps {
  originalFile: File | null;
  originalPreview: string | null;
  bimiSvg: string | null;
}

export function PreviewPanel({ originalFile, originalPreview, bimiSvg }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(1);

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
                    dangerouslySetInnerHTML={{ __html: bimiSvg }}
                  />
                </div>
                <div className="preview-mode">
                  <div className="preview-mode-label">Dark Mode</div>
                  <div 
                    className="preview-container preview-dark" 
                    style={{ transform: `scale(${zoom})` }}
                    dangerouslySetInnerHTML={{ __html: bimiSvg }}
                  />
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

