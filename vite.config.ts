import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Cloudflare 터널 등 외부 호스트에서의 접속 허용 (데모용)
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true, port: 4173 },
});
