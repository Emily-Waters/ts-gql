import { GraphQLTypeGeneratorOptions } from "./utilities/object-mapper/type-generator";

interface ConfigOptions extends GraphQLTypeGeneratorOptions {
  /** Whether to clean the output directory before generating the files */
  clean?: boolean;
  /** Include Apollo Hooks */
  withApollo?: boolean;
  /** Include refetch functions for Apollo */
  withRefetch?: boolean;
  /** Maybe value, defaults to "T | null" */
  maybeValue?: string;
}

/** Configuration options.
 * @param {string} gqlEndpoint The GraphQL endpoint to fetch the schema from
 * @param {string} outDir The output directory, defaults to "__\_\_generated\_\___"
 * @param {ConfigOptions} options Additional options
 */
export type Config = {
  /** The GraphQL endpoint to fetch the schema from */
  gqlEndpoint: string;
  /**  The output directory, defaults to "__\_\_generated\_\___"  */
  outDir: string;
  /** Local .graphql documents */
  documents?: string[];
  /** Additional options */
  options?: ConfigOptions;
  /** Custom Scalars */
  scalarMap?: Record<string, { input: string; output: string }>;
};

/** Define the configuration options.
 * @param {Config} cfg The configuration options
 */
export function defineConfig(cfg: Config) {
  return cfg;
}
