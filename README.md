# Mini ESLint

一个轻量级的 JavaScript/TypeScript 代码检查工具，基于 ESTree AST 实现，支持自定义规则和配置。

## 功能特性

### 🚀 核心功能

- **多文件支持**：支持单个文件、多个文件和 glob 模式匹配
- **多语言支持**：支持 JavaScript (.js)、TypeScript (.ts)、JSX (.jsx) 文件
- **自定义配置**：支持 JSON 配置文件，可自定义规则和严重级别
- **异步处理**：高效的异步文件解析和分析
- **错误报告**：详细的错误信息，包含文件路径、行号、列号等

### 📋 内置规则

- **semi**：分号检测规则，检查分号的使用是否符合配置要求
- **no-unused-vars**：未使用变量检测，识别声明但未使用的变量（已导出变量除外）

### ⚙️ 配置选项

- 规则级别：`"off"` | `"warn"` | `"error"`
- 支持 `.minlintrc.json` 配置文件
- 默认配置：`no-unused-vars: "error"`, `semi: "warn"`

## 安装

```bash
npm install mini-eslint
```

## 使用方法

### 命令行使用

```bash
# 检查默认文件模式
minlint

# 检查指定文件
minlint src/index.js

# 检查多个文件
minlint src/**/*.js src/**/*.ts

# 使用自定义配置文件
minlint -c .minlintrc.json src/**/*.js

# 显示版本信息
minlint -v
```

### 编程式使用

```javascript
import {Linter} from "mini-eslint";

// 基本使用
const linter = new Linter({
  files: ["src/**/*.js"],
});

const errors = await linter.getErrors();
console.log(errors);

// 使用自定义配置
const linter = new Linter({
  files: ["src/**/*.js"],
  configFile: ".minlintrc.json",
});
```

## 配置文件

创建 `.minlintrc.json` 文件：

```json
{
  "rules": {
    "semi": "warn",
    "no-unused-vars": "error"
  }
}
```

### 规则配置

#### semi 规则

检测分号使用：

- `"always"`（默认）：要求使用分号
- `"never"`：禁止使用分号

```json
{
  "rules": {
    "semi": ["warn", "always"]
  }
}
```

#### no-unused-vars 规则

检测未使用的变量：

- 检测声明但未使用的变量
- 已导出的变量被视为已使用
- 支持函数参数、类成员等

## 错误信息格式

每个错误包含以下信息：

```typescript
interface LintError {
  node: ASTNode; // AST 节点
  message: string; // 错误描述
  ruleId: string; // 规则名称
  filePath: string; // 文件路径
  severity: "error" | "warn"; // 严重级别
  line: number; // 行号
  column: number; // 列号
}
```

## 支持的文件类型

- **JavaScript** (`.js`)
- **TypeScript** (`.ts`)
- **JSX** (`.jsx`)
- **TSX** (`.tsx`)

## 开发

### 项目结构

```
mini-eslint/
├── src/
│   ├── linter.ts      # 核心 lint 逻辑
│   ├── rules/         # 规则实现
│   ├── config.ts      # 配置解析
│   ├── utils.ts       # 工具函数
│   ├── types.ts       # 类型定义
├── tests/             # 测试用例
├── package.json
├── tsconfig.json
├── README.md
```

### 构建和测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建项目
npm run build

# 开发模式（监听文件变化）
npm run watch
```

### 技术栈

- **解析器**：Espree（ESTree 兼容的 JavaScript 解析器）
- **文件匹配**：glob
- **构建工具**：esbuild
- **测试框架**：Vitest
- **命令行**：Commander.js
- **样式输出**：Chalk

## 扩展开发

### 添加新规则

1. 在 `src/rules/` 目录下创建新规则文件
2. 实现规则接口：

```typescript
export default {
  meta: {
    name: "rule-name",
    docs: "Rule description",
    schema: {},
  },
  create(ctx: RuleContext): RuleListener {
    return {
      // AST 节点访问器
      NodeType(node) {
        // 规则逻辑
        ctx.report({
          node,
          message: "Error message",
          ruleId: "rule-name",
          line: node.loc.start.line,
          column: node.loc.start.column,
        });
      },
    };
  },
};
```

3. 在 `src/rules/index.ts` 中注册新规则
