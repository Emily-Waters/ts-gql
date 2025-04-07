import emdash from "@emilywaters/emdash";
import { GraphQLField } from "graphql";
import { Config } from "../..";

export class HookFunctionMap<T extends GraphQLField<any, any>> {
  constructor(
    private type: T,
    private operation: string,
    private modifier: "Lazy" | "Suspense" | "",
    private options: Config["options"],
  ) {}

  private buildHook() {
    const fieldName = emdash.string.capitalize(this.type.name);
    const operationName = emdash.string.capitalize(this.operation);
    const returnType = `${fieldName}${operationName}Result`;
    const inputType = `${fieldName}${operationName}Input`;
    const documentName = `${fieldName}${operationName}Document`;

    return [
      `export function use${fieldName}${this.modifier}${operationName}(`,
      `  baseOptions?: Apollo.${this.modifier}${operationName}HookOptions<`,
      `    ${returnType},`,
      `    ${inputType}`,
      `  >,`,
      `) {`,
      `  return Apollo.use${this.modifier}${operationName}<`,
      `    ${returnType},`,
      `    ${inputType}`,
      `  >(${documentName}, baseOptions);`,
      `};`,
    ].join("\n");
  }

  private buildRefetch() {
    if (this.operation !== "Query" || this.modifier) return "";
    if (!this.options?.withRefetch) return "";

    const fieldName = emdash.string.capitalize(this.type.name);
    const operationName = emdash.string.capitalize(this.operation);
    const inputType = `${fieldName}${operationName}Input`;
    const documentName = `${fieldName}${operationName}Document`;

    return [
      `export function refetch${fieldName}${operationName}(`,
      `  variables?: ${inputType},`,
      `) {`,
      `  return { query: ${documentName}, variables };`,
      `};`,
    ].join("\n");
  }

  toString() {
    return [this.buildHook(), this.buildRefetch()].join("\n\n");
  }
}
