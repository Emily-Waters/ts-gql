import ts from "typescript";
import { DescriptionType } from "../../../types";

export class ASTHelpers {
  private static ts = ts.factory;

  static typeAlias({
    name,
    node,
    comments,
    options = {
      exportable: false,
    },
  }: {
    name: string;
    node: ts.TypeNode;
    options?: {
      exportable?: boolean;
    };
    comments?: {
      description?: DescriptionType;
      deprecation?: DescriptionType;
    };
  }) {
    const modifiers = [];

    if (options.exportable) {
      modifiers.push(this.ts.createModifier(ts.SyntaxKind.ExportKeyword));
    }

    const alias = this.ts.createTypeAliasDeclaration(
      modifiers,
      this.ts.createIdentifier(name),
      undefined,
      node,
    );

    this.comment(alias, comments);

    return alias;
  }

  static print(node: ts.Node) {
    const printer = ts.createPrinter();
    const sourceFile = ts.createSourceFile("temp.ts", "", ts.ScriptTarget.Latest);
    return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  }

  static property({
    key,
    node,
    comments,
    optional = false,
  }: {
    key: string;
    node: ts.TypeNode;
    comments?: {
      description?: DescriptionType;
      deprecation?: DescriptionType;
    };
    optional?: boolean;
  }) {
    const property = this.ts.createPropertySignature(
      undefined,
      this.ts.createIdentifier(key),
      optional ? this.optional() : undefined,
      node,
    );

    this.comment(property, comments);

    return property;
  }

  static comment(
    node: ts.Node,
    comments?: { description?: DescriptionType; deprecation?: DescriptionType },
  ) {
    if (comments && (comments.deprecation || comments?.description)) {
      const { deprecation, description } = comments;

      ts.setSyntheticLeadingComments(node, [
        {
          kind: ts.SyntaxKind.MultiLineCommentTrivia,
          text: `* ${this.formatMultilineComment([description, `${deprecation ? `@deprecated ${deprecation}` : ""}`])} `,
          pos: -1,
          end: -1,
          hasTrailingNewLine: true,
        },
      ]);
    }
  }

  private static formatMultilineComment(values: DescriptionType[]) {
    const filtered = values.filter(Boolean);

    if (!filtered.length) {
      return;
    } else if (filtered.length === 1) {
      return filtered[0];
    } else {
      return filtered.map((str) => `* ${str}`).join("\n");
    }
  }

  static reference({ name, args }: { name: string; args?: ts.TypeNode[] }): ts.TypeReferenceNode {
    return this.ts.createTypeReferenceNode(name, args);
  }

  static optional() {
    return this.ts.createToken(ts.SyntaxKind.QuestionToken);
  }

  static stringLiteral(value: string) {
    return this.ts.createStringLiteral(value);
  }

  static literal = {
    string: (value: string) => this.ts.createStringLiteral(value),
    number: (value: number) => this.ts.createNumericLiteral(value.toString()),
    object: (properties?: ts.TypeElement[]) => this.ts.createTypeLiteralNode(properties),
    union: (nodes: ts.TypeNode[]) => this.ts.createUnionTypeNode(nodes),
    enum: (name: string, nodes: { name: string; value: string }[]) =>
      this.ts.createEnumDeclaration(
        undefined,
        name,
        nodes.map((node) => this.ts.createEnumMember(node.name, this.stringLiteral(node.value))),
      ),
    array: (node: ts.TypeNode) => this.ts.createArrayTypeNode(node),
  };

  static keyword = {
    string: this.ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    number: this.ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
    boolean: this.ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
    any: this.ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
  };

  static __typename(name: string) {
    return this.property({
      key: "__typename",
      node: this.ts.createLiteralTypeNode(this.ts.createStringLiteral(name)),
      optional: true,
    });
  }
}
