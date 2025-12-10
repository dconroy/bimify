import React from 'react';
import type { ConvertOptions, Shape } from '../core/types';

interface ControlsPanelProps {
  options: ConvertOptions;
  onOptionsChange: (options: ConvertOptions) => void;
  onConvert: () => void;
  disabled?: boolean;
}

export function ControlsPanel({ options, onOptionsChange, onConvert, disabled }: ControlsPanelProps) {
  const {
    backgroundColor = '#FFFFFF',
    shape = 'circle',
    paddingPercent = 12.5,
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
      <h3>Conversion Options</h3>
      
      <div className="control-group">
        <label htmlFor="background-color">Background Color</label>
        <div className="color-input-wrapper">
          <input
            id="background-color"
            type="color"
            value={backgroundColor}
            onChange={handleBackgroundColorChange}
            disabled={disabled}
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => onOptionsChange({ ...options, backgroundColor: e.target.value })}
            disabled={disabled}
            className="color-text-input"
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
          min="5"
          max="25"
          step="0.5"
          value={paddingPercent}
          onChange={handlePaddingChange}
          disabled={disabled}
          className="slider"
        />
        <div className="slider-labels">
          <span>5%</span>
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

