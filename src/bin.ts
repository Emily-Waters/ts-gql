import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { cwd } from "process";
import { register } from "ts-node";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { build } from ".";

console.time("finish");

async function loadAndExecuteTSFile(configName: string) {
  register({ transpileOnly: true });
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

async function importConfig() {
  const args = await yargs(hideBin(process.argv) as any).parse();

  const configName = args.config || "config.ts";

  const configPath = await findConfigPath(configName);

  if (configPath) {
    if (configPath.endsWith(".ts")) {
      return loadAndExecuteTSFile(configPath);
    }

    return import(configPath);
  }
}

(async () => {
  console.time("finish");
  console.time("import");
  const config = await importConfig();
  console.timeEnd("import");
  console.time("build");
  await build(config.default);
  console.timeEnd("build");
  console.timeEnd("finish");
})();
