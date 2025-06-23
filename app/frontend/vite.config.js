// frontend/vite.config.js - Cloud Foundry deployment configuration
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './', // Important for HTML5 app deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3002,
    host: '0.0.0.0',
    proxy: {
      '/opportunity-risks': {
        target: process.env.NODE_ENV === 'production' 
          ? '/opportunity-risks' // In production, use relative URL
          : 'https://port4004-workspaces-ws-8dilk.ap10.applicationstudio.cloud.sap',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url);
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})