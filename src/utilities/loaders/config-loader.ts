import emdash from "@emilywaters/emdash";
import { bundleRequire } from "bundle-require";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Config } from "../..";

async function loadAndExecuteTSFile(configPath: string) {
  const { mod } = await bundleRequire({
    filepath: configPath,
  });

  return mod;
}

export async function configLoader(): Promise<{
  path: string;
  config: { default: Config } | Config;
}> {
  const args = await yargs(hideBin(process.argv) as any).parse();

  const configName = (args.config as string) || "ts-gql.config.ts";

  const paths = await emdash.fs.glob(`**/${configName}`);
  const path = paths[0];

  if (!path) {
    console.error(`Config file not found: ${configName}`);
    process.exit(1);
  } else {
    let config;

    if (path.endsWith(".ts")) {
      config = await loadAndExecuteTSFile(path);
    } else {
      config = await import(path);
    }

    return { path, config };
  }
}
