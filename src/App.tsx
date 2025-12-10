import { useState, useCallback, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { ControlsPanel } from './components/ControlsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { Footer } from './components/Footer';
import { convertToBimiSvg } from './core';
import type { ConvertOptions, ValidationResult } from './core/types';
import { downloadBimiSvg, downloadValidationReport, copyToClipboard } from './utils/downloadUtils';
import { initAnalytics, trackFileUpload, trackConversion, trackDownload } from './utils/analytics';
import './App.css';

function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [bimiSvg, setBimiSvg] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConvertOptions>({
    backgroundColor: '#FFFFFF',
    shape: 'circle',
    paddingPercent: 12.5,
    title: '',
  });

  const acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setOriginalFile(file);
    setError(null);
    setBimiSvg(null);
    setValidation(null);

    // Track file upload
    trackFileUpload(file.type, file.size);

    // Create preview for original file
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Extract title from SVG if it's an SVG file
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      try {
        const svgText = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const titleElement = doc.querySelector('title');
        
        if (titleElement && titleElement.textContent) {
          const existingTitle = titleElement.textContent.trim();
          if (existingTitle) {
            // Pre-populate the title field
            setOptions(prev => ({
              ...prev,
              title: existingTitle,
            }));
          }
        }
      } catch (err) {
        // Silently fail - not critical if we can't extract the title
        console.debug('Could not extract title from SVG:', err);
      }
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!originalFile) return;

    setIsConverting(true);
    setError(null);

    try {
      const result = await convertToBimiSvg(originalFile, options);
      setBimiSvg(result.svg);
      setValidation(result.validation);
      
      // Track successful conversion
      trackConversion(true, originalFile.type, result.validation.errors.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setBimiSvg(null);
      setValidation(null);
      
      // Track failed conversion
      trackConversion(false, originalFile.type);
    } finally {
      setIsConverting(false);
    }
  }, [originalFile, options]);

  const handleDownloadSvg = useCallback(() => {
    if (!bimiSvg || !originalFile) return;
    downloadBimiSvg(bimiSvg, originalFile.name);
    trackDownload('svg');
  }, [bimiSvg, originalFile]);

  const handleDownloadReport = useCallback(() => {
    if (!validation || !originalFile) return;
    downloadValidationReport(validation, originalFile.name);
    trackDownload('report');
  }, [validation, originalFile]);

  const handleCopySvg = useCallback(async () => {
    if (!bimiSvg) return;
    try {
      await copyToClipboard(bimiSvg);
      trackDownload('clipboard');
      // Could show a toast notification here
      alert('SVG copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  }, [bimiSvg]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>VerifyBIMI</h1>
        <p className="app-description">
          Upload a logo, convert to a BIMI-friendly SVG, and validate it.
        </p>
      </header>

      <main className="app-main">
        <div className="app-content">
          <div className="left-column">
            <UploadArea
              onFileSelect={handleFileSelect}
              acceptedFormats={acceptedFormats}
              maxSizeMB={10}
            />

            <ControlsPanel
              options={options}
              onOptionsChange={setOptions}
              onConvert={handleConvert}
              disabled={!originalFile || isConverting}
            />

            {error && (
              <div className="error-banner">
                <strong>Error:</strong> {error}
              </div>
            )}

            {bimiSvg && (
              <div className="download-section">
                <h3>Download</h3>
                <div className="download-buttons">
                  <button onClick={handleDownloadSvg} className="download-button primary">
                    Download BIMI SVG
                  </button>
                  <button onClick={handleCopySvg} className="download-button">
                    Copy SVG as Text
                  </button>
                  {validation && (
                    <button onClick={handleDownloadReport} className="download-button">
                      Download Validation Report
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="right-column">
            <PreviewPanel
              originalFile={originalFile}
              originalPreview={originalPreview}
              bimiSvg={bimiSvg}
            />

            <ValidationPanel validation={validation} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;

