/**
 * 编辑器上下文 - 基于PRD重构
 */

import { createContext, useContext } from 'react'
import { EditorState, EditorConfig, EditorAction, TOCItem } from './EditorState'
import { EditorType, SceneTemplate, AICapability } from './EditorType'
import { EditorAdapter } from './ViewAdapter'

/**
 * 编辑器上下文值
 */
export interface EditorContextValue {
    // 状态
    state: EditorState
    config: EditorConfig
    
    // 当前编辑器适配器
    adapter: EditorAdapter | null
    
    // 状态更新方法
    setContent: (content: string) => void
    setEditorType: (type: EditorType) => void
    setSceneTemplate: (template: SceneTemplate) => void
    setAICapabilities: (capabilities: AICapability[]) => void
    setTOC: (toc: TOCItem[]) => void
    setCurrentSection: (sectionId: string) => void
    
    // AI相关方法
    processAIInput: (input: string) => Promise<void>
    applyAISuggestion: (suggestionId: string) => Promise<void>
    clearAISuggestions: () => void
    
    // 目录相关方法
    generateTOC: () => TOCItem[]
    navigateToSection: (sectionId: string) => void
    updateTOC: () => void
    
    // 文档操作
    saveDocument: () => Promise<void>
    loadDocument: (documentId: string) => Promise<void>
    createDocument: (template?: SceneTemplate) => Promise<string>
    
    // 历史记录
    undo: () => void
    redo: () => void
    canUndo: () => boolean
    canRedo: () => boolean
    
    // UI控制
    toggleFullscreen: () => void
    toggleSidebar: () => void
    toggleToolbar: () => void
    toggleTOC: () => void
    
    // 配置更新
    updateConfig: (config: Partial<EditorConfig>) => void
    
    // 事件监听
    onStateChange: (callback: (state: EditorState) => void) => () => void
    onTOCChange: (callback: (toc: TOCItem[]) => void) => () => void
    onAISuggestionChange: (callback: (suggestions: any[]) => void) => () => void
}

/**
 * 编辑器上下文
 */
export const EditorContext = createContext<EditorContextValue | null>(null)

/**
 * 使用编辑器上下文
 */
export const useEditor = (): EditorContextValue => {
    const context = useContext(EditorContext)
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider')
    }
    return context
}

/**
 * 编辑器操作类型
 */
export enum EditorActionType {
    // 内容操作
    SET_CONTENT = 'SET_CONTENT',
    INSERT_TEXT = 'INSERT_TEXT',
    DELETE_TEXT = 'DELETE_TEXT',
    
    // 编辑器类型操作
    SWITCH_EDITOR_TYPE = 'SWITCH_EDITOR_TYPE',
    SWITCH_SCENE_TEMPLATE = 'SWITCH_SCENE_TEMPLATE',
    
    // AI操作
    PROCESS_AI_INPUT = 'PROCESS_AI_INPUT',
    APPLY_AI_SUGGESTION = 'APPLY_AI_SUGGESTION',
    CLEAR_AI_SUGGESTIONS = 'CLEAR_AI_SUGGESTIONS',
    SET_AI_CAPABILITIES = 'SET_AI_CAPABILITIES',
    SET_AI_PROCESSING = 'SET_AI_PROCESSING',
    SET_AI_SUGGESTIONS = 'SET_AI_SUGGESTIONS',
    
    // 目录操作
    UPDATE_TOC = 'UPDATE_TOC',
    NAVIGATE_TO_SECTION = 'NAVIGATE_TO_SECTION',
    
    // 文档操作
    SAVE_DOCUMENT = 'SAVE_DOCUMENT',
    LOAD_DOCUMENT = 'LOAD_DOCUMENT',
    CREATE_DOCUMENT = 'CREATE_DOCUMENT',
    
    // UI操作
    TOGGLE_FULLSCREEN = 'TOGGLE_FULLSCREEN',
    TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR',
    TOGGLE_TOOLBAR = 'TOGGLE_TOOLBAR',
    TOGGLE_TOC = 'TOGGLE_TOC',
    
    // 配置操作
    UPDATE_CONFIG = 'UPDATE_CONFIG',
}

/**
 * 编辑器操作创建器
 */
export const createEditorAction = (
    type: EditorActionType,
    payload?: any
): EditorAction => ({
    type,
    payload,
    timestamp: Date.now(),
})