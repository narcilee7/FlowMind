/**
 * 编辑器动作
 */

import { EditorType } from "./editorType"
import { EditorMode } from "./editorMode"
import { PositionSection, SelectionRange } from "./editorAdapter";
import { CanvasEditorState, MarkdownEditorState, RichTextEditorState } from "./editorState";

export enum EditorActionType {
    // 设置内容
    SET_CONTENT = 'SET_CONTENT',
    // 设置语言
    SET_LANGUAGE = 'SET_LANGUAGE',
    // 设置主题
    SET_THEME = 'SET_THEME',
    // 设置编辑器类型
    SET_EDITOR_TYPE = 'SET_EDITOR_TYPE',
    // 设置编辑器模式
    SET_EDITOR_MODE = 'SET_EDITOR_MODE',
    // 设置只读
    SET_READ_ONLY = 'SET_READ_ONLY',
    // 设置脏状态
    SET_DIRTY = 'SET_DIRTY',
    // 设置光标位置
    SET_CURSOR_POSITION = 'SET_CURSOR_POSITION',
    // 设置选择范围
    SET_SELECTION = 'SET_SELECTION',
    // 设置滚动位置
    SET_SCROLL_POSITION = 'SET_SCROLL_POSITION',
    // 设置视口
    SET_VIEWPORT = 'SET_VIEWPORT',
    // 设置 Markdown 状态
    SET_MARKDOWN_STATE = 'SET_MARKDOWN_STATE',
    // 设置富文本状态
    SET_RICH_TEXT_STATE = 'SET_RICH_TEXT_STATE',
    // 设置 Canvas 状态
    SET_CANVAS_STATE = 'SET_CANVAS_STATE',
    // 重置状态
    RESET_STATE = 'RESET_STATE'
}

export type EditorAction = 
    | { type: EditorActionType.SET_CONTENT; payload: string }
    | { type: EditorActionType.SET_LANGUAGE; payload: string }
    | { type: EditorActionType.SET_THEME; payload: string }
    | { type: EditorActionType.SET_EDITOR_TYPE; payload: EditorType }
    | { type: EditorActionType.SET_EDITOR_MODE; payload: EditorMode }
    | { type: EditorActionType.SET_READ_ONLY; payload: boolean }
    | { type: EditorActionType.SET_DIRTY; payload: boolean }
    | { type: EditorActionType.SET_CURSOR_POSITION; payload: PositionSection }
    | { type: EditorActionType.SET_SELECTION; payload: SelectionRange | null }
    | { type: EditorActionType.SET_SCROLL_POSITION; payload: { scrollTop: number; scrollLeft: number } }
    | { type: EditorActionType.SET_VIEWPORT; payload: { width: number; height: number } }
    | { type: EditorActionType.SET_MARKDOWN_STATE; payload: Partial<MarkdownEditorState> }
    | { type: EditorActionType.SET_RICH_TEXT_STATE; payload: Partial<RichTextEditorState> }
    | { type: EditorActionType.SET_CANVAS_STATE; payload: Partial<CanvasEditorState> }
    | { type: EditorActionType.RESET_STATE }