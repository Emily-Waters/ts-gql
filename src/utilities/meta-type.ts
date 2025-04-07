import { TypeGuards } from "../guards/type-guards";
import { GraphQLTypes, MetaType } from "../types";

export function metaType(
  type: GraphQLTypes,
  meta = { isNonNullable: false, isList: false, isScalar: false, isUnion: false },
): MetaType {
  switch (true) {
    case TypeGuards.isNonNullable(type):
      return metaType(type.ofType, { ...meta, isNonNullable: true });
    case TypeGuards.isList(type):
      return metaType(type.ofType, { ...meta, isList: true });
    case TypeGuards.isField(type):
      return metaType(type.type, { ...meta, isNonNullable: true });
    default:
      return {
        type,
        ...meta,
        isScalar: TypeGuards.isScalar(type),
        isUnion: TypeGuards.isUnion(type),
      };
  }
}
