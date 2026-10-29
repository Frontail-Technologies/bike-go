import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    // Data access lives in each feature's hooks/ (and queries.ts); components only call those hooks.
    files: ["src/app/**/*.tsx", "src/**/components/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@tanstack/react-query",
          importNames: ["useQuery", "useQueries", "useInfiniteQuery", "useSuspenseQuery", "useMutation", "useQueryClient"],
          message: "Define queries and mutations in the feature's hooks/ folder (or queries.ts) and call that hook here.",
        }],
      }],
    },
  },
  globalIgnores([
    ".next/**",
    ".next-*/**",
    ".next-qa/**",
    "qa/screenshots/**",
    "backend/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
