import { defineConfig } from "astro/config";

export default defineConfig({
  build: {
    format: "file",
  },
  server: {
    host: true,
    port: 4321,
  },
});
