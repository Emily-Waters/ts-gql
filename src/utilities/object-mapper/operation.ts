import { GraphQLField } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseType } from "./base";
import { DocumentType } from "./document";

export class OperationType<T extends GraphQLField<any, any>> extends BaseType<T> {
  private hooks: string[] = [];
  private documents: { key: string; value: string }[] = [];

  constructor(
    type: T,
    private specifier: string,
  ) {
    super(type);

    this.name = type.name;
    this.separator = ": ";
    this.eol = ";\n";

    this.map();
  }

  public map() {
    this.documents.push({
      key: this.type.name,
      value: new DocumentType(this.type, this.specifier).toString(),
    });
  }

  private buildHook(field: GraphQLField<any, any>, specifier: string, modifier = "") {
    // TODO: cleanup formatting, create Query/Mutation types and Variables type
    const fieldName = StringUtils.capitalize(field.name);
    const specifierName = StringUtils.capitalize(specifier);
    const modifierName = StringUtils.capitalize(modifier);

    const hookOptions =
      `${fieldName}${specifierName},\n` + `${fieldName}${specifierName}Variables\n`;

    let depth = 1;

    return `export function use${fieldName}${modifierName}${specifierName}(
        baseOptions?: Apollo.${modifierName}${specifierName}HookOptions<
          ${hookOptions}
        >,
      ) {
        return Apollo.use${modifierName}${specifierName}<
          ${hookOptions}
        >(${fieldName}Document, baseOptions);
      };`;
  }

  public toString() {
    return (
      `${this.documents.map((document) => `export const ${StringUtils.capitalize(document.key)}Document = gql\`\n${document.value}\`;`).join("\n\n")}` +
      `${this.hooks.join("\n\n")}`
    );
  }
}
