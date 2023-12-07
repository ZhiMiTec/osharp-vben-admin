import { defineApplicationConfig } from '@vben/vite-config';

export default defineApplicationConfig({
  overrides: {
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'qrcode',
        '@iconify/iconify',
        'ant-design-vue/es/locale/zh_CN',
        'ant-design-vue/es/locale/en_US',
      ],
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://edu.carebobo.com/api',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/api`), ''),
          // only https
          // secure: false
        },
        '/UploadFiles': {
          target: 'https://edu.carebobo.com/UploadFiles',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/UploadFiles`), ''),
        },
      },
    },
  },
});
