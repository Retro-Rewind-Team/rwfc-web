import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [solidPlugin(), tailwindcss()],
    server: {
        port: 3000,
    },
    build: {
        target: "esnext",
    },
    test: {
        environment: "node",
        include: ["src/__tests__/**/*.test.ts"],
        coverage: {
            provider: "v8",
            include: ["src/utils/**/*.ts"],
            exclude: ["src/utils/index.ts"],
        },
    },
});
