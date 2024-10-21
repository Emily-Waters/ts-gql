import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { cwd } from "process";
// import { register } from "ts-node";
import { register } from "esbuild-register/dist/node";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { build, Config } from ".";
import { Logger } from "./utilities/logger/logger";

async function loadAndExecuteTSFile(configName: string) {
  register();
  return await require(configName);
}

const exclude = ["dist", "node_modules"];

async function findConfigPath(
  configName = "config.ts",
  currentPath = cwd(),
): Promise<string | undefined> {
  const entries = await readdir(currentPath, { withFileTypes: true });

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
      return join(entry.parentPath, entry.name);
    }
  }

  for (const dir of directories) {
    const path = await findConfigPath(configName, join(dir.parentPath, dir.name));

    if (path) {
      return path;
    }
  }
}

async function importConfig(): Promise<{ default: Config } | Config> {
  const args = await yargs(hideBin(process.argv) as any).parse();

  const configName = args.config || "config.ts";

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

Logger.log("Finished        ", async () => {
  let config = await Logger.log("Importing Config", importConfig);

  if ("default" in config) {
    config = config.default;
  }

  await Logger.log("Building Schema ", () => build(config));
});
