# FlowMind Editor 架构文档

## 🎯 设计理念

FlowMind Editor 是一个基于 **ViewAdapter 模式** 的多形态编辑器架构，支持富文本、知识图谱、画布、表格、时间线等多种编辑模式。核心设计理念是：

- **AST 作为通信核心**：所有编辑器通过统一的 AST 数据结构进行通信
- **适配器只负责视图渲染**：适配器专注于视图层的渲染和交互，不处理业务逻辑
- **高度可扩展**：新编辑器类型只需实现适配器接口即可
- **类型安全**：完整的 TypeScript 类型定义，确保代码质量
- **错误处理**：完善的错误边界和恢复机制

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    EditorManager                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ RichText    │ │ Graph       │ │ Canvas      │          │
│  │ Adapter     │ │ Adapter     │ │ Adapter     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ViewAdapterFactory                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ BaseView    │ │ ASTUtils    │ │ EditorCore  │          │
│  │ Adapter     │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        AST Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ DocumentAST │ │ ASTNode     │ │ Selection   │          │
│  │             │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 📁 目录结构

```
frontend/src/components/Editor/
├── adapters/                 # 视图适配器
│   ├── BaseViewAdapter.ts    # 基础适配器类
│   ├── RichTextViewAdapter.ts # 富文本适配器
│   ├── GraphViewAdapter.ts   # 图谱适配器
│   ├── CanvasViewAdapter.ts  # 画布适配器
│   ├── TableViewAdapter.ts   # 表格适配器
│   └── TimelineViewAdapter.ts # 时间线适配器
├── core/                     # 核心组件
│   ├── EditorCore.tsx        # 编辑器核心组件
│   ├── EditorManager.ts      # 编辑器管理器
│   └── ViewAdapterFactory.ts # 适配器工厂
├── types/                    # 类型定义
│   ├── EditorAST.ts          # AST 数据结构
│   ├── EditorType.ts         # 编辑器类型
│   ├── EditorTheme.ts        # 主题定义
│   └── ViewAdapter.ts        # 适配器接口
├── utils/                    # 工具类
│   └── ASTUtils.ts           # AST 操作工具
└── README.md                 # 本文档
```

## 🔧 核心组件

### 1. BaseViewAdapter

基础适配器类，提供所有适配器的通用功能：

- **生命周期管理**：初始化、销毁、状态验证
- **事件系统**：统一的事件监听和触发机制
- **错误处理**：错误边界和恢复机制
- **工具方法**：防抖、节流、批量更新等

```typescript
export abstract class BaseViewAdapter implements ViewAdapter {
    // 抽象方法，由子类实现
    abstract create(element: HTMLElement, options: ViewAdapterOptions): Promise<void>
    abstract render(ast: DocumentAST): void
    abstract performDestroy(): void
    
    // 通用功能
    protected validateInitialized(): boolean
    protected handleError(error: Error, context: string): void
    protected triggerEvent<K extends keyof EventMap>(event: K, data?: any): void
}
```

### 2. ViewAdapterFactory

适配器工厂，负责创建和管理不同类型的适配器：

- **适配器注册**：支持动态注册新的适配器类型
- **场景模板**：根据场景推荐合适的编辑器类型
- **依赖验证**：检查适配器的依赖是否满足
- **错误处理**：统一的错误处理和恢复

```typescript
// 创建适配器
const adapter = ViewAdapterFactory.createAdapter(EditorType.RICH_TEXT, {
    sceneTemplate: SceneTemplate.WRITING,
    options: { theme: 'auto' },
    onError: (error) => console.error(error)
})
```

### 3. EditorManager

高级编辑器管理器，提供多编辑器管理功能：

- **多编辑器管理**：同时管理多个编辑器实例
- **状态同步**：保持所有编辑器的状态同步
- **历史记录**：支持撤销/重做操作
- **自动保存**：定时自动保存文档
- **事件管理**：统一的事件监听和处理

```typescript
const manager = new EditorManager(initialAST, {
    maxHistorySize: 100,
    autoSaveInterval: 30000,
    enableUndoRedo: true
})

// 创建编辑器
const editorId = await manager.createEditor(element, EditorType.RICH_TEXT)

// 执行操作
manager.executeOperation({
    type: 'insert',
    node: newNode,
    parentId: 'parent'
})

// 撤销/重做
manager.undo()
manager.redo()
```

### 4. ASTUtils

AST 操作工具类，提供完整的 AST 操作功能：

- **节点操作**：增删改查、移动、复制
- **遍历查询**：深度遍历、路径查找
- **验证工具**：结构验证、ID 唯一性检查
- **序列化**：JSON 序列化和反序列化

```typescript
// 添加节点
const result = ASTUtils.addNode(ast, newNode, parentId, index)
if (result.success) {
    ast = result.ast!
}

// 查找节点
const node = ASTUtils.findNodeById(ast, nodeId)

// 验证 AST
const validation = ASTUtils.validateAST(ast)
```

## 🎨 适配器类型

### 1. RichTextViewAdapter

基于 TipTap/ProseMirror 的富文本编辑器：

- **格式化功能**：粗体、斜体、下划线、颜色等
- **块级元素**：标题、段落、列表、表格、代码块
- **媒体支持**：图片、链接、嵌入内容
- **实时协作**：支持多人实时编辑

### 2. GraphViewAdapter

基于 vis-network 的知识图谱编辑器：

- **节点管理**：添加、删除、移动节点
- **边管理**：创建、删除、修改关系
- **布局算法**：力导向、层次、环形、网格布局
- **交互功能**：拖拽、缩放、选择、搜索

### 3. CanvasViewAdapter

基于 Fabric.js 的画布编辑器：

