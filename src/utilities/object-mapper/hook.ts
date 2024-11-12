import { GraphQLField } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseObjectMap } from "./base";

export class HookFunctionMap<T extends GraphQLField<any, any>> extends BaseObjectMap<T> {
  constructor(
    type: T,
    private operation: "Query" | "Mutation" | "Subscription",
    private modifier: "Lazy" | "Suspense" | "" = "",
  ) {
    super(type, `${StringUtils.capitalize(type.name)}${operation}${modifier}Hook`);

    this.separator = "";
    this.eol = "";
    this.brackets.open = "";
    this.brackets.close = "";
    this.declaration = "";
    this.initialDepth = -1;

    this.map();
  }

  private map() {
    this.pairs.push({
      key: "",
      value: this.buildHook(),
      metaTypeData: { isNonNullable: true },
    });
  }

  private buildHook() {
    const fieldName = StringUtils.capitalize(this.type.name);
    const operationName = StringUtils.capitalize(this.operation);

    return (
      `export function use${fieldName}${this.modifier}${operationName}(\n` +
      `  baseOptions?: Apollo.${this.modifier}${operationName}HookOptions<\n` +
      `    ${fieldName}${operationName}Result,\n` +
      `    ${fieldName}${operationName}Variables\n` +
      `  >,\n` +
      `) {\n` +
      `  return Apollo.use${this.modifier}${operationName}<\n` +
      `    ${fieldName}${operationName}Result,\n` +
      `    ${fieldName}${operationName}Variables\n` +
      `  >(${fieldName}Document, baseOptions);\n` +
      `}`
    );
  }
}
