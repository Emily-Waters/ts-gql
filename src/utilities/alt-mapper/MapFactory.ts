import {
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
} from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { MetaTypeData } from "../object-mapper/base";
import { StringUtils } from "../string/string-utils";
import { mapEnum } from "./enum";
import { mapObject } from "./object";

type GraphQLMappableTypes =
  | GraphQLNamedType
  | GraphQLObjectType
  | GraphQLField<any, any>
  | GraphQLInputObjectType
  | GraphQLEnumType
  | GraphQLUnionType
  | GraphQLScalarType;

export type TypeMap = Map<string, MappedType>;

export type KeyValuePair =
  | { key: string; value: string; metaTypeData?: MetaTypeData }
  | { key: string; __ref: MappedType; metaTypeData?: MetaTypeData };

export type KeyValuePairs = KeyValuePair[];

export type MappedType = {
  key: string;
  name: string;
  values: KeyValuePairs;
  metaTypeData?: MetaTypeData;
  formatConfig: {
    terminator: string;
    separator: string;
    eol: string;
    brackets: { open: string; close: string };
    declaration: (key: string) => string;
    initialDepth: number;
    emptyPairValue?: string;
  };
};

export function MapFactory() {
  const map = new Map<string, MappedType>();

  function toString(key: string, type: MappedType, depth = 0): string {
    return `${type.formatConfig.declaration(key)}${buildPairs(type, depth)}`;
  }

  function buildPairs(type: MappedType, depth = 0): string {
    if (!type.values.length) {
      return type.formatConfig.emptyPairValue || "";
    }

    return (
      `${type.formatConfig.brackets.open}` +
      `${type.values.reduce((acc, pair) => {
        return `${acc}${StringUtils.indent(keyValuePair({ type, pair, depth: depth + 1 }), depth + 1)}`;
      }, "")}` +
      `${StringUtils.indent(type.formatConfig.brackets.close, depth)}`
    );
  }

  function keyValuePair({
    type,
    pair,
    depth = 0,
  }: {
    type: MappedType;
    pair: KeyValuePair;
    depth: number;
  }): string {
    let { key, metaTypeData } = pair;
    let value = "";
    const isNullable = !metaTypeData?.isNonNullable;

    if (isNullable) {
      key += "?";
    }

    if ("value" in pair) {
      value = pair.value;

      if (metaTypeData?.isList) {
        value = `Array<${pair.value}>`;
      }
    } else {
      value = buildPairs(pair.__ref, depth);
    }

    return `${key}${type.formatConfig.separator}${value}${type.formatConfig.eol}`;
  }

  const self = {
    map,
    create(type: GraphQLMappableTypes, keyModifier: string = "") {
      const mapKey = type.name + keyModifier;

      switch (true) {
        case TypeGuards.isEnum(type):
          map.set(mapKey, mapEnum(type));
          break;
        case TypeGuards.isObjectType(type):
          if (type.name === "Query" || type.name === "Mutation" || type.name === "Subscription") {
            const fields = type.getFields();
            for (const fieldKey in fields) {
              const field = fields[fieldKey];
              self.create(field, keyModifier + fieldKey);
            }
            break;
          }

          map.set(mapKey, mapObject(type));

          break;
        case TypeGuards.isInputObjectType(type):
          break;
        case TypeGuards.isUnion(type):
          break;
      }
    },
    toString,
  };

  return self;
}