- **绘图工具**：自由绘制、形状、路径
- **对象管理**：选择、移动、缩放、旋转
- **图层系统**：多层画布管理
- **导出功能**：PNG、JPG、SVG 导出

### 4. TableViewAdapter

功能强大的表格编辑器：

- **数据操作**：增删改查、排序、过滤
- **公式支持**：单元格公式计算
- **样式设置**：边框、背景、字体
- **导入导出**：CSV、Excel、JSON

### 5. TimelineViewAdapter

时间线编辑器：

- **时间管理**：日期、时间、持续时间
- **状态跟踪**：进度、状态、优先级
- **分组功能**：按时间、状态、负责人分组
- **甘特图**：项目进度可视化

## 🚀 使用指南

### 基础使用

```typescript
import { EditorCore } from '@/components/Editor/core/EditorCore'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'

function MyEditor() {
    return (
        <EditorCore
            editorType={EditorType.RICH_TEXT}
            sceneTemplate={SceneTemplate.WRITING}
            theme="auto"
            onASTChange={(ast) => console.log('AST changed:', ast)}
            onSelectionChange={(selection) => console.log('Selection:', selection)}
        />
    )
}
```

### 高级使用

```typescript
import { EditorManager } from '@/components/Editor/core/EditorManager'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'

// 创建管理器
const manager = new EditorManager(initialAST, {
    maxHistorySize: 100,
    autoSaveInterval: 30000,
    enableUndoRedo: true
})

// 创建多个编辑器
const richTextId = await manager.createEditor(
    richTextElement,
    EditorType.RICH_TEXT,
    { sceneTemplate: SceneTemplate.WRITING }
)

const graphId = await manager.createEditor(
    graphElement,
    EditorType.GRAPH,
    { sceneTemplate: SceneTemplate.KNOWLEDGE_MAPPING }
)

// 监听事件
manager.on('astUpdated', (data) => {
    console.log('AST updated:', data.ast)
})

manager.on('selectionChanged', (data) => {
    console.log('Selection changed:', data.selection)
})
```

### 自定义适配器

```typescript
import { BaseViewAdapter } from '@/components/Editor/adapters/BaseViewAdapter'
import { ViewAdapterOptions } from '@/components/Editor/types/ViewAdapter'
import { DocumentAST } from '@/components/Editor/types/EditorAST'

export class CustomViewAdapter extends BaseViewAdapter {
    public readonly type: EditorType.CUSTOM = EditorType.CUSTOM
    
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        // 实现创建逻辑
        this.isInitialized = true
    }
    
    protected performDestroy(): void {
        // 实现销毁逻辑
    }
    
    render(ast: DocumentAST): void {
        // 实现渲染逻辑
    }
    
    // 实现其他抽象方法...
}
```

## 🔧 配置选项

### ViewAdapterOptions

```typescript
interface ViewAdapterOptions {
    type: EditorType
    sceneTemplate: SceneTemplate
    theme?: EditorTheme
    
    // 视图选项
    viewport?: Viewport
    zoom?: number
    showGrid?: boolean
    showRulers?: boolean
    
    // 交互选项
    enableSelection?: boolean
    enableDrag?: boolean
    enableResize?: boolean
    enableContextMenu?: boolean
    
    // 性能选项
    enableVirtualization?: boolean
    batchUpdates?: boolean
    debounceUpdates?: number
}
```

### EditorManagerConfig

```typescript
interface EditorManagerConfig {
    maxHistorySize?: number        // 历史记录最大数量
    autoSaveInterval?: number      // 自动保存间隔（毫秒）
    enableCollaboration?: boolean  // 启用协作功能
    enableUndoRedo?: boolean       // 启用撤销重做
    enableAutoLayout?: boolean     // 启用自动布局
}
```

## 🎯 最佳实践

### 1. 错误处理

```typescript
// 总是使用错误边界
try {
    const result = ASTUtils.addNode(ast, node)
    if (!result.success) {
        console.error('Failed to add node:', result.error)
        return
    }
    ast = result.ast!
} catch (error) {
    console.error('Unexpected error:', error)
}
```

### 2. 性能优化

```typescript
// 使用批量更新
adapter.batchUpdate([
    () => adapter.addNode(node1),
    () => adapter.addNode(node2),
    () => adapter.updateNode(node3.id, updates)
])

// 使用防抖处理频繁更新
const debouncedUpdate = adapter.debounce(() => {
    adapter.render(ast)
}, 100)
```

### 3. 状态管理

```typescript
// 使用管理器统一管理状态
const manager = new EditorManager()

// 监听状态变化
manager.on('astUpdated', (data) => {
    // 更新全局状态
    setGlobalAST(data.ast)
})

manager.on('selectionChanged', (data) => {
    // 更新选择状态
    setSelection(data.selection)
})
```

## 🔮 未来规划

### 1. AI 集成

- **智能补全**：基于上下文的智能文本补全
- **知识提取**：自动从内容中提取知识图谱
- **风格转换**：AI 驱动的文档风格转换
- **内容生成**：基于提示词的内容生成

### 2. 协作功能

- **实时协作**：多人实时编辑
- **版本控制**：Git 风格的版本管理
- **评论系统**：文档评论和讨论
- **权限管理**：细粒度的权限控制

### 3. 扩展性增强

- **插件系统**：支持第三方插件
- **主题系统**：可定制的主题和样式
- **国际化**：多语言支持
- **无障碍**：无障碍访问支持

## 📝 贡献指南

1. **代码规范**：遵循 TypeScript 严格模式
2. **测试覆盖**：新功能需要包含测试用例
3. **文档更新**：代码变更需要更新相关文档
4. **性能考虑**：新功能需要考虑性能影响
5. **向后兼容**：API 变更需要保持向后兼容

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

