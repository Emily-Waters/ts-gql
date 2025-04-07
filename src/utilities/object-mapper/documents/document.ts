import emdash from "@emilywaters/emdash";
import { GraphQLArgument, GraphQLField } from "graphql";
import { TypeGuards } from "../../../guards/type-guards";
import { DescriptionType, MetaType } from "../../../types";
import { Format } from "../../format/variable-names";
import { metaType } from "../../meta-type";

export type PairDataType = {
  key: string;
  value: string | PairDataType[];
  description?: DescriptionType;
};

export class DocumentObjectMap<T extends GraphQLField<any, any>> {
  private pairs: PairDataType[] = [];
  constructor(
    private type: T,
    private operation: string,
  ) {
    this.map();
  }

  private map() {
    const meta = metaType(this.type);

    const pair: PairDataType = {
      key: `${this.type.name}${this.buildArgs(this.type.args, (arg) => `${arg.name}: $${arg.name}`)}`,
      value: "",
    };

    this.buildFields(meta, pair);

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

  private buildFields(meta: MetaType, pair: PairDataType) {
    if (TypeGuards.meta.isObject(meta)) {
      pair.value = [];

      const fields = meta.type.getFields();

      for (const fieldKey in fields) {
        const field = fields[fieldKey];
        const meta = metaType(field);

        const nestedPair: PairDataType = {
          key: field.name,
          value: [],
          description: field.description,
        };

        if (TypeGuards.meta.isObject(meta)) {
          this.buildFields(meta, nestedPair);
        } else if (TypeGuards.meta.isUnion(meta)) {
          this.buildFragment(meta, nestedPair);
        }

        pair.value.push(nestedPair);
      }
    } else {
      pair.value = "";
    }
  }

  private buildFragment(meta: MetaType<"union">, pair: (typeof this.pairs)[number]) {
    const types = meta.type.getTypes();

    pair.value = [];

    for (const type of types) {
      const meta = metaType(type);
      const nestedPair: (typeof this.pairs)[number] = {
        key: `... on ${meta.type.name}`,
        value: [],
        description: meta.type.description,
      };

      this.buildFields(meta, nestedPair);

      pair.value.push(nestedPair);
    }
  }

  public buildPairs(depth: number) {
    return this._buildPairs(depth, this.pairs);
  }

  protected keyValuePair({ key, value }: PairDataType, depth = 0) {
    if (typeof value !== "string") {
      value = this._buildPairs(depth, value);
    }

    return `${key}${value}\n`;
  }

  private _buildPairs(depth: number = 0, pairs: PairDataType[]): string {
    if (!pairs.length) {
      return "";
    }

    return (
      ` {\n` +
      pairs.reduce((acc, pair) => {
        let value = this.keyValuePair(pair, depth + 2);
        value = emdash.string.indent(value, depth + 2);

        return `${acc}${value}`;
      }, "") +
      emdash.string.indent("}", depth)
    );
  }

  public toString() {
    const documentName = Format.document(this.type.name, this.operation);

    return `export const ${documentName} = gql\`\n${
      `  ${this.operation.toLowerCase()} ${emdash.string.capitalize(this.type.name)}` +
      `${this.buildArgs(this.type.args, (arg) => `$${arg.name}: ${arg.type}`)}`
    }${this.buildPairs(2)}\n\`;`;
  }
}
