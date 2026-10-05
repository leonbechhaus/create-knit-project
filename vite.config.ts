import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as {
  version: string
}

// The GitHub Pages deploy workflow sets GH_PAGES=true so asset URLs resolve
// under /<repo-name>/ — every other target (local dev, Vercel/Netlify,
// Electron later) serves from the domain root, so base stays "/".
const base = process.env.GH_PAGES === 'true' ? '/create-knit-project/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    sourcemap: true,
    target: 'es2023',
  },
})
