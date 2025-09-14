import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      include: "**/*.{jsx,tsx}"
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Production optimizations
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          fcl: ['@onflow/fcl', '@onflow/config', '@onflow/types'],
          ui: ['framer-motion', 'lucide-react', 'react-hot-toast'],
          utils: ['zustand', 'tailwind-merge', 'class-variance-authority']
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Generate source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    // Optimize CSS
    cssCodeSplit: true,
    // Enable gzip compression
    reportCompressedSize: true,
  },
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    open: true,
  },
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@onflow/fcl',
      'framer-motion',
      'lucide-react',
      'react-hot-toast',
      'zustand'
    ],
    exclude: ['@onflow/fcl']
  },
  // CSS configuration
  css: {
    devSourcemap: true,
  },
})
