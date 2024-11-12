import { GraphQLInputObjectType, GraphQLObjectType, GraphQLType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { MetaTypeData } from "../object-mapper/base";
import { StringUtils } from "../string/string-utils";
import { KeyValuePairs, MappedType } from "./MapFactory";

export function mapObject(type: GraphQLObjectType | GraphQLInputObjectType): MappedType {
  const values: KeyValuePairs = [];

  if (TypeGuards.isObjectType(type)) {
    values.push({ key: "__typename", value: `"${type.name}"`, metaTypeData: {} });
  }

  const fields = type.getFields();

  for (const fieldKey in fields) {
    const { name, type } = fields[fieldKey];

    values.push({
      key: name,
      value: StringUtils.stripNonAlpha(type.toString()),
      metaTypeData: metaTypeData(type),
    });
  }

  function metaTypeData(type: GraphQLType, metaType: MetaTypeData = {}): MetaTypeData {
    // TODO: handle nested lists
    if (TypeGuards.isNonNullable(type)) {
      return metaTypeData(type.ofType, { ...metaType, isNonNullable: true });
    } else if (TypeGuards.isList(type)) {
      return metaTypeData(type.ofType, { ...metaType, isList: true });
    } else if (TypeGuards.isScalar(type)) {
      return { ...metaType, isScalar: true };
    } else if (TypeGuards.isUnion(type)) {
      return { ...metaType, isUnion: true };
    } else {
      return metaType;
    }
  }

  return {
    key: type.name,
    name: type.name,
    values,
    metaTypeData: metaTypeData(type),
    formatConfig: {
      terminator: ";",
      separator: ": ",
      eol: ",\n",
      brackets: { open: "{\n", close: "}" },
      declaration: (key) => `export type ${key} = `,
      initialDepth: 0,
    },
  };
}
