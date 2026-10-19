import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  base: process.env.UNFORGED_BASE ?? "/",
  plugins: [react(), wasm()],
  server: { port: 5173, strictPort: true, host: "localhost" },
  preview: { port: 5173, strictPort: true, host: "localhost" },
  build: { target: "es2022" },
  optimizeDeps: { exclude: ["@midnightntwrk/onchain-runtime-v4"] },
});
