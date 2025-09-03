import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { UnifiedViteWeappTailwindcssPlugin } from 'weapp-tailwindcss/vite'
import tailwindcss from '@tailwindcss/postcss'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// 跨端平台检测
const isH5 = process.env.UNI_PLATFORM === "h5";
// vue3 版本构建到 app, UNI_PLATFORM 的值为 app
// vue2 版本为 app-plus
const isApp = process.env.UNI_PLATFORM === "app" || process.env.UNI_PLATFORM === "app-plus";
const WeappTailwindcssDisabled = isH5 || isApp;

// vite 插件配置
const vitePlugins = [
  uni(),
  UnifiedViteWeappTailwindcssPlugin({
    rem2rpx: true,
    disabled: WeappTailwindcssDisabled
  })
];

export default defineConfig({
  plugins: vitePlugins,
  css: {
    postcss: {
      plugins: (() => {
        const plugins = [tailwindcss()];
        
        // 只在小程序环境下添加 rem 转 rpx 插件
        if (!WeappTailwindcssDisabled) {
          // 注意：这里需要安装 postcss-rem-to-responsive-pixel 插件
          // npm install postcss-rem-to-responsive-pixel -D
          try {
            const remToRpx = require('postcss-rem-to-responsive-pixel');
            plugins.push(
              remToRpx({
                rootValue: 32,
                propList: ['*'],
                transformUnit: 'rpx'
              })
            );
          } catch (e) {
            console.warn('postcss-rem-to-responsive-pixel not found, skipping rem to rpx conversion');
          }
        }
        
        return plugins;
      })()
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'key.pem')),
      cert: fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'cert.pem'))
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      '/fileserver': {
        target: 'https://192.168.1.68:8443/download',
        changeOrigin: true,
        secure: false, // 如果目标服务器使用自签名证书，设置为false
        rewrite: (path) => path.replace(/^\/fileserver/, '')
      },
      '/backend': {
        target: 'https://jeremy233-temp.oss-cn-guangzhou.aliyuncs.com',
        changeOrigin: true,
        secure: false, // 如果目标服务器使用自签名证书，设置为false
        rewrite: (path) => path.replace(/^\/backend/, '')
      }
    }
  },
  build: {
    // 确保WebGL相关的二进制文件能正确处理
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // 防止大文件被内联
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && (assetInfo.name.endsWith('.wasm') || assetInfo.name.endsWith('.ply'))) {
            return '[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
});
