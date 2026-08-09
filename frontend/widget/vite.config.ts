import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AvitoOnboarding',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    target: 'es2019',
    minify: 'esbuild',
    emptyOutDir: true,
    watch:
      process.env.WATCH_POLL === '1'
        ? { chokidar: { usePolling: true, interval: 300 } }
        : null,
  },
});
