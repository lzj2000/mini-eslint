export interface RuleContext {
    report: (data: {
        node: ASTNode;
        message: string;
        ruleId: string;
    }) => void;
}

export interface RuleListener {
    [key: string]: (node: ASTNode) => void
}

export interface Rule {
    meta: {
        docs: string
    }
    create(ctx: RuleContext): RuleListener
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
}