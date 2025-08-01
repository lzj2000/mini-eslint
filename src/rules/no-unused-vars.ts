import { RuleContext, RuleListener } from '../types'
export default {
    meta: { docs: 'disallow unused variables' },
    create(ctx: RuleContext): RuleListener {
        const declared = new Set<string>()
        const used = new Set<string>()
        const declaredInfo = new Map<string, any>()
        const declaredUsed = new Set<string>()
        return {
            VariableDeclarator(node) {
                declared.add(node.id.name)
                declaredUsed.add(node.id.name)
                declaredInfo.set(node.id.name, node)
            },
            Identifier(node) {
                if (!declaredUsed.has(node.name)) {
                    used.add(node.name)
                }
            },
            'VariableDeclarator:exit'(node) {
                declaredUsed.delete(node.id.name)
            },
            'Program:exit'() {
                for (const name of declared) {
                    if (!used.has(name)) {
                        console.log('Program:exit', name);
                        ctx.report({
                            node: declaredInfo.get(name),
                            message: `'${name}' is declared but never used`
                        })
                    }
                }
            }

        }
    }
}