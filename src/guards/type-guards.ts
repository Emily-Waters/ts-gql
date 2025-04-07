import {
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLType,
  GraphQLUnionType,
} from "graphql";
import { MetaType } from "../types";

class ScalarTypeGuards {
  static ID(type: GraphQLScalarType) {
    return type.name === "ID";
  }

  static String(type: GraphQLScalarType) {
    return type.name === "String";
  }

  static Int(type: GraphQLScalarType) {
    return type.name === "Int";
  }

  static Float(type: GraphQLScalarType) {
    return type.name === "Float";
  }

  static Boolean(type: GraphQLScalarType) {
    return type.name === "Boolean";
  }

  static isNative(type: GraphQLScalarType) {
    return (
      this.ID(type) || this.String(type) || this.Int(type) || this.Float(type) || this.Boolean(type)
    );
  }
}

class MetaTypeGuards {
  static isEnum(meta: MetaType): meta is MetaType<"enum"> {
    return TypeGuards.isEnum(meta.type);
  }

  static isInputObject(meta: MetaType): meta is MetaType<"input"> {
    return TypeGuards.isInputObject(meta.type);
  }

  static isInterface(meta: MetaType): meta is MetaType<"interface"> {
    return TypeGuards.isInterface(meta.type);
  }

  static isObject(meta: MetaType): meta is MetaType<"object"> {
    return TypeGuards.isObject(meta.type);
  }

  static isScalar(meta: MetaType): meta is MetaType<"scalar"> {
    return TypeGuards.isScalar(meta.type);
  }

  static isUnion(meta: MetaType): meta is MetaType<"union"> {
    return TypeGuards.isUnion(meta.type);
  }
}

export class TypeGuards {
  static isScalar(type: unknown): type is GraphQLScalarType {
    return type instanceof GraphQLScalarType;
  }

  static isObject(type: unknown): type is GraphQLObjectType {
    return type instanceof GraphQLObjectType;
  }

  static isInterface(type: unknown): type is GraphQLInterfaceType {
    return type instanceof GraphQLInterfaceType;
  }

  static isUnion(type: unknown): type is GraphQLUnionType {
    return type instanceof GraphQLUnionType;
  }

  static isEnum(type: unknown): type is GraphQLEnumType {
    return type instanceof GraphQLEnumType;
  }

  static isInputObject(type: unknown): type is GraphQLInputObjectType {
    return type instanceof GraphQLInputObjectType;
  }

  static isList<T extends GraphQLType>(type: unknown): type is GraphQLList<T> {
    return type instanceof GraphQLList;
  }

  static isNonNullable<T extends GraphQLNullableType>(type: unknown): type is GraphQLNonNull<T> {
    return type instanceof GraphQLNonNull;
  }

  static isField(type: unknown): type is GraphQLField<any, any> {
    return !!(
      typeof type === "object" &&
      type &&
      "astNode" in type &&
      typeof type.astNode === "object" &&
      type.astNode &&
      "kind" in type.astNode &&
      type.astNode.kind === "FieldDefinition"
    );
  }

  static scalars = ScalarTypeGuards;
  static meta = MetaTypeGuards;
}
