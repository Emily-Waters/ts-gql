import {
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

export type GraphQLTypes = GraphQLType | GraphQLField<any, any>;
export type GraphQLBaseType = Exclude<GraphQLTypes, GraphQLList<any> | GraphQLNonNull<any>>;
export type DescriptionType = string | null | undefined;

export type GraphQLBaseTypeMap = {
  scalar: GraphQLScalarType;
  object: GraphQLObjectType;
  interface: GraphQLInterfaceType;
  union: GraphQLUnionType;
  enum: GraphQLEnumType;
  input: GraphQLInputObjectType;
  any: GraphQLBaseType;
};

export type MetaType<T extends keyof GraphQLBaseTypeMap = keyof GraphQLBaseTypeMap> = {
  type: GraphQLBaseTypeMap[T];
  isList?: boolean;
  isNonNullable?: boolean;
};
