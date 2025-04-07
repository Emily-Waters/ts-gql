import emdash from "@emilywaters/emdash";
import {
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLType,
  GraphQLUnionType,
} from "graphql";
import { Maybe } from "graphql/jsutils/Maybe";
import { Config } from "../..";
import { TypeGuards } from "../../guards/type-guards";

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
  description?: Maybe<string>;
};

type MappableTypes =
  | GraphQLObjectType
  | GraphQLField<any, any>
  | GraphQLInputObjectType
  | GraphQLEnumType
  | GraphQLUnionType
  | GraphQLScalarType;

export abstract class BaseObjectMap<T extends MappableTypes> {
  protected _type: string = "base";

  static instanceCount = 0;
  static _typeMap: Map<string, BaseObjectMap<MappableTypes>> = new Map();

  protected terminator: string = ";";
  protected emptyPairValue = "";
  protected name: string = "";
  protected pairs: PairDataType[] = [];
  protected separator: string = ": ";
  protected eol: string = ";\n";
  protected brackets = { open: " {\n", close: "}" };
  protected declaration: string = "";
  protected initialDepth: number = 0;

  static _scalarPrimitiveTypeMap: NonNullable<Config["scalarMap"]> = {
    ID: "string",
    String: "string",
    Int: "number",
    Float: "number",
    Boolean: "boolean",
  };

  constructor(
    protected type: T,
    name?: string,
  ) {
    if (!this.name) {
      this.name = name || type.name;
    }

    BaseObjectMap._typeMap.set(this.name, this);
  }

  public buildPairs(depth: number = this.initialDepth) {
    return this._buildPairs(depth, this.pairs);
  }

  protected keyValuePair({ key, value, metaTypeData }: PairDataType, depth = 0) {
    if (typeof value === "string") {
      if (metaTypeData?.isScalar) {
        value = BaseObjectMap._scalarPrimitiveTypeMap[value] || "any";
      }

      if (metaTypeData?.isList) {
        value += "[]";
      }
    } else {
      value = this._buildPairs(depth, value);
    }

    if (key === "__typename") {
      key += "?";
    } else if (!metaTypeData?.isNonNullable) {
      value = `Maybe<${value}>`;
    }

    return `${key}${this.separator}${value}${this.eol}`;
  }

  private _buildPairs(depth: number = 0, pairs: PairDataType[]): string {
    if (!pairs.length) {
      return this.emptyPairValue;
    }

    function remapPairs(pairs: PairDataType[]): any {
      return pairs.map((pair) => {
        if (pair.value && typeof pair.value === "object") {
          return { ...pair, value: remapPairs(pair.value) };
        }
        return pair;
      });
    }

    return (
      `${this.brackets.open}` +
      pairs.reduce((acc, pair) => {
        let value = this.keyValuePair(pair, depth + 2);
        value = emdash.string.indent(value, depth + 2);

        let description = "";

        if (pair.description && this._type !== "document") {
          description = emdash.string.indent(`/** ${pair.description} */\n`, 2);
        }

        return `${acc}${description}${value}`;
      }, "") +
      emdash.string.indent(this.brackets.close, depth)
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
    return `${this.declaration}${this.buildPairs()}${this.terminator}`;
  }

  static extendScalarMap(scalarMap: Config["scalarMap"]) {
    this._scalarPrimitiveTypeMap = { ...this._scalarPrimitiveTypeMap, ...scalarMap };
  }
}
