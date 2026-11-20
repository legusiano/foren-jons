import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// защитные заголовки (для продакшена их нужно продублировать
// на уровне хостинга: Netlify _headers / Nginx / Vercel headers)
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages отдаёт проект по /<repo>/, локально — с корня
  base: mode === 'ghpages' ? '/foren-jons/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
}))
