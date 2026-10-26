import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Alle Tests teilen sich eine Testdatenbank, daher nacheinander ausführen.
    fileParallelism: false,
    setupFiles: ["tests/setup.ts"],
  },
});
