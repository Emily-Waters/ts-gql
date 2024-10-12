import * as esbuild from "esbuild";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const esbuildCommonConfig: esbuild.BuildOptions = {
  entryPoints: ["./src/bin.ts", "./src/index.ts"],
  bundle: true,
  platform: "node",
  outdir: "dist",
  external: ["ts-node"],
};

main();

async function main() {
  const args = await yargs<["-w"]>(hideBin(process.argv) as any)
    .alias("-w", "--watch")
    .parse();

  if (args.watch || args.w) {
    let ctx = await esbuild.context({
      ...esbuildCommonConfig,
    });

    await ctx.watch();
    console.log("watching...");
  } else {
    await esbuild.build({
      ...esbuildCommonConfig,
    });
  }
}
