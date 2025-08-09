export interface RuleContext {
  report: (data: { node: ASTNode; message: string; ruleId: string; line: number; column: number }) => void;
  options?: string[];
  getSourceCode: () => string;
}

export interface RuleListener {
  [key: string]: (node: ASTNode) => void;
}

export interface Rule {
  meta: {
    name: string;
    docs: string;
    schema: any;
  };
  create(ctx: RuleContext): RuleListener;
}

export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface ASTNode {
  type: string;
  loc?: SourceLocation;
  range?: [number, number];
  [key: string]: any;
}

export interface AST extends ASTNode {
  body: ASTNode[];
  sourceType?: string;
  comments?: any[];
  tokens?: any[];
}

export interface LintError {
  node: ASTNode;
  message: string;
  ruleId: string;
  filePath: string;
  severity?: "error" | "warn";
  line: number;
  column: number;
}

export interface config {
  rules: Rules;
}

export interface Rules {
  [ruleName: string]: RuleConfiguration;
}

export type RuleConfiguration = "off" | "warn" | "error" | [string, ...any[]];
