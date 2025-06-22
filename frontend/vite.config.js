// frontend/vite.config.js - Updated with CSP headers and clean proxy config
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3002,
    host: '0.0.0.0',
    // Configure headers to allow framing in SAP Business Application Studio
    headers: {
      // Allow framing from SAP Business Application Studio domains
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors 'self' *.ap10cf.applicationstudio.cloud.sap gw.ap10.applicationstudio.cloud.sap *.ap10.applicationstudio.cloud.sap workspaces-ws-8dilk.ap10.applicationstudio.cloud.sap port3002-workspaces-ws-8dilk.ap10.applicationstudio.cloud.sap *.sap.com 'unsafe-inline'"
    },
    // Proxy configuration for backend API
    proxy: {
      '/opportunity-risks': {
        target: 'https://port4004-workspaces-ws-8dilk.ap10.applicationstudio.cloud.sap',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url);
            // Add any necessary headers
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