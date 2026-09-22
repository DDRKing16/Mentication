import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
  ],
  test: {
    // The .claude/worktrees folder holds separate, isolated agent
    // checkouts of this same repo. Their test files must never be picked
    // up when running tests from the main checkout.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
});
