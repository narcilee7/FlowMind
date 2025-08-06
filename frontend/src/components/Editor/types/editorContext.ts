/**
 * 编辑器提供者接口
 */

import React from "react";
import { EditorType } from "./editorType";
import { EditorMode } from "./editorMode";
import { EditorState, RichTextEditorState, MarkdownEditorState, CanvasEditorState } from "./editorState";
import { EditorAction } from "./editorAction";
import { PositionSection, ScrollPosition, SelectionRange, Viewport } from "./editorAdapter";
import { EditorPlugin } from "./editorPlugin";

export interface EditorProviderProps {
    children: React.ReactNode
    initialContent?: string
    initialLanguage?: string
    initialTheme?: string
    initialEditorType?: EditorType
    initialEditorMode?: EditorMode
}

export interface EditorContextValue {
    state: EditorState
    dispatch: React.Dispatch<EditorAction>
    // 操作
    setContent: (content: string) => void
    getContent: () => string
    insertText: (text: string, position?: PositionSection) => void
    replaceSelection: (text: string) => void
    // 光标和选择
    getSelection: () => string
    setSelection: (selection: string) => void
    // 选择范围
    getSelectionRange: () => SelectionRange | null
    setSelectionRange: (selection: SelectionRange) => void
    // 光标
    getCursorPosition: () => PositionSection
    setCursorPosition: (position: PositionSection) => void
    // 滚动
    getScrollPosition: () => ScrollPosition
    setScrollPosition: (position: ScrollPosition) => void
    scrollToLine: (line: number) => void
    // 视口
    getViewport: () => Viewport
    setViewport: (viewport: Viewport) => void
    // 编辑器状态
    getMarkdownState: () => MarkdownEditorState | null
    setMarkdownState: (markdownState: MarkdownEditorState) => void
    getRichTextState: () => RichTextEditorState | null
    setRichTextState: (richTextState: RichTextEditorState) => void
    getCanvasState: () => CanvasEditorState | null
    setCanvasState: (canvasState: CanvasEditorState) => void
    // 编辑器类型切换
    switchEditorType: (type: EditorType) => void
    switchEditorMode: (mode: EditorMode) => void
    // 插件系统
    registerPlugin: (plugin: EditorPlugin) => void
    unregisterPlugin: (pluginId: string) => void
    getPlugin: (pluginId: string) => EditorPlugin | undefined
    // 事件系统
    subscribe: (event: string, callback: Function) => () => void
    emit: (event: string, data?: any) => void
}