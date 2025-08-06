/**
 * 编辑器状态接口
 */

import { PositionSection, SelectionRange } from "./editorAdapter"
import { EditorMode } from "./editorMode"
import { EditorType } from "./editorType"

export interface EditorState {
    content: string
    language: string
    theme: string
    editorType: EditorType
    editorMode: EditorMode
    isReadOnly: boolean
    isDirty: boolean
    cursorPosition: PositionSection
    selectionRange: SelectionRange | null
    scrollPosition: { scrollTop: number; scrollLeft: number }
    viewport: { width: number; height: number }
    // 编辑器特定状态
    markdownState?: MarkdownEditorState
    richTextState?: RichTextEditorState
    canvasState?: CanvasEditorState
}

/**
 * Markdown 编辑器特定状态
 */

export interface MarkdownEditorState {
    // 显示行号
    showLineNumbers: boolean
    // 显示边距
    showGutter: boolean
    // 换行
    wordWrap: boolean
    // 自动保存
    autoSave: boolean
    // 预览主题
    previewTheme: string
    // 数学渲染
    mathRendering: boolean
    // mermaid 渲染
    mermaidRendering: boolean
}

/**
 * 富文本编辑器特定状态
 */

export interface RichTextEditorState {
    // 显示工具栏
    showToolbar: boolean
    // 显示格式栏
    showFormatBar: boolean
    // 块类型
    blockTypes: string[]
    // 自定义块
    customBlocks: Record<string, any>
    // 协作功能
    collaborationEnabled: boolean
}

/**
 * Canvas 编辑器特定状态
 */

export interface CanvasEditorState {
    // 缩放
    zoom: number
    // 平移
    pan: { x: number; y: number }
    // 选中的节点
    selectedNodes: string[]
    // 选中的边
    selectedEdges: string[]
    // 网格
    gridEnabled: boolean
    // 网格对齐
    snapToGrid: boolean
}