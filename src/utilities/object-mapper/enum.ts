import { GraphQLEnumType } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseType } from "./base";

export class EnumType extends BaseType<GraphQLEnumType> {
  constructor(type: GraphQLEnumType) {
    super(type);

    this.separator = " = ";
    this.eol = ",\n";
    this.name = type.name;

    this.map(type);
  }

  private map(enumType: GraphQLEnumType) {
    for (const field of enumType.getValues()) {
      this.pairs.push({ key: field.name, value: `"${field.value}"` });
    }
  }

  public toString() {
    let value = `export enum ${this.name} {\n`;

    for (const pair of this.pairs) {
      value += StringUtils.indent(this.keyValuePair(pair.key, pair.value));
    }

    value += `}\n\n`;

    return value;
  }
}
