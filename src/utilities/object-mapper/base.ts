import { GraphQLField, GraphQLType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";

export type MetaTypeData = {
  isNonNullable?: boolean;
  isList?: boolean;
  isScalar?: boolean;
  isUnion?: boolean;
};

type PairType = { key: string; value: string | PairType; metaTypeData?: MetaTypeData }[];

export abstract class BaseType<T> {
  protected name: string = "";
  protected pairs: PairType = [];
  protected separator: string;
  protected eol: string;

  protected _scalarPrimitiveTypeMap: Record<string, { input: string; output: string }> = {
    ID: { input: "string", output: "string" },
    String: { input: "string", output: "string" },
    Int: { input: "number", output: "number" },
    Float: { input: "number", output: "number" },
    Boolean: { input: "boolean", output: "boolean" },
  };

  constructor(protected type: T) {}

  protected buildPairs(depth: number = 0) {
    return this._buildPairs(depth, this.pairs);
  }

  protected keyValuePair({ key, value, metaTypeData }: PairType[number], depth = 0) {
    if (!metaTypeData?.isNonNullable) {
      key += "?";
    }

    if (metaTypeData?.isScalar && typeof value === "string") {
      const scalarDataField = TypeGuards.isInputObjectType(this.type) ? "input" : "output";
      value = this._scalarPrimitiveTypeMap[value]?.[scalarDataField] || "any";
    }

    if (metaTypeData?.isList) {
      value += "[]";
    }

    if (typeof value === "string") {
      return StringUtils.indent(`${key}${this.separator}${value}${this.eol}`);
    }

    return StringUtils.indent(
      `${key}${this.separator}${this._buildPairs(depth + 1, value)}${this.eol}`,
    );
  }

  private _buildPairs(depth: number = 0, pairs: PairType): string {
    return pairs.reduce((acc, pair) => {
      return `${acc}${StringUtils.indent(this.keyValuePair(pair), depth)}`;
    }, "");
  }
}

export abstract class BaseObjectType<T> extends BaseType<T> {
  protected findBaseType<T extends GraphQLType | GraphQLField<any, any>>(type: T): GraphQLType {
    if ("ofType" in type) {
      return this.findBaseType(type.ofType);
    } else if ("type" in type) {
      return this.findBaseType(type.type);
    } else {
      return type;
    }
  }
}
