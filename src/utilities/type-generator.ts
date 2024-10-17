import { GraphQLSchema } from "graphql";
import { TypeGuards } from "../guards/type-guards";
import { BaseObjectMap } from "./object-mapper/base";
import { DocumentObjectMap } from "./object-mapper/document";
import { EnumObjectMap } from "./object-mapper/enum";
import { HookFunctionMap } from "./object-mapper/hook";
import { OperationObjectMap } from "./object-mapper/operation";
import { TypeScriptObjectMap } from "./object-mapper/typescript-object";
import { UnionObjectMap } from "./object-mapper/union";
import { VariableObjectMap } from "./object-mapper/variables";

export interface GraphQLTypeGeneratorOptions {
  maybeValue?: string;
}

export class GraphQLTypeGenerator {
  private _typeMap: Map<string, BaseObjectMap<unknown>> = new Map();
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
          this._typeMap.set(type.name, new EnumObjectMap(type));
          break;

        case TypeGuards.isObjectType(type):
          const isQuery = type.name === "Query";
          const isMutation = type.name === "Mutation";

          if (isQuery || isMutation) {
            const typeName = type.name as "Query" | "Mutation";

            const fields = type.getFields();

            for (const fieldKey in fields) {
              const field = fields[fieldKey];

              const documentKey = `${field.name}Document`;
              const hookKey = `${field.name}${typeName}Hook`;
              const variableKey = `${field.name}${typeName}Variables`;
              const operationKey = `${field.name}${typeName}`;

              this._typeMap.set(documentKey, new DocumentObjectMap(field, typeName));
              this._typeMap.set(variableKey, new VariableObjectMap(field, typeName));
              this._typeMap.set(operationKey, new OperationObjectMap(field, typeName));
              this._typeMap.set(hookKey, new HookFunctionMap(field, typeName));
            }
          } else {
            this._typeMap.set(type.name, new TypeScriptObjectMap(type));
          }
          break;

        case TypeGuards.isInputObjectType(type):
          this._typeMap.set(type.name, new TypeScriptObjectMap(type));
          break;

        case TypeGuards.isUnion(type):
          this._typeMap.set(type.name, new UnionObjectMap(type));
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
