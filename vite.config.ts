import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Function to copy public directory recursively (excluding HTML files processed by Vite)
const copyPublicDir = (): void => {
  const publicDir = resolve(__dirname, 'public');
  const distDir = resolve(__dirname, 'dist');
  
  if (!existsSync(publicDir)) {
    return;
  }
  
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  
  // Copy public directory, but HTML files will be processed by Vite as entry points
  const copyDir = (src: string, dest: string): void => {
    const entries = readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!existsSync(destPath)) {
          mkdirSync(destPath, { recursive: true });
        }
        copyDir(srcPath, destPath);
      } else if (!entry.name.endsWith('.html')) {
        // Skip HTML files as they're processed by Vite
        // Skip prevent-duplicate-tabs.png - keep in repo but exclude from build
        if (entry.name === 'prevent-duplicate-tabs.png') {
          return;
        }
        copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyDir(publicDir, distDir);
};

// Function to copy manifest.json
const copyManifest = (): void => {
  const distDir = resolve(__dirname, 'dist');
  const manifestSrc = resolve(__dirname, 'manifest.json');
  const manifestDest = resolve(distDir, 'manifest.json');
  
  if (!existsSync(manifestSrc)) {
    return;
  }
  
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  
  copyFileSync(manifestSrc, manifestDest);
};

// Plugin to copy manifest.json and public files, and watch for changes
const copyAssetsPlugin = () => {
  const manifestPath = resolve(__dirname, 'manifest.json');
  const publicDir = resolve(__dirname, 'public');
  
  return {
    name: 'copy-assets',
    buildStart() {
      // Copy on initial build
      copyManifest();
      copyPublicDir();
      
      // Add files to watch list for watch mode
      this.addWatchFile(manifestPath);
      if (existsSync(publicDir)) {
        this.addWatchFile(publicDir);
      }
    },
    closeBundle() {
      // Always copy after build completes (works in both build and watch modes)
      copyManifest();
      copyPublicDir();
    },
    watchChange(id: string) {
      // Watch for changes in watch mode - copy immediately when files change
      if (id === manifestPath) {
        copyManifest();
      } else if (id.startsWith(publicDir)) {
        copyPublicDir();
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Enable minification in dev mode for code protection
    // esbuild minifier is faster and automatically preserves Chrome APIs
    minify: 'esbuild',
    rollupOptions: {
      input: {
        // Service worker background script
        background: resolve(__dirname, 'src/service-worker/index.ts'),
        // Popup page - HTML entry that imports TSX
        popup: resolve(__dirname, 'popup.html'),
        // Options page - HTML entry that imports TSX
        options: resolve(__dirname, 'options.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        format: 'es',
      },
    },
  },
});

