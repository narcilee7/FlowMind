# SCSS 主题系统架构设计

## 架构优势
- **性能更好**：编译时生成 CSS，无运行时开销
- **调试友好**：清晰的类名和 CSS 变量
- **类型安全**：通过 TypeScript 定义主题接口
- **易于维护**：模块化的 SCSS 文件结构
- **主题切换**：通过 CSS 变量实现动态主题切换

## 文件结构
```
src/styles/
├── scss/
│   ├── _variables.scss          # 设计令牌变量
│   ├── _mixins.scss             # 通用混入
│   ├── _functions.scss          # SCSS 函数
│   ├── _themes/
│   │   ├── _light.scss          # 亮色主题
│   │   ├── _dark.scss           # 暗色主题
│   │   └── _system.scss         # 系统主题
│   ├── _components/
│   │   ├── _button.scss         # 按钮样式
│   │   ├── _input.scss          # 输入框样式
│   │   ├── _panel.scss          # 面板样式
│   │   └── _toolbar.scss        # 工具栏样式
│   ├── _utilities.scss          # 工具类
│   └── main.scss                # 主入口文件
├── theme/
│   ├── types.ts                 # TypeScript 类型定义
│   ├── tokens.ts                # 设计令牌
│   └── ThemeProvider.tsx        # React 主题提供者
└── index.scss                   # 全局样式入口
```

## 核心概念

### 1. CSS 变量系统
- 使用 CSS 变量定义主题颜色、间距、字体等
- 支持动态主题切换
- 提供回退值确保兼容性

### 2. 设计令牌
- 统一的设计变量管理
- 类型安全的 TypeScript 接口
- 自动生成 CSS 变量

### 3. 组件样式
- 基于设计令牌的组件样式
- 支持变体和状态
- 响应式设计支持

### 4. 主题切换
- 通过 CSS 类名切换主题
- 平滑的过渡动画
- 系统主题自动检测
