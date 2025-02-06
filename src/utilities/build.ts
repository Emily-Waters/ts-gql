import fs from "fs/promises";
import { join } from "path";
import { cwd } from "process";
import { Config } from "..";
import { configLoader } from "./loaders/config-loader";
import { OperationDocumentLoader } from "./loaders/document-loader";
import { introspectionLoader } from "./loaders/introspection-loader";
import { Logger } from "./logger/logger";
import { GraphQLTypeGenerator } from "./object-mapper/type-generator";

async function build({ gqlEndpoint, outDir, options = {}, documents, scalarMap }: Config) {
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

  const schema = await Logger.log("Fetching Schema", () => introspectionLoader(gqlEndpoint));
  const documentLoader = new OperationDocumentLoader(schema, documents);
  const combinedSchema = await Logger.log("Loading Documents", () => documentLoader.load());
  const typeBuilder = new GraphQLTypeGenerator(combinedSchema, options, scalarMap);
  const output = await Logger.log("Building Types", () => typeBuilder.generate());

  for (const [key, { ext, value }] of Object.entries(output)) {
    await Logger.log(`Writing file: ${join(outDir, `${key}.${ext}`)}`, () =>
      fs.writeFile(join(cwd(), outDir, `${key}.${ext}`), value),
    );
  }

  return output;
}

export async function main() {
  Logger.log("Finished        ", async () => {
    let { config } = await Logger.log("Importing Config", configLoader);

    if ("default" in config) {
      config = config.default;
    }

    await build(config);
  });
}
