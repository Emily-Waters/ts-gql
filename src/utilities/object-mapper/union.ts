import { GraphQLUnionType as T } from "graphql";
import { BaseType } from "./base";

export class UnionType extends BaseType<T> {
  constructor(type: T) {
    super(type);

    this.separator = " | ";
    this.eol = "";
    this.name = type.name;

    this.map(type);
  }

  private map(unionType: T) {
    for (const type of unionType.getTypes()) {
      this.pairs.push({ key: "", value: type.name });
    }
  }

  public toString() {
    return `export type ${this.name} = ${this.buildPairs()};\n\n`;
  }
}
