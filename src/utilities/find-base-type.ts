import { TypeGuards } from "../guards/type-guards";
import { GraphQLTypes, MetaType } from "../types";

export function metaType(
  type: GraphQLTypes,
  meta = { isNonNullable: false, isList: false },
): MetaType {
  switch (true) {
    case TypeGuards.isNonNullable(type):
      return metaType(type.ofType, { ...meta, isNonNullable: true });
    case TypeGuards.isList(type):
      return metaType(type.ofType, { ...meta, isList: true });
    default:
      return { type: type, ...meta };
  }
}
