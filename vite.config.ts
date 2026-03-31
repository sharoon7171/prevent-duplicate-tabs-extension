import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync, readdirSync, renameSync, rmSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const copyPublicDir = (): void => {
  const publicDir = resolve(__dirname, 'public');
  const distDir = resolve(__dirname, 'dist');

  if (!existsSync(publicDir)) {
    return;
  }

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  const copyDir = (src: string, dest: string): void => {
    const entries = readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'icons') {
          const iconEntries = readdirSync(srcPath, { withFileTypes: true });
          for (const icon of iconEntries) {
            if (icon.isFile() && icon.name !== 'prevent-duplicate-tabs.png') {
              copyFileSync(join(srcPath, icon.name), join(dest, icon.name));
            }
          }
        } else {
          const destPath = join(dest, entry.name);
          if (!existsSync(destPath)) {
            mkdirSync(destPath, { recursive: true });
          }
          copyDir(srcPath, destPath);
        }
      } else if (!entry.name.endsWith('.html')) {
        copyFileSync(srcPath, join(dest, entry.name));
      }
    }
  };

  copyDir(publicDir, distDir);
};

const moveBuiltHtmlToDistRoot = (): void => {
  const distDir = resolve(__dirname, 'dist');
  const publicInDist = join(distDir, 'public');
  const popupSrc = join(publicInDist, 'popup.html');
  const optionsSrc = join(publicInDist, 'options.html');
  if (existsSync(popupSrc)) {
    renameSync(popupSrc, join(distDir, 'popup.html'));
  }
  if (existsSync(optionsSrc)) {
    renameSync(optionsSrc, join(distDir, 'options.html'));
  }
  if (existsSync(publicInDist)) {
    rmSync(publicInDist, { recursive: true });
  }
};

const copyAssetsPlugin = () => {
  const publicDir = resolve(__dirname, 'public');
  const isBackgroundOnly = process.env.BUILD_BACKGROUND === '1';

  return {
    name: 'copy-assets',
    buildStart() {
      if (existsSync(publicDir)) {
        this.addWatchFile(publicDir);
      }
    },
    closeBundle() {
      copyPublicDir();
      if (!isBackgroundOnly) {
        moveBuiltHtmlToDistRoot();
      }
    },
    watchChange(id: string) {
      if (id.startsWith(publicDir)) {
        copyPublicDir();
      }
    },
  };
};

const sharedResolve = {
  alias: { '@': resolve(__dirname, './src') },
};

const isBackgroundOnly = process.env.BUILD_BACKGROUND === '1';
const preserveOutput = process.env.EMPTY_OUT_DIR === '0';

export default defineConfig({
  plugins: [...(isBackgroundOnly ? [] : [react()]), copyAssetsPlugin()],
  resolve: sharedResolve,
  publicDir: false,
  build: isBackgroundOnly
    ? {
        outDir: 'dist',
        emptyOutDir: false,
        rolldownOptions: {
          input: {
            background: resolve(__dirname, 'src/service-worker/index.ts'),
          },
          output: {
            codeSplitting: false,
            entryFileNames: '[name].js',
            format: 'es',
          },
        },
      }
    : {
        outDir: 'dist',
        emptyOutDir: !preserveOutput,
        rollupOptions: {
          input: {
            popup: resolve(__dirname, 'public/popup.html'),
            options: resolve(__dirname, 'public/options.html'),
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name][extname]',
            format: 'es',
          },
        },
      },
});

