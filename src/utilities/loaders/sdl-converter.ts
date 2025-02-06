import {
  DocumentNode,
  FieldNode,
  GraphQLObjectType,
  GraphQLSchema,
  Kind,
  OperationDefinitionNode,
  VariableDefinitionNode,
} from "graphql";
import { StringUtils } from "../string/string-utils";

export class OperationToSDLConverter {
  private argNameMapping: { [operationName: string]: { [originalName: string]: string } } = {};

  constructor(private schema: GraphQLSchema) {}

  convert(operationDoc: DocumentNode): string {
    const operations = operationDoc.definitions.filter(
      (def) => def.kind === Kind.OPERATION_DEFINITION,
    ) as OperationDefinitionNode[];

    const sdl: string[] = [];

    operations.forEach((operation) => {
      const fields: string[] = [];
      const operationName =
        operation.name?.value || `Unnamed${StringUtils.capitalize(operation.operation)}`;
      const returnType = `${StringUtils.capitalize(operationName)}${StringUtils.capitalize(operation.operation)}Result`;

      sdl.push(`type ${returnType} {`);

      for (const selection of operation.selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          const field = this.processField(selection, this.getRootType(operation.operation));

          if (field) {
            fields.push(`  ${field}`);
          }
        }
      }

      const mappedArgs = operation.variableDefinitions
        ?.map((varDef) => this.mapArgument(operation.name?.value, varDef))
        .filter(Boolean);

      sdl.push(`${fields.join("\n")}\n}`);
      sdl.push(`extend type ${StringUtils.capitalize(operation.operation)} {
    ${operationName}${mappedArgs && mappedArgs.length > 0 ? `(${mappedArgs.join(", ")})` : ""}: ${returnType}
  }`);
      //       } else if (operation.operation === "query") {
      //         const combinedFields: string[] = [];
      //         const operationName = operation.name?.value || "UnnamedQuery";
      //         const returnType = `${operationName}Payload`;

      //         sdl.push(`type ${returnType} {`);

      //         operation.selectionSet.selections.forEach((selection) => {
      //           if (selection.kind === Kind.FIELD) {
      //             const fieldSDL = this.processField(selection as FieldNode, this.getRootType("query"));
      //             if (fieldSDL) {
      //               combinedFields.push(`  ${fieldSDL}`);
      //             }
      //           }
      //         });

      //         sdl.push(`${combinedFields.join("\n")}\n}`);
      //         sdl.push(`extend type Query {
      //     ${operationName}: ${returnType}
      //   }`);
      //       }
    });

    return sdl.join("\n\n");
  }

  private mapArgument(
    operationName: string | undefined,
    varDef: VariableDefinitionNode,
  ): string | null {
    if (!operationName) return null;

    const originalName = varDef.variable.name.value;
    const mappedName = this.argNameMapping[operationName]?.[originalName] || originalName;

    let argType = this.getTypeFromNode(varDef.type);

    return `${mappedName}: ${argType}`;
  }

  private getRootType(operation: string): GraphQLObjectType | null {
    switch (operation) {
      case "query":
        return this.schema.getQueryType() || null;
      case "mutation":
        return this.schema.getMutationType() || null;
      default:
        return null;
    }
  }

  private getTypeFromNode(typeNode: any): string {
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
      return `${this.getTypeFromNode(typeNode.type)}!`;
    } else if (typeNode.kind === Kind.LIST_TYPE) {
      return `[${this.getTypeFromNode(typeNode.type)}]`;
    } else if (typeNode.kind === Kind.NAMED_TYPE) {
      return typeNode.name.value;
    }
    return "unknown";
  }

  private processField(field: FieldNode, parentType: GraphQLObjectType | null): string | null {
    if (!parentType) return null;

    const name = field.name.value;
    const schemaField = parentType.getFields()[name];
    if (!schemaField) return null;

    const args = field.arguments?.map((arg) => {
      const schemaArg = schemaField.args.find((a) => a.name === arg.name.value);
      const argName = arg.name.value;
      const argType = schemaArg ? schemaArg.type.toString() : "String";
      return `${argName}: ${argType}`;
    });

    const argsStr = args?.length ? `(${args.join(", ")})` : "";

    return `${name}${argsStr}: ${schemaField.type.toString()}`;
  }
}
