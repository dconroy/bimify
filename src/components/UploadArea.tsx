import React, { useRef, useState } from 'react';
import { trackFileRejected, trackFileUpload } from '../utils/analytics';

interface UploadAreaProps {
  onFileSelect: (file: File) => void | Promise<void>;
  acceptedFormats: string[];
  maxSizeMB?: number;
}

export function UploadArea({ onFileSelect, acceptedFormats, maxSizeMB = 10 }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): { error: string | null; reason?: 'invalid_format' | 'too_large' } => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidFormat = acceptedFormats.some(format => 
      file.type.includes(format) || fileExtension === format.replace('image/', '')
    );

    if (!isValidFormat) {
      return { error: `Unsupported file type. Accepted: ${acceptedFormats.join(', ')}`, reason: 'invalid_format' };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return { error: `File size exceeds ${maxSizeMB}MB limit`, reason: 'too_large' };
    }

    return { error: null };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const { error: validationError, reason } = validateFile(file);
    if (validationError) {
      setError(validationError);
      trackFileRejected('drag_drop', reason || 'unknown');
      return;
    }

    trackFileUpload(file.type || file.name.split('.').pop()?.toLowerCase() || 'unknown', file.size, 'drag_drop');

    // Handle async onFileSelect properly
    const result = onFileSelect(file);
    if (result instanceof Promise) {
      result.catch((err) => {
        console.error('Error in file selection handler:', err);
        setError('An error occurred while processing the file');
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const { error: validationError, reason } = validateFile(file);
    if (validationError) {
      setError(validationError);
      trackFileRejected('file_picker', reason || 'unknown');
      return;
    }

    trackFileUpload(file.type || file.name.split('.').pop()?.toLowerCase() || 'unknown', file.size, 'file_picker');

    // Handle async onFileSelect properly
    const result = onFileSelect(file);
    if (result instanceof Promise) {
      result.catch((err) => {
        console.error('Error in file selection handler:', err);
        setError('An error occurred while processing the file');
      });
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-area">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
        aria-label="Upload a logo file"
      >
        <input
          id="logo-file-input"
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          aria-label="Choose a logo file to upload"
        />
        <div className="upload-content">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="upload-text">
            <strong>Drag and drop</strong> your logo here, or <strong>click to browse</strong>
          </p>
          <p className="upload-hint">
            Upload your logo (SVG recommended, PNG/JPG experimental)
          </p>
          <p className="upload-hint" style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#64748b' }}>
            If you can, start with an SVG exported from your design tool.
          </p>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

