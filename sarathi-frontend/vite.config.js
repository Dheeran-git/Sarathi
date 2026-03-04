import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow any host (required for cloudflared tunnels with dynamic URLs)
    allowedHosts: true,
    // Bind to all interfaces so localhost works reliably on Windows (IPv4 + IPv6)
    host: "0.0.0.0",
    // Use a stable port (5173 is commonly occupied)
    port: 5174,
    strictPort: true,
  }
})
