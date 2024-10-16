import { GraphQLSchema } from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";
import { TypeGuards } from "../guards/type-guards";
import { EnumType } from "./object-mapper/enum";
import { TypeScriptObjectType } from "./object-mapper/object";
import { OperationType } from "./object-mapper/operation";
import { UnionType } from "./object-mapper/union";
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
  private _enums: { ext: string; value: EnumType[] } = { ext: "ts", value: [] };
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

    this._types.value =
      `import { gql } from "@apollo/client";\n` +
      `import * as Apollo from "@apollo/client";\n\n` +
      `const defaultOptions = {};\n\n`;
  }

  public async generate() {
    for (const type of this._config.types) {
      if (/__\w+/.test(type.name)) {
        continue;
      }

      if (TypeGuards.isEnum(type)) {
        this._types.value += new EnumType(type).toString();
        continue;
      }

      if (TypeGuards.isObjectType(type)) {
        const isQuery = type.name === "Query";
        const isMutation = type.name === "Mutation";

        if (isQuery || isMutation) {
          this._types.value += new OperationType(type).toString();
        }

        this._types.value += new TypeScriptObjectType(type).toString();
        continue;
      }

      if (TypeGuards.isInputObjectType(type)) {
        this._types.value += new TypeScriptObjectType(type).toString();
        continue;
      }

      if (TypeGuards.isScalar(type)) {
        this._scalars.value += this.ScalarTransformer.transform(type);
        continue;
      }

      if (TypeGuards.isUnion(type)) {
        this._types.value += new UnionType(type).toString();
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
