import { GraphQLField } from "graphql";
import { Config } from "../../..";
import { Format } from "../../format/variable-names";

export class HookFunctionMap<T extends GraphQLField<any, any>> {
  constructor(
    private type: T,
    private operation: string,
    private modifier: "Lazy" | "Suspense" | "",
    private options: Config["options"],
  ) {}

  private buildHook() {
    const resultName = Format.result(this.type.name, this.operation);
    const inputName = Format.input(this.type.name, this.operation);
    const documentName = Format.document(this.type.name, this.operation);
    const hookName = Format.hook(this.type.name, this.operation, this.modifier);

    return [
      `export function ${hookName}(`,
      `  baseOptions?: Apollo.${this.modifier}${this.operation}HookOptions<`,
      `    ${resultName},`,
      `    ${inputName}`,
      `  >,`,
      `) {`,
      `  return Apollo.use${this.modifier}${this.operation}<`,
      `    ${resultName},`,
      `    ${inputName}`,
      `  >(${documentName}, baseOptions);`,
      `};`,
    ].join("\n");
  }

  private buildRefetch() {
    if (this.operation !== "Query" || this.modifier) return "";
    if (!this.options?.withRefetch) return "";

    const inputName = Format.input(this.type.name, this.operation);
    const documentName = Format.document(this.type.name, this.operation);
    const refetchName = Format.refetch(this.type.name, this.operation);

    return [
      `export function ${refetchName}(`,
      `  variables?: ${inputName},`,
      `) {`,
      `  return { query: ${documentName}, variables };`,
      `};`,
    ].join("\n");
  }

  toString() {
    return [this.buildHook(), this.buildRefetch()].filter(Boolean).join("\n\n");
  }
}
