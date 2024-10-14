import { GraphQLField, GraphQLObjectType, GraphQLType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseTransformer } from "./base";

export class OperationTransformer extends BaseTransformer {
  public transform(operationType: GraphQLObjectType, specifier: string) {
    let output = "";

    const fields = operationType.getFields();

    for (const fieldKey in fields) {
      output += this.buildSignature(fields[fieldKey], specifier);
    }

    return output;
  }

  protected buildFields(type: GraphQLType, depth = 2) {
    let output = "";

    const baseType = this.findBaseType(type);

    if (TypeGuards.isObjectType(baseType)) {
      output += " {\n";

      const fields = baseType.getFields();
      for (const fieldKey in fields) {
        const field = fields[fieldKey];

        const baseField = this.findBaseType(field);

        output += `${StringUtils.indent(field.name, depth)}`;

        if (TypeGuards.isObjectType(baseField)) {
          output += this.buildFields(baseField, depth + 1);
        } else if (TypeGuards.isUnion(baseField)) {
          const types = baseField.getTypes();

          for (const type of types) {
            output += `\n${StringUtils.indent(`... on ${type.name}`, depth)}`;
            output += this.buildFields(type, depth + 1);
          }
        }

        output += "\n";
      }

      output += StringUtils.indent(`}`, depth - 1);
    }

    return output;
  }

  protected buildSignature(field: GraphQLField<any, any>, specifier: string) {
    let operation = "";
    let output = "";
    let alias = "";

    operation += `${specifier} ${StringUtils.capitalize(field.name)}`;
    alias += field.name;

    if (field.args.length) {
      operation += `(`;
      alias += `(`;

      let operationArgs = [];
      let aliasArgs = [];

      for (const arg of field.args) {
        operationArgs.push(`$${arg.name}: ${arg.type}`);
        aliasArgs.push(`${arg.name}: $${arg.name}`);
      }

      operation += operationArgs.join(", ");
      operation += `)`;

      alias += aliasArgs.join(", ");
      alias += `)`;
    }

    output += `${operation} {\n`;
    output += `${StringUtils.indent(alias)}`;
    output += this.buildFields(field.type);
    output += `\n}\n\n`;

    return output;
  }

  private findBaseType<T extends GraphQLType | GraphQLField<any, any>>(type: T): any {
    if ("ofType" in type) {
      return this.findBaseType(type.ofType);
    } else if ("type" in type) {
      return this.findBaseType(type.type);
    } else {
      return type;
    }
  }
}
