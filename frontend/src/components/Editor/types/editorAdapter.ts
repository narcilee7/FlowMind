/**
 * 编辑器适配器接口 - 完善版
 */

import { EditorType, SceneTemplate } from './EditorType'
import { TOCItem } from './EditorState'

/**
 * 编辑器适配器接口
 */
export interface EditorAdapter {
    // 基础属性
    // 编辑器类型
    type: EditorType
    // 编辑器场景模板
    sceneTemplate: SceneTemplate
    
    // 生命周期方法
    create(element: HTMLElement, options: EditorOptions): Promise<void>
    destroy(): void
    
    // 内容操作
    getValue(): string
    setValue(value: string): void
    getSelection(): string
    setSelection(start: number, end: number): void
    
    // 富文本格式化操作
    formatBold(): void
    formatItalic(): void
    formatUnderline(): void
    formatStrikethrough(): void
    formatCode(): void
    formatLink(url: string): void
    insertImage(url: string, alt?: string): void
    
    // 块级操作
    insertHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void
    insertParagraph(): void
    insertBulletList(): void
    insertNumberedList(): void
    insertBlockquote(): void
    insertCodeBlock(language?: string): void
    insertTable(rows: number, cols: number): void
    
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
    onFocus(callback: () => void): void
    onBlur(callback: () => void): void
    onKeyDown(callback: (event: KeyboardEvent) => void): void
    
    // 工具方法
    focus(): void
    blur(): void
    isFocused(): boolean
    undo(): void
    redo(): void
    canUndo(): boolean
    canRedo(): boolean
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
    tocUpdateInterval?: number
    
    // 主题选项
    theme?: 'light' | 'dark' | 'auto'
    fontSize?: number
    
    // 富文本特定选项
    richTextOptions?: RichTextOptions
}

/**
 * 富文本编辑器选项
 */
export interface RichTextOptions {
    // 显示选项
    showToolbar?: boolean
    showFormatBar?: boolean
    showBlockMenu?: boolean
    
    // 功能选项
    enableFormatting?: boolean
    enableImages?: boolean
    enableTables?: boolean
    enableCodeBlocks?: boolean
    enableLinks?: boolean
    
    // 块类型
    blockTypes?: string[]
    customBlocks?: Record<string, any>
    
    // 快捷键
    enableShortcuts?: boolean
    customShortcuts?: Record<string, () => void>
    
    // 粘贴处理
    pasteAsPlainText?: boolean
    allowedTags?: string[]
    
    // 自动保存
    autoSave?: boolean
    autoSaveInterval?: number
}
