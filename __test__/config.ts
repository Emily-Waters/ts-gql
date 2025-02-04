import { defineConfig } from "../src/index";

export default defineConfig({
  gqlEndpoint: "http://localhost:3000/graphql",
  outDir: "__generated__",
  options: {
    clean: true,
  },
});
