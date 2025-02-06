import { GraphQLSchema } from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";
import { Config } from "../..";
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
  private _normalizedSchema: GraphQLSchemaNormalizedConfig;

  constructor(
    _schema: GraphQLSchema,
    private options: Config["options"],
    private _scalarMap?: Config["scalarMap"],
  ) {
    this._normalizedSchema = _schema.toConfig();

    if (this._scalarMap) {
      BaseObjectMap.extendScalarMap(this._scalarMap);
    }

    if (options?.withApollo) {
      this._output.value = `import { gql } from "@apollo/client";\nimport * as Apollo from "@apollo/client";\n\n`;
    }

    let maybeValue = options?.maybeValue || "T | null";

    this._output.value += `type Maybe<T> = ${maybeValue};\n\n`;
  }

  public async generate() {
    for (const type of this._normalizedSchema.types) {
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

            if (this.options?.withApollo) {
              for (const fieldKey in fields) {
                const field = fields[fieldKey];

                new DocumentObjectMap(field, typeName);
                new OperationObjectMap(field, typeName);
                new VariableObjectMap(field, typeName);
                new HookFunctionMap(field, typeName, "", this.options);

                if (isQuery) {
                  new HookFunctionMap(field, typeName, "Lazy", this.options);
                  new HookFunctionMap(field, typeName, "Suspense", this.options);
                }
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
