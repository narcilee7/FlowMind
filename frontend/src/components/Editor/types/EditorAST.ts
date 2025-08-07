/**
 * 编辑器AST数据结构 - 多形态编辑器通信核心
 * 支持富文本、图谱、Canvas、表格、时间线等多种视图模式
 */

/**
 * 基础节点接口
 */
export interface BaseNode {
    id: string                    // 唯一标识符
    type: string                  // 节点类型
    position: Position            // 位置信息
    metadata?: NodeMetadata       // 元数据
    children?: ASTNode[]          // 子节点
    parent?: string               // 父节点ID
}

/**
 * 位置信息
 */
export interface Position {
    x: number                     // X坐标
    y: number                     // Y坐标
    z?: number                    // Z坐标（用于3D）
    width?: number                // 宽度
    height?: number               // 高度
    rotation?: number             // 旋转角度
}

/**
 * 节点元数据
 */
export interface NodeMetadata {
    createdAt: string             // 创建时间
    updatedAt: string             // 更新时间
    tags?: string[]               // 标签
    version?: string              // 版本
    [key: string]: any            // 扩展属性
}

/**
 * 富文本节点类型
 */
export type RichTextNodeType = 
    | 'paragraph'     // 段落
    | 'heading'       // 标题
    | 'text'          // 文本
    | 'bold'          // 粗体
    | 'italic'        // 斜体
    | 'underline'     // 下划线
    | 'strikethrough' // 删除线
    | 'code'          // 行内代码
    | 'codeBlock'     // 代码块
    | 'link'          // 链接
    | 'image'         // 图片
    | 'list'          // 列表
    | 'listItem'      // 列表项
    | 'blockquote'    // 引用
    | 'table'         // 表格
    | 'tableRow'      // 表格行
    | 'tableCell'     // 表格单元格
    | 'horizontalRule' // 分割线

/**
 * 富文本节点
 */
export interface RichTextNode extends BaseNode {
    type: RichTextNodeType
    content?: string              // 文本内容
    attributes?: RichTextAttributes // 富文本属性
    marks?: TextMark[]            // 文本标记
}

/**
 * 富文本属性
 */
export interface RichTextAttributes {
    level?: number                // 标题级别
    language?: string             // 代码语言
    href?: string                 // 链接地址
    src?: string                  // 图片地址
    alt?: string                  // 图片描述
    ordered?: boolean             // 是否有序列表
    [key: string]: any
}

/**
 * 文本标记
 */
export interface TextMark {
    type: string
    attributes?: Record<string, any>
}

/**
 * 图谱节点类型
 */
export type GraphNodeType = 
    | 'graphNode'     // 图谱节点
    | 'graphEdge'     // 图谱边
    | 'graphGroup'    // 图谱组

/**
 * 图谱节点
 */
export interface GraphNode extends BaseNode {
    type: GraphNodeType
    label: string                 // 节点标签
    graphData?: GraphData         // 图谱数据
}

/**
 * 图谱数据
 */
export interface GraphData {
    nodeType?: string      // 节点类型（概念、实体、事件等）
    properties?: Record<string, any> // 节点属性
    connections?: string[]        // 连接的边ID
    group?: string                // 所属组
}

/**
 * 图谱边
 */
export interface GraphEdge extends BaseNode {
    type: 'graphEdge'
    source: string                // 源节点ID
    target: string                // 目标节点ID
    label?: string                // 边标签
    edgeType?: string             // 边类型（关系类型）
    weight?: number               // 权重
    directed?: boolean            // 是否有向
}

/**
 * Canvas节点类型
 */
export type CanvasNodeType = 
    | 'shape'         // 形状
    | 'image'         // 图片
    | 'text'          // 文本
    | 'group'         // 组
    | 'path'          // 路径
    | 'connector'     // 连接线

/**
 * Canvas节点
 */
export interface CanvasNode extends BaseNode {
    type: CanvasNodeType
    canvasData?: CanvasData       // Canvas数据
}

/**
 * Canvas数据
 */
export interface CanvasData {
    shapeType?: string            // 形状类型（矩形、圆形、三角形等）
    fillColor?: string            // 填充颜色
    strokeColor?: string          // 描边颜色
    strokeWidth?: number          // 描边宽度
    opacity?: number              // 透明度
    text?: string                 // 文本内容
    fontSize?: number             // 字体大小
    fontFamily?: string           // 字体
    points?: Point[]              // 路径点
    [key: string]: any
}

/**
 * 点坐标
 */
export interface Point {
    x: number
    y: number
}

/**
 * 表格节点类型
 */
export type TableNodeType = 
    | 'table'         // 表格
    | 'tableRow'      // 表格行
    | 'tableCell'     // 表格单元格
    | 'tableHeader'   // 表格头部

/**
 * 表格节点
 */
