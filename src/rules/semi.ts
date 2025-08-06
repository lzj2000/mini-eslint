import { ASTNode, RuleContext, RuleListener } from "../types";
import { getNodeLocation } from "../utils";

/**
 * 分号检测规则
 * 检测代码中分号的使用是否符合配置要求
 */
export default {
  meta: {
    name: "semi",
    docs: "Require or disallow semicolons instead of ASI",
    schema: {
      enum: ["always", "never"],
      default: "always",
    },
  },
  create(ctx: RuleContext): RuleListener {
    const defaultConfig = ctx.options?.[0] || "always";
    const isSemicolonRequired = defaultConfig === "always";
    const sourceCode = ctx.getSourceCode();
    const types = [
      "VariableDeclaration", // 变量声明: const a = 1;
      "ExpressionStatement", // 表达式语句: console.log();
      "ReturnStatement", // 返回语句: return value;
      "ThrowStatement", // 抛出语句: throw new Error();
      "BreakStatement", // 中断语句: break;
      "ContinueStatement", // 继续语句: continue;
      "ImportDeclaration", // 导入语句: import { a } from 'b';
      "ExportNamedDeclaration", // 命名导出: export { a };
      "ExportDefaultDeclaration", // 默认导出: export default a;
      "ExportAllDeclaration", // 全部导出: export * from 'module';
    ];

    // 检查分号的通用函数
    function checkSemicolon(node: ASTNode) {
      const lastToken = sourceCode.charAt(node.end - 1);
      const hasSemicolon = lastToken === ";";

      const { line, endColumn } = getNodeLocation(node);
      if (isSemicolonRequired && !hasSemicolon) {
        // 缺少分号：报告应该添加分号的位置（语句结束位置）
        ctx.report({
          node: node,
          message: `Missing semicolon.`,
          ruleId: "semi",
          line: line,
          column: endColumn,
        });
      } else if (!isSemicolonRequired && hasSemicolon) {
        // 多余分号：报告分号本身的位置
        ctx.report({
          node: node,
          message: `Extra semicolon.`,
          ruleId: "semi",
          line: line,
          column: endColumn,
        });
      }
    }

    // 动态生成监听器对象
    const listeners: RuleListener = {};
    types.forEach((type) => {
      listeners[type] = checkSemicolon;
    });
    return listeners;
  },
};
