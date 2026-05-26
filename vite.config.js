import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If deploying to https://USERNAME.github.io/newsletter-builder/
// set base to "/newsletter-builder/". For a custom domain, set to "/".
export default defineConfig({
  plugins: [react()],
  base: "./",
});
