import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Custom domain (https://harvest.shanislam.com/) serves from root.
  // Local `vite` / `vite preview` use the same base path.
  base: '/',
})
