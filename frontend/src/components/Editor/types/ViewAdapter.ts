/**
 * 视图适配器接口
 * 适配器只负责视图渲染，不处理编辑逻辑
 */

import { EditorType, SceneTemplate } from './EditorType'
import { DocumentAST, ASTNode, Selection } from './EditorAST'
import { EditorTheme } from './EditorTheme'

/**
 * 视图适配器接口
 */
export interface ViewAdapter {
    // 基础属性
    type: EditorType
    sceneTemplate: SceneTemplate
    
    // 生命周期方法
    create(element: HTMLElement, options: ViewAdapterOptions): Promise<void>
    destroy(): void
    
    // 视图渲染方法
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
    onNodeDoubleClick(callback: (nodeId: string, event: MouseEvent) => void): void
    onSelectionChange(callback: (selection: Selection) => void): void
    onViewChange(callback: (viewData: any) => void): void
    onFocus(callback: () => void): void
    onBlur(callback: () => void): void
    
    // 视图工具方法
    scrollToNode(nodeId: string): void
    zoomIn(): void
    zoomOut(): void
    resetZoom(): void
    fitToView(): void
    
    // 视图状态
    getViewport(): Viewport
    setViewport(viewport: Viewport): void
}

/**
 * 视图适配器选项
 */
export interface ViewAdapterOptions {
    // 基础选项
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

/**
 * 视口信息
 */
export interface Viewport {
    x: number
    y: number
    width: number
    height: number
    zoom: number
}

/**
 * 视图数据
 */
export interface ViewData {
    viewport: Viewport
    selection: Selection
    focusedNodeId?: string
    hoveredNodeId?: string
}

/**
 * 富文本视图适配器
 */
export interface RichTextViewAdapter extends ViewAdapter {
    type: EditorType.RICH_TEXT
    
    // 富文本特有方法
    insertText(text: string, position?: number): void
    deleteText(start: number, end: number): void
    formatText(start: number, end: number, format: TextFormat): void
    insertNode(node: ASTNode, position?: number): void
    
    // 富文本事件
    onTextChange(callback: (text: string) => void): void
    onFormatChange(callback: (format: TextFormat) => void): void
}

/**
 * 文本格式
 */
export interface TextFormat {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
    color?: string
    backgroundColor?: string
    fontSize?: number
    fontFamily?: string
    alignment?: 'left' | 'center' | 'right' | 'justify'
}

/**
 * 图谱视图适配器
 */
export interface GraphViewAdapter extends ViewAdapter {
    type: EditorType.GRAPH
    
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

/**
 * 图谱布局类型
 */
export type GraphLayout = 
    | 'force'        // 力导向布局
    | 'hierarchical' // 层次布局
    | 'circular'     // 环形布局
    | 'grid'         // 网格布局
    | 'random'       // 随机布局

/**
 * Canvas视图适配器
 */
export interface CanvasViewAdapter extends ViewAdapter {
    type: EditorType.CANVAS
    
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

/**
 * Canvas工具类型
 */
export type CanvasTool = 
    | 'select'       // 选择工具
    | 'draw'         // 绘制工具
    | 'shape'        // 形状工具
    | 'text'         // 文本工具
    | 'image'        // 图片工具
    | 'connector'    // 连接线工具

/**
 * 表格视图适配器
 */
export interface TableViewAdapter extends ViewAdapter {
    type: EditorType.TABLE
    
    // 表格特有方法
    addRow(index?: number): void
    addColumn(index?: number): void
    removeRow(index: number): void
    removeColumn(index: number): void
    updateCell(row: number, col: number, value: string): void
    
    // 表格功能
    sortByColumn(column: number, direction: 'asc' | 'desc'): void
    filterRows(filter: (row: any[]) => boolean): void
    exportData(format: 'csv' | 'json' | 'excel'): string
    
    // 表格事件
    onCellEdit(callback: (row: number, col: number, value: string) => void): void
    onRowSelect(callback: (rowIndex: number) => void): void
}

/**
 * 时间线视图适配器
 */
export interface TimelineViewAdapter extends ViewAdapter {
    type: EditorType.TIMELINE
    
    // 时间线特有方法
    addItem(item: ASTNode): void
    addMilestone(milestone: ASTNode): void
    updateItemDate(itemId: string, date: string): void
    updateItemStatus(itemId: string, status: string): void
    
    // 时间线功能
    setTimeRange(start: string, end: string): void
    groupBy(groupBy: TimelineGroupBy): void
    filterByStatus(status: string[]): void
    
    // 时间线事件
    onItemClick(callback: (itemId: string, event: MouseEvent) => void): void
    onDateChange(callback: (itemId: string, date: string) => void): void
}

/**
 * 时间线分组类型
 */
export type TimelineGroupBy = 
    | 'day'          // 按天分组
    | 'week'         // 按周分组
    | 'month'        // 按月分组
    | 'quarter'      // 按季度分组
    | 'year'         // 按年分组
    | 'status'       // 按状态分组
    | 'assignee'     // 按负责人分组