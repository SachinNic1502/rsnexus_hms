import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next";

export default tseslint.config(
  ...nextConfig,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
);
