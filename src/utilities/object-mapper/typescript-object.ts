import { GraphQLInputObjectType, GraphQLObjectType, GraphQLType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseObjectType, MetaTypeData } from "./base";

export class TypeScriptObjectType<
  T extends GraphQLObjectType | GraphQLInputObjectType,
> extends BaseObjectType<T> {
  constructor(type: T) {
    super(type);

    this.name = type.name;
    this.separator = ": ";
    this.eol = ";\n";

    this.map();
  }

  protected map() {
    const fields = this.type.getFields();

    for (const fieldKey in fields) {
      const { name, type } = fields[fieldKey];

      this.pairs.push({
        key: name,
        value: StringUtils.stripNonAlpha(type.toString()),
        metaTypeData: this.metaTypeData(type),
      });
    }
  }

  protected metaTypeData(type: GraphQLType, metaType: MetaTypeData = {}): MetaTypeData {
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
    const isInputObjectType = TypeGuards.isInputObjectType(this.type);
    const typeNameField = `${StringUtils.indent(`__typename?: "${this.name}";\n`)}`;
    const scalarDataField = isInputObjectType ? "input" : "output";

    return (
      `export type ${this.name} = {\n` +
      `${isInputObjectType ? "" : typeNameField}` +
      `${this.pairs
        .map((pair) => {
          let { key, value, metaTypeData: { isNonNullable, isList, isScalar } = {} } = pair;

          if (!isNonNullable) {
            key += "?";
          }

          if (isScalar) {
            value = this._scalarPrimitiveTypeMap[value]?.[scalarDataField] || "any";
          }

          if (isList) {
            value += "[]";
          }

          return StringUtils.indent(`${this.keyValuePair(key, value)}`);
        })
        .join("")}` +
      `};\n\n`
    );
  }
}
