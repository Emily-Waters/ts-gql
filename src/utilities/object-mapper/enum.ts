import { GraphQLEnumType } from "graphql";
import { BaseObjectMap } from "./base";

export class EnumObjectMap<T extends GraphQLEnumType> extends BaseObjectMap<T> {
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
