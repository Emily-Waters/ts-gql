import { GraphQLSchema } from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";
import { Config } from "../..";
import { TypeGuards } from "../../guards/type-guards";
import { ASTBuilder } from "./ast/ast";
import { OperationKeywords } from "./constants";
import { DocumentObjectMap } from "./documents/document";
import { HookFunctionMap } from "./hooks/hook";

export interface GraphQLTypeGeneratorOptions {}

export class GraphQLTypeGenerator {
  private _output = { ext: "ts", value: "" };
  private _normalizedSchema: GraphQLSchemaNormalizedConfig;

  private add(value: string) {
    this._output.value += `\n\n${value}`;
  }

  constructor(
    _schema: GraphQLSchema,
    private options: Config["options"],
    private _scalarMap?: Config["scalarMap"],
  ) {
    this._normalizedSchema = _schema.toConfig();

    if (options?.withApollo) {
      this.add(`import { gql } from "@apollo/client";\nimport * as Apollo from "@apollo/client";`);
    }

    let maybeValue = options?.maybeValue || "T | null";

    this.add(`type Maybe<T> = ${maybeValue};`);
  }

  public async generate() {
    const ast = new ASTBuilder(this._scalarMap);

    for (const type of this._normalizedSchema.types) {
      if (/__\w+/.test(type.name)) {
        continue;
      }

      ast.build(type);

      if (TypeGuards.isObject(type)) {
        const operation = OperationKeywords[type.name];

        if (operation) {
          const fields = type.getFields();

          if (this.options?.withApollo) {
            for (const fieldKey in fields) {
              const field = fields[fieldKey];

              const document = new DocumentObjectMap(field, operation);
              this.add(document.toString());

              const hook = new HookFunctionMap(field, operation, "", this.options);
              this.add(hook.toString());

              if (operation === "Query") {
                const lazy = new HookFunctionMap(field, operation, "Lazy", this.options);
                this.add(lazy.toString());

                const suspense = new HookFunctionMap(field, operation, "Suspense", this.options);
                this.add(suspense.toString());
              }
            }
          }
        }
      }
    }

    this.add(ast.toString());

    return {
      index: this._output,
    };
  }
}
