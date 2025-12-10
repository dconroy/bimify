import { useState, useCallback } from 'react';
import { UploadArea } from './components/UploadArea';
import { ControlsPanel } from './components/ControlsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { Footer } from './components/Footer';
import { convertToBimiSvg } from './core';
import type { ConvertOptions, ValidationResult } from './core/types';
import { downloadBimiSvg, copyToClipboard } from './utils/downloadUtils';
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

  const processFile = async (file: File, currentOptions: ConvertOptions) => {
    setIsConverting(true);
    setError(null);

    try {
      const result = await convertToBimiSvg(file, currentOptions);
      
      // Add warning for raster images
      if (!file.type.includes('svg') && !file.name.toLowerCase().endsWith('.svg')) {
        result.validation.warnings.push(
          'Raster image detected. Conversion quality is limited. For best results, use a vector SVG source.'
        );
      }

      setBimiSvg(result.svg);
      setValidation(result.validation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setBimiSvg(null);
      setValidation(null);
    } finally {
      setIsConverting(false);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setOriginalFile(file);
    setError(null);
    setBimiSvg(null);
    setValidation(null);

    // Create preview for original file
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Extract title from SVG if it's an SVG file (for pre-populating the title field)
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      try {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const titleEl = doc.querySelector('title');
        if (titleEl && titleEl.textContent) {
          const title = titleEl.textContent.trim();
          if (title) {
            setOptions(prev => ({
              ...prev,
              title,
            }));
          }
        }
      } catch (e) {
        console.warn('Could not extract SVG title:', e);
      }
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!originalFile) return;
    await processFile(originalFile, options);
  }, [originalFile, options]);

  const handleDownloadSvg = useCallback(() => {
    if (!bimiSvg || !originalFile) return;
    downloadBimiSvg(bimiSvg, originalFile.name);
  }, [bimiSvg, originalFile]);


  const handleCopySvg = useCallback(async () => {
    if (!bimiSvg) return;
    try {
      await copyToClipboard(bimiSvg);
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
          </div>

          <div className="right-column">
            <PreviewPanel
              originalFile={originalFile}
              originalPreview={originalPreview}
              bimiSvg={bimiSvg}
            />

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
                </div>
              </div>
            )}
          </div>

          <ValidationPanel validation={validation} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
