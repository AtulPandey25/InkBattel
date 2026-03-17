import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),react()],
  server: {
    allowedHosts: [
      'a6d6-2409-4064-2ecf-109e-440-d093-4666-98fe.ngrok-free.app'
    ]
  }
})
