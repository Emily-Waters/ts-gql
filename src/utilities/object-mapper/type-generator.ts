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
  private _schema: GraphQLSchemaNormalizedConfig;

  private add(value: { toString: () => string }) {
    this._output.value += `\n\n${value.toString()}`;
  }

  constructor(
    _schema: GraphQLSchema,
    private config: Config,
  ) {
    this._schema = _schema.toConfig();

    if (config.options?.withApollo) {
      this.add(`import { gql } from "@apollo/client";\nimport * as Apollo from "@apollo/client";`);
    }

    let maybeValue = config.options?.maybeValue || "T | null";

    this.add(`type Maybe<T> = ${maybeValue};`);
  }

  public async generate() {
    const scalars = this.config.scalarMap;
    const options = this.config.options;
    const ast = new ASTBuilder(scalars);

    for (const type of this._schema.types) {
      if (/__\w+/.test(type.name)) {
        continue;
      }

      ast.build(type);

      if (TypeGuards.isObject(type)) {
        const operation = OperationKeywords[type.name];

        if (operation) {
          const fields = type.getFields();

          if (options?.withApollo) {
            for (const fieldKey in fields) {
              const field = fields[fieldKey];

              this.add(new DocumentObjectMap(field, operation));
              this.add(new HookFunctionMap(field, operation, "", options));

              if (operation === "Query") {
                this.add(new HookFunctionMap(field, operation, "Lazy", options));
                this.add(new HookFunctionMap(field, operation, "Suspense", options));
              }
            }
          }
        }
      }
    }

    this.add(ast);

    return {
      index: this._output,
    };
  }
}
