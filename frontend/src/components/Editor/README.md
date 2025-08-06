# FlowMind 编辑器架构设计

## 概述

FlowMind 编辑器采用模块化、插件化的架构设计，支持多种编辑器后端，提供丰富的扩展能力。该架构遵循 React 设计哲学，具有良好的可扩展性和可维护性。

## 架构特点

### 1. 分层架构
- **表现层**：React 组件，负责 UI 渲染和用户交互
- **业务层**：编辑器核心逻辑，状态管理和事件处理
- **适配层**：编辑器后端适配器，支持多种编辑器引擎
- **插件层**：功能扩展系统，支持动态加载和卸载

### 2. 插件化设计
- 核心功能与扩展功能分离
- 支持动态插件加载和卸载
- 插件间通过事件系统通信
- 统一的插件接口规范

### 3. 适配器模式
- 支持多种编辑器后端（Monaco、CodeMirror、Ace 等）
- 统一的编辑器接口抽象
- 易于切换和扩展编辑器引擎

## 目录结构

```
src/components/Editor/
├── core/                    # 核心模块
│   ├── EditorProvider.tsx   # 编辑器上下文提供者
│   └── EditorAdapter.ts     # 编辑器适配器接口
├── adapters/                # 适配器实现
│   └── MonacoAdapter.ts     # Monaco 编辑器适配器
├── plugins/                 # 插件实现
│   ├── MarkdownPlugin.ts    # Markdown 支持插件
│   └── AIAssistantPlugin.ts # AI 助手插件
├── organisms/               # 复杂组件
│   ├── EditorCore.tsx       # 编辑器核心组件
│   ├── EditorWorkspace.tsx  # 原工作区组件
│   └── EditorWorkspaceV2.tsx # 新工作区组件
├── molecules/               # 分子组件
│   ├── EditorToolbar.tsx    # 编辑器工具栏
│   ├── TableOfContents.tsx  # 目录组件
│   └── FileTree.tsx         # 文件树组件
├── config/                  # 配置管理
│   └── EditorConfig.ts      # 编辑器配置
└── README.md               # 本文档
```

## 核心概念

### 1. EditorProvider
编辑器状态管理的核心，提供：
- 统一的状态管理
- 事件系统
- 插件注册机制
- 编辑器操作方法

### 2. EditorAdapter
编辑器后端适配器，抽象不同编辑器引擎的差异：
- 统一的接口定义
- 事件映射
- 配置转换
- 方法适配

### 3. EditorPlugin
功能扩展的基础单元：
- 生命周期管理
- 命令注册
- 事件监听
- 快捷键绑定

## 使用方式

### 基础使用

```tsx
import { EditorProvider } from './core/EditorProvider'
import { EditorCore } from './organisms/EditorCore'

function App() {
  return (
    <EditorProvider initialContent="# Hello World">
      <EditorCore 
        adapter="monaco"
        plugins={['markdown', 'ai-assistant']}
      />
    </EditorProvider>
  )
}
```

### 完整工作区

```tsx
import { EditorWorkspaceV2 } from './organisms/EditorWorkspaceV2'

function App() {
  const [content, setContent] = useState('# Hello World')
  
  return (
    <EditorWorkspaceV2
      content={content}
      onContentChange={setContent}
      showPreview={true}
      showToc={true}
      showFileTree={true}
      plugins={['markdown', 'ai-assistant']}
      adapter="monaco"
    />
  )
}
```

## 插件开发

### 创建插件

```tsx
import { EditorPlugin, EditorContextValue } from '../core/EditorProvider'

export class MyPlugin implements EditorPlugin {
  id = 'my-plugin'
  name = 'My Plugin'
  version = '1.0.0'
  
  private context: EditorContextValue | null = null

  activate(context: EditorContextValue): void {
    this.context = context
    
    // 注册命令
    this.context.emit('registerCommand', {
      id: 'my-command',
      handler: () => this.myCommand()
    })
    
    // 注册事件监听
    this.context.subscribe('contentChanged', (content: string) => {
      this.handleContentChange(content)
    })
  }

  deactivate(): void {
    this.context = null
  }

  private myCommand(): void {
    console.log('My command executed')
  }

  private handleContentChange(content: string): void {
    console.log('Content changed:', content.length)
  }
}
```

### 注册插件

```tsx
// 在 EditorCore 中注册插件
const pluginMap = {
  'my-plugin': MyPlugin
}

plugins.forEach(pluginId => {
  const PluginClass = pluginMap[pluginId]
  if (PluginClass) {
    const pluginInstance = new PluginClass()
    registerPlugin(pluginInstance)
  }
})
```

