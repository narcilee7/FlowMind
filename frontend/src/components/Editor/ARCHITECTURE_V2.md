# FlowMind 编辑器架构 V2 - 多编辑器支持

## 概述

FlowMind 编辑器 V2 是一个全新的多编辑器架构，专门为知识管理产品设计。与传统的代码编辑器不同，这个架构支持三种不同的编辑器类型，每种都针对特定的内容创作需求进行了优化。

## 三种编辑器类型

### 1. Markdown 编辑器
- **目标产品**：类似 Typora 的所见即所得 Markdown 编辑器
- **特点**：
  - 支持标准 Markdown 语法
  - 实时预览和编辑模式切换
  - 数学公式渲染（KaTeX）
  - Mermaid 图表支持
  - 语法高亮和自动补全
- **适用场景**：技术文档、学术论文、博客写作

### 2. 富文本编辑器
- **目标产品**：类似 Notion 的块级编辑器
- **特点**：
  - 块级编辑架构
  - 多种内容块类型（段落、标题、列表、代码等）
  - 拖拽排序和重新组织
  - 协作编辑支持
  - 丰富的格式化选项
- **适用场景**：知识库、项目管理、协作文档

### 3. Canvas 编辑器
- **目标产品**：类似 Obsidian Canvas 的图形化编辑器
- **特点**：
  - 节点和连接线系统
  - 缩放和平移操作
  - 网格对齐和吸附
  - 多种节点类型（文本、图片、链接等）
  - 思维导图和知识图谱
- **适用场景**：思维导图、知识图谱、项目规划

## 架构设计

### 1. 适配器模式
每种编辑器类型都有独立的适配器实现：

```typescript
interface EditorAdapter {
  type: EditorType
  create(element: HTMLElement, options: EditorOptions): Promise<void>
  destroy(): void
  getValue(): string
  setValue(value: string): void
  // ... 其他方法
}
```

### 2. 统一状态管理
所有编辑器类型共享统一的状态管理：

```typescript
interface EditorState {
  content: string
  editorType: EditorType
  editorMode: EditorMode
  // 编辑器特定状态
  markdownState?: MarkdownEditorState
  richTextState?: RichTextEditorState
  canvasState?: CanvasEditorState
}
```

### 3. 插件系统
插件可以针对特定编辑器类型或全局工作：

```typescript
interface EditorPlugin {
  id: string
  supportedEditorTypes: EditorType[]
  activate(context: EditorContextValue): void
  deactivate(): void
}
```

## 核心组件

### EditorProvider
提供统一的上下文和状态管理：

```tsx
<EditorProvider
  initialContent="# Hello World"
  initialEditorType={EditorType.MARKDOWN}
  initialEditorMode={EditorMode.EDIT}
>
  <EditorCoreV2 />
</EditorProvider>
```

### EditorCoreV2
主要的编辑器组件，支持类型切换：

```tsx
<EditorCoreV2
  showToolbar={true}
  showStatusBar={true}
  onContentChange={handleContentChange}
  onEditorTypeChange={handleTypeChange}
  onEditorModeChange={handleModeChange}
/>
```

### EditorManager
管理编辑器实例的创建和切换：

```typescript
const manager = new EditorManager()
await manager.createEditor(element, EditorType.MARKDOWN, options)
await manager.switchEditorType(EditorType.RICH_TEXT)
```

## 使用示例

### 基础使用
```tsx
import { EditorProvider, EditorCoreV2, EditorType } from './components/Editor'

function App() {
  return (
    <EditorProvider initialEditorType={EditorType.MARKDOWN}>
      <EditorCoreV2 />
    </EditorProvider>
  )
}
```

### 完整演示
```tsx
import { MultiEditorDemo } from './components/Editor'

function App() {
  return <MultiEditorDemo />
}
```

### 自定义适配器
```typescript
import { EditorAdapterFactory, EditorType } from './components/Editor'

class CustomAdapter implements EditorAdapter {
  // 实现适配器接口
}

EditorAdapterFactory.registerAdapter(EditorType.CUSTOM, CustomAdapter)
```

## 技术特点

### 1. 类型安全
- 完整的 TypeScript 类型定义
- 编辑器类型和模式的类型检查
- 插件接口的类型约束

### 2. 性能优化
- 按需加载编辑器适配器
- 状态更新的事务性处理
- 事件系统的防抖和节流

### 3. 可扩展性
- 插件化的功能扩展
- 自定义编辑器类型支持
- 主题和样式的可定制性

### 4. 用户体验
- 无缝的编辑器类型切换
- 统一的快捷键和操作
- 响应式设计和移动端支持

## 与 V1 架构的区别

| 特性 | V1 (Monaco) | V2 (多编辑器) |
|------|-------------|---------------|
| 编辑器类型 | 单一代码编辑器 | 三种编辑器类型 |
| 目标用户 | 开发者 | 知识工作者 |
| 内容类型 | 代码 | 文档、图表、思维导图 |
| 架构模式 | 单一适配器 | 多适配器工厂 |
| 状态管理 | 简单状态 | 复杂分层状态 |
| 插件系统 | 基础插件 | 类型感知插件 |

## 迁移指南

### 从 V1 迁移到 V2

1. **更新导入**
```typescript
// V1
import { MonacoEditor } from './components/Editor'

// V2
import { EditorProvider, EditorCoreV2 } from './components/Editor'
```

2. **更新组件使用**
```tsx
// V1
<MonacoEditor value={content} onChange={setContent} />

// V2
<EditorProvider initialContent={content}>
  <EditorCoreV2 onContentChange={setContent} />
</EditorProvider>
```

3. **更新状态管理**
```typescript
// V1
const [content, setContent] = useState('')

// V2
const { state, setContent } = useEditor()
```

## 未来规划

### 短期目标
- [ ] 完善 Markdown 编辑器的预览功能
- [ ] 增强富文本编辑器的块类型
- [ ] 优化 Canvas 编辑器的性能
- [ ] 添加更多插件示例

### 长期目标
- [ ] 支持更多编辑器类型（表格、数据库等）
- [ ] 实现跨编辑器类型的内容转换
- [ ] 添加云端协作功能
- [ ] 支持移动端编辑器

## 贡献指南

1. **开发新适配器**
   - 实现 `EditorAdapter` 接口
   - 添加类型定义
   - 编写测试用例
   - 更新文档

2. **开发新插件**
   - 实现 `EditorPlugin` 接口
   - 指定支持的编辑器类型
   - 添加配置选项
   - 提供使用示例

3. **改进现有功能**
   - 遵循现有架构模式
   - 保持向后兼容性
   - 更新相关文档
   - 添加测试覆盖

## 许可证

MIT License 