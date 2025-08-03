import { ASTNode, RuleContext, RuleListener } from '../types'

/**
 * 未使用变量检测规则
 * 检测代码中声明但未使用的变量
 * 已导出的变量被视为已使用
 */
export default {
    meta: {
        docs: 'disallow unused variables'
    },
    create(ctx: RuleContext): RuleListener {
        // 存储所有声明的变量
        const declared = new Set<string>();
        // 存储所有使用的变量
        const used = new Set<string>();
        // 存储变量声明节点信息，用于报告错误时定位
        const declaredInfo = new Map<string, ASTNode>();
        // 临时存储正在处理的变量声明
        const declaredUsed = new Set<string>();
        // 存储所有导出的变量
        const exportedVars = new Set<string>();

        return {
            // 处理变量声明
            VariableDeclarator(node) {
                declared.add(node.id.name)
                declaredUsed.add(node.id.name)
                declaredInfo.set(node.id.name, node)
            },
            // 处理标识符（变量使用）
            Identifier(node) {
                if (!declaredUsed.has(node.name)) {
                    used.add(node.name)
                }
            },
            // 处理导出声明
            ExportNamedDeclaration(node) {
                // 处理 export const/let/var 声明
                if (node.declaration && node.declaration.type === 'VariableDeclaration') {
                    const declarations = node.declaration.declarations;
                    for (const decl of declarations) {
                        if (decl.id && decl.id.type === 'Identifier') {
                            // 将导出的变量添加到已使用集合中
                            used.add(decl.id.name);
                            exportedVars.add(decl.id.name);
                        }
                    }
                }
            },

            // 变量声明处理完成后的清理
            'VariableDeclarator:exit'(node) {
                if (node.id && node.id.type === 'Identifier') {
                    declaredUsed.delete(node.id.name);
                }
            },

            // 程序结束时检查未使用的变量
            'Program:exit'() {
                for (const name of declared) {
                    if (!used.has(name)) {
                        ctx.report({
                            node: declaredInfo.get(name)!,
                            message: `'${name}' is declared but never used`,
                            ruleId: 'no-unused-vars'
                        });
                    }
                }
            }
        };
    }
};