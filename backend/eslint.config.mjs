import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**", "drizzle/**", "storage/**", ".agents/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
);
