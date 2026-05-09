import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: "src",
  base: "./",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, "src"),
      '@platform': path.resolve(__dirname, `src/platform/${process.platform}`)
    }
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
})