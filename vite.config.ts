import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: "src/renderer",
  base: "./",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, "src"),
      '@platform': path.resolve(__dirname, `src/renderer/platform/${process.platform}`)
    }
  },
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
})