import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-syntax-highlighter',
      '@excalidraw/excalidraw',
    ],
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {},
};

export default nextConfig;
