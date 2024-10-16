import { GraphQLArgument, GraphQLField, GraphQLType, GraphQLUnionType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { StringUtils } from "../string/string-utils";
import { BaseObjectType } from "./base";

export class DocumentType<T extends GraphQLField<any, any>> extends BaseObjectType<T> {
  private key: string;

  constructor(
    type: T,
    private specifier: string,
  ) {
    super(type);

    this.name = type.name;
    this.separator = "";
    this.eol = "\n";

    this.map();
  }

  private map() {
    this.key =
      `${this.specifier.toLowerCase()} ${StringUtils.capitalize(this.name)}` +
      `${this.buildArgs(this.type.args, (arg) => `$${arg.name}: ${arg.type}`)}`;

    const key = this.name + this.buildArgs(this.type.args, (arg) => `${arg.name}: $${arg.name}`);

    const pair = { key, value: "", metaTypeData: { isNonNullable: true } };

    this.buildFields(this.type.type, pair);

    this.pairs.push(pair);
  }

  private buildArgs(
    args: readonly GraphQLArgument[],
    keyValuePairCallback: (args: GraphQLArgument) => string,
  ) {
    if (args.length) {
      return `(${args.map(keyValuePairCallback).join(", ")})`;
    }

    return "";
  }

  private buildFields(type: GraphQLType, pair: (typeof this.pairs)[number]) {
    const baseType = this.findBaseType(type);

    if (TypeGuards.isObjectType(baseType)) {
      pair.value = [];

      const fields = baseType.getFields();

      for (const fieldKey in fields) {
        const field = fields[fieldKey];
        const baseField = this.findBaseType(field);
        const nestedPair = { key: field.name, value: "", metaTypeData: { isNonNullable: true } };

        if (TypeGuards.isObjectType(baseField)) {
          this.buildFields(baseField, nestedPair);
        } else if (TypeGuards.isUnion(baseField)) {
          this.buildFragment(baseField, nestedPair);
        }
        pair.value.push(nestedPair);
      }
    } else {
      pair.value = "";
    }
  }

  private buildFragment(field: GraphQLUnionType, pair: (typeof this.pairs)[number]) {
    const types = field.getTypes();

    pair.value = [];

    for (const type of types) {
      const nestedPair = {
        key: `... on ${type.name}`,
        value: [],
        metaTypeData: { isNonNullable: true },
      };

      this.buildFields(type, nestedPair);

      pair.value.push(nestedPair);
    }
  }

  public toString() {
    return `${this.key}${this.buildPairs()}`;
  }
}
