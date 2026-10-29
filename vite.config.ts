import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' —— 相对路径，仓库页（/repo/）和根域名都能直接跑，不用改配置
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
