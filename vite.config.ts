import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

/*
      See https://vitejs.dev/config/
*/

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: '../manifest.json',
          dest: '.'
        },
        {
          src: '../public/*.*',
          dest: '.'
        }
      ]
    }),
    viteStaticCopy({
      targets: [
        // Widget icons and configurations
        {
          src: 'widgets/**/*.{svg,png,jpg,json}',
          dest: '.'
        }
      ],
      structured: true
    })
  ],
  root: './src',
  base: '',
  publicDir: 'public',
  build: {
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: false,
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: false,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        // List every widget entry point here
        markdownEmbed: resolve(__dirname, 'src/widgets/markdwown-embed/index.html'),
      },
      output: {
        manualChunks: {
          'react': ['react', 'react-dom'],
          'markdown': ['markdown-it'],
          'highlighting': ['highlight.js'],
        }
      }
    }
  }
});
