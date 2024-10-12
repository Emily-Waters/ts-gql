import { GraphQLSchema } from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";
import { TypeGuards } from "../guards/type-guards";
import { EnumTransformer } from "./transformers/enum";
import { ObjectTransformer } from "./transformers/object";

export type GraphQLTypeGeneratorOptions = {
  maybeValue?: string;
};

export class GraphQLTypeGenerator {
  private _config: GraphQLSchemaNormalizedConfig;
  private _schema: GraphQLSchema;

  private _types = "";
  private _enums = "";

  private EnumTransformer: EnumTransformer;
  private ObjectTransformer: ObjectTransformer;

  constructor(schema: GraphQLSchema, options: GraphQLTypeGeneratorOptions) {
    this._schema = schema;
    this._config = this._schema.toConfig();

    this.EnumTransformer = new EnumTransformer(this._schema, this._config);
    this.ObjectTransformer = new ObjectTransformer(this._schema, this._config);

    this._types += `import * as Enums from "./enums";\n\n`;
    this._types += `type MaybeValue<T> = ${options.maybeValue || "T | undefined"};\n\n`;
  }

  public async generate() {
    for (const type of this._config.types) {
      if (/__\w+/.test(type.name)) {
        continue;
      }

      if (TypeGuards.isEnum(type)) {
        this._enums += this.EnumTransformer.transform(type);
        continue;
      }

      if (TypeGuards.isObjectType(type) || TypeGuards.isInputObjectType(type)) {
        this._types += this.ObjectTransformer.transform(type);
        continue;
      }
    }

    return { types: this._types, enums: this._enums };
  }
}
