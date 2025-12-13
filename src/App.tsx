import { useState, useCallback } from 'react';
import { UploadArea } from './components/UploadArea';
import { ControlsPanel } from './components/ControlsPanel';
import { OriginalPreview } from './components/OriginalPreview';
import { PreviewPanel } from './components/PreviewPanel';
import { EmailPreview } from './components/EmailPreview';
import { ValidationPanel } from './components/ValidationPanel';
import { PaymentGate } from './components/PaymentGate';
import { Footer } from './components/Footer';
import { BimiInfoPage } from './components/BimiInfoPage';
import { convertToBimiSvg } from './core';
import type { ConvertOptions, ValidationResult } from './core/types';
import { downloadBimiSvg, copyToClipboard } from './utils/downloadUtils';
import './App.css';

function App() {
  // Simple path-based view switch (no router). This also acts as a safety net if hosting falls back to index.html.
  if (typeof window !== 'undefined' && window.location.pathname.includes('/what-is-bimi')) {
    return <BimiInfoPage />;
  }

  const guideHref = `${import.meta.env.BASE_URL}what-is-bimi/`;

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [bimiSvg, setBimiSvg] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSvgSource, setIsSvgSource] = useState<boolean | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
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
          'Auto vectorization may not be accurate enough for BIMI. Please consider using an SVG provided by your designer.'
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

    // Determine if source is SVG or raster
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    setIsSvgSource(isSvg);

    // Create preview for original file
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Extract title from SVG if it's an SVG file (for pre-populating the title field)
    if (isSvg) {
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

  // Check for payment success on mount
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      setHasPaid(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  });

  const handlePaymentStart = useCallback(() => {
    // TODO: Replace with your actual Stripe Payment Link
    // Example: window.location.href = 'https://buy.stripe.com/test_...';
    
    // For demo purposes, we'll simulate a redirect and return
    const confirm = window.confirm("This would redirect to Stripe for a $1.00 payment.\n\nClick OK to simulate a successful payment.");
    if (confirm) {
      setHasPaid(true);
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
          Already have an SVG logo from your designer? This tool will turn it into a BIMI-ready SVG and validate it.
        </p>
        <div className="app-header-actions">
          <a className="header-cta" href={guideHref}>
            What is BIMI? Read the guide
          </a>
        </div>
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
              isSvgSource={isSvgSource}
            />

            {error && (
              <div className="error-banner">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          <div className="right-column">
            <OriginalPreview
              originalFile={originalFile}
              originalPreview={originalPreview}
              options={options}
            />

            <PreviewPanel 
              bimiSvg={bimiSvg}
              onDownload={hasPaid ? handleDownloadSvg : undefined}
              onCopy={hasPaid ? handleCopySvg : undefined}
            />
            
            {bimiSvg && !hasPaid && (
              <PaymentGate onPaymentStart={handlePaymentStart} />
            )}
          </div>

          <EmailPreview bimiSvg={bimiSvg} companyName={options.title || 'Your Company'} />

          <ValidationPanel validation={validation} isSvgSource={isSvgSource} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
