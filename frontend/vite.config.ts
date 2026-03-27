import { defineConfig } from "vite";
import srvg from "vite-plugin-svgr";

export default defineConfig({
      appType: "spa",
      server: {
            proxy: {
                  '/api': {
                        target: 'http://localhost:3000',
                        changeOrigin: true,
                        rewrite: (path) => path.replace(/^\/api/, '')
                  },
            },
            host: true,
            port: 5173,
            strictPort: true
      },
      plugins: [srvg()]


});