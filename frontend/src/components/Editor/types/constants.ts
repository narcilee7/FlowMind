/**
 * 编辑器事件常量
 */

export type EditorEvent = 
    // 内容变化
    | 'change'
    | 'cursorPositionChanged'
    | 'selectionChanged'
    | 'scrollChanged'
    // 焦点变化
    | 'focus'
    | 'blur'
    // 键盘事件
    | 'keydown'
    | 'keyup'
    // 鼠标事件
    | 'mousedown'
    | 'mouseup'
    // 粘贴事件
    | 'paste'
    | 'drop'

export const EditorEvent = {
    CHANGE: 'change',
    CURSOR_POSITION_CHANGED: 'cursorPositionChanged',
    SELECTION_CHANGED: 'selectionChanged',
    SCROLL_CHANGED: 'scrollChanged',
    FOCUS: 'focus',
    BLUR: 'blur',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    MOUSEDOWN: 'mousedown',
    MOUSEUP: 'mouseup',
    PASTE: 'paste',
    DROP: 'drop'
}