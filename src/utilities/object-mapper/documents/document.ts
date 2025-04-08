import emdash from "@emilywaters/emdash";
import { GraphQLArgument, GraphQLField } from "graphql";
import { TypeGuards } from "../../../guards/type-guards";
import { DescriptionType, MetaType } from "../../../types";
import { Format } from "../../format/variable-names";
import { metaType } from "../../meta-type";

export type PairDataType = {
  key: string;
  value: PairDataType[];
  description?: DescriptionType;
};

export class DocumentObjectMap<T extends GraphQLField<any, any>> {
  private pairs: PairDataType = { key: "", value: [] };
  constructor(
    private type: T,
    private operation: string,
  ) {
    this.map();
  }

  private createPair(key: string): PairDataType {
    return { key, value: [] };
  }

  private map() {
    const meta = metaType(this.type);
    const key = `${this.type.name}${this.buildArgs(this.type.args, (arg) => `${arg.name}: $${arg.name}`)}`;
    this.mapPair(meta, key, this.pairs);
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
      const fields = meta.type.getFields();

      for (const fieldKey in fields) {
        const field = fields[fieldKey];
        const meta = metaType(field);

        this.mapPair(meta, field.name, pair);
      }
    } else if (TypeGuards.meta.isUnion(meta)) {
      this.buildUnionFragments(meta, pair);
    }
  }

  private buildUnionFragments(meta: MetaType<"union">, pair: PairDataType) {
    const types = meta.type.getTypes();

    for (const type of types) {
      const meta = metaType(type);
      this.mapPair(meta, `... on ${meta.type.name}`, pair);
    }
  }

  private mapPair(meta: MetaType, key: string, parent: PairDataType) {
    const pair = this.createPair(key);
    this.buildFields(meta, pair);
    parent.value.push(pair);
  }

  private printPairs(pairs: PairDataType[], indent = 2): string {
    if (!pairs.length) {
      return "";
    }

    return (
      ` {\n` +
      pairs.reduce((acc, pair) => {
        let value = pair.key;

        if (Array.isArray(pair.value)) {
          value += this.printPairs(pair.value, indent + 2);
        } else {
          value += pair.value;
        }

        return `${acc}${emdash.string.indent(value, indent + 2)}\n`;
      }, "") +
      emdash.string.indent("}", indent)
    );
  }

  public toString() {
    const documentName = Format.document(this.type.name, this.operation);

    return `export const ${documentName} = gql\`\n${
      `  ${this.operation.toLowerCase()} ${emdash.string.capitalize(this.type.name)}` +
      `${this.buildArgs(this.type.args, (arg) => `$${arg.name}: ${arg.type}`)}`
    }${this.printPairs(this.pairs.value)}\n\`;`;
  }
}
