import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // 忽略的文件
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".vite/**",
      ".cache/**",
      "*.log",
      "*.tmp",
      "*.temp",
      "posts/**",
      "public/content/**",
      ".vscode/**",
      ".idea/**",
      ".env*",
      "package-lock.json",
    ],
  },

  // JavaScript 推荐规则
  js.configs.recommended,

  // 所有 TypeScript 文件
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        Response: "readonly",
        Request: "readonly",
        URL: "readonly",
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react,
      "react-hooks": reactHooks,
      jsdoc,
      prettier,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // ==================== 代码长度限制 ====================
      "max-lines-per-function": [
        "warn",
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-lines": [
        "warn",
        {
          max: 400,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-len": [
        "warn",
        {
          code: 100,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
        },
      ],

      // ==================== JSDoc 规范 ====================
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: false,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          contexts: [
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportDefaultDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration > VariableDeclaration",
            "ExportNamedDeclaration > VariableDeclarator[init.type='ArrowFunctionExpression']",
            "ExportDefaultDeclaration > ArrowFunctionExpression",
          ],
        },
      ],
      "jsdoc/require-param": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-returns-description": "warn",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-types": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",

      // ==================== TypeScript 规范 ====================
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",

      // ==================== React 规范 ====================
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // ==================== 通用代码质量 ====================
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "no-throw-literal": "error",

      // ==================== Prettier 集成 ====================
      "prettier/prettier": "warn",

      // 关闭与 Prettier 冲突的规则
      ...prettierConfig.rules,
    },
  },

  // 脚本文件特殊规则
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "max-lines": ["warn", { max: 500 }],
    },
  },

  // 配置文件特殊规则
  {
    files: ["*.config.ts", "*.config.js", "*.config.cjs", "*.config.mjs"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "jsdoc/require-jsdoc": "off",
    },
  },
];
