import { ASTNode } from "../types";

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
