import { GraphQLTypeGeneratorOptions } from "./utilities/object-mapper/type-generator";

interface ConfigOptions extends GraphQLTypeGeneratorOptions {
  clean?: boolean;
}

export type Config = {
  gqlEndpoint: string;
  outDir: string;
  options?: ConfigOptions;
};

export function defineConfig(cfg: Config) {
  return cfg;
}
