import { bundleRequire } from "bundle-require";
import { Dirent } from "fs";
import * as fs from "fs/promises";
import { join } from "path";
import { cwd } from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Config } from "../..";

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

export async function configLoader(): Promise<{
  path: string;
  config: { default: Config } | Config;
}> {
  const args = await yargs(hideBin(process.argv) as any).parse();

  const configName = (args.config as string) || "config.ts";

  const configPath = await findConfigPath(configName);

  if (!configPath) {
    console.error(`Config file not found: ${configName}`);
    process.exit(1);
  } else {
    if (configPath.endsWith(".ts")) {
      return { path: configPath, config: await loadAndExecuteTSFile(configPath) };
    }

    return { path: configPath, config: await import(configPath) };
  }
}
