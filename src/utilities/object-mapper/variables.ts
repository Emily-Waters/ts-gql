import { GraphQLField } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseObjectMap } from "./base";

export class VariableObjectMap<T extends GraphQLField<any, any>> extends BaseObjectMap<T> {
  constructor(
    type: T,
    private specifier: "Query" | "Mutation" | "Subscription",
  ) {
    super(type, `${type.name}${specifier}Variables`);

    this._type = "variables";

    this.separator = ": ";
    this.eol = ";\n";
    this.declaration = `export type ${StringUtils.capitalize(type.name)}${this.specifier}Variables =`;
    this.emptyPairValue = "{ [key: string]: never }";

    this.map();
  }

  private map() {
    for (const arg of this.type.args) {
      const baseType = this.findBaseType(arg.type);
      const metaTypeData = this.metaTypeData(arg.type);

      this.pairs.push({
        key: arg.name,
        value: StringUtils.stripNonAlpha(baseType.toString()),
        metaTypeData,
        description: arg.description,
      });
    }
  }
}
