import { defineConfig } from "../src/index";

export default defineConfig({
  gqlEndpoint: "http://localhost:4000/graphql",
  outDir: "__generated__",
  options: {
    clean: true,
    // prettier: true,
  },
});
