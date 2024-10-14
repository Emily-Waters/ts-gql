import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
} from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";
import { StringUtils } from "../string/string-utils";

export class BaseTransformer {
  protected _config: GraphQLSchemaNormalizedConfig;

  constructor(protected _schema: GraphQLSchema) {
    this._config = _schema.toConfig();
  }

  protected scalar(
    scalarType: GraphQLScalarType,
    metaType: { isNonNullable: boolean; isInputObjectType: boolean },
  ) {
    const specifier = metaType.isInputObjectType ? "input" : "output";
    return `Scalars.${scalarType.name}Scalar["${specifier}"]`;
  }

  protected union(unionType: GraphQLUnionType) {
    return unionType
      .getTypes()
      .map((type) => type.toString())
      .join(" | ");
  }

  protected enum(enumType: GraphQLEnumType) {
    return `Enums.${enumType.name}`;
  }

  protected makeMaybe(val: string) {
    return `MaybeValue<${val}>`;
  }

  protected list(val: string) {
    return `Array<${val}>`;
  }

  protected object(objectType: GraphQLObjectType | GraphQLInputObjectType | GraphQLInterfaceType) {
    return StringUtils.stripNonAlpha(objectType.toString());
  }
}
