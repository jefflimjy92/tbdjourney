import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      ignored: ['**/.omc/**', '**/.omx/**', '**/.bkit/**', '**/tmp-*'],
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 50,
      },
    },
  },
  build: {
    reportCompressedSize: false,
  },
  resolve: {
    alias: [
      {
        find: /^recharts$/,
        replacement: path.resolve(__dirname, "./src/app/vendor/recharts.ts"),
      },
      {
        find: /^lucide-react$/,
        replacement: path.resolve(__dirname, "./src/app/vendor/lucide-react.ts"),
      },
      {
        // Alias @ to the src directory
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
});
