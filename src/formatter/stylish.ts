import chalk from "chalk";
import { LintError } from "../types";

/**
 * 给定一个单词和计数，如果计数不是1，则添加s
 */
function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

/**
 * Stylish格式化器
 */
export function stylish(errors: LintError[]): void {
  if (errors.length === 0) {
    console.log(chalk.green("✓ No problems found"));
    return;
  }

  // 按文件分组错误
  const errorsByFile = errors.reduce<Record<string, LintError[]>>(
    (acc, error) => {
      if (!acc[error.filePath]) {
        acc[error.filePath] = [];
      }
      acc[error.filePath].push(error);
      return acc;
    },
    {}
  );

  // 统计错误和警告的数量
  let errorCount = 0;
  let warningCount = 0;

  // 遍历每个文件的错误
  for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
    console.log(`${chalk.underline(filePath)}`);
    
    // 对文件中的错误按行号排序
    fileErrors.sort((a, b) => a.line - b.line || a.column - b.column);

    for (const error of fileErrors) {
      const location = `${error.line}:${error.column}`;
      const ruleName = error.ruleId || "unknown-rule";
      const severity = error.severity || "error";

      // 根据错误级别设置不同的颜色
      const severityColor = severity === "error" ? chalk.red : chalk.yellow;
      const severityText = severity === "error" ? "error" : "warning";

      // 更新计数
      if (severity === "error") {
        errorCount++;
      } else {
        warningCount++;
      }

      console.log(
        `  ${location}  ` +
        `${severityColor(severityText)}  ` +
        `${error.message}  ` +
        `${chalk.gray(ruleName)}`
      );
    }
    console.log(); // 添加空行分隔不同文件的错误
  }

  // 显示总结信息
  const total = errorCount + warningCount;
  const summary = [
    `✖ ${total} ${pluralize("problem", total)}`,
    `(${errorCount} ${pluralize("error", errorCount)},`,
    `${warningCount} ${pluralize("warning", warningCount)})`
  ].join(" ");

  const summaryColor = errorCount > 0 ? chalk.red : chalk.yellow;
  console.log(summaryColor(summary));
}