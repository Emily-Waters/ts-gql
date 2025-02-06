import { GraphQLField } from "graphql";
import { Config } from "../..";
import { StringUtils } from "../string/string-utils";
import { BaseObjectMap } from "./base";

export class HookFunctionMap<T extends GraphQLField<any, any>> extends BaseObjectMap<T> {
  constructor(
    type: T,
    private operation: "Query" | "Mutation" | "Subscription",
    private modifier: "Lazy" | "Suspense" | "",
    private options: Config["options"],
  ) {
    super(type, `${StringUtils.capitalize(type.name)}${operation}${modifier}Hook`);

    this._type = "hook";

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
      value: [this.buildHook(), this.buildRefetch()].join("\n"),
      metaTypeData: { isNonNullable: true },
    });
  }

  private buildHook() {
    const fieldName = StringUtils.capitalize(this.type.name);
    const operationName = StringUtils.capitalize(this.operation);
    const Pick = `Pick<${operationName}, '__typename' | '${this.type.name}'>`;

    return [
      `export function use${fieldName}${this.modifier}${operationName}(`,
      `  baseOptions?: Apollo.${this.modifier}${operationName}HookOptions<`,
      `    ${Pick},`,
      `    ${fieldName}${operationName}Variables`,
      `  >,`,
      `) {`,
      `  return Apollo.use${this.modifier}${operationName}<`,
      `    ${Pick},`,
      `    ${fieldName}${operationName}Variables`,
      `  >(${fieldName}Document, baseOptions);`,
      `}`,
    ].join("\n");
  }

  private buildRefetch() {
    if (this.operation !== "Query" || this.modifier) return "";
    if (!this.options?.withRefetch) return "";

    const fieldName = StringUtils.capitalize(this.type.name);
    const operationName = StringUtils.capitalize(this.operation);

    return [
      `export function refetch${fieldName}${operationName}(`,
      `  variables?: ${fieldName}${operationName}Variables,`,
      `) {`,
      `  return { query: ${fieldName}Document, variables };`,
      `}`,
    ].join("\n");
  }
}
