import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5184'

  return {
    plugins: [react()],
    server: {
      // Node resolves "localhost" to IPv6 (::1) only; bind IPv4 explicitly so tools
      // that connect to 127.0.0.1 can reach the dev server too.
      host: '127.0.0.1',
      port: 5173,
      // Fail instead of silently moving to another port; the API's CORS policy will expect 5173.
      strictPort: true,
      // Forward API calls to the .NET backend so the browser sees a single origin (no CORS in dev).
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/health': { target: apiTarget, changeOrigin: true },
        // SignalR: negotiate over HTTP, then upgrade to a WebSocket.
        '/hubs': { target: apiTarget, changeOrigin: true, ws: true },
      },
    },
  }
})
