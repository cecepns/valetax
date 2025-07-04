import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: 'https://gudang-fosly.site/',
  // server: {
  //   proxy: {
  //     '/api': {
  //       // Development proxy - only used during npm run dev
  //       target: 'https://api-inventory.isavralabel.com',
  //       changeOrigin: true,
  //     },
  //   },
  // },
})