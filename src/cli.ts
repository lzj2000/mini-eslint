import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";

import { version } from "../package.json";
import { Linter } from "./linter";

const program = new Command();

// 程序标题
console.log(chalk.bold.cyan("\n=== MiniESLint ===") + " 轻量级代码检查工具\n");

program
  .name("mini-eslint")
  .description("一个轻量级代码检查工具")
  .version(version, "-v, --version", "显示版本号");

program
  .argument(
    "[files...]",
    '要检查的文件或glob模式（默认: "src/**/*.{js,ts,jsx,tsx}"）'
  )
  .option('-c, --config <path>', '配置文件路径（默认: ".minlintrc.{json,js}"）')
  .action(async (files: string[], options: any) => {
    try {
      // 处理配置文件路径
      let configFile = options.config;
      if (!configFile) {
        const defaultConfigPaths = [
          path.join(process.cwd(), '.minlintrc.json'),
          path.join(process.cwd(), '.minlintrc.js')
        ];
        for (const configPath of defaultConfigPaths) {
          if (fs.existsSync(configPath)) {
            configFile = configPath;
            break;
          }
        }
      }

      if (files.length === 0) {
        files = ["src/**/*.{js,ts,jsx,tsx}"];
        // 检查src目录是否存在
        if (!fs.existsSync(path.join(process.cwd(), "src"))) {
          console.log(
            chalk.yellow("注意: 'src' 目录不存在，将检查当前目录下的所有JS文件")
          );
          files = ["**/*.{js,ts,jsx,tsx}"];
        }
      }

      const linter = new Linter({
        files,
        configFile
      });
    } catch (error) {
      console.error(error);
    }
  });

// 解析命令行参数
program.parse(process.argv);
