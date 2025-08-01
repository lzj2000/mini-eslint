export type RuleContext = any

export interface RuleListener {
    [key: string]: (node: any) => void
}

export interface Rule {
    meta: {
        docs: string
    }
    create(ctx: RuleContext): RuleListener
}