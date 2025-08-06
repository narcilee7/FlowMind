# Editor内核架构 - 重构版

## 概述

Editor内核已经重构为清爽、可扩展的架构，基于**Adapter Factory + 插件模式**设计。移除了所有无用代码，统一了事件系统，实现了完整的插件架构。

## 核心架构

```
EditorCore (React组件)
├── EditorCore (核心类)
│   ├── EditorAdapterFactory (适配器工厂)
│   ├── EditorPluginManager (插件管理器)
│   └── 统一事件系统
├── Adapters (适配器层)
│   └── TipTapAdapter (富文本适配器)
├── Plugins (插件层)
│   ├── AIAssistantPlugin (AI助手)
│   ├── MarkdownPlugin (Markdown支持)
│   ├── ShortcutPlugin (快捷键)
│   ├── AutoSavePlugin (自动保存)
│   └── TOCPlugin (目录生成)
└── Types (类型定义)
    ├── EditorCore.ts (核心类型)
    ├── EditorAdapter.ts (适配器接口)
    ├── EditorPlugin.ts (插件接口)
    ├── EditorAST.ts (AST数据结构)
    └── EditorType.ts (编辑器类型)
```

## 核心特性

### 1. 清爽架构
- **单一职责**: 每个模块职责明确，互不干扰
- **无无用代码**: 移除了所有重复和不完整的实现
- **统一接口**: 所有适配器实现相同的接口

### 2. 可扩展性
- **插件系统**: 完整的事件驱动的插件架构
- **适配器工厂**: 支持动态注册和切换适配器
- **AST数据结构**: 统一的文档状态管理

### 3. 事件系统
- **统一事件**: 所有组件通过统一的事件系统通信
- **类型安全**: 完整的TypeScript类型定义
- **异步支持**: 支持异步事件处理

## 核心组件

### EditorCore
编辑器核心类，负责：
- 适配器生命周期管理
- 事件系统管理
- 文档状态管理
- 插件协调

### EditorAdapterFactory
适配器工厂，负责：
- 适配器注册和创建
- 类型检查和验证
- 动态适配器切换

### EditorPluginManager
插件管理器，负责：
- 插件生命周期管理
- 插件注册和注销
- 插件间通信协调

## 适配器

### TipTapAdapter
基于TipTap的富文本编辑器适配器，提供：
- 完整的富文本编辑功能
- Markdown语法支持
- 表格、代码块、图片等高级功能
- 实时协作支持

## 插件系统

### AIAssistantPlugin
AI助手插件，提供：
- 智能文本补全
- AI续写和改写
- 内容摘要生成
- 快捷键支持

### MarkdownPlugin
Markdown支持插件，提供：
- Markdown语法解析
- 自动链接检测
- 表格语法支持
- 数学公式支持

### ShortcutPlugin
快捷键插件，提供：
- 全局快捷键支持
- 自定义快捷键注册
- 快捷键冲突检测
- 快捷键帮助显示

### AutoSavePlugin
自动保存插件，提供：
- 定时自动保存
- 失焦时保存
- 本地备份管理
- 服务器同步

### TOCPlugin
目录生成插件，提供：
- 自动目录生成
- 目录导航
- 目录统计
- 多格式导出

## 使用方法

### 基本使用

```tsx
import { EditorCore } from './components/Editor/core/EditorCore'

function App() {
  return (
    <EditorCore
      initialContent="开始写作..."
      onContentChange={(content) => console.log('内容变化:', content)}
    />
  )
}
```

### 插件配置

```tsx
// 在EditorPluginManager中配置插件
const pluginManager = new EditorPluginManager(core)

// 注册自定义插件
pluginManager.register(new CustomPlugin({
  options: {
    enableFeature: true
  }
}))
```

### 适配器切换

```tsx
// 动态切换编辑器类型
await core.switchAdapter(EditorType.GRAPH, SceneTemplate.RESEARCH)
```

## 开发指南

### 创建新适配器

1. 实现`EditorAdapter`接口
2. 在`EditorAdapterFactory`中注册
3. 添加相应的类型定义

### 创建新插件

1. 继承`BasePlugin`类
2. 实现必要的抽象方法
3. 在`EditorPluginManager`中注册

### 事件处理

```tsx
// 监听事件
core.on('content:change', (content) => {
  console.log('内容变化:', content)
})

// 触发事件
core.emit('custom:event', { data: 'value' })
```

## 性能优化

- **防抖处理**: 内容变化和TOC更新使用防抖
- **懒加载**: 插件按需加载
- **内存管理**: 及时清理事件监听器和定时器
- **AST缓存**: 智能的AST更新机制

## 未来扩展

- **图谱编辑器**: 知识图谱可视化编辑
- **Canvas编辑器**: 白板式自由编辑
- **表格编辑器**: 数据库视图编辑
- **时间线编辑器**: 时间线式内容组织

## 总结

重构后的Editor内核具有以下优势：

1. **架构清晰**: 职责分离，易于理解和维护
2. **高度可扩展**: 插件系统支持无限功能扩展
3. **性能优秀**: 优化的渲染和事件处理机制
4. **类型安全**: 完整的TypeScript支持
5. **易于测试**: 模块化设计便于单元测试

这个架构为FlowMind的AI原生编辑器提供了坚实的基础，支持未来的功能扩展和性能优化。 