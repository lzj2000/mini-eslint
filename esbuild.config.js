const { build } = require("esbuild");

async function runBuild() {
  try {
    await build({
      entryPoints: ["src/cli.ts"],
      bundle: true,
      outfile: "dist/cli.js",
      platform: "node", // 指定为 Node.js 平台
      format: "cjs", // 使用 CommonJS 格式
      external: [], // 可以指定不打包的外部依赖
    });
  } catch (error) {
    process.exit(1);
  }
}

runBuild();
