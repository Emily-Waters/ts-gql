import { GraphQLEnumType } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseTransformer } from "./base";

export class EnumTransformer extends BaseTransformer {
  public transform(enumType: GraphQLEnumType) {
    let value = `export enum ${enumType.name} {\n`;

    for (const field of enumType.getValues()) {
      value += StringUtils.indent(this.createKeyValuePair(field.name, field.value));
      value += ",\n";
    }

    value += `}\n\n`;

    return value;
  }

  private createKeyValuePair(key: string, value: string) {
    return `${key} = "${value}"`;
  }
}
