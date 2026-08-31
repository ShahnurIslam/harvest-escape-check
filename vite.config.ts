import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Project GitHub Pages site. Local `vite` / `vite preview` still work;
  // preview is served under this path.
  base: '/harvest-escape-check/',
})
