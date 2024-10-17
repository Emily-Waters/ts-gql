import { GraphQLEnumType } from "graphql";
import { BaseType } from "./base";

export class EnumType<T extends GraphQLEnumType> extends BaseType<T> {
  constructor(type: T) {
    super(type);

    this.separator = " = ";
    this.eol = ",\n";
    this.name = type.name;

    this.declaration = `export enum ${this.name}`;

    this.map();
  }

  private map() {
    for (const field of this.type.getValues()) {
      this.pairs.push({
        key: field.name,
        value: `"${field.value}"`,
        metaTypeData: { isNonNullable: true },
      });
    }
  }
}
