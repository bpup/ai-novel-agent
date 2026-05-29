import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = "172.19.208.102";

export default defineConfig(async () => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@lancedb/lancedb"],
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    rollupOptions: {
      external: [
        "@lancedb/lancedb",
        "@lancedb/lancedb-darwin-arm64",
        "@lancedb/lancedb-darwin-x64",
        "@lancedb/lancedb-linux-x64-gnu",
        "@lancedb/lancedb-win32-x64-msvc",
      ],
    },
  },
}));
