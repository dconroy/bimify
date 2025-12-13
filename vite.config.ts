import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Using custom domain (verifybimi.com) - base path is root
  // For custom domains, always use '/' as base path
  // For GitHub Pages subdomain (username.github.io/repo), use '/repo/'
  base: process.env.GITHUB_PAGES && !process.env.CUSTOM_DOMAIN
    ? `/${process.env.GITHUB_REPOSITORY_NAME || 'bimify'}/`
    : '/',
  build: {
    // Explicitly enable minification (default in production, but making it explicit)
    minify: 'esbuild', // esbuild is faster than terser for most cases
    // Enable CSS minification
    cssMinify: true,
    // Enable source maps for production debugging (optional, can disable for smaller builds)
    sourcemap: false,
    rollupOptions: {
      // Enable tree-shaking (default, but explicit)
      // Tree-shaking configuration must be in rollupOptions to be passed to Rollup
      treeshake: true,
      output: {
        // Code splitting: separate vendor chunks and core logic
        manualChunks: (id) => {
          // Separate React vendor
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Separate core conversion logic (framework-agnostic)
          if (id.includes('/src/core/')) {
            return 'core';
          }
          // Keep tools pages separate (already lazy loaded, but ensure they're chunked)
          if (id.includes('/src/components/tools/')) {
            return 'tools';
          }
          // All other node_modules go into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Chunk size warnings threshold (500kb default)
    chunkSizeWarningLimit: 600,
  },
})

