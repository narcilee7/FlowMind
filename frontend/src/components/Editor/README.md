# Editor内核架构 - 真正的多形态编辑器

## 概述

重新设计的Editor内核是一个**真正的多形态编辑器内核**，而不是富文本编辑器框架。核心设计理念是：**AST作为通信核心，适配器只负责视图渲染，命令系统处理编辑逻辑**。

## 核心架构

```
Editor Core (真正的内核)
├── Document State (统一的文档状态)
│   ├── AST (多形态抽象语法树)
│   ├── Selection (跨视图选择状态)
│   └── History (操作历史)
├── Command System (命令系统)
│   ├── Insert Commands
│   ├── Transform Commands
│   └── View Commands
├── View Adapters (纯视图适配器)
│   ├── RichTextView (富文本视图)
│   ├── GraphView (图谱视图)
│   ├── CanvasView (Canvas视图)
│   ├── TableView (表格视图)
│   └── TimelineView (时间线视图)
└── Plugin System (业务插件)
    ├── AI Plugins
    ├── Export Plugins
    └── Collaboration Plugins
```

## 核心特性

### 1. AST作为通信核心
- **统一数据结构**：支持富文本、图谱、Canvas、表格、时间线等多种节点类型
- **跨视图共享**：所有视图共享同一个AST，只是渲染方式不同
- **类型安全**：完整的TypeScript类型定义，支持所有节点类型

### 2. 视图适配器分离
- **纯视图渲染**：适配器只负责将AST渲染为特定视图
- **不处理编辑逻辑**：编辑逻辑由命令系统统一处理
- **视图特定功能**：每种视图有自己的特定功能（如图谱布局、Canvas工具等）

### 3. 命令驱动架构
- **统一命令系统**：所有编辑操作通过命令执行
- **可撤销/重做**：命令系统天然支持操作历史
- **跨视图操作**：命令可以在不同视图间执行

## AST数据结构

### 基础节点结构
```typescript
interface BaseNode {
    id: string                    // 唯一标识符
    type: string                  // 节点类型
    position: Position            // 位置信息
    metadata?: NodeMetadata       // 元数据
    children?: ASTNode[]          // 子节点
    parent?: string               // 父节点ID
}
```

### 支持的节点类型

#### 富文本节点
- `paragraph` - 段落
- `heading` - 标题
- `text` - 文本
- `bold`, `italic`, `underline` - 格式化
- `codeBlock` - 代码块
- `table` - 表格
- 等等...

#### 图谱节点
- `graphNode` - 图谱节点
- `graphEdge` - 图谱边
- `graphGroup` - 图谱组

#### Canvas节点
- `shape` - 形状
- `image` - 图片
- `text` - 文本
- `path` - 路径
- `connector` - 连接线

#### 表格节点
- `table` - 表格
- `tableRow` - 表格行
- `tableCell` - 表格单元格
- `tableHeader` - 表格头部

#### 时间线节点
- `timeline` - 时间线
- `timelineItem` - 时间线项
- `milestone` - 里程碑

#### AI节点
- `aiBlock` - AI生成块
- `aiSuggestion` - AI建议
- `aiCompletion` - AI补全

#### 媒体节点
- `video` - 视频
- `audio` - 音频
- `embed` - 嵌入内容

## 视图适配器

### 基础视图适配器
```typescript
interface ViewAdapter {
    // 基础属性
    type: EditorType
    sceneTemplate: SceneTemplate
    
    // 生命周期
    create(element: HTMLElement, options: ViewAdapterOptions): Promise<void>
    destroy(): void
    
    // 视图渲染
    render(ast: DocumentAST): void
    update(ast: DocumentAST): void
    updateNode(nodeId: string, node: ASTNode): void
    removeNode(nodeId: string): void
    addNode(node: ASTNode, parentId?: string, index?: number): void
    
    // 选择状态
    setSelection(selection: Selection): void
    getSelection(): Selection
    
    // 视图控制
    focus(): void
    blur(): void
    isFocused(): boolean
    
    // 视图事件
    onNodeClick(callback: (nodeId: string, event: MouseEvent) => void): void
    onSelectionChange(callback: (selection: Selection) => void): void
    onViewChange(callback: (viewData: any) => void): void
    
    // 视图工具
    scrollToNode(nodeId: string): void
    zoomIn(): void
    zoomOut(): void
    resetZoom(): void
    fitToView(): void
}
```

