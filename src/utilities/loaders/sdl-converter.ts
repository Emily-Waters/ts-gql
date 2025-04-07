import emdash from "@emilywaters/emdash";
import {
  DocumentNode,
  FieldNode,
  GraphQLObjectType,
  GraphQLSchema,
  Kind,
  OperationDefinitionNode,
  VariableDefinitionNode,
} from "graphql";

export class OperationToSDLConverter {
  private argNameMapping: { [operationName: string]: { [originalName: string]: string } } = {};
  private processed: Set<string> = new Set();

  constructor(private schema: GraphQLSchema) {}

  convert(node: DocumentNode): string {
    const operations = this.extractOperationDefinitions(node);
    if (operations.length === 0) return "";

    const sdl: string[] = [];
    sdl.push(...this.buildOperationsVariables(operations));
    sdl.push(...this.buildOperationResultType(operations));
    sdl.push(...this.buildOperationExtension(operations));

    return sdl.join("\n\n");
  }

  private extractOperationDefinitions(node: DocumentNode): OperationDefinitionNode[] {
    return node.definitions.filter((def) => def.kind === Kind.OPERATION_DEFINITION);
  }

  private extractOperationName(operation: OperationDefinitionNode) {
    return operation.name?.value || `Unnamed${emdash.string.capitalize(operation.operation)}`;
  }

  private buildOperationsVariables(operations: OperationDefinitionNode[]): string[] {
    return operations
      .map((operation) => {
        if (!operation.variableDefinitions || operation.variableDefinitions.length === 0) return;

        const operationName = this.extractOperationName(operation);
        const inputName = `${operationName}Input`;

        const fields = [];

        for (const field of operation.variableDefinitions) {
          const key = field.variable.name.value;
          const value = this.getTypeFromNode(field.type);
          fields.push(emdash.string.indent(`${key}: ${value}`, 2));
        }

        return `type ${inputName} {\n${fields.join("\n")}\n}`;
      })
      .filter(Boolean) as string[];
  }

  private buildOperationResultType(operations: OperationDefinitionNode[]) {
    return operations
      .map((operation) => {
        const operationName = this.extractOperationName(operation);
        const returnType = `${emdash.string.capitalize(operationName)}`;

        const fields = [];

        for (const selection of operation.selectionSet.selections) {
          if (selection.kind === Kind.FIELD) {
            const field = selection as FieldNode;
            const key = field.name.value;

            const rootType = this.getRootType(operation.operation);
            if (!rootType) return "";

            const schemaField = rootType.getFields()[key];
            // TODO: Throw an error here when the value of the field is not found in the schema
            if (!schemaField) return "";

            const value = schemaField.type.toString();
            fields.push(emdash.string.indent(`${key}: ${value}`, 2));
          }
        }

        this.processed.add(operationName);

        return `type ${returnType} {${fields.join("\n")}\n}`;
      })
      .filter(Boolean) as string[];
  }

  private buildOperationExtension(operations: OperationDefinitionNode[]) {
    return operations.map((operation) => {
      const operationName = this.extractOperationName(operation);
      const rootTypeName = emdash.string.capitalize(operation.operation);

      const mappedArgs = operation.variableDefinitions?.length
        ? `(${operation.variableDefinitions
            .map((varDef) => this.mapArgument(operation.name?.value, varDef))
            .filter(Boolean)
            .join(", ")})`
        : "";

      const returnValue = `${emdash.string.capitalize(operationName)}`;
      const defs = emdash.string.indent(`${operationName}${mappedArgs}: ${returnValue}`, 2);

      return `extend type ${rootTypeName} {\n${defs}\n}`;
    });
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
      case "subscription":
        return this.schema.getSubscriptionType() || null;
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
}
