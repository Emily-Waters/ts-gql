import { TypeGuards } from "../guards/type-guards";
import { GraphQLBaseType, GraphQLTypes } from "../types";

export function getBaseType(
  type: GraphQLTypes,
  meta = { isNonNullable: false, isList: false },
): { type: GraphQLBaseType; isNonNullable: boolean; isList: boolean } {
  switch (true) {
    case TypeGuards.isNonNullable(type):
      return getBaseType(type.ofType, { ...meta, isNonNullable: true });
    case TypeGuards.isList(type):
      return getBaseType(type.ofType, { ...meta, isList: true });
    default:
      return { type, ...meta };
  }
}
