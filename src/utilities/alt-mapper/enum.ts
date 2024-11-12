import { GraphQLEnumType } from "graphql";
import { KeyValuePairs, MappedType } from "./MapFactory";

export function mapEnum(type: GraphQLEnumType): MappedType {
  const values: KeyValuePairs = [];

  for (const field of type.getValues()) {
    values.push({
      key: field.name,
      value: `"${field.value}"`,
      metaTypeData: { isNonNullable: true },
    });
  }

  return {
    key: type.name,
    name: type.name,
    values,
    metaTypeData: {
      isNonNullable: false,
      isList: false,
      isScalar: false,
      isUnion: false,
    },
    formatConfig: {
      terminator: "",
      separator: " = ",
      eol: ",\n",
      brackets: { open: "{\n", close: "}" },
      declaration: (key) => `export enum ${key} `,
      initialDepth: 0,
      emptyPairValue: "",
    },
  };
}
