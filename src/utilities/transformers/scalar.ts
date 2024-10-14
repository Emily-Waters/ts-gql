import { GraphQLScalarType } from "graphql";
import { BaseTransformer } from "./base";

export class ScalarTransformer extends BaseTransformer {
  private _scalars: Record<string, string> = {};

  public transform(scalarType: GraphQLScalarType) {
    if (this._scalars[scalarType.name]) {
      return "";
    }

    let input, output;

    switch (scalarType.name) {
      case "String":
        input = "string";
        output = "string";
        break;

      case "Int":
        input = "number";
        output = "number";
        break;

      case "Float":
        input = "number";
        output = "number";
        break;

      case "Boolean":
        input = "boolean";
        output = "boolean";
        break;

      case "ID":
        input = "string";
        output = "string";
        break;

      default:
        input = "any";
        output = "any";
        break;
    }

    return `export type ${scalarType.name}Scalar = { input: ${input}; output: ${output} };\n`;
  }
}
