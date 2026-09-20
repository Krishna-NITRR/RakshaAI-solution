import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const khaanNetraSource = fileURLToPath(new URL('../../khaan-netra/', import.meta.url))

function packageKhaanNetra() {
  return {
    name: 'package-khaan-netra',
    closeBundle() {
      const destination = fileURLToPath(new URL('./dist/khaan-netra/', import.meta.url))
      fs.rmSync(destination, { recursive: true, force: true })
      fs.cpSync(khaanNetraSource, destination, { recursive: true })
    },
  }
}

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/auth': 'http://127.0.0.1:8000',
      '/dashboard': 'http://127.0.0.1:8000',
      '/compliance': 'http://127.0.0.1:8000',
      '/inspections': 'http://127.0.0.1:8000',
      '/corrective-actions': 'http://127.0.0.1:8000',
      '/telemetry': 'http://127.0.0.1:8000',
      '/ws': { target: 'ws://127.0.0.1:8000', ws: true },
      '/khaan-netra': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/khaan-netra/, ''),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'CoalGuard Inspector',
        short_name: 'CoalGuard',
        description: 'Offline-capable field inspection for coal mining governance',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    }),
    packageKhaanNetra(),
  ]
})
