import { AST, ASTNode, RuleListener } from "../types";

/**
 * 遍历AST树并应用监听器的方法
 * @param ast 抽象语法树
 * @param listener 规则监听器
 */
export function traverse(ast: AST, listener: RuleListener) {
  // 递归遍历AST节点
  const visit = (node: ASTNode, parent: ASTNode | null = null) => {
    if (!node || typeof node !== "object") return;

    // 如果节点有type属性，并且listener中有对应的处理方法，则调用该方法
    if (node.type && typeof listener[node.type] === "function") {
      listener[node.type](node);
    }

    // 处理特殊的退出事件
    // 例如：'Program:exit'会在Program节点的所有子节点都被访问后调用
    if (node.type && typeof listener[`${node.type}:exit`] === "function") {
      // 先遍历所有子节点
      for (const key in node) {
        if (key === "type" || key === "loc" || key === "range") continue;

        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((item) => visit(item, node));
        } else {
          visit(child, node);
        }
      }

      // 然后调用退出方法
      listener[`${node.type}:exit`](node);
      return; // 已经处理过子节点，不需要再次处理
    }

    // 遍历所有子节点
    for (const key in node) {
      if (key === "type" || key === "loc" || key === "range") continue;

      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach((item) => visit(item, node));
      } else {
        visit(child, node);
      }
    }
  };

  // 开始遍历AST
  visit(ast);
}