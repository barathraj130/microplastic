import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tailwindcss from "eslint-plugin-tailwindcss"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  // Ignore build output
  globalIgnores(["dist", "node_modules"]),

  {
    files: ["**/*.{ts,tsx}"],

    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      ...tailwindcss.configs["flat/recommended"],
    ],

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },

    rules: {
      /* ===============================
         Tailwind (important for you)
         =============================== */

      // ❌ Disable annoying pixel-to-scale suggestions
      "tailwindcss/suggestCanonicalClasses": "off",

      // Allow arbitrary values like h-[46px]
      "tailwindcss/no-arbitrary-value": "off",

      // Allow custom class ordering (you intentionally design UI)
      "tailwindcss/classnames-order": "off",

      /* ===============================
         React / TypeScript
         =============================== */

      // React 19 + Vite = no need
      "react/react-in-jsx-scope": "off",

      // You use props intentionally
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      // Relaxed for UI-heavy code
      "@typescript-eslint/no-explicit-any": "off",

      /* ===============================
         General quality
         =============================== */

      "no-console": "off", // allowed for dev & ESP32 debugging
    },
  },
])
