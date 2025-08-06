/**
 * 编辑器适配器抽象接口
 */

import { EditorOptions } from "./editorOptions";

export interface EditorAdapter {
    /**
     * 基础操作
     */
    // 创建编辑器
    create(element: HTMLElement, options: EditorOptions): Promise<void>
    // 销毁编辑器
    destroy(): void

    // 内容操作
    getValue(): string
    setValue(value: string): void
    insertText(text: string, position?: PositionSection): void
    replaceSelection(text: string): void
    getSelection(): string
    setSelection(start: PositionSection, end: PositionSection): void

    // 光标和选择
    getCursorPosition(): PositionSection
    setCursorPosition(position: PositionSection): void
    getSelectionRange(): SelectionRange | null
    setSelectionRange(range: SelectionRange): void

    // 滚动
    getScrollPosition(): ScrollPosition
    setScrollPosition(position: ScrollPosition): void
    scrollToLine(line: number): void

    // 配置
    updateOptions(options: Partial<EditorOptions>): void
    getOption<K extends keyof EditorOptions>(key: K): EditorOptions[K]

    // 事件监听
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    
    // 命令执行
    executeCommand(command: string, ...args: any[]): void
    addCommand(id: string, handler: Function): void

    // 焦点控制
    focus(): void
    blur(): void
    isFocused(): boolean

    // 扩展
    [key: string]: any
}

// 位置接口
export interface PositionSection {
    line: number
    column: number
}

// 选择范围接口
export interface SelectionRange {
    start: PositionSection
    end: PositionSection
}

// 滚动位置接口
export interface ScrollPosition {
    scrollTop: number
    scrollLeft: number
}

// 视口接口
export interface Viewport {
    width: number
    height: number
}
