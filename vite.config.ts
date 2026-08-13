import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repositoryPath = process.env.PAGES_BASE_PATH?.replace(/^\/+|\/+$/g, "");

export default defineConfig({
  base: repositoryPath ? `/${repositoryPath}/` : "/",
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
