import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/proyecto-frontend/',  // nombre exacto de tu repo
})
