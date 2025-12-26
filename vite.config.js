import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: 'local.gofloww.xyz',
    hmr: {
      overlay: false,
      host: 'local.gofloww.xyz',
      protocol: 'ws',
      clientPort: 5173
    }
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          if (assetInfo.name.match(/\.(png|jpe?g|svg|gif|webp|avif)$/)) {
            return 'images/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
          utils: ['date-fns', 'uuid', 'js-cookie']
        }
      }
    },
    sourcemap: process.env.NODE_ENV === 'development',
    chunkSizeWarningLimit: 1000
  },
  preview: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})
