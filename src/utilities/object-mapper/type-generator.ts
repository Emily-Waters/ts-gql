import { GraphQLSchema } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { BaseObjectMap } from "./base";
import { DocumentObjectMap } from "./document";
import { EnumObjectMap } from "./enum";
import { HookFunctionMap } from "./hook";
import { OperationObjectMap } from "./operation";
import { TypeScriptObjectMap } from "./typescript-object";
import { UnionObjectMap } from "./union";
import { VariableObjectMap } from "./variables";

export interface GraphQLTypeGeneratorOptions {}

export class GraphQLTypeGenerator {
  private _output = { ext: "ts", value: "" };

  constructor(
    _schema: GraphQLSchema,
    private _config = _schema.toConfig(),
  ) {
    this._output.value = `import { gql } from "@apollo/client";\nimport * as Apollo from "@apollo/client";\n\n`;
  }

  public async generate() {
    for (const type of this._config.types) {
      if (/__\w+/.test(type.name)) {
        continue;
      }

      switch (true) {
        case TypeGuards.isEnum(type):
          new EnumObjectMap(type);
          break;

        case TypeGuards.isObjectType(type):
          const isQuery = type.name === "Query";
          const isMutation = type.name === "Mutation";
          const isSubscription = type.name === "Subscription";

          if (isQuery || isMutation || isSubscription) {
            const typeName = type.name as "Query" | "Mutation" | "Subscription";
            const fields = type.getFields();

            for (const fieldKey in fields) {
              const field = fields[fieldKey];

              new DocumentObjectMap(field, typeName);
              new OperationObjectMap(field, typeName);
              new VariableObjectMap(field, typeName);
              new HookFunctionMap(field, typeName);

              if (isQuery) {
                new HookFunctionMap(field, typeName, "Lazy");
                new HookFunctionMap(field, typeName, "Suspense");
              }
            }
          }

          new TypeScriptObjectMap(type);
          break;

        case TypeGuards.isInputObjectType(type):
          new TypeScriptObjectMap(type);
          break;

        case TypeGuards.isUnion(type):
          new UnionObjectMap(type);
          break;
      }
    }

    for (const type of BaseObjectMap._typeMap.values()) {
      this._output.value += type.toString() + "\n\n";
    }

    return {
      index: this._output,
    };
  }
}
