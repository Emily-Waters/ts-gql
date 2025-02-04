import {
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLType,
  GraphQLUnionType,
} from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { Maybe } from "graphql/jsutils/Maybe";

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

  protected _scalarPrimitiveTypeMap: Record<string, { input: string; output: string }> = {
    ID: { input: "string", output: "string" },
    String: { input: "string", output: "string" },
    Int: { input: "number", output: "number" },
    Float: { input: "number", output: "number" },
    Boolean: { input: "boolean", output: "boolean" },
  };

  constructor(
    protected type: T,
    name?: string,
  ) {
    if (!this.name) {
      this.name = name || type.name;
    }

    // if (BaseObjectMap._typeMap.has(this.name)) {
    //   console.error(`ERROR: Type with name ${this.name} already exists`);
    //   process.exit(1);
    // }

    BaseObjectMap._typeMap.set(this.name, this);
  }

  public buildPairs(depth: number = this.initialDepth) {
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
        let value = this.keyValuePair(pair, depth + 1);
        value = StringUtils.indent(value, depth + 1);

        let description = "";

        if (pair.description && this._type !== "document") {
          description = StringUtils.indent(`/** ${pair.description} */\n`);
        }

        return `${acc}${description}${value}`;
      }, "") +
      StringUtils.indent(this.brackets.close, depth)
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
}
