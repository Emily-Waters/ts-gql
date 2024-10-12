import { GraphQLInputObjectType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseObjectTransformer } from "./object";

export class InputObjectTransformer extends BaseObjectTransformer {
  public transform(objectType: GraphQLInputObjectType) {
    let output = `export type ${objectType.name} = {\n`;

    output += StringUtils.indent(`__typename?: "${objectType.name}";\n`);

    for (const fieldKey in objectType.getFields()) {
      const field = objectType.getFields()[fieldKey];
      const type = field.type;
      const isNonNullable = TypeGuards.isNonNullable(type);

      const key = field.name;
      const value = this.buildFromOutputType(type, isNonNullable);

      output += StringUtils.indent(this.createKeyValuePair(key, value));
      output += ";\n";
    }

    output += "}\n\n";

    return output;
  }
}
