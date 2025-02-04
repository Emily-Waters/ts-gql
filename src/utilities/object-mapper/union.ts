import { GraphQLUnionType as T } from "graphql";
import { BaseObjectMap } from "./base";

export class UnionObjectMap extends BaseObjectMap<T> {
  constructor(type: T) {
    super(type);

    this._type = "union";

    this.separator = "| ";
    this.eol = "\n";
    this.brackets = { open: "", close: "" };
    this.declaration = `export type ${this.name} =\n`;

    this.map();
  }

  private map() {
    for (const type of this.type.getTypes()) {
      this.pairs.push({
        key: "",
        value: type.name,
        metaTypeData: { isNonNullable: true },
        description: type.description,
      });
    }
  }
}
