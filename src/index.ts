import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery } from "graphql";
import { join } from "path";
import { cwd } from "process";
import { GraphQLTypeGenerator, GraphQLTypeGeneratorOptions } from "./utilities/type-generator";

interface ConfigOptions extends GraphQLTypeGeneratorOptions {
  barrel?: boolean;
  clean?: boolean;
}

export type Config = {
  gqlEndpoint: string;
  outDir: string;
  options?: ConfigOptions;
};

// why just pass the argument directly back?
export default function defineConfig(cfg: Config) {
  return cfg;
}

export async function build({ gqlEndpoint, outDir, options = {} }: Config) {
  const outDirPath = join(cwd(), outDir);
  const outDirStat = await stat(outDirPath).catch(() => null);

  if (!outDirStat) {
    await mkdir(outDirPath);
  } else if (!outDirStat.isDirectory()) {
    throw new Error(`The path ${outDirPath} is not a directory`);
  } else if (options.clean) {
    for (const entry of await readdir(outDirPath)) {
      await unlink(join(outDirPath, entry));
    }
  }

  const schema = await getSchema(gqlEndpoint);

  const typeBuilder = new GraphQLTypeGenerator(schema);

  const output = await typeBuilder.generate();

  for (const [key, { ext, value }] of Object.entries(output)) {
    await writeFile(join(cwd(), outDir, `${key}.${ext}`), value);
  }

  return output;
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