## 适配器开发

### 创建适配器

```tsx
import { EditorAdapter, EditorOptions } from '../core/EditorAdapter'

export class MyEditorAdapter implements EditorAdapter {
  private editor: any = null

  async create(element: HTMLElement, options: EditorOptions): Promise<void> {
    // 创建编辑器实例
    this.editor = new MyEditor(element, this.convertOptions(options))
    
    // 绑定事件
    this.bindEvents()
  }

  destroy(): void {
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
  }

  getValue(): string {
    return this.editor?.getValue() || ''
  }

  setValue(value: string): void {
    this.editor?.setValue(value)
  }

  // ... 实现其他接口方法

  private convertOptions(options: EditorOptions): any {
    // 转换配置选项
    return {
      value: options.value,
      theme: options.theme,
      // ... 其他配置
    }
  }

  private bindEvents(): void {
    // 绑定编辑器事件
    this.editor.on('change', (content: string) => {
      this.emit('change', content)
    })
  }
}
```

### 注册适配器

```tsx
import { EditorRegistry } from '../core/EditorAdapter'

class MyEditorFactory implements EditorFactory {
  createAdapter(): EditorAdapter {
    return new MyEditorAdapter()
  }

  getSupportedLanguages(): string[] {
    return ['markdown', 'javascript']
  }

  getSupportedThemes(): string[] {
    return ['default', 'dark']
  }
}

EditorRegistry.register('my-editor', new MyEditorFactory())
```

## 配置管理

### 使用配置管理器

```tsx
import { editorConfigManager } from './config/EditorConfig'

// 获取配置
const config = editorConfigManager.getConfig()

// 更新配置
editorConfigManager.updateConfig({
  defaultFontSize: 18,
  enableAutoSave: false
})

// 监听配置变化
const unsubscribe = editorConfigManager.subscribe((config) => {
  console.log('Config changed:', config)
})
```

## 事件系统

### 事件类型

- `contentChanged`: 内容变化
- `cursorPositionChanged`: 光标位置变化
- `selectionChanged`: 选择变化
- `scrollChanged`: 滚动变化
- `editorFocused`: 编辑器获得焦点
- `editorBlurred`: 编辑器失去焦点

### 事件使用

```tsx
const { subscribe, emit } = useEditor()

// 监听事件
const unsubscribe = subscribe('contentChanged', (content: string) => {
  console.log('Content changed:', content)
})

// 发送事件
emit('customEvent', { data: 'value' })
```

## 性能优化

### 1. 组件优化
- 使用 React.memo 优化组件渲染
- 合理使用 useCallback 和 useMemo
- 避免不必要的重渲染

### 2. 插件优化
- 延迟加载插件
- 及时清理事件监听
- 避免插件间的循环依赖

### 3. 状态优化
- 合理分割状态
- 使用不可变数据结构
- 避免深层嵌套

## 扩展指南

### 1. 添加新功能
1. 创建插件类
2. 实现插件接口
3. 注册插件
4. 在配置中启用

### 2. 支持新编辑器
1. 创建适配器类
2. 实现适配器接口
3. 注册适配器工厂
4. 更新配置

### 3. 自定义主题
1. 在配置中添加主题定义
2. 在适配器中实现主题支持
3. 更新主题切换逻辑

## 最佳实践

### 1. 插件开发
- 保持插件独立性
- 使用事件系统通信
- 及时清理资源
- 提供清晰的文档

### 2. 适配器开发
- 实现完整的接口
- 正确处理事件映射
- 提供配置转换
- 处理错误情况

### 3. 组件开发
- 遵循单一职责原则
- 使用 TypeScript 类型
- 提供合理的默认值
- 支持自定义样式

## 故障排除

### 常见问题

1. **插件不生效**
   - 检查插件是否正确注册
   - 确认插件在配置中启用
   - 查看控制台错误信息

2. **适配器加载失败**
   - 检查适配器是否正确注册
   - 确认依赖是否正确安装
   - 查看网络请求状态

3. **性能问题**
   - 检查是否有内存泄漏
   - 确认事件监听是否正确清理
   - 使用性能分析工具

### 调试技巧

1. 启用调试模式
2. 查看事件日志
3. 检查状态变化
4. 使用 React DevTools

## 未来规划

### 短期目标
- 完善插件系统
- 优化性能
- 增加更多编辑器支持
- 改进错误处理

### 长期目标
- 支持协作编辑
- 集成更多 AI 功能
- 支持移动端
- 提供云端同步

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 编写测试
4. 提交 Pull Request

## 许可证

MIT License 