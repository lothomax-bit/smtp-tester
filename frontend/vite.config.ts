import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^.*wailsjs\/(runtime|go\/main\/App)$/,
        replacement: path.resolve(__dirname, 'src/wailsMock.ts')
      }
    ]
  }
})
