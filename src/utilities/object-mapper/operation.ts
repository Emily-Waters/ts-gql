import {
  GraphQLArgument,
  GraphQLField,
  GraphQLObjectType,
  GraphQLType,
  GraphQLUnionType,
} from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseObjectType } from "./base";

export class OperationType<T extends GraphQLObjectType> extends BaseObjectType<T> {
  private _objectMap: Record<string, string> = {};

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

      this.documents.push({ key: fieldKey, value: this.buildDocument(field, specifier) });

      if (specifier === "Mutation") {
        this.hooks.push(this.buildHook(fields[fieldKey], specifier));
      } else {
        for (const key of ["", "Lazy", "Suspense"]) {
          this.hooks.push(this.buildHook(fields[fieldKey], specifier, key));
        }
      }
    }
  }

  private buildDocument(field: GraphQLField<any, any>, specifier: string) {
    return (
      `${specifier.toLowerCase()} ${StringUtils.capitalize(field.name)}` +
      `${this.buildArgs(field.args, (arg) => `$${arg.name}: ${arg.type}`)} {\n` +
      `${StringUtils.indent(field.name + this.buildArgs(field.args, (arg) => `${arg.name}: $${arg.name}`))}` +
      `${this.buildFields(field.type)}` +
      "\n}"
    );
  }

  private buildArgs(
    args: readonly GraphQLArgument[],
    keyValuePairCallback: (args: GraphQLArgument) => string,
  ) {
    if (args.length) {
      return `(${args.map(keyValuePairCallback).join(", ")})`;
    }

    return "";
  }

  private buildFields(type: GraphQLType, depth = 2) {
    let output = "";

    const baseType = this.findBaseType(type);

    if (TypeGuards.isObjectType(baseType)) {
      if (this._objectMap[baseType.name]) {
        output += this._objectMap[baseType.name];
      } else {
        const fields = baseType.getFields();

        output += " {\n";

        for (const fieldKey in fields) {
          const field = fields[fieldKey];
          const baseField = this.findBaseType(field);

          output += `${StringUtils.indent(field.name, depth)}`;

          if (TypeGuards.isObjectType(baseField)) {
            output += this.buildFields(baseField, depth + 1);
          } else if (TypeGuards.isUnion(baseField)) {
            output += this.buildFragment(baseField, depth);
          }

          output += "\n";
        }

        output += StringUtils.indent(`}`, depth - 1);
      }

      this._objectMap[baseType.name] = output;
    }

    return output;
  }

  private buildFragment(field: GraphQLUnionType, depth: number) {
    let output = "";
    const types = field.getTypes();

    for (const type of types) {
      output += `\n${StringUtils.indent(`... on ${type.name}`, depth)}${this.buildFields(type, depth + 1)}`;
    }

    return output;
  }

  private buildHook(field: GraphQLField<any, any>, specifier: string, modifier = "") {
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
        const options = { ...defaultOptions, ...baseOptions };
        return Apollo.use${modifierName}${specifierName}<
          ${hookOptions}
        >(${fieldName}Document, options);
      };`;
  }

  public toString() {
    return (
      `${this.documents.map((document) => `export const ${StringUtils.capitalize(document.key)}Document = gql\`${document.value}\`;`).join("\n\n")}` +
      `${this.hooks.join("\n\n")}`
    );
  }
}
