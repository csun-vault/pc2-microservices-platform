import { defineConfig } from "vite";
import srvg from "vite-plugin-svgr";

export default defineConfig({
      appType: "spa",
      server: {
            host: true,
            port: 5173,
            strictPort: true
      },
      plugins: [srvg()]


});