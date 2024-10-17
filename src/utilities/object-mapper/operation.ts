import { GraphQLField } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseObjectMap } from "./base";

export class OperationObjectMap<T extends GraphQLField<any, any>> extends BaseObjectMap<T> {
  constructor(
    type: T,
    private specifier: string,
  ) {
    super(type);

    this.name = StringUtils.capitalize(type.name) + this.specifier;
    this.separator = ": ";
    this.eol = ";\n";

    this.declaration = `export type ${this.name} =`;

    this.map();
  }

  public map() {
    this.pairs.push({ key: "__typename", value: `"${this.specifier}"` });

    const metaTypeData = this.metaTypeData(this.type.type);
    const baseType = this.findBaseType(this.type);

    this.pairs.push({
      key: this.type.name,
      value: StringUtils.stripNonAlpha(baseType.toString()),
      metaTypeData,
    });
  }
}
