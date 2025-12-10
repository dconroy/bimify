# VerifyBIMI

A browser-only web application that converts uploaded logos (PNG, JPG, SVG) into BIMI-compliant SVG format with live preview and validation.

## What is BIMI?

BIMI (Brand Indicators for Message Identification) is an email standard that allows brands to display their logo next to authenticated emails. BIMI requires logos to be in a specific SVG format with strict requirements.

## Features

- **Multi-format Support**: Upload PNG, JPG, or SVG logos
- **BIMI Conversion**: Automatically converts logos to BIMI-compliant SVG format
- **Live Preview**: Side-by-side comparison of original and BIMI versions
- **Validation**: Real-time validation against BIMI requirements with detailed error and warning messages
- **Customizable Options**:
  - Background color (default: white)
  - Background shape (circle or rounded square)
  - Safe padding percentage (5% to 25%, default: 12.5%)
- **Download Options**:
  - Download BIMI SVG file
  - Copy SVG to clipboard
  - Download validation report (JSON)

## BIMI Requirements Implemented

- ✅ Square viewBox (minimum 64x64 logical size)
- ✅ No raster images (`<image>` tags)
- ✅ No scripts or foreign objects
- ✅ Solid, opaque background
- ✅ Safe padding area for artwork
- ✅ Vector-only output

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

### Build for Production

Build the production bundle:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Deploy to GitHub Pages

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick setup:**
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings (Source: GitHub Actions)
3. Configure DNS for custom domain `verifybimi.com` (see [DNS_SETUP.md](./DNS_SETUP.md))
4. Your app will be live at `https://verifybimi.com`

**DNS Configuration:** See [DNS_SETUP.md](./DNS_SETUP.md) for step-by-step DNS setup instructions.

The repository includes:
- Automated GitHub Actions workflow that deploys on every push to `main`
- CNAME file configured for `verifybimi.com`
- Base path set to root (`/`) for custom domain

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
- **`src/utils/`**: Utility functions for downloads and clipboard operations

### Future Micro-SaaS Integration

The codebase is structured to easily add:

- User authentication
- Usage limits and quotas
- API endpoints
- Analytics tracking
- Cloud storage for converted logos
- Batch processing

See `src/core/README.md` for more details on backend integration.

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

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Browser APIs**: File API, Canvas API, DOMParser, XMLSerializer

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
│   │   └── ValidationPanel.tsx
│   ├── utils/             # Utility functions
│   │   └── downloadUtils.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Contributing

This is a browser-only application with no backend. All processing happens client-side.

## License

MIT License - feel free to use this code for your own projects.

## References

- [BIMI Specification](https://bimigroup.org/)
- [SVG Specification](https://www.w3.org/TR/SVG2/)

