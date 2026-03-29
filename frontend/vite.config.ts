import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
      const env = loadEnv(mode, process.cwd(), "");

      const backendTarget = env.DOCKER_ENV
            ? "http://backend:3000"
            : "http://localhost:3000";

      return {
            appType: "spa",
            server: {
                  host: "0.0.0.0",
                  port: 5173,
                  proxy: {
                        "/api": {
                              target: backendTarget,
                              changeOrigin: true,
                              rewrite: (path) => path.replace(/^\/api/, ""),
                        },
                  },
            },
            plugins: [react(), svgr()],
      };
});