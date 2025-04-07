import emdash from "@emilywaters/emdash";
import { GraphQLArgument, GraphQLField, GraphQLType, GraphQLUnionType } from "graphql";
import { TypeGuards } from "../../guards/type-guards";
import { getBaseType } from "../find-base-type";
import { BaseObjectMap } from "./base";

export class DocumentObjectMap<T extends GraphQLField<any, any>> extends BaseObjectMap<T> {
  constructor(
    type: T,
    private operation: string,
  ) {
    const fieldName = emdash.string.capitalize(type.name);
    const operationName = emdash.string.capitalize(operation);
    super(type, `${fieldName}${operationName}Document`);

    this._type = "document";
    this.separator = "";
    this.eol = "\n";
    this.declaration = `export const ${this.name} = `;

    this.map();
  }

  private map() {
    const pair: (typeof this.pairs)[number] = {
      key: `${this.type.name}${this.buildArgs(this.type.args, (arg) => `${arg.name}: $${arg.name}`)}`,
      value: "",
      metaTypeData: { isNonNullable: true },
      description: this.type.description,
    };

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
    const baseType = getBaseType(type);

    if (TypeGuards.isObject(baseType)) {
      pair.value = [];

      const fields = baseType.getFields();

      for (const fieldKey in fields) {
        const field = fields[fieldKey];
        const baseField = getBaseType(field);
        const nestedPair: (typeof this.pairs)[number] = {
          key: field.name,
          value: "",
          metaTypeData: { isNonNullable: true },
          description: field.description,
        };

        if (TypeGuards.isObject(baseField)) {
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
      const nestedPair: (typeof this.pairs)[number] = {
        key: `... on ${type.name}`,
        value: [],
        metaTypeData: { isNonNullable: true },
        description: type.description,
      };

      this.buildFields(type, nestedPair);

      pair.value.push(nestedPair);
    }
  }

  public toString() {
    return `${this.declaration}gql\`\n${
      `${this.operation.toLowerCase()} ${emdash.string.capitalize(this.name)}` +
      `${this.buildArgs(this.type.args, (arg) => `$${arg.name}: ${arg.type}`)}`
    }${this.buildPairs()}\`;`;
  }
}
