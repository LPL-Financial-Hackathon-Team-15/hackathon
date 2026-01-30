import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["ec2-3-142-36-77.us-east-2.compute.amazonaws.com"]
  }
})
