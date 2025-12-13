# Core BIMI Conversion Library

This directory contains the core conversion and validation logic for BIMI logo processing.

## Purpose

These modules are framework-agnostic and can be used by:
- React frontend (current implementation)
- Backend API services
- CLI tools
- Other JavaScript/TypeScript applications

## Modules

- **types.ts**: Core TypeScript types and interfaces
- **svgValidate.ts**: BIMI validation rules and checks
- **svgNormalize.ts**: SVG normalization (background, padding, cleanup)
- **imageToSvg.ts**: Raster to vector conversion (with limitations)
- **index.ts**: Main API entry point

## Limitations

- Browser-based vectorization is limited in quality
- For production-grade vectorization, consider server-side tools like Potrace
- Complex images may not convert perfectly
