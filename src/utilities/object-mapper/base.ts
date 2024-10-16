import { GraphQLField, GraphQLType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";

export type MetaTypeData = {
  isNonNullable?: boolean;
  isList?: boolean;
  isScalar?: boolean;
  isUnion?: boolean;
};

type PairDataType = {
  key: string;
  value: string | PairDataType[];
  metaTypeData?: MetaTypeData;
};

export abstract class BaseType<T> {
  protected name: string = "";
  protected pairs: PairDataType[] = [];
  protected separator: string;
  protected eol: string;
  protected delimiters = { start: "{\n", end: "}" };

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

  protected keyValuePair({ key, value, metaTypeData }: PairDataType, depth = 0) {
    if (!metaTypeData?.isNonNullable) {
      key += "?";
    }

    if (typeof value === "string") {
      if (metaTypeData?.isScalar) {
        const scalarDataField = TypeGuards.isInputObjectType(this.type) ? "input" : "output";
        value = this._scalarPrimitiveTypeMap[value]?.[scalarDataField] || "any";
      }

      if (metaTypeData?.isList) {
        value += "[]";
      }

      return `${key}${this.separator}${value}${this.eol}`;
    }

    return `${key}${this.separator}${this._buildPairs(depth, value)}${this.eol}`;
  }

  private _buildPairs(depth: number = 0, pairs: PairDataType[]): string {
    return (
      `${this.delimiters.start}` +
      pairs.reduce((acc, pair) => {
        return `${acc}${StringUtils.indent(this.keyValuePair(pair, depth + 1), depth + 1)}`;
      }, "") +
      StringUtils.indent(this.delimiters.end, depth)
    );
  }

  protected findBaseType<T extends GraphQLType | GraphQLField<any, any>>(type: T): GraphQLType {
    if ("ofType" in type) {
      return this.findBaseType(type.ofType);
    } else if ("type" in type) {
      return this.findBaseType(type.type);
    } else {
      return type;
    }
  }

  public toString() {
    return `export type ${this.name} = ${this.buildPairs()}\n\n`;
  }
}
