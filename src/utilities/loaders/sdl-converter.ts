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
  private processedOperations: Set<string> = new Set();

  constructor(private schema: GraphQLSchema) {}

  convert(operationDoc: DocumentNode): string {
    const operations = operationDoc.definitions.filter(
      (def) => def.kind === Kind.OPERATION_DEFINITION,
    ) as OperationDefinitionNode[];

    const sdl: string[] = [];

    operations.forEach((operation) => {
      if (operation.variableDefinitions && operation.variableDefinitions.length > 0) {
        sdl.push(this.buildVariablesType(operation));
      }
    });

    // Second pass: Create result types for each operation
    operations.forEach((operation) => {
      const operationName =
        operation.name?.value || `Unnamed${emdash.string.capitalize(operation.operation)}`;
      const returnType = `${emdash.string.capitalize(operationName)}`;

      // Build result type
      sdl.push(`type ${returnType} {`);

      // Add __typename field first
      // sdl.push(`  __typename: "${emdash.string.capitalize(operation.operation)}"`);

      // Process each top-level field in the operation for result type
      for (const selection of operation.selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          const field = selection as FieldNode;
          const fieldName = field.name.value;
          const rootType = this.getRootType(operation.operation);
          if (!rootType) continue;

          const schemaField = rootType.getFields()[fieldName];
          if (!schemaField) continue;

          // Get the actual return type from the schema
          const returnTypeName = schemaField.type.toString();

          // Add the field with its return type
          sdl.push(`  ${fieldName}: ${returnTypeName}`);
        }
      }

      sdl.push("}");

      // Mark this operation as processed
      this.processedOperations.add(operationName);
    });

    // Third pass: Extend Query/Mutation types to include operations
    operations.forEach((operation) => {
      const operationName =
        operation.name?.value || `Unnamed${emdash.string.capitalize(operation.operation)}`;
      const returnType = `${emdash.string.capitalize(operationName)}`;
      const rootTypeName = emdash.string.capitalize(operation.operation);

      const mappedArgs = operation.variableDefinitions?.length
        ? `(${operation.variableDefinitions
            .map((varDef) => this.mapArgument(operation.name?.value, varDef))
            .filter(Boolean)
            .join(", ")})`
        : "";

      sdl.push(`extend type ${rootTypeName} {
  ${operationName}${mappedArgs}: ${returnType}
}`);
    });

    return sdl.join("\n\n");
  }

  private buildVariablesType(operation: OperationDefinitionNode): string {
    const operationName =
      operation.name?.value || `Unnamed${emdash.string.capitalize(operation.operation)}`;
    const typeName = `${emdash.string.capitalize(operationName)}Input`;

    const args = operation.variableDefinitions
      ?.map((varDef) => `  ${varDef.variable.name.value}: ${this.getTypeFromNode(varDef.type)}`)
      .join("\n");

    return `type ${typeName} {\n${args}\n}`;
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
