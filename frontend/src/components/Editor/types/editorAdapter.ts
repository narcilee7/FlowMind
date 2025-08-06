/**
 * 编辑器适配器接口
 */

import { EditorType, SceneTemplate } from './editorType'
import { TOCItem } from './editorState'

/**
 * 编辑器适配器接口
 */
export interface EditorAdapter {
    // 基础属性
    type: EditorType
    sceneTemplate: SceneTemplate
    
    // 生命周期方法
    create(element: HTMLElement, options: EditorOptions): Promise<void>
    destroy(): void
    
    // 内容操作
    getValue(): string
    setValue(value: string): void
    getSelection(): string
    setSelection(start: number, end: number): void
    
    // 目录操作
    generateTOC(): TOCItem[]
    navigateToSection(sectionId: string): void
    updateTOC(): void
    
    // AI集成
    processAIInput(input: string): Promise<void>
    applyAISuggestion(suggestionId: string): Promise<void>
    
    // 事件监听
    onContentChange(callback: (content: string) => void): void
    onSelectionChange(callback: (selection: string) => void): void
    onTOCChange(callback: (toc: TOCItem[]) => void): void
    
    // 工具方法
    focus(): void
    blur(): void
    isFocused(): boolean
}

/**
 * 编辑器选项
 */
export interface EditorOptions {
    // 基础选项
    type: EditorType
    sceneTemplate: SceneTemplate
    content?: string
    placeholder?: string
    
    // 配置选项
    autoSave?: boolean
    autoSaveInterval?: number
    enableAI?: boolean
    autoGenerateTOC?: boolean
    tocUpdateInterval?: number          // 目录更新间隔（毫秒）
    
    // 主题选项
    theme?: 'light' | 'dark' | 'auto'
    fontSize?: number
    
    // 编辑器特定选项
    richTextOptions?: RichTextOptions
    graphOptions?: GraphOptions
    canvasOptions?: CanvasOptions
    tableOptions?: TableOptions
    timelineOptions?: TimelineOptions
}

/**
 * 富文本编辑器选项
 */
export interface RichTextOptions {
    showToolbar?: boolean
    showFormatBar?: boolean
    blockTypes?: string[]
    customBlocks?: Record<string, any>
}

/**
 * 图谱编辑器选项
 */
export interface GraphOptions {
    showGrid?: boolean
    snapToGrid?: boolean
    nodeTypes?: string[]
    edgeTypes?: string[]
    layout?: 'force' | 'hierarchical' | 'circular'
}

/**
 * Canvas编辑器选项
 */
export interface CanvasOptions {
    zoom?: number
    pan?: { x: number; y: number }
    gridEnabled?: boolean
    snapToGrid?: boolean
    nodeTypes?: string[]
}

/**
 * 表格编辑器选项
 */
export interface TableOptions {
    showHeader?: boolean
    showRowNumbers?: boolean
    editable?: boolean
    sortable?: boolean
    filterable?: boolean
}

/**
 * 时间线编辑器选项
 */
export interface TimelineOptions {
    showDates?: boolean
    showIcons?: boolean
    groupBy?: string
    sortBy?: 'date' | 'title' | 'custom'
}
