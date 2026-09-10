import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
    plugins: [
        // HMR off under test: solid-refresh wraps components in a hot-reload shim that Vitest
        // cannot resolve ("file:///@solid-refresh"). Dev and build are unaffected.
        solidPlugin({ hot: mode !== "test" }),
        tailwindcss(),
    ],
    server: {
        port: 3000,
    },
    build: {
        target: "esnext",
    },
    // Solid ships separate server and browser builds; tests need the browser one or reactivity
    // silently does nothing.
    resolve: {
        conditions: mode === "test" ? ["development", "browser"] : [],
    },
    test: {
        // jsdom, not node: with no DOM, no component or hook could be tested at all. The include
        // glob also only matched .ts, so a .tsx test file was silently never run.
        environment: "jsdom",
        setupFiles: ["src/__tests__/setup.ts"],
        include: ["src/__tests__/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            include: ["src/utils/**/*.ts", "src/hooks/**/*.tsx", "src/components/**/*.tsx"],
            exclude: ["src/utils/index.ts"],
        },
    },
}));
