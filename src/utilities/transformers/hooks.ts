export class HookTransformer {
  public transform(values: Record<string, string>[]) {
    let output = `import * as Apollo from '@apollo/client';\n`;
    output += `import * as QueryDocuments`;

    for (const value of values) {
      const [key, operation] = Object.entries(value)[0];

      output += `export function use${key}Query(
  baseOptions?: Apollo.QueryHookOptions<
    QueryDocuments.AccountInfoQuery,
    QueryDocuments.AccountInfoQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    CodegenTypes.AccountInfoQuery,
    CodegenTypes.AccountInfoQueryVariables
  >(AccountInfoDocument, options);
}`;
    }
  }
}
