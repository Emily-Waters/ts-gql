import { GraphQLSchema } from "graphql";
import { TypeGuards } from "../guards/type-guards";
import { EnumTransformer } from "./transformers/enum";
import { ObjectTransformer } from "./transformers/object";
import { OperationTransformer } from "./transformers/operation";
import { ScalarTransformer } from "./transformers/scalar";

export interface GraphQLTypeGeneratorOptions {
  maybeValue?: string;
}

export class GraphQLTypeGenerator {
  private _types = { ext: "ts", value: "" };
  private _enums = { ext: "ts", value: "" };
  private _scalars = { ext: "ts", value: "" };
  private _queries = { ext: "gql", value: "" };
  private _mutations = { ext: "gql", value: "" };

  private EnumTransformer: EnumTransformer;
  private ObjectTransformer: ObjectTransformer;
  private ScalarTransformer: ScalarTransformer;

  private OperationTransformer: OperationTransformer;

  constructor(
    private readonly _schema: GraphQLSchema,
    options: GraphQLTypeGeneratorOptions,
    private readonly _config = _schema.toConfig(),
  ) {
    this.EnumTransformer = new EnumTransformer(this._schema);
    this.ObjectTransformer = new ObjectTransformer(this._schema);
    this.ScalarTransformer = new ScalarTransformer(this._schema);

    this.OperationTransformer = new OperationTransformer(this._schema);

    this._types.value += `import * as Enums from "./enums";\n`;
    this._types.value += `import * as Scalars from "./scalars";\n\n`;
    this._types.value += `type MaybeValue<T> = ${options.maybeValue || "T | undefined"};\n\n`;
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
          this._queries.value += this.OperationTransformer.transform(type, operationSpecifier);
        } else if (isMutation) {
          this._mutations.value += this.OperationTransformer.transform(type, operationSpecifier);
        } else {
          this._types.value += this.ObjectTransformer.transform(type);
        }
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
    };
  }
}
