import { GraphQLSchema } from "graphql";
import { GraphQLSchemaNormalizedConfig } from "graphql/type/schema";

export class BaseTransformer {
  constructor(
    protected _schema: GraphQLSchema,
    protected _config: GraphQLSchemaNormalizedConfig,
  ) {}
}
