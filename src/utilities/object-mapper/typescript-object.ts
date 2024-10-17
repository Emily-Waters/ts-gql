import { GraphQLInputObjectType, GraphQLObjectType, GraphQLType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseType, MetaTypeData } from "./base";

export class TypeScriptObjectType<
  T extends GraphQLObjectType | GraphQLInputObjectType,
> extends BaseType<T> {
  constructor(type: T) {
    super(type);

    this.name = type.name;
    this.separator = ": ";
    this.eol = ";\n";

    this.declaration = `export type ${this.name} =`;

    this.map();
  }

  protected map() {
    if (TypeGuards.isObjectType(this.type)) {
      this.pairs.push({ key: "__typename", value: `"${this.name}"` });
    }

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
