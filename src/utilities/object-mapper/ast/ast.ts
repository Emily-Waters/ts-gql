import { GraphQLArgument, GraphQLField } from "graphql";
import * as ts from "typescript";
import { Config } from "../../..";
import { TypeGuards } from "../../../guards/type-guards";
import { GraphQLTypes, MetaType } from "../../../types";
import { Format } from "../../format/variable-names";
import { metaType } from "../../meta-type";
import { OperationKeywords } from "../constants";
import { ASTHelpers } from "./helpers";

export class ASTBuilder {
  private ts = ASTHelpers;
  private _scalars: NonNullable<Config["scalarMap"]> = {};
  private _cache = new Map<string, ts.Node>();

  constructor(scalars: Config["scalarMap"] = {}) {
    this._scalars = scalars;
  }

  build(type: GraphQLTypes, exportable = false) {
    let name, alias;

    const meta = metaType(type);
    const cached = this.getCachedValue(meta);

    if (cached) {
      alias = cached;
      name = this.getName(meta);
    } else if (TypeGuards.meta.isScalar(meta) && TypeGuards.scalars.isNative(meta.type)) {
      return;
    } else if (TypeGuards.meta.isEnum(meta)) {
      name = this.getName(meta);
      alias = this.enumToEnumDeclaration(meta);
    } else {
      name = this.getName(meta);
      alias = this.toTypeDeclaration(meta, exportable);
    }

    if (name && alias) this._cache.set(name, alias);
  }

  private toTypeDeclaration(meta: MetaType, exportable: boolean) {
    const name = this.getName(meta);
    const node = this.buildType(meta, false);
    const description = meta.type.description;

    return this.ts.typeAlias({
      name,
      node,
      options: { exportable },
      description,
    });
  }

  private enumToEnumDeclaration(meta: MetaType<"enum">) {
    const values = meta.type.getValues().map((v) => v);
    return this.ts.literal.enum(this.getName(meta), values);
  }

  private getCachedValue(meta: MetaType) {
    return this._cache.get(this.getName(meta));
  }

  private getName(meta: MetaType) {
    return meta.type.name;
  }

  private buildType(meta: MetaType, reference: boolean): ts.TypeNode {
    switch (true) {
      case TypeGuards.meta.isEnum(meta):
        return this.enumToTypeNode(meta);
      case TypeGuards.meta.isInputObject(meta):
        return this.inputObjectToTypeNode(meta, reference);
      case TypeGuards.meta.isInterface(meta):
        return this.interfaceToTypeNode(meta, reference);
      case TypeGuards.meta.isObject(meta):
        return this.objectToTypeNode(meta, reference);
      case TypeGuards.meta.isScalar(meta):
        return this.scalarToTypeNode(meta);
      case TypeGuards.meta.isUnion(meta):
        return this.unionToTypeNode(meta, reference);
      default:
        throw new Error(`Unsupported type: ${JSON.stringify(meta, null, 2)}`);
    }
  }

  private enumToTypeNode(meta: MetaType<"enum">) {
    return this.reference(meta);
  }

  private inputObjectToTypeNode(meta: MetaType<"input">, reference: boolean) {
    if (reference) return this.reference(meta);
    return this._object({ meta: meta });
  }

  private interfaceToTypeNode(meta: MetaType<"interface">, reference: boolean) {
    return this.reference(meta);
  }

  private objectToTypeNode(meta: MetaType<"object">, reference: boolean) {
    if (reference) return this.reference(meta);

    const operation = OperationKeywords[this.getName(meta)];
    if (operation) this.operationTypesToTypeNode(meta, operation);

    return this._object({ meta, typeName: true });
  }

  private buildObjectProperties(
    fields: GraphQLField<any, any>[] | ReadonlyArray<GraphQLArgument>,
    __typename?: ts.PropertySignature,
  ) {
    const properties = [];

    if (__typename) properties.push(__typename);

    properties.push(
      ...fields.map((field) => {
        const type = metaType(field.type);

        const key = field.name;
        const node = this.buildType(type, true);
        const optional = !type.isNonNullable;
        const description = field.description;

        return this.ts.property({ key, node, optional, description });
      }),
    );

    return properties;
  }

  private operationTypesToTypeNode(meta: MetaType<"object">, operation: string) {
    const fields = meta.type.getFields();

    for (const key in fields) {
      const field = fields[key];

      const resultName = Format.result(key, operation);
      const typename = this.ts.__typename(this.getName(meta));
      this.buildOperationProperties(resultName, [field], typename);

      if (field.args) {
        const inputName = Format.input(key, operation);
        if (this._cache.has(inputName)) continue;
        this.buildOperationProperties(inputName, field.args);
      }
    }
  }

  private buildOperationProperties(
    name: string,
    fields: GraphQLField<any, any>[] | ReadonlyArray<GraphQLArgument>,
    typename?: ts.PropertySignature,
  ) {
    const properties = this.buildObjectProperties(fields, typename);
    const node = this.ts.literal.object(properties);
    const alias = this.ts.typeAlias({ name, node, options: { exportable: true } });
    this._cache.set(name, alias);
  }

  private unionToTypeNode(meta: MetaType<"union">, reference: boolean) {
    if (reference) return this.reference(meta);
    const values = meta.type.getTypes().map((t) => this.buildType(metaType(t), reference));
    return this.ts.literal.union(values);
  }

  private scalarToTypeNode(meta: MetaType<"scalar">) {
    switch (true) {
      case TypeGuards.scalars.String(meta.type):
        return this.ts.keyword.string;
      case TypeGuards.scalars.Int(meta.type):
        return this.ts.keyword.number;
      case TypeGuards.scalars.Float(meta.type):
        return this.ts.keyword.number;
      case TypeGuards.scalars.Boolean(meta.type):
        return this.ts.keyword.boolean;
      default:
        if (this._scalars[this.getName(meta)]) {
          return this.ts.reference({ name: this._scalars[this.getName(meta)] });
        } else if (TypeGuards.scalars.ID(meta.type)) {
          return this.ts.keyword.string;
        }

        return this.ts.keyword.any;
    }
  }

  private reference(meta: MetaType) {
    const ref = this.ts.reference({ name: this.getName(meta) });
    if (meta.isList) return this.ts.literal.array(ref);
    return ref;
  }

  private _object({ meta, typeName }: { meta: MetaType<"object" | "input">; typeName?: boolean }) {
    let typename;

    const fields = Object.values(meta.type.getFields());
    if (typeName) typename = this.ts.__typename(this.getName(meta));
    const properties = this.buildObjectProperties(fields, typename);
    return this.ts.literal.object(properties);
  }

  toString() {
    return Array.from(this._cache.values())
      .map((node) => this.ts.print(node))
      .join("\n\n");
  }
}
