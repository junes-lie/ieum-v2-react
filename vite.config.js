import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { omitArchivedPublicOutput } from './scripts/build-output-policy.mjs'

export default defineConfig({
  plugins: [react(), omitArchivedPublicOutput()],
  server: { port: 4187, strictPort: true },
  preview: { port: 4187, strictPort: true }
})