### 特定视图适配器

#### 富文本视图适配器
```typescript
interface RichTextViewAdapter extends ViewAdapter {
    // 富文本特有方法
    insertText(text: string, position?: number): void
    deleteText(start: number, end: number): void
    formatText(start: number, end: number, format: TextFormat): void
    insertNode(node: ASTNode, position?: number): void
    
    // 富文本事件
    onTextChange(callback: (text: string) => void): void
    onFormatChange(callback: (format: TextFormat) => void): void
}
```

#### 图谱视图适配器
```typescript
interface GraphViewAdapter extends ViewAdapter {
    // 图谱特有方法
    addGraphNode(node: ASTNode, position?: { x: number; y: number }): void
    addEdge(edge: ASTNode): void
    removeGraphNode(nodeId: string): void
    removeEdge(edgeId: string): void
    updateNodePosition(nodeId: string, position: { x: number; y: number }): void
    
    // 图谱布局
    applyLayout(layout: GraphLayout): void
    autoLayout(): void
    centerOnNode(nodeId: string): void
    
    // 图谱事件
    onNodeDrag(callback: (nodeId: string, position: { x: number; y: number }) => void): void
    onEdgeClick(callback: (edgeId: string, event: MouseEvent) => void): void
}
```

#### Canvas视图适配器
```typescript
interface CanvasViewAdapter extends ViewAdapter {
    // Canvas特有方法
    addShape(shape: ASTNode): void
    addImage(image: ASTNode): void
    addText(text: ASTNode): void
    addPath(path: ASTNode): void
    
    // Canvas工具
    selectTool(tool: CanvasTool): void
    clearCanvas(): void
    exportImage(format: 'png' | 'jpg' | 'svg'): string
    
    // Canvas事件
    onDraw(callback: (path: { x: number; y: number }[]) => void): void
    onShapeResize(callback: (nodeId: string, size: { width: number; height: number }) => void): void
}
```

## 使用示例

### 基本使用
```tsx
import { EditorCore } from './components/Editor/core/EditorCore'

function App() {
  return (
    <EditorCore
      initialAST={ASTUtils.createDocument('doc-1', '我的文档')}
      onASTChange={(ast) => console.log('AST变化:', ast)}
    />
  )
}
```

### 切换视图
```tsx
// 切换到图谱视图
await editor.switchView(EditorType.GRAPH)

// 切换到Canvas视图
await editor.switchView(EditorType.CANVAS)

// 切换到时间线视图
await editor.switchView(EditorType.TIMELINE)
```

### 执行命令
```tsx
// 插入文本
await editor.executeCommand('insertText', { text: 'Hello World', position: 0 })

// 插入图谱节点
await editor.executeCommand('insertGraphNode', { 
  node: { id: 'node-1', type: 'graphNode', label: '概念节点' },
  position: { x: 100, y: 100 }
})

// 插入Canvas形状
await editor.executeCommand('insertCanvasShape', {
  node: { id: 'shape-1', type: 'shape', canvasData: { shapeType: 'rectangle' } }
})
```

## 开发指南

### 创建新视图适配器
1. 实现`ViewAdapter`接口
2. 在`AdapterFactory`中注册
3. 添加相应的类型定义

### 创建新命令
1. 实现命令接口
2. 在命令系统中注册
3. 添加撤销/重做支持

### 创建新插件
1. 继承`BasePlugin`类
2. 实现必要的抽象方法
3. 在插件管理器中注册

## 优势

1. **真正的多形态**：支持多种视图模式，共享同一份数据
2. **架构清晰**：AST作为核心，职责分离明确
3. **高度可扩展**：新视图、新命令、新插件易于添加
4. **类型安全**：完整的TypeScript支持
5. **性能优秀**：视图分离，按需渲染

## 总结

这个重新设计的架构实现了真正的**多形态编辑器内核**：

- **AST作为通信核心**：统一的数据结构支持所有视图模式
- **视图适配器分离**：纯视图渲染，不处理编辑逻辑
- **命令驱动架构**：统一的编辑操作处理
- **插件系统扩展**：业务逻辑通过插件扩展

这样的设计完全符合PRD中"多形态编辑器内核"的要求，为FlowMind的AI原生编辑器提供了坚实的基础。
