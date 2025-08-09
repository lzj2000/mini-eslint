import { ASTNode, config } from "../types";
export { traverse } from "./ast-utils";

export function getNodeLocation(node: ASTNode): {
  line: number;
  startColumn: number;
  endColumn: number;
} {
  if (node.loc && node.loc.start) {
    return {
      line: node.loc.start.line,
      startColumn: node.loc.start.column,
      endColumn: node.loc.end.column,
    };
  }

  return { line: 0, startColumn: 0, endColumn: 0 };
}

export function mergeConfigs(defaultConfig: config, userConfig: Partial<config>): config {
  // 创建默认配置的副本
  const result = { ...defaultConfig };

  // 如果用户配置为空，直接返回默认配置
  if (!userConfig) return result;

  // 遍历用户配置的所有属性
  for (const key in userConfig) {
    // 如果是规则配置，需要特殊处理
    if (key === 'rules' && userConfig.rules && defaultConfig.rules) {
      // 合并规则，以用户规则为主
      result.rules = { ...defaultConfig.rules, ...userConfig.rules };
    }
    // 对于其他配置项，直接使用用户配置覆盖默认配置
    else {
      result[key] = userConfig[key] as any;
    }
  }

  return result;
}