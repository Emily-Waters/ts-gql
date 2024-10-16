import { GraphQLSchema } from "graphql";
import { TypeGuards } from "../guards/type-guards";
import { EnumType } from "./object-mapper/enum";
import { OperationType } from "./object-mapper/operation";
import { TypeScriptObjectType } from "./object-mapper/typescript-object";
import { UnionType } from "./object-mapper/union";

export interface GraphQLTypeGeneratorOptions {
  maybeValue?: string;
}

export class GraphQLTypeGenerator {
  private _types = { ext: "ts", value: "" };

  constructor(
    _schema: GraphQLSchema,
    private _config = _schema.toConfig(),
  ) {
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

      switch (true) {
        case TypeGuards.isEnum(type):
          this._types.value += new EnumType(type).toString();
          break;

        case TypeGuards.isObjectType(type):
          const isQuery = type.name === "Query";
          const isMutation = type.name === "Mutation";

          if (isQuery || isMutation) {
            this._types.value += new OperationType(type).toString();
          }

          this._types.value += new TypeScriptObjectType(type).toString();
          break;

        case TypeGuards.isInputObjectType(type):
          this._types.value += new TypeScriptObjectType(type).toString();
          break;

        case TypeGuards.isUnion(type):
          this._types.value += new UnionType(type).toString();
          break;
      }
    }

    return {
      index: this._types,
    };
  }
}
