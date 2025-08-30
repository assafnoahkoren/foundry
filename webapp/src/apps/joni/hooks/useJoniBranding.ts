import { useEffect } from 'react';
import logoPath from '../assets/logo.png';

interface UseJoniBrandingOptions {
  title?: string;
  faviconPath?: string;
}

/**
 * Custom hook to set JONI-specific branding (title and favicon)
 * Automatically restores original values on cleanup
 */
export function useJoniBranding(options?: UseJoniBrandingOptions) {
  useEffect(() => {
    // Store original values
    const originalTitle = document.title;
    const originalFavicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    const originalFaviconHref = originalFavicon?.href;

    // Set JONI-specific title
    document.title = options?.title || 'Joni';

    // Set JONI-specific favicon
    const setFavicon = () => {
      // Remove existing favicon
      if (originalFavicon) {
        originalFavicon.remove();
      }

      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = options?.faviconPath || logoPath;
      document.head.appendChild(link);
    };

    setFavicon();

    // Cleanup function to restore original values
    return () => {
      // Restore original title
      document.title = originalTitle;

      // Restore original favicon
      const currentFavicon = document.querySelector("link[rel*='icon']");
      if (currentFavicon) {
        currentFavicon.remove();
      }
      if (originalFaviconHref) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = originalFaviconHref;
        document.head.appendChild(link);
      }
    };
  }, [options?.title, options?.faviconPath]);
}