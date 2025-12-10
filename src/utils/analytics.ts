/**
 * Google Analytics utility functions
 * Replace G-XXXXXXXXXX with your actual Google Analytics 4 Measurement ID
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Get GA Measurement ID from environment variable or use placeholder
// Set VITE_GA_MEASUREMENT_ID in .env file or build environment
const getGAMeasurementId = (): string => {
  // Check window first (set in index.html)
  if (typeof window !== 'undefined' && (window as any).GA_MEASUREMENT_ID) {
    const id = (window as any).GA_MEASUREMENT_ID;
    if (id && id !== 'G-5NC3F2GFGJ') {
      return id;
    }
  }
  // Fallback to placeholder
  return 'G-5NC3F2GFGJ';
};

const GA_MEASUREMENT_ID = getGAMeasurementId();

/**
 * Initialize Google Analytics
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    return; // Don't initialize if no ID provided
  }

  // GA script is loaded in index.html
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  if (window.gtag && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
}

/**
 * Track event
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    [key: string]: string | number | boolean;
  }
): void {
  if (window.gtag && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    window.gtag('event', eventName, eventParams);
  }
}

/**
 * Track file upload
 */
export function trackFileUpload(fileType: string, fileSize: number): void {
  trackEvent('file_upload', {
    file_type: fileType,
    file_size: fileSize,
  });
}

/**
 * Track conversion
 */
export function trackConversion(success: boolean, fileType: string, errors?: number): void {
  trackEvent('bimi_conversion', {
    success: success,
    file_type: fileType,
    error_count: errors || 0,
  });
}

/**
 * Track download
 */
export function trackDownload(downloadType: 'svg' | 'report' | 'clipboard'): void {
  trackEvent('file_download', {
    download_type: downloadType,
  });
}

