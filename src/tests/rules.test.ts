import { describe, it, expect } from 'vitest';
import * as espree from 'espree';
import { AST } from '../types';
import { traverse } from '../utils';
import Semi from '../rules/semi';
import NoUnusedVars from '../rules/no-unused-vars';

// 辅助函数：解析代码生成AST
function parseCode(code: string): AST {
    return espree.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        loc: true,
        range: true
    }) as AST;
}

// 辅助函数：创建模拟上下文
function createContext() {
    const errors: any[] = [];
    const sourceCode = new Map<string, string>();

    return {
        errors,
        context: {
            report: (data: any) => errors.push(data),
            getSourceCode: () => sourceCode.get('code') || '',
            options: [] as string[],


        },
        setSourceCode: (code: string) => sourceCode.set('code', code)
    };
}

describe('Semi规则测试', () => {
    it('应该检测出缺少分号的情况 (always模式)', () => {
        // 准备测试代码和上下文
        const code = 'const a = 1\nconst b = 2;';
        const { context, errors, setSourceCode } = createContext();
        setSourceCode(code);
        context.options = ['always'];

        // 创建规则监听器并应用到AST
        const listener = Semi.create(context);
        const ast = parseCode(code);
        traverse(ast, listener);

        // 验证结果
        expect(errors.length).toBe(1);
        expect(errors[0].message).toContain('Missing semicolon');
        expect(errors[0].ruleId).toBe('semi');
    });
    
    it('不应该检测缺少分号的情况 (always模式)', () => {
        // 准备测试代码和上下文 - 所有语句都有分号
        const code = 'const a = 1;\nconst b = 2;';
        const { context, errors, setSourceCode } = createContext();
        setSourceCode(code);
        context.options = ['always'];
        
        // 创建规则监听器并应用到AST
        const listener = Semi.create(context);
        const ast = parseCode(code);
        traverse(ast, listener);
        
        // 验证结果 - 不应该有错误
        expect(errors.length).toBe(0);
    });

    it('应该检测出多余分号的情况 (never模式)', () => {
        // 准备测试代码和上下文
        const code = 'const a = 1;\nconst b = 2';
        const { context, errors, setSourceCode } = createContext();
        setSourceCode(code);
        context.options = ['never'];

        // 创建规则监听器并应用到AST
        const listener = Semi.create(context);
        const ast = parseCode(code);
        traverse(ast, listener);

        // 验证结果
        expect(errors.length).toBe(1);
        expect(errors[0].message).toContain('Extra semicolon');
        expect(errors[0].ruleId).toBe('semi');
    });
    
    it('不应该检测多余分号的情况 (never模式)', () => {
        // 准备测试代码和上下文 - 所有语句都没有分号
        const code = 'const a = 1\nconst b = 2';
        const { context, errors, setSourceCode } = createContext();
        setSourceCode(code);
        context.options = ['never'];
        
        // 创建规则监听器并应用到AST
        const listener = Semi.create(context);
        const ast = parseCode(code);
        traverse(ast, listener);
        
        // 验证结果 - 不应该有错误
        expect(errors.length).toBe(0);
    });
});

describe('NoUnusedVars规则测试', () => {
    it('应该检测出未使用的变量', () => {
        // 准备测试代码和上下文
        const code = 'const a = 1; const b = 2; console.log(a);';
        const { context, errors, setSourceCode } = createContext();
        setSourceCode(code);

        // 创建规则监听器并应用到AST
        const listener = NoUnusedVars.create(context);
        const ast = parseCode(code);
        traverse(ast, listener);

        // 验证结果
        expect(errors.length).toBe(1);
        expect(errors[0].message).toContain("'b' is declared but never used");
        expect(errors[0].ruleId).toBe('no-unused-vars');
    });

    it('不应该报告已使用的变量', () => {
        // 准备测试代码和上下文
        const code = 'const a = 1; const b = 2; console.log(a, b);';
        const { context, errors, setSourceCode } = createContext();
        setSourceCode(code);

        // 创建规则监听器并应用到AST
        const listener = NoUnusedVars.create(context);
        const ast = parseCode(code);
        traverse(ast, listener);

        // 验证结果
        expect(errors.length).toBe(0);
    });

    it('不应该报告导出的变量', () => {
        // 准备测试代码和上下文
        const code = 'export const a = 1; const b = 2; console.log(b);';
        const { context, errors, setSourceCode } = createContext();
        setSourceCode(code);

        // 创建规则监听器并应用到AST
        const listener = NoUnusedVars.create(context);
        const ast = parseCode(code);
        traverse(ast, listener);

        // 验证结果
        expect(errors.length).toBe(0);
    });
});