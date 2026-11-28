import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,

    // העברת בקשות API לשרת ה-Backend המקומי
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,

        // העברת פרטי התקשורת דרך ה-Proxy
        xfwd: true,

        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
