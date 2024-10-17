import { GraphQLSchema } from "graphql";
import { TypeGuards } from "../guards/type-guards";
import { BaseType } from "./object-mapper/base";
import { DocumentType } from "./object-mapper/document";
import { EnumType } from "./object-mapper/enum";
import { TypeScriptObjectType } from "./object-mapper/typescript-object";
import { UnionType } from "./object-mapper/union";

export interface GraphQLTypeGeneratorOptions {
  maybeValue?: string;
}

export class GraphQLTypeGenerator {
  private _typeMap: Map<string, BaseType<unknown>> = new Map();
  private _types = { ext: "ts", value: "" };

  constructor(
    _schema: GraphQLSchema,
    private _config = _schema.toConfig(),
  ) {
    this._types.value = `import { gql } from "@apollo/client";\nimport * as Apollo from "@apollo/client";\n\n`;
  }

  public async generate() {
    for (const type of this._config.types) {
      if (/__\w+/.test(type.name)) {
        continue;
      }

      switch (true) {
        case TypeGuards.isEnum(type):
          this._typeMap.set(type.name, new EnumType(type));
          break;

        case TypeGuards.isObjectType(type):
          const isQuery = type.name === "Query";
          const isMutation = type.name === "Mutation";

          if (isQuery || isMutation) {
            const fields = type.getFields();
            for (const fieldKey in fields) {
              const field = fields[fieldKey];

              this._typeMap.set(field.name, new DocumentType(field, type.name));
            }
          } else {
            this._typeMap.set(type.name, new TypeScriptObjectType(type));
          }
          break;

        case TypeGuards.isInputObjectType(type):
          this._typeMap.set(type.name, new TypeScriptObjectType(type));
          break;

        case TypeGuards.isUnion(type):
          this._typeMap.set(type.name, new UnionType(type));
          break;
      }
    }

    for (const type of this._typeMap.values()) {
      this._types.value += type.toString() + "\n\n";
    }

    return {
      index: this._types,
    };
  }
}
