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

// export declare type GraphQLType =
//   | GraphQLScalarType
//   | GraphQLObjectType
//   | GraphQLInterfaceType
//   | GraphQLUnionType
//   | GraphQLEnumType
//   | GraphQLInputObjectType
//   | GraphQLList<GraphQLType>
//   | GraphQLNonNull<
//       | GraphQLScalarType
//       | GraphQLObjectType
//       | GraphQLInterfaceType
//       | GraphQLUnionType
//       | GraphQLEnumType
//       | GraphQLInputObjectType
//       | GraphQLList<GraphQLType>
//     >;

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
}
