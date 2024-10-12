import {
  GraphQLEnumType,
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

export class TypeGuards {
  static isNonNullable<T extends GraphQLNullableType>(type: unknown): type is GraphQLNonNull<T> {
    return type instanceof GraphQLNonNull;
  }

  static isScalar(type: unknown): type is GraphQLScalarType {
    return type instanceof GraphQLScalarType;
  }

  static isUnion(type: unknown): type is GraphQLUnionType {
    return type instanceof GraphQLUnionType;
  }

  static isEnum(type: unknown): type is GraphQLEnumType {
    return type instanceof GraphQLEnumType;
  }

  static isInputObjectType(type: unknown): type is GraphQLInputObjectType {
    return type instanceof GraphQLInputObjectType;
  }

  static isObjectType(type: unknown): type is GraphQLObjectType {
    return type instanceof GraphQLObjectType;
  }

  static isList<T extends GraphQLType>(type: unknown): type is GraphQLList<T> {
    return type instanceof GraphQLList;
  }

  static isInterface(type: unknown): type is GraphQLInterfaceType {
    return type instanceof GraphQLInterfaceType;
  }
}
