import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Linter } from '../src/linter';


// 创建临时测试文件
function createTempFile(fileName: string, content: string): string {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// 清理临时文件
function cleanupTempFiles() {
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// 创建临时配置文件
function createTempConfig(config: any): string {
  const configPath = path.join(__dirname, 'temp', '.minlintrc.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return configPath;
}

describe('Linter类测试', () => {
  beforeEach(() => {
    cleanupTempFiles();
  });

  afterEach(() => {
    cleanupTempFiles();
  });

  describe('构造函数和初始化', () => {
    it('应该正确初始化Linter实例', async () => {
      const testFile = createTempFile('test.js', 'const a = 1;');
      const linter = new Linter({ files: [testFile] });

      expect(linter).toBeInstanceOf(Linter);

      const errors = await linter.getErrors();
      expect(Array.isArray(errors)).toBe(true);
    });

    it('应该使用默认配置当没有提供配置文件时', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const linter = new Linter({ files: [testFile] });

      const errors = await linter.getErrors();
      // 默认配置包含semi规则，检测缺少分号
      expect(errors.some(error => error.ruleId === 'semi')).toBe(true);
    });

    it('应该正确加载JSON配置文件', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const config = {
        rules: {
          'semi': 'off',
          'no-unused-vars': 'error'
        }
      };
      const configFile = createTempConfig(config);

      const linter = new Linter({ files: [testFile], configFile });
      const errors = await linter.getErrors();

      // semi规则关闭，无分号错误
      expect(errors.some(error => error.ruleId === 'semi')).toBe(false);
      // 有未使用变量错误
      expect(errors.some(error => error.ruleId === 'no-unused-vars')).toBe(true);
    });

    it('应该在配置文件不存在时使用默认配置', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const nonExistentConfig = path.join(__dirname, 'nonexistent.json');

      const linter = new Linter({ files: [testFile], configFile: nonExistentConfig });
      const errors = await linter.getErrors();

      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('文件扫描和解析', () => {
    it('应该正确扫描单个JavaScript文件', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const linter = new Linter({ files: [testFile] });

      const errors = await linter.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      // 检查文件路径
      expect(errors[0].filePath).toContain('test.js');
      expect(path.basename(errors[0].filePath)).toBe(path.basename(testFile));
    });

    // 路径标准化辅助函数
    function normalizeFilePath(filePath: string): string {
      return path.resolve(filePath).replace(/\\/g, '/');
    }

    function containsFile(filePaths: string[], targetFile: string): boolean {
      const normalizedTarget = normalizeFilePath(targetFile);
      return filePaths.some(filePath => {
        const normalizedPath = normalizeFilePath(filePath);
        return normalizedPath.includes(path.basename(targetFile)) ||
          normalizedPath === normalizedTarget;
      });
    }

    it('应该正确扫描多个文件', async () => {
      const testFile1 = createTempFile('test1.js', 'const a = 1');
      const testFile2 = createTempFile('test2.js', 'const b = 2');

      const linter = new Linter({ files: [testFile1, testFile2] });
      const errors = await linter.getErrors();

      const filePaths = errors.map(error => error.filePath);
      expect(containsFile(filePaths, testFile1)).toBe(true);
      expect(containsFile(filePaths, testFile2)).toBe(true);
    });

    it('应该正确处理glob模式', async () => {
      createTempFile('glob1.js', 'const a = 1');
      createTempFile('glob2.js', 'const b = 2');

      // 使用绝对路径构建glob模式
      const tempDir = path.join(__dirname, 'temp');
      const globPattern = path.join(tempDir, '*.js').replace(/\\/g, '/');

      const linter = new Linter({ files: [globPattern] });
      const errors = await linter.getErrors();

      // 验证找到了两个文件的错误
      const uniqueFiles = [...new Set(errors.map(error => path.basename(error.filePath)))];
      expect(uniqueFiles).toContain('glob1.js');
      expect(uniqueFiles).toContain('glob2.js');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('应该正确处理JSX文件', async () => {
      const jsxContent = `
        import React from 'react';
        const Component = () => <div>Hello</div>
        export default Component;
      `;
      const testFile = createTempFile('test.jsx', jsxContent);

      const linter = new Linter({ files: [testFile] });
      const errors = await linter.getErrors();

      // 能够解析JSX文件
      expect(Array.isArray(errors)).toBe(true);
    });

    it('应该正确处理TypeScript文件', async () => {
      const tsContent = `
        interface User {
          name: string;
          age: number;
        }
        const user: User = { name: 'John', age: 30 }
      `;
      const testFile = createTempFile('test.ts', tsContent);

      const linter = new Linter({ files: [testFile] });
      const errors = await linter.getErrors();

      expect(Array.isArray(errors)).toBe(true);
    });

    it('应该正确处理语法错误', async () => {
      const invalidCode = 'const a = {';
      const testFile = createTempFile('invalid.js', invalidCode);

      const linter = new Linter({ files: [testFile] });

      // 语法错误不应导致程序崩溃
      await expect(linter.getErrors()).resolves.toBeDefined();
    });
  });

  describe('规则应用和错误检测', () => {
    it('应该正确设置错误严重级别', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const config = {
        rules: {
          'semi': 'warn',
          'no-unused-vars': 'error'
        }
      };
      const configFile = createTempConfig(config);

      const linter = new Linter({ files: [testFile], configFile });
      const errors = await linter.getErrors();

      const semiError = errors.find(error => error.ruleId === 'semi');
      const unusedVarError = errors.find(error => error.ruleId === 'no-unused-vars');

      expect(semiError?.severity).toBe('warn');
      expect(unusedVarError?.severity).toBe('error');
    });

    it('应该正确处理关闭的规则', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const config = {
        rules: {
          'semi': 'off',
          'no-unused-vars': 'off'
        }
      };
      const configFile = createTempConfig(config);

      const linter = new Linter({ files: [testFile], configFile });
      const errors = await linter.getErrors();

      expect(errors.length).toBe(0);
    });
  });

  describe('错误信息格式', () => {
    it('应该包含正确的错误信息格式', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const linter = new Linter({ files: [testFile] });

      const errors = await linter.getErrors();
      expect(errors.length).toBeGreaterThan(0);

      const error = errors[0];
      expect(error).toHaveProperty('node');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('ruleId');
      expect(error).toHaveProperty('filePath');
      expect(error).toHaveProperty('line');
      expect(error).toHaveProperty('column');
      expect(error).toHaveProperty('severity');

      expect(typeof error.message).toBe('string');
      expect(typeof error.ruleId).toBe('string');
      expect(typeof error.filePath).toBe('string');
      expect(typeof error.line).toBe('number');
      expect(typeof error.column).toBe('number');
      expect(['error', 'warn']).toContain(error.severity);
    });

    it('应该包含正确的位置信息', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const linter = new Linter({ files: [testFile] });

      const errors = await linter.getErrors();
      const error = errors[0];

      expect(error.line).toBeGreaterThan(0);
      expect(error.column).toBeGreaterThanOrEqual(0);
    });
  });

  describe('异步处理', () => {
    it('应该正确处理异步文件解析', async () => {
      const testFiles = [
        createTempFile('test1.js', 'const a = 1'),
        createTempFile('test2.js', 'const b = 2'),
        createTempFile('test3.js', 'const c = 3')
      ];

      const linter = new Linter({ files: testFiles });
      const errors = await linter.getErrors();

      // 处理所有文件
      const uniqueFiles = [...new Set(errors.map(error => error.filePath))];
      expect(uniqueFiles.length).toBe(3);
    });

    it('getErrors方法应该等待分析完成', async () => {
      const testFile = createTempFile('test.js', 'const a = 1');
      const linter = new Linter({ files: [testFile] });

      // 立即调用getErrors，等待分析完成
      const errors = await linter.getErrors();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理空文件', async () => {
      const testFile = createTempFile('empty.js', '');
      const linter = new Linter({ files: [testFile] });

      const errors = await linter.getErrors();
      expect(Array.isArray(errors)).toBe(true);
    });

    it('应该处理只有注释的文件', async () => {
      const testFile = createTempFile('comments.js', '// This is a comment\n/* Another comment */');
      const linter = new Linter({ files: [testFile] });

      const errors = await linter.getErrors();
      expect(Array.isArray(errors)).toBe(true);
    });

    it('应该处理不存在的文件模式', async () => {
      const nonExistentPattern = path.join(__dirname, 'nonexistent', '*.js');
      const linter = new Linter({ files: [nonExistentPattern] });

      const errors = await linter.getErrors();
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBe(0);
    });

    it('应该处理复杂的代码结构', async () => {
      const complexCode = `
        function fibonacci(n) {
          if (n <= 1) return n
          return fibonacci(n - 1) + fibonacci(n - 2)
        }
        
        class Calculator {
          constructor() {
            this.result = 0
          }
          
          add(a, b) {
            return a + b
          }
        }
        
        const calc = new Calculator()
        const fib5 = fibonacci(5)
        console.log(calc.add(fib5, 10))
      `;

      const testFile = createTempFile('complex.js', complexCode);
      const linter = new Linter({ files: [testFile] });

      const errors = await linter.getErrors();
      expect(Array.isArray(errors)).toBe(true);
    });
  });
});