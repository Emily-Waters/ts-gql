import { GraphQLSchema } from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";
import { TypeGuards } from "../guards/type-guards";
import { StringUtils } from "./string/string-utils";
import { EnumTransformer } from "./transformers/enum";
import { ObjectTransformer } from "./transformers/object";
import { OperationTransformer } from "./transformers/operation";
import { ScalarTransformer } from "./transformers/scalar";

export interface GraphQLTypeGeneratorOptions {
  maybeValue?: string;
}

export class GraphQLTypeGenerator {
  private _config: GraphQLSchemaNormalizedConfig;

  private _types = { ext: "ts", value: "" };
  private _enums = { ext: "ts", value: "" };
  private _scalars = { ext: "ts", value: "" };
  private _queries = { ext: "gql", value: "" };
  private _mutations = { ext: "gql", value: "" };

  private _hooks = { ext: "ts", value: "" };

  private EnumTransformer: EnumTransformer;
  private ObjectTransformer: ObjectTransformer;
  private ScalarTransformer: ScalarTransformer;
  private OperationTransformer: OperationTransformer;

  constructor(
    private readonly _schema: GraphQLSchema,
    private readonly options: GraphQLTypeGeneratorOptions,
  ) {
    this._config = _schema.toConfig();

    this.EnumTransformer = new EnumTransformer(this._schema);
    this.ScalarTransformer = new ScalarTransformer(this._schema);
    this.ObjectTransformer = new ObjectTransformer(this._schema);
    this.OperationTransformer = new OperationTransformer(this._schema);

    this._types.value += `import * as Enums from "./enums";
    import * as Scalars from "./scalars";
    
    type MaybeValue<T> = ${this.options.maybeValue || "T | undefined"};\n\n`;

    this._hooks.value += `import { gql } from "@apollo/client";
    import * as Apollo from "@apollo/client";
    import * as Types from "./types"

    const defaultOptions = {};\n\n`;
  }

  public async generate() {
    for (const type of this._config.types) {
      if (/__\w+/.test(type.name)) {
        continue;
      }

      if (TypeGuards.isEnum(type)) {
        this._enums.value += this.EnumTransformer.transform(type);
        continue;
      }

      if (TypeGuards.isObjectType(type)) {
        const isQuery = type.name === "Query";
        const isMutation = type.name === "Mutation";
        const operationSpecifier = type.name.toLowerCase();

        if (isQuery) {
          const { values, operations } = this.OperationTransformer.transform(
            type,
            operationSpecifier,
          );

          for (const val of values) {
            const [key, query] = Object.entries(val)[0];
            this._queries.value += query;
            this._hooks.value += `export const ${StringUtils.capitalize(key)}Document = gql\`\n${query
              .split("\n")
              .map((val) => StringUtils.indent(val))
              .join("\n")}\n\`;\n\n`;
          }

          this._hooks.value += operations;
        } else if (isMutation) {
          const { values, operations } = this.OperationTransformer.transform(
            type,
            operationSpecifier,
          );

          for (const val of values) {
            const [key, mutation] = Object.entries(val)[0];
            this._mutations.value += mutation;
            this._hooks.value += `export const ${StringUtils.capitalize(key)}Document = gql\`\n${mutation
              .split("\n")
              .map((val) => StringUtils.indent(val))
              .join("\n")}\n\`;\n\n`;
          }

          this._hooks.value += operations;
        }

        this._types.value += this.ObjectTransformer.transform(type);
        continue;
      }

      if (TypeGuards.isInputObjectType(type)) {
        this._types.value += this.ObjectTransformer.transform(type);
        continue;
      }

      if (TypeGuards.isScalar(type)) {
        this._scalars.value += this.ScalarTransformer.transform(type);
        continue;
      }
    }

    return {
      types: this._types,
      enums: this._enums,
      scalars: this._scalars,
      queries: this._queries,
      mutations: this._mutations,
      hooks: this._hooks,
    };
  }
}
