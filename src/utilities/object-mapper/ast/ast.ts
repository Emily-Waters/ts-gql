import emdash from "@emilywaters/emdash";
import {
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLType,
  GraphQLUnionType,
} from "graphql";
import * as ts from "typescript";
import { Config } from "../../..";
import { TypeGuards } from "../../../guards/type-guards";
import { GraphQLTypes } from "../../../types";
import { getBaseType } from "../../find-base-type";
import { OperationKeywords } from "../constants";
import { ASTHelpers } from "./helpers";

export type DescriptionType = string | null | undefined;

export class ASTBuilder {
  private ts = ASTHelpers;
  private _scalars: NonNullable<Config["scalarMap"]> = {};
  private _cache = new Map<string, ts.Node>();

  constructor(scalars: Config["scalarMap"] = {}) {
    this._scalars = scalars;
  }

  build(type: GraphQLTypes, exportable = false) {
    if (TypeGuards.isScalar(type)) {
      return;
    }

    let name, alias;
    const cached = this.getCachedValue(type);

    if (cached) {
      alias = cached;
    } else if (TypeGuards.isEnum(type)) {
      name = this.getName(type);
      alias = this.enumToEnumDeclaration(type);
    } else {
      name = this.getName(type);
      alias = this.toTypeDeclaration(type, exportable);
    }

    if (name && alias) this._cache.set(name, alias);
  }

  private toTypeDeclaration(type: GraphQLTypes, exportable: boolean) {
    const name = this.getName(type);
    const node = this.buildType(type, false);
    const description = this.getDescription(type);

    return this.ts.typeAlias({
      name,
      node,
      options: { exportable },
      description,
    });
  }

  private enumToEnumDeclaration(type: GraphQLEnumType) {
    const name = this.getName(type);
    const values = type.getValues().map((v) => v);
    return this.ts.literal.enum(name, values);
  }

  private getName(type: GraphQLTypes): string {
    return getBaseType(type).type.name;
  }

  private getDescription(type: GraphQLTypes): DescriptionType {
    return getBaseType(type).type.description;
  }

  private getCachedValue(type: GraphQLTypes) {
    return this._cache.get(this.getName(type));
  }

  private buildType(type: GraphQLTypes, reference: boolean): ts.TypeNode {
    switch (true) {
      case TypeGuards.isEnum(type):
        return this.enumToTypeNode(type);
      case TypeGuards.isInputObject(type):
        return this.inputObjectToTypeNode(type, reference);
      case TypeGuards.isInterface(type):
        return this.interfaceToTypeNode(type, reference);
      case TypeGuards.isList(type):
        return this.listToTypeNode(type, reference);
      case TypeGuards.isNonNullable(type):
        return this.nonNullableToTypeNode(type, reference);
      case TypeGuards.isObject(type):
        return this.objectToTypeNode(type, reference);
      case TypeGuards.isScalar(type):
        return this.scalarToTypeNode(type);
      case TypeGuards.isUnion(type):
        return this.unionToTypeNode(type, reference);
      default:
        throw new Error(`Unsupported type: ${JSON.stringify(type, null, 2)}`);
    }
  }

  private enumToTypeNode(type: GraphQLEnumType) {
    return this.reference(type);
  }

  private inputObjectToTypeNode(type: GraphQLInputObjectType, reference: boolean) {
    if (reference) return this.reference(type);
    return this._object({ type });
  }

  private interfaceToTypeNode(type: GraphQLInterfaceType, reference: boolean) {
    return this.reference(type);
  }

  private listToTypeNode(type: GraphQLList<GraphQLType>, reference: boolean) {
    let node;

    if (reference) {
      node = this.reference(getBaseType(type).type);
    } else {
      node = this.buildType(getBaseType(type).type, reference);
    }

    return this.ts.literal.array(node);
  }

  private nonNullableToTypeNode(
    type: GraphQLNonNull<GraphQLType>,
    reference: boolean,
  ): ts.TypeNode {
    return this.buildType(getBaseType(type).type, reference);
  }

  private objectToTypeNode(type: GraphQLObjectType, reference: boolean) {
    if (reference) return this.reference(type);

    const operation = OperationKeywords[type.name];
    if (operation) this.operationTypesToTypeNode(type, operation);

    return this._object({ type, typeName: true });
  }

  private buildObjectProperties(
    fields: GraphQLField<any, any>[] | ReadonlyArray<GraphQLArgument>,
    __typename?: ts.PropertySignature,
  ) {
    const properties = [];

    if (__typename) properties.push(__typename);

    properties.push(
      ...fields.map((field) => {
        const type = field.type;

        const key = field.name;
        const node = this.buildType(type, true);
        const optional = this.isOptional(type);
        const description = field.description;

        return this.ts.property({ key, node, optional, description });
      }),
    );

    return properties;
  }

  private operationTypesToTypeNode(type: GraphQLObjectType, operation: string) {
    const fields = type.getFields();

    for (const key in fields) {
      const field = fields[key];

      const fieldName = emdash.string.capitalize(key);
      const operationName = emdash.string.capitalize(operation);

      const name = `${fieldName}${operationName}Result`;
      const typename = this.ts.__typename(type.name);
      this.buildOperationProperties(name, [field], typename);

      if (field.args) {
        const name = `${fieldName}${operationName}Input`;
        if (this._cache.has(name)) continue;
        this.buildOperationProperties(name, field.args);
      }
    }
  }

  private buildOperationProperties(
    name: string,
    fields: GraphQLField<any, any>[] | ReadonlyArray<GraphQLArgument>,
    typename?: ts.PropertySignature,
  ) {
    const properties = this.buildObjectProperties(fields, typename);
    const node = this.ts.literal.object(properties);
    const alias = this.ts.typeAlias({ name, node, options: { exportable: true } });
    this._cache.set(name, alias);
  }

  private unionToTypeNode(type: GraphQLUnionType, reference: boolean) {
    if (reference) return this.reference(type);
    const values = type.getTypes().map((t) => this.buildType(t, reference));
    return this.ts.literal.union(values);
  }

  private scalarToTypeNode(type: GraphQLScalarType) {
    switch (true) {
      case TypeGuards.scalars.String(type):
        return this.ts.keyword.string;
      case TypeGuards.scalars.Int(type):
        return this.ts.keyword.number;
      case TypeGuards.scalars.Float(type):
        return this.ts.keyword.number;
      case TypeGuards.scalars.Boolean(type):
        return this.ts.keyword.boolean;
      default:
        if (this._scalars[type.name]) {
          return this.ts.reference({ name: this._scalars[type.name] });
        } else if (TypeGuards.scalars.ID(type)) {
          return this.ts.keyword.string;
        }

        return this.ts.keyword.any;
    }
  }

  private reference(type: GraphQLTypes) {
    return this.ts.reference({ name: this.getName(type) });
  }

  private _object({
    type,
    typeName,
  }: {
    type: GraphQLObjectType | GraphQLInputObjectType;
    typeName?: boolean;
  }) {
    let typename;

    const fields = Object.values(type.getFields());
    if (typeName) typename = this.ts.__typename(type.name);
    const properties = this.buildObjectProperties(fields, typename);
    return this.ts.literal.object(properties);
  }

  private isOptional(type: GraphQLTypes) {
    return !TypeGuards.isNonNullable(type);
  }

  toString() {
    return Array.from(this._cache.values())
      .map((node) => this.ts.print(node))
      .join("\n\n");
  }
}
