# VerifyBIMI
[VerifyBIMI - Convert and Validate Logos for BIMI](https://verifybimi.com)

A browser-only web application that converts uploaded logos (PNG, JPG, SVG) into BIMI-compliant SVG format with live preview and validation.

## Transparency & Privacy

This application is fully transparent in its operation:
- **Client-Side Only**: All processing (logo conversion, validation, preview) happens entirely in your browser.
- **No Uploads**: Your logos are never uploaded to any server. They remain on your device.
- **Open Source**: The full source code is available here for inspection to verify how the tool works.

## What is BIMI?

BIMI (Brand Indicators for Message Identification) is an email standard that allows brands to display their logo next to authenticated emails. BIMI requires logos to be in a specific SVG format with strict requirements.

## Features

### Logo Conversion & Validation
- **Multi-format Support**: Upload PNG, JPG, or SVG logos
- **BIMI Conversion**: Automatically converts logos to BIMI-compliant SVG format
- **Live Preview**: Side-by-side comparison of original and BIMI versions
- **Validation**: Real-time validation against BIMI requirements with detailed error and warning messages
- **Customizable Options**:
  - Background color (default: white)
  - Background shape (circle or rounded square)
  - Safe padding percentage (1% to 25%, default: 3%)
- **Download Options**:
  - Download BIMI SVG file
  - Copy SVG to clipboard

### Tools & Utilities
- **DMARC Verifier**: Check your DMARC DNS record using DNS-over-HTTPS
  - Verify DMARC policy enforcement (required for BIMI)
  - Multiple resolver options (Cloudflare, Google DNS)
  - Clear PASS/FAIL status for BIMI eligibility
  - Parsed DMARC tag analysis

### Educational Resources
- **BIMI Guide**: Comprehensive "What is BIMI?" guide
- **Blog**: Practical guides covering:
  - BIMI logo requirements (SVG Tiny 1.2)
  - BIMI DNS record examples
  - DMARC vs BIMI relationship
  - Provider-specific requirements (Gmail, Yahoo)
  - VMC requirements
  - Deliverability considerations

### Performance & Accessibility
- **Optimized Performance**: Code splitting, lazy loading, and optimized asset delivery
- **Accessibility**: WCAG-compliant with proper heading hierarchy, form labels, and ARIA attributes
- **SEO Optimized**: Comprehensive meta tags, structured data, and sitemap
- **Fast Loading**: Preconnect hints, deferred analytics, and efficient caching strategies

## BIMI Requirements Implemented

- ✅ Square viewBox (minimum 64x64 logical size)
- ✅ No raster images (`<image>` tags)
- ✅ No scripts or foreign objects
- ✅ Solid, opaque background
- ✅ Safe padding area for artwork
- ✅ Vector-only output

## Usage

1. **Upload a Logo**: Drag and drop or click to browse for a logo file (PNG, JPG, or SVG)
2. **Configure Options**: 
   - Choose background color
   - Select background shape (circle or rounded square)
   - Adjust safe padding percentage
3. **Convert**: Click "Convert to BIMI" to process the logo
4. **Review**: Check the preview and validation results
5. **Download**: Download the BIMI-compliant SVG or copy it to clipboard

## Architecture

The application is built with a modular architecture that separates core logic from the UI:

- **`src/core/`**: Framework-agnostic conversion and validation logic
  - Can be reused by backend services, CLI tools, or other applications
  - No React dependencies
- **`src/components/`**: React UI components
  - Main converter components
  - Tools pages (DMARC verifier, tools landing)
  - Educational pages (BIMI guide)
- **`src/utils/`**: Utility functions
  - Downloads and clipboard operations
  - DNS-over-HTTPS (DoH) for DMARC verification
  - DMARC record parsing and validation
  - Analytics tracking

See `src/core/README.md` for more details on the core library.

## Known Limitations

### Browser-Based Vectorization

The raster-to-vector conversion (PNG/JPG to SVG) is performed entirely in the browser using JavaScript. This has several limitations:

1. **Quality**: Browser-based vectorization is limited compared to server-side tools like Potrace or ImageMagick
2. **Complex Images**: Photos, gradients, and complex images may not convert perfectly
3. **Performance**: Large images may take longer to process
4. **Accuracy**: The vector paths may not perfectly match the original raster image

**Recommendations**:
- For best results, start with SVG files when possible
- Use simple logos with clear shapes and high contrast
- For production-grade vectorization, consider integrating a backend service with Potrace or similar tools

### SVG Normalization

- Some complex SVG features (filters, masks, gradients) may be simplified or removed
- External font references are detected but not automatically converted to paths
- Text elements should ideally be converted to paths for maximum compatibility

## Technology Stack

- **React 18**: UI framework with lazy loading and code splitting
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server with optimized production builds
- **Browser APIs**: File API, Canvas API, DOMParser, XMLSerializer
- **DNS-over-HTTPS**: For DMARC verification (Cloudflare, Google DNS)
- **Google Analytics**: Usage tracking (deferred loading for performance)

## Project Structure

```
bimify/
├── src/
│   ├── core/              # Core conversion logic (framework-agnostic)
│   │   ├── types.ts       # TypeScript types
│   │   ├── svgValidate.ts # BIMI validation
│   │   ├── svgNormalize.ts # SVG normalization
│   │   ├── imageToSvg.ts  # Raster to vector conversion
│   │   └── index.ts       # Main API
│   ├── components/        # React components
│   │   ├── UploadArea.tsx
│   │   ├── ControlsPanel.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── ValidationPanel.tsx
│   │   ├── EmailPreview.tsx
│   │   ├── OriginalPreview.tsx
│   │   ├── BimiInfoPage.tsx
│   │   ├── Footer.tsx
│   │   └── tools/         # Tools pages
│   │       ├── ToolsPage.tsx
│   │       └── DmarcVerifierPage.tsx
│   ├── utils/             # Utility functions
│   │   ├── downloadUtils.ts
│   │   ├── analytics.ts
│   │   ├── doh.ts         # DNS-over-HTTPS
│   │   └── dmarc.ts       # DMARC parsing
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   ├── App.css            # Component styles
│   └── index.css          # Global styles
├── public/                # Static assets
│   ├── blog/              # Blog posts (static HTML)
│   ├── what-is-bimi/      # BIMI guide (static HTML)
│   ├── tools/             # Tool redirect stubs for GitHub Pages
│   ├── favicon.ico
│   ├── logo.png
│   ├── sitemap.xml
│   ├── robots.txt
│   └── _headers           # Cache headers (for Cloudflare/Netlify)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Performance Optimizations

- **Code Splitting**: Tools pages are lazy-loaded to reduce initial bundle size
- **Vendor Chunks**: React is separated into its own chunk for better caching
- **Deferred Analytics**: Google Analytics loads after page interaction
- **Preconnect Hints**: Early connection to third-party domains
- **Cache Headers**: Optimized cache strategies for static assets
- **LCP Optimization**: Critical images have explicit dimensions and priority hints

## Accessibility

- **WCAG Compliant**: Proper heading hierarchy (h1 → h2 → h3)
- **Form Labels**: All inputs have associated labels or ARIA attributes
- **Color Contrast**: Meets WCAG AA contrast requirements
- **Keyboard Navigation**: Full keyboard support for interactive elements
- **Screen Reader Support**: Semantic HTML and ARIA labels throughout

## License

MIT License

## References

- [BIMI Specification](https://bimigroup.org/)
- [SVG Specification](https://www.w3.org/TR/SVG2/)
