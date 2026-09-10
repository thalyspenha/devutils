import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Produção roda sob file:// (Electron loadFile) → assets precisam de caminho relativo.
  base: './',
  // Dev: main.cjs e o script `electron:dev` (wait-on tcp:1234) apontam para a 1234.
  server: { port: 1234, strictPort: true },
})
