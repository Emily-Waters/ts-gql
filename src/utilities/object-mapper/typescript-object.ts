import { GraphQLInputObjectType, GraphQLObjectType, GraphQLType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseObjectMap, MetaTypeData } from "./base";

export class TypeScriptObjectMap<
  T extends GraphQLObjectType | GraphQLInputObjectType,
> extends BaseObjectMap<T> {
  constructor(type: T) {
    super(type);

    this._type = "object";

    this.separator = ": ";
    this.eol = ";\n";
    this.declaration = `export type ${this.name} =`;

    this.map();
  }

  protected map() {
    if (TypeGuards.isObjectType(this.type)) {
      this.pairs.push({
        key: "__typename",
        value: `"${this.name}"`,
        description: this.type.description,
      });
    }

    const fields = this.type.getFields();

    for (const fieldKey in fields) {
      const field = fields[fieldKey];

      this.pairs.push({
        key: field.name,
        value: StringUtils.stripNonAlpha(field.type.toString()),
        metaTypeData: this.metaTypeData(field.type),
        description: field.description,
      });
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
}
