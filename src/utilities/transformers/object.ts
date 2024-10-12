import {
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLType,
  GraphQLUnionType,
} from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseTransformer } from "./base";

export class BaseObjectTransformer extends BaseTransformer {
  protected createKeyValuePair(key: string, value: string) {
    return `${key}: ${value}`;
  }

  protected buildFromOutputType(type: GraphQLType, isNonNullable = false): string {
    let value = "";

    if (TypeGuards.isNonNullable(type)) {
      return this.buildFromOutputType(type.ofType, true);
    } else {
      if (TypeGuards.isList(type)) {
        return `Array<${this.buildFromOutputType(type.ofType, isNonNullable)}>`;
      } else if (TypeGuards.isScalar(type)) {
        if (TypeGuards.isInputObjectType(type)) {
          value += this.mapScalar(type).input;
        } else {
          value += this.mapScalar(type).output;
        }
      } else if (TypeGuards.isUnion(type)) {
        value += this.mapUnion(type).join(" | ");
      } else if (TypeGuards.isEnum(type)) {
        value += `Enums.${type.name}`;
      } else {
        value += StringUtils.stripNonAlpha(type.toString());
      }
    }

    if (isNonNullable) {
      return value;
    }

    return this.makeMaybe(value);
  }

  protected mapUnion(unionType: GraphQLUnionType) {
    return unionType.getTypes().map((type) => type.toString());
  }

  protected makeMaybe(val: string) {
    return `MaybeValue<${val}>`;
  }

  protected mapScalar(scalarType: GraphQLScalarType) {
    switch (scalarType.name) {
      case "String":
        return { input: "string", output: "string" };
      case "Int":
        return { input: "number", output: "number" };
      case "Float":
        return { input: "number", output: "number" };
      case "Boolean":
        return { input: "boolean", output: "boolean" };
      case "ID":
        return { input: "string", output: "string" };
      default:
        return { input: "any", output: "any" };
    }
  }
}

export class ObjectTransformer extends BaseObjectTransformer {
  public transform(objectType: GraphQLObjectType | GraphQLInputObjectType) {
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
