// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            // Formatting
            indent: ["error", 4],
            semi: ["warn", "always"],
            quotes: ["warn", "double"],

            // TypeScript
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "no-unused-vars": "off",

            // Imports
            "sort-imports": ["error", {
                ignoreCase: true,
                ignoreDeclarationSort: true,
                ignoreMemberSort: false,
            }],
            "no-duplicate-imports": "error",
        },
    },
);
