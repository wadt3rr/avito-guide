import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Файлы приходят с хоста через смонтированную папку — обычные события
      // файловой системы туда не долетают, поэтому следим опросом.
      usePolling: true,
    },
  },
});
