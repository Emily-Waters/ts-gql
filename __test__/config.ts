import { defineConfig } from "../src/index";

export default defineConfig({
  gqlEndpoint: "http://localhost:3000/graphql",
  outDir: "__generated__",
  documents: ["**/*.gql"],
  options: {
    clean: true,
    withApollo: true,
    withRefetch: true,
  },
  scalarMap: {
    DateScalar: "Date",
  },
});
