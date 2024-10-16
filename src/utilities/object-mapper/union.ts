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
      this.pairs.push({ key: type.name, value: type.name });
    }
  }

  public toString() {
    let value = `export type ${this.name} = `;

    for (const pair of this.pairs) {
      value += this.keyValuePair("", pair.value);
    }

    value += `;\n\n`;

    return value;
  }
}
