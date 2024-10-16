import { GraphQLSchema } from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";
import { TypeGuards } from "../guards/type-guards";
import { EnumType } from "./object-mapper/enum";
import { OperationType } from "./object-mapper/operation";
import { TypeScriptObjectType } from "./object-mapper/typescript-object";
import { UnionType } from "./object-mapper/union";

export interface GraphQLTypeGeneratorOptions {
  maybeValue?: string;
}

export class GraphQLTypeGenerator {
  private _config: GraphQLSchemaNormalizedConfig;

  private _types = { ext: "ts", value: "" };

  constructor(
    private readonly _schema: GraphQLSchema,
    private readonly options: GraphQLTypeGeneratorOptions,
  ) {
    this._config = _schema.toConfig();

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

      if (TypeGuards.isUnion(type)) {
        this._types.value += new UnionType(type).toString();
        continue;
      }
    }

    return {
      index: this._types,
    };
  }
}
