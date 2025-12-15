import React from 'react';
import type { ConvertOptions, Shape } from '../core/types';

interface ControlsPanelProps {
  options: ConvertOptions;
  onOptionsChange: (options: ConvertOptions) => void;
  onConvert: () => void;
  disabled?: boolean;
  isSvgSource?: boolean | null;
  hasFile?: boolean;
}

export function ControlsPanel({ options, onOptionsChange, onConvert, disabled, isSvgSource, hasFile = false }: ControlsPanelProps) {
  const {
    backgroundColor = '#FFFFFF',
    shape = 'circle',
    paddingPercent = 3, // Reduced default to maximize logo size
    title = '',
  } = options;

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({ ...options, backgroundColor: e.target.value });
  };

  const handleShapeChange = (newShape: Shape) => {
    onOptionsChange({ ...options, shape: newShape });
  };

  const handlePaddingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({ ...options, paddingPercent: parseFloat(e.target.value) });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({ ...options, title: e.target.value });
  };

  return (
    <div className="controls-panel">
      {!hasFile && (
        <div className="controls-overlay">
          <div className="controls-overlay-text">
            Upload an image above to unlock controls
          </div>
        </div>
      )}

      <h2>Conversion Options</h2>
      
      {isSvgSource === false && (
        <div className="raster-warning-banner">
          <strong>⚠️ Experimental Auto Vectorization</strong>
          <p>
            You uploaded a raster logo (PNG/JPG). We will attempt automatic vectorization in the browser. 
            This works best for simple, flat logos. For production BIMI we recommend getting a true SVG 
            from your designer and using that instead.
          </p>
        </div>
      )}

      {isSvgSource === true && (
        <div className="svg-source-badge">
          <span className="source-badge">Source: SVG (best for BIMI)</span>
        </div>
      )}

      {isSvgSource === false && (
        <div className="raster-source-badge">
          <span className="source-badge experimental">Source: PNG/JPG. Auto vectorization is experimental.</span>
        </div>
      )}
      
      <div className="control-group">
        <label htmlFor="background-color" id="background-color-label">Background Color</label>
        <div className="color-input-wrapper">
          <input
            id="background-color"
            type="color"
            value={backgroundColor}
            onChange={handleBackgroundColorChange}
            disabled={disabled}
            aria-labelledby="background-color-label"
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => onOptionsChange({ ...options, backgroundColor: e.target.value })}
            disabled={disabled}
            className="color-text-input"
            aria-labelledby="background-color-label"
            aria-label="Background color hex value"
          />
        </div>
      </div>

      <div className="control-group">
        <label>Background Shape</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="shape"
              value="circle"
              checked={shape === 'circle'}
              onChange={() => handleShapeChange('circle')}
              disabled={disabled}
            />
            <span>Circle</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="shape"
              value="rounded-square"
              checked={shape === 'rounded-square'}
              onChange={() => handleShapeChange('rounded-square')}
              disabled={disabled}
            />
            <span>Rounded Square</span>
          </label>
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="padding">
          Safe Padding: {paddingPercent.toFixed(1)}%
        </label>
        <input
          id="padding"
          type="range"
          min="1"
          max="25"
          step="0.5"
          value={paddingPercent}
          onChange={handlePaddingChange}
          disabled={disabled}
          className="slider"
        />
        <div className="slider-labels">
          <span>1% (max size)</span>
          <span>25%</span>
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="svg-title">
          SVG Title <span className="label-hint">(Recommended for BIMI)</span>
        </label>
        <input
          id="svg-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          disabled={disabled}
          placeholder="e.g., Company Logo"
          className="text-input"
        />
        <p className="control-hint">
          Some BIMI validators require a title element for accessibility. This will be added as a &lt;title&gt; tag in the SVG.
        </p>
      </div>

      <button
        className="convert-button"
        onClick={onConvert}
        disabled={disabled}
      >
        Convert to BIMI
      </button>
    </div>
  );
}
