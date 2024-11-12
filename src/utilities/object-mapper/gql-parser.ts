import fs from "fs/promises";
import path from "path";
import { cwd } from "process";

export async function parseGql() {
  const filePath = path.join(cwd(), "__test__", "gql", "schema.gql");

  const input = await fs.readFile(filePath, "utf-8");
  const operationType = /(mutation|query)/gi;

  const operations = [];

  const matchesRegexArr = input.matchAll(operationType);
  const matches = Array.from(matchesRegexArr);

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];

    operations.push(input.slice(match.index, nextMatch?.index || input.length));
  }

  const operationName = /(?:\s)([\w]*)/gi;
  const operationArgs = /(?:\()([^)]*)(?:\))/gi;
  const operationBody = /(?:\s*{)/gi;

  const combined = new RegExp(
    operationType.source + operationName.source + operationArgs.source + operationBody.source,
    "gim",
  );

  for (const operation of operations) {
    const type = operation.matchAll(operationType).next()?.value;
    const name = operation.matchAll(operationName).next()?.value;
    const args = operation.matchAll(operationArgs).next()?.value;

    if (type) {
      const typeStr = type[1];
      console.log(typeStr);
    }

    if (name) {
      const nameStr = name[1];
      console.log(nameStr);
    }

    if (args) {
      const argsStr = args[1];

      console.log(argsStr.match(/(\w+):([^,\n]*)/gi));
    }

    // console.log({ type, name, args });
    const matches = operation.matchAll(combined);

    for (const match of matches) {
      //   console.log(match);
    }
  }
}
