import { GraphQLField, GraphQLObjectType } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseObjectType } from "./base";
import { DocumentType } from "./document";

export class OperationType<T extends GraphQLObjectType> extends BaseObjectType<T> {
  private hooks: string[] = [];
  private documents: { key: string; value: string }[] = [];

  constructor(type: T) {
    super(type);

    this.name = type.name;
    this.separator = ": ";
    this.eol = ";\n";

    this.map();
  }

  public map() {
    const specifier = this.name;
    const fields = this.type.getFields();

    for (const fieldKey in fields) {
      const field = fields[fieldKey];

      this.documents.push({
        key: field.name,
        value: new DocumentType(field, specifier).toString(),
      });

      if (specifier === "Mutation") {
        this.hooks.push(this.buildHook(fields[fieldKey], specifier));
      } else {
        for (const key of ["", "Lazy", "Suspense"]) {
          this.hooks.push(this.buildHook(fields[fieldKey], specifier, key));
        }
      }
    }
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