export interface TableNode extends BaseNode {
    type: TableNodeType
    tableData?: TableData         // 表格数据
}

/**
 * 表格数据
 */
export interface TableData {
    rows: number                  // 行数
    cols: number                  // 列数
    headers?: string[]            // 表头
    data?: string[][]             // 表格数据
    sortable?: boolean            // 是否可排序
    filterable?: boolean          // 是否可过滤
    [key: string]: any
}

/**
 * 时间线节点类型
 */
export type TimelineNodeType = 
    | 'timeline'      // 时间线
    | 'timelineItem'  // 时间线项
    | 'milestone'     // 里程碑

/**
 * 时间线节点
 */
export interface TimelineNode extends BaseNode {
    type: TimelineNodeType
    timelineData?: TimelineData   // 时间线数据
}

/**
 * 时间线数据
 */
export interface TimelineData {
    date?: string                 // 日期
    time?: string                 // 时间
    duration?: number             // 持续时间
    status?: string               // 状态
    priority?: number             // 优先级
    assignee?: string             // 负责人
    [key: string]: any
}

/**
 * AI节点类型
 */
export type AINodeType = 
    | 'aiBlock'       // AI生成块
    | 'aiSuggestion'  // AI建议
    | 'aiCompletion'  // AI补全

/**
 * AI节点
 */
export interface AINode extends BaseNode {
    type: AINodeType
    aiData?: AIData               // AI数据
}

/**
 * AI数据
 */
export interface AIData {
    prompt?: string               // 提示词
    model?: string                // 模型名称
    confidence?: number           // 置信度
    alternatives?: string[]       // 备选方案
    metadata?: Record<string, any> // AI元数据
}

/**
 * 媒体节点类型
 */
export type MediaNodeType = 
    | 'video'         // 视频
    | 'audio'         // 音频
    | 'embed'         // 嵌入内容

/**
 * 媒体节点
 */
export interface MediaNode extends BaseNode {
    type: MediaNodeType
    mediaData?: MediaData         // 媒体数据
}

/**
 * 媒体数据
 */
export interface MediaData {
    url: string                   // 媒体URL
    type: string                  // 媒体类型
    duration?: number             // 时长
    thumbnail?: string            // 缩略图
    autoplay?: boolean            // 自动播放
    controls?: boolean            // 显示控制
    [key: string]: any
}

/**
 * 统一节点类型
 */
export type NodeType = 
    | RichTextNodeType 
    | GraphNodeType 
    | CanvasNodeType 
    | TableNodeType 
    | TimelineNodeType 
    | AINodeType 
    | MediaNodeType

/**
 * 统一节点接口
 */
export type ASTNode = 
    | RichTextNode 
    | GraphNode 
    | CanvasNode 
    | TableNode 
    | TimelineNode 
    | AINode 
    | MediaNode

/**
 * 文档AST
 */
export interface DocumentAST {
    version: string               // 版本
    type: 'document'              // 文档类型
    id: string                    // 文档ID
    title?: string                // 文档标题
    root: ASTNode                 // 根节点
    metadata?: DocumentMetadata   // 文档元数据
    settings?: DocumentSettings   // 文档设置
}

/**
 * 文档元数据
 */
export interface DocumentMetadata {
    createdAt: string             // 创建时间
    updatedAt: string             // 更新时间
    author?: string               // 作者
    tags?: string[]               // 标签
    description?: string          // 描述
    sceneTemplate?: string        // 场景模板
    editorType?: string           // 编辑器类型
    [key: string]: any
}

/**
 * 文档设置
 */
export interface DocumentSettings {
    theme?: 'light' | 'dark' | 'auto' // 主题
    fontSize?: number             // 字体大小
    fontFamily?: string           // 字体
    lineHeight?: number           // 行高
    autoSave?: boolean            // 自动保存
    collaboration?: boolean       // 协作模式
    [key: string]: any
}

/**
 * AST操作类型
 */
export type ASTOperation = 
    | { type: 'insert'; node: ASTNode; parentId?: string; index?: number }
    | { type: 'delete'; nodeId: string }
    | { type: 'update'; nodeId: string; updates: Partial<ASTNode> }
    | { type: 'move'; nodeId: string; newParentId: string; newIndex: number }
    | { type: 'duplicate'; nodeId: string; newParentId?: string }

/**
 * AST历史记录
 */
export interface ASTHistory {
    operations: ASTOperation[]    // 操作列表
    timestamp: number             // 时间戳
    description?: string          // 描述
    author?: string               // 作者
}

/**
 * 选择状态
 */
export interface Selection {
    nodeIds: string[]             // 选中的节点ID
    range?: {                     // 文本选择范围
        start: number
        end: number
        nodeId: string
    }
    type: 'node' | 'text' | 'mixed' // 选择类型
}
