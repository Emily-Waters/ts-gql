import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery } from "graphql";

export async function introspectionLoader(gqlEndpoint: string) {
  const introspectionQuery = getIntrospectionQuery();

  const data: IntrospectionQuery = await fetch(gqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: introspectionQuery,
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data);

  return buildClientSchema(data);
}
