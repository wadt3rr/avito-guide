import { defineConfig } from 'vite';

// Сборка в один самодостаточный файл: хост подключает его обычным <script src>,
// без сборщика и загрузчика модулей на своей стороне.
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
  },
});
