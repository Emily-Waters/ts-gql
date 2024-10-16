import { GraphQLEnumType } from "graphql";
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
      this.pairs.push({
        key: field.name,
        value: `"${field.value}"`,
        metaTypeData: { isNonNullable: true },
      });
    }
  }

  public toString() {
    return `export enum ${this.name}${this.buildPairs()}\n\n`;
  }
}
