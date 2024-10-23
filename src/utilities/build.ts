import { bundleRequire } from "bundle-require";
import { Dirent } from "fs";
import fs from "fs/promises";
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery } from "graphql";
import { join } from "path";
import { cwd } from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Config } from "..";
import { Logger } from "./logger/logger";
import { GraphQLTypeGenerator } from "./object-mapper/type-generator";

async function build({ gqlEndpoint, outDir, options = {} }: Config) {
  const outDirPath = join(cwd(), outDir);
  const outDirStat = await fs.stat(outDirPath).catch(() => null);

  if (!outDirStat) {
    await fs.mkdir(outDirPath);
  } else if (!outDirStat.isDirectory()) {
    throw new Error(`The path ${outDirPath} is not a directory`);
  } else if (options.clean) {
    for (const entry of await fs.readdir(outDirPath)) {
      await fs.unlink(join(outDirPath, entry));
    }
  }

  const schema = await getSchema(gqlEndpoint);

  const typeBuilder = new GraphQLTypeGenerator(schema);

  const output = await typeBuilder.generate();

  for (const [key, { ext, value }] of Object.entries(output)) {
    await fs.writeFile(join(cwd(), outDir, `${key}.${ext}`), value);
  }

  return output;
}

async function loadAndExecuteTSFile(configPath: string) {
  const { mod } = await bundleRequire({
    filepath: configPath,
  });

  return mod;
}

const exclude = ["dist", "node_modules"];

async function findConfigPath(
  configName = "config.ts",
  currentPath = cwd(),
): Promise<string | undefined> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  let directories: Dirent[] = [];

  for (const entry of entries) {
    if (exclude.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const isHidden = entry.name.startsWith(".");

      if (isHidden) {
        continue;
      }

      directories.push(entry);

      continue;
    }

    if (entry.isFile() && entry.name === configName) {
      return join(currentPath, entry.name);
    }
  }

  for (const dir of directories) {
    const path = await findConfigPath(configName, join(currentPath, dir.name));

    if (path) {
      return path;
    }
  }
}

async function importConfig(): Promise<{ default: Config } | Config> {
  const args = await yargs(hideBin(process.argv) as any).parse();

  const configName = (args.config as string) || "config.ts";

  const configPath = await findConfigPath(configName);

  if (!configPath) {
    console.error(`Config file not found: ${configName}`);
    process.exit(1);
  } else {
    if (configPath.endsWith(".ts")) {
      return loadAndExecuteTSFile(configPath);
    }

    return import(configPath);
  }
}

async function getSchema(gqlEndpoint: string) {
  const introspectionQuery = getIntrospectionQuery();

  const data: IntrospectionQuery = await fetch(gqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: introspectionQuery,
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data);

  return buildClientSchema(data);
}

export async function main() {
  Logger.log("Finished        ", async () => {
    let config = await Logger.log("Importing Config", importConfig);

    if ("default" in config) {
      config = config.default;
    }

    await Logger.log("Building Schema ", () => build(config));
  });
}
