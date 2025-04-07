import fs from "fs";
import { glob } from "glob";
import { buildSchema, GraphQLSchema, parse, printSchema } from "graphql";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cwd } from "node:process";
import { OperationToSDLConverter } from "./sdl-converter";

export class OperationDocumentLoader {
  constructor(
    private schema: GraphQLSchema,
    private _documents: string[] = [],
  ) {}

  async load() {
    if (!this._documents.length) return this.schema;

    let schema = printSchema(this.schema);

    const documents = (await Promise.all(this._documents.map((filePath) => glob(filePath)))).flat();

    for (const document of documents) {
      const content = await readFile(document, "utf-8");
      const converter = new OperationToSDLConverter(this.schema);
      const sdl = converter.convert(parse(content));

      schema += "\n\n";
      schema += sdl;
    }

    await fs.promises.writeFile(path.join(cwd(), "__test__", "extend.graphql"), schema, "utf-8");
    return buildSchema(schema);
  }
}
