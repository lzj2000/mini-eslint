import { glob } from "glob";
import * as espree from "espree";
import fs from "fs";
import path from "path";

import noUnusedVars from "./rules/no-unused-vars";
import { Rule } from "./types";

/**
 * 代码检查器类
 * 负责扫描、解析和分析 JavaScript/TypeScript 文件
 */
export class Linter {
  /** 输入的文件模式列表 */
  private filePatterns: string[];
  /** 规则列表 */
  private rules: Rule[];
  /** 错误信息列表 */
  private errors: any[]; // 初始化为空数组

  /**
   * 构造函数
   * @param options 配置选项
   * @param options.files 要检查的文件模式数组
   */
  constructor(options: { files: string[] }) {
    this.filePatterns = options.files;
    this.errors = [];
    this.initRules();
    this.scanAndParseFiles();
  }

  private initRules() {
    this.rules = [
      noUnusedVars
    ];
  }

  /**
   * 扫描并解析文件
   * 根据文件模式查找匹配的文件，然后解析生成 AST
   */
  async scanAndParseFiles() {
    let allMatchedFiles: string[] = [];

    // 遍历每个文件模式，查找匹配的文件
    for (const pattern of this.filePatterns) {
      try {
        const matchedFiles = await glob(pattern, {
          ignore: "node_modules/**", // 忽略 node_modules 目录
          absolute: false, // 使用相对路径
        });
        allMatchedFiles.push(...matchedFiles);
      } catch (error) {
        console.error(`处理文件模式 "${pattern}" 时出错:`, error);
      }
    }

    // 去重处理（避免重复的文件）
    const uniqueFiles = [...new Set(allMatchedFiles)];
    console.log(uniqueFiles);

    // 解析所有找到的文件
    await this.parseMultipleFiles(uniqueFiles);
  }

  /**
   * 批量解析多个文件
   * @param files 要解析的文件路径数组
   */
  async parseMultipleFiles(files: string[]) {
    for (const file of files) {
      try {
        await this.parseSingleFile(file);
      } catch (error) {
        console.error(`解析文件 ${file} 时出错:`, error);
      }
    }
  }

  /**
   * 解析单个文件生成 AST
   * @param filePath 文件路径
   * @returns 解析后的 AST 对象
   */
  async parseSingleFile(filePath: string) {
    try {
      // 读取文件内容
      const sourceCode = fs.readFileSync(filePath, "utf-8");

      // 根据文件扩展名确定文件类型
      const fileExtension = path.extname(filePath);
      const isJSXFile = fileExtension === ".jsx" || fileExtension === ".tsx";

      // 配置 Espree 解析选项
      const parserOptions = {
        ecmaVersion: "latest" as const, // 使用最新的 ECMAScript 版本
        sourceType: "module" as const, // 支持 ES6 模块语法
        ecmaFeatures: {
          jsx: isJSXFile, // 是否支持 JSX 语法
          globalReturn: false, // 不允许全局 return 语句
          impliedStrict: true, // 隐式严格模式
        },
        range: true, // 包含节点的字符位置范围信息
        loc: true, // 包含行列位置信息
        comments: true, // 包含注释信息
        tokens: true, // 包含 token 信息
      };

      // 使用 Espree 解析源代码生成 AST
      const abstractSyntaxTree = espree.parse(sourceCode, parserOptions);

      console.log(`✓ 成功解析 ${filePath}`);

      // 分析生成的 AST
      await this.analyzeAbstractSyntaxTree(abstractSyntaxTree, filePath);

      return abstractSyntaxTree;
    } catch (error) {
      // 处理不同类型的解析错误
      if (error instanceof SyntaxError) {
        console.error(`✗ 语法错误 ${filePath}:`, error.message);
      } else {
        console.error(`✗ 解析错误 ${filePath}:`, error);
      }
      throw error;
    }
  }

  /**
   * 分析抽象语法树
   * 在这里应用各种 lint 规则对 AST 进行静态分析
   * @param ast 抽象语法树对象
   * @param filePath 文件路径
   */
  async analyzeAbstractSyntaxTree(ast: any, filePath: string) {
    // TODO: 在这里实现具体的 AST 分析逻辑
    // 可以遍历 AST 节点，应用各种代码检查规则
    console.log(`开始分析 ${filePath} 的抽象语法树...`);

    try {
      // 应用所有规则
      for (const rule of this.rules) {
        const listener = rule.create({
          report: (data) => {
            this.errors.push({ ...data, filePath })
          }
        });
        this.traverse(ast, listener);
      }
      console.log(`分析 ${filePath} 的抽象语法树完成`);
    } catch (error) {
      console.error(`分析 ${filePath} 的抽象语法树时出错:`, error);
    }
    // 打印错误信息
    this.printErrors();
  }

  traverse(ast: any, listener: any) {
    // 递归遍历AST节点
    const visit = (node: any, parent: any = null) => {
      if (!node || typeof node !== 'object') return;

      // 如果节点有type属性，并且listener中有对应的处理方法，则调用该方法
      if (node.type && typeof listener[node.type] === 'function') {
        listener[node.type](node);
      }

      // 处理特殊的退出事件
      // 例如：'Program:exit'会在Program节点的所有子节点都被访问后调用
      if (node.type && typeof listener[`${node.type}:exit`] === 'function') {
        // 先遍历所有子节点
        for (const key in node) {
          if (key === 'type' || key === 'loc' || key === 'range') continue;

          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(item => visit(item, node));
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
        if (key === 'type' || key === 'loc' || key === 'range') continue;

        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(item => visit(item, node));
        } else {
          visit(child, node);
        }
      }
    };

    // 开始遍历AST
    visit(ast);
  }

  /**
   * 打印所有错误信息
   */
  printErrors() {
    for (const error of this.errors) {
      console.log(`[${error.filePath}] ${error.message}`);
    }
  }
}
