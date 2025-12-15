import { useState, useCallback, lazy, Suspense } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { ControlsPanel } from './components/ControlsPanel';
import { OriginalPreview } from './components/OriginalPreview';
import { PreviewPanel } from './components/PreviewPanel';
import { EmailPreview } from './components/EmailPreview';
import { ValidationPanel } from './components/ValidationPanel';

// Lazy load tools pages to reduce initial bundle size
const ToolsPage = lazy(() => import('./components/tools/ToolsPage').then(m => ({ default: m.ToolsPage })));
const DmarcVerifierPage = lazy(() => import('./components/tools/DmarcVerifierPage').then(m => ({ default: m.DmarcVerifierPage })));
const BimiCheckerPage = lazy(() => import('./components/tools/BimiCheckerPage').then(m => ({ default: m.BimiCheckerPage })));
const SpfDkimCheckerPage = lazy(() => import('./components/tools/SpfDkimCheckerPage').then(m => ({ default: m.SpfDkimCheckerPage })));
import { convertToBimiSvg } from './core';
import type { ConvertOptions, ValidationResult } from './core/types';
import { downloadBimiSvg, copyToClipboard } from './utils/downloadUtils';
import './App.css';

function App() {
  // Simple path-based view switch (no router). This also acts as a safety net if hosting falls back to index.html.
  if (typeof window !== 'undefined') {
    // ... (keep existing routing logic) ...
    // GitHub Pages fallback: static pages under /tools/* redirect to "/?r=/tools/...".
    // Normalize that back into a clean pathname so our simple router can render the correct view.
    const baseUrl = import.meta.env.BASE_URL || '/';
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('r');
    if (redirect) {
      const next = redirect.startsWith('/') ? redirect : `/${redirect}`;
      // Ensure we keep baseUrl prefix (e.g., /repo/ on GH Pages project sites)
      const normalized = `${baseUrl.replace(/\/?$/, '/')}${next.replace(/^\//, '')}`;
      window.history.replaceState({}, '', normalized);
    }

    const pathname = window.location.pathname;

    // If hosting falls back to index.html for unknown routes, redirect to the real static blog pages.
    // (Vite serves /public/blog/* at /blog/*, but some hosts may still load the SPA for /blog/... paths.)
    if (pathname.includes('/blog')) {
      const baseUrl = import.meta.env.BASE_URL || '/';

      // Avoid redirect loops if we're already on a concrete static HTML file.
      if (!pathname.endsWith('.html')) {
        // Normalize:
        // - /blog or /blog/                -> /blog/index.html
        // - /blog/some-post or /blog/some-post/ -> /blog/some-post/index.html
        const blogRootMatch = pathname.match(/\/blog\/?$/);
        if (blogRootMatch) {
          window.location.replace(`${baseUrl}blog/index.html`);
          return null;
        }

        const blogPostMatch = pathname.match(/\/blog\/([^/]+)\/?$/);
        if (blogPostMatch?.[1]) {
          const slug = blogPostMatch[1];
          window.location.replace(`${baseUrl}blog/${slug}/index.html`);
          return null;
        }
      }
    }

    if (pathname.includes('/tools/dmarc')) {
      return (
        <Suspense fallback={<div className="app"><main className="app-main"><div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div></main></div>}>
          <DmarcVerifierPage />
        </Suspense>
      );
    }

    if (pathname.includes('/tools/bimi')) {
      return (
        <Suspense fallback={<div className="app"><main className="app-main"><div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div></main></div>}>
          <BimiCheckerPage />
        </Suspense>
      );
    }

    if (pathname.includes('/tools/spf-dkim')) {
      return (
        <Suspense fallback={<div className="app"><main className="app-main"><div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div></main></div>}>
          <SpfDkimCheckerPage />
        </Suspense>
      );
    }

    if (pathname.includes('/tools')) {
      return (
        <Suspense fallback={<div className="app"><main className="app-main"><div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div></main></div>}>
          <ToolsPage />
        </Suspense>
      );
    }

    // Fallback for /what-is-bimi if the SPA loads instead of the static file
    if (pathname.includes('/what-is-bimi')) {
      window.location.replace(`${baseUrl}what-is-bimi/index.html`);
      return null;
    }
  }

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [bimiSvg, setBimiSvg] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSvgSource, setIsSvgSource] = useState<boolean | null>(null);
  const [options, setOptions] = useState<ConvertOptions>({
    backgroundColor: '#FFFFFF',
    shape: 'circle',
    paddingPercent: 3, // Reduced default to maximize logo size
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
      <Header />
      
      <main className="app-main">
        {/* Hero Section for Main Converter */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>BIMI Logo Converter</h1>
          <p style={{ display: 'block', margin: '0 auto', fontSize: '1.25rem', maxWidth: '600px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Upload your logo (SVG, PNG, or JPG) to automatically generate a compliant BIMI SVG file.
          </p>
        </div>

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
              hasFile={!!originalFile}
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
              onDownload={handleDownloadSvg}
              onCopy={handleCopySvg}
            />
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
