import { GraphQLField } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseObjectMap } from "./base";

export class HookFunctionMap<T extends GraphQLField<any, any>> extends BaseObjectMap<T> {
  constructor(
    type: T,
    private specifier: "Query" | "Mutation",
  ) {
    super(type);

    this.name = type.name;
    this.separator = "";
    this.eol = "";
    this.brackets.open = "";
    this.brackets.close = "";
    this.declaration = "";

    this.map();
  }

  private map() {
    const key = "";
    let value = "";

    const fieldName = StringUtils.capitalize(this.type.name);
    const specifierName = StringUtils.capitalize(this.specifier);

    if (this.specifier === "Mutation") {
      value += this.buildHook(fieldName, specifierName);
    } else {
      const modifiers = ["", "Lazy", "Suspense"];

      for (const modifier of modifiers) {
        value += this.buildHook(fieldName, specifierName, modifier);
      }
    }

    this.pairs.push({ key, value, metaTypeData: { isNonNullable: true } });
  }

  private buildHook(fieldName: string, specifierName: string, modifierName = "") {
    return (
      `export function use${fieldName}${modifierName}${specifierName}(\n` +
      `  baseOptions?: Apollo.${modifierName}${specifierName}HookOptions<\n` +
      `    ${fieldName}${specifierName},\n` +
      `    ${fieldName}${specifierName}Variables\n` +
      `  >,\n` +
      `) {\n` +
      `  return Apollo.use${modifierName}${specifierName}<\n` +
      `    ${fieldName}${specifierName},\n` +
      `    ${fieldName}${specifierName}Variables\n` +
      `  >(${fieldName}Document, baseOptions);\n` +
      `}\n\n`
    );
  }
}
