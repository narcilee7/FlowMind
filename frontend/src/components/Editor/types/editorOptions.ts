/**
 * 编辑器选项接口
 */

export interface EditorOptions {
    /**
     * 基础配置
     */
    value: string
    language: string
    theme: string
    readonly: boolean

    /**
     * 样式配置
     */
    fontSize: number
    fontFamily: string
    lineHeight: number
    wordWrap: EditorWordWrap
    wordWrapColumn: number

    /**
     * 功能配置
     */
    // 迷你地图
    minimap: {
        enabled: boolean
    }
    lineNumbers: EditorLineNumbers
    // 是否启用折叠
    folding: boolean
    // 自动保存
    autoSave: boolean
    autoSaveDelay: number

    /**
     * 交互配置
     */
    // 右键菜单
    contextmenu: boolean
    // 鼠标滚轮缩放
    mouseWheelZoom: boolean
    // 快速建议
    quickSuggestions: boolean
    // 触发字符建议
    suggestOnTriggerCharacters: boolean
    // 智能提示
    suggest: {
        enabled: boolean
        triggerCharacters: string[]
        triggerCharactersRegex: RegExp
    }

    /**
     * 布局配置
     */
    automaticLayout: boolean
    scrollBeyondLastLine: boolean
    padding: {
        top: number
        bottom: number
    }

    /**
     * 扩展配置
     */
    [key: string]: any
}
// 换行模式
type EditorWordWrap = 'off' | 'on' | 'wordWrapColumn' | 'bounded'

// 行号
type EditorLineNumbers = 'on' | 'off' | 'relative'