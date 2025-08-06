/**
 * 编辑器提供者接口
 */

import React from "react";
import { EditorType } from "./editorType";
import { EditorMode } from "./editorMode";
import { EditorState } from "./editorState";
import { EditorAction } from "./editorAction";
import { PositionSection } from "./editorAdapter";
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
    getSelection: () => string
    setSelection: (start: PositionSection, end: PositionSection) => void
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