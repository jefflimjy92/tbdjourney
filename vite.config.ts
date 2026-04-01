import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
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
