import { GraphQLScalarType } from "graphql";

// no wrapping class. function returns a plain ol boolean
export function isScalar(type: unknown): boolean {
  return type instanceof GraphQLScalarType;
}
