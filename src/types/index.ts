import { GraphQLField, GraphQLList, GraphQLNonNull, GraphQLType } from "graphql";

export type GraphQLTypes = GraphQLType | GraphQLField<any, any>;
export type GraphQLBaseType = Exclude<GraphQLTypes, GraphQLList<any> | GraphQLNonNull<any>>;
