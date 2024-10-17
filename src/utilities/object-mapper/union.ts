import { GraphQLUnionType as T } from "graphql";
import { BaseType } from "./base";

export class UnionType extends BaseType<T> {
  constructor(type: T) {
    super(type);

    this.separator = "| ";
    this.eol = "\n";
    this.name = type.name;
    this.brackets = { open: "", close: "" };

    this.declaration = `export type ${this.name} =\n`;

    this.map();
  }

  private map() {
    for (const type of this.type.getTypes()) {
      this.pairs.push({ key: "", value: type.name, metaTypeData: { isNonNullable: true } });
    }
  }
}
