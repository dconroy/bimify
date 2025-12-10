import { useState } from 'react';

interface PreviewPanelProps {
  bimiSvg: string | null;
  onDownload?: () => void;
  onCopy?: () => void;
}

export function PreviewPanel({ bimiSvg, onDownload, onCopy }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>BIMI Version</h3>
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button>
        </div>
      </div>
      
      {bimiSvg ? (
        <div className="preview-modes">
          <div className="preview-mode">
            <div className="preview-mode-label">Light Mode</div>
            <div className="preview-container preview-light">
              <div 
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                dangerouslySetInnerHTML={{ __html: bimiSvg }}
              />
            </div>
          </div>
          <div className="preview-mode">
            <div className="preview-mode-label">Dark Mode</div>
            <div className="preview-container preview-dark">
              <div 
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                dangerouslySetInnerHTML={{ __html: bimiSvg }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="preview-placeholder">
          Convert to see BIMI version
        </div>
      )}

      {bimiSvg && onDownload && onCopy && (
        <div className="preview-download-buttons">
          <button onClick={onDownload} className="download-button primary">
            Download BIMI SVG
          </button>
          <button onClick={onCopy} className="download-button">
            Copy SVG as Text
          </button>
        </div>
      )}
    </div>
  );
}
