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

export abstract class BaseObjectMap<T> {
  protected emptyPairValue = "";
  protected name: string = "";
  protected pairs: PairDataType[] = [];
  protected separator: string = ": ";
  protected eol: string = ";\n";
  protected brackets = { open: " {\n", close: "}" };
  protected declaration: string;

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
    if (!pairs.length) {
      return this.emptyPairValue;
    }

    return (
      `${this.brackets.open}` +
      pairs.reduce((acc, pair) => {
        return `${acc}${StringUtils.indent(this.keyValuePair(pair, depth + 1), depth + 1)}`;
      }, "") +
      StringUtils.indent(this.brackets.close, depth)
    );
  }

  protected findBaseType<T extends GraphQLType | GraphQLField<any, any>>(type: T): GraphQLType {
    // this 'in' isnt familiar syntax to me.
    // can you explain what it does?
    if ("ofType" in type) {
      return this.findBaseType(type.ofType);
    } else if ("type" in type) {
      return this.findBaseType(type.type);
    } else {
      return type;
    }
  }

  protected metaTypeData(type: GraphQLType, metaType: MetaTypeData = {}): MetaTypeData {
    // TODO: handle nested lists
    if (TypeGuards.isNonNullable(type)) {
      return this.metaTypeData(type.ofType, { ...metaType, isNonNullable: true });
    } else if (TypeGuards.isList(type)) {
      return this.metaTypeData(type.ofType, { ...metaType, isList: true });
    } else if (TypeGuards.isScalar(type)) {
      return { ...metaType, isScalar: true };
    } else if (TypeGuards.isUnion(type)) {
      return { ...metaType, isUnion: true };
    } else {
      return metaType;
    }
  }

  public toString() {
    return `${this.declaration}${this.buildPairs()};`;
  }
}
