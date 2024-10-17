import { GraphQLField } from "graphql";
import { StringUtils } from "../string/string-utils";
import { BaseType } from "./base";

export class VariablesType<T extends GraphQLField<any, any>> extends BaseType<T> {
  constructor(
    type: T,
    private specifier: "Query" | "Mutation",
  ) {
    super(type);

    this.separator = ": ";
    this.eol = ";\n";
    this.emptyPairValue = "{ [key: string]: never }";

    this.declaration = `export type ${StringUtils.capitalize(type.name)}${this.specifier}Variables =`;

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
      });
    }
  }
}
