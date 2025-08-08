/**
 * 编辑器管理器
 * 提供多编辑器管理、状态同步、历史记录等高级功能
 */

import { ViewAdapter, ViewAdapterOptions } from '../types/ViewAdapter'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { DocumentAST, Selection, ASTOperation } from '../types/EditorAST'
import {
    addNode,
    createDocumentAST,
    moveNode,
    updateNode,
    duplicateNode,
    serialize,
    deserialize,
    validateAST,
    removeNode
} from '../utils/ASTUtils'
import ViewAdapterFactory from './ViewAdapterFactory'

/**
 * 编辑器实例信息
 */
interface EditorInstance {
    id: string
    type: EditorType
    adapter: ViewAdapter
    element: HTMLElement
    options: ViewAdapterOptions
    isActive: boolean
    lastActivity: number
}

/**
 * 历史记录项
 */
interface HistoryItem {
    id: string
    timestamp: number
    operation: ASTOperation
    description: string
    author?: string
    astSnapshot?: DocumentAST
}

/**
 * 编辑器状态
 */
interface EditorState {
    ast: DocumentAST
    selection: Selection
    viewport: any
    theme: string
    zoom: number
}

/**
 * 编辑器管理器配置
 */
interface EditorManagerConfig {
    maxHistorySize?: number
    autoSaveInterval?: number
    enableCollaboration?: boolean
    enableUndoRedo?: boolean
    enableAutoLayout?: boolean
}

/**
 * 编辑器管理器
 */
export class EditorManager {
    private editors: Map<string, EditorInstance> = new Map()
    private activeEditorId: string | null = null
    private history: HistoryItem[] = []
    private historyIndex: number = -1
    private config: EditorManagerConfig
    private ast: DocumentAST
    private autoSaveTimer: NodeJS.Timeout | null = null
    private eventListeners: Map<string, Function[]> = new Map()

    /**
     * 构造函数
     */
    constructor(
        initialAST?: DocumentAST,
        config: EditorManagerConfig = {}
    ) {
        this.ast = initialAST || createDocumentAST('新文档')
        this.config = {
            maxHistorySize: 100,
            autoSaveInterval: 30000, // 30秒
            enableCollaboration: false,
            enableUndoRedo: true,
            enableAutoLayout: true,
            ...config
        }

        this.initializeAutoSave()
    }

    /**
     * 创建编辑器实例
     */
    async createEditor(
        element: HTMLElement,
        type: EditorType,
        options: Partial<ViewAdapterOptions> = {}
    ): Promise<string> {
        const editorId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        try {
            // 创建适配器
            const adapter = ViewAdapterFactory.createAdapter(type, {
                sceneTemplate: options.sceneTemplate || SceneTemplate.WRITING,
                options: {
                    type,
                    sceneTemplate: options.sceneTemplate || SceneTemplate.WRITING,
                    theme: options.theme || 'auto',
                    enableSelection: true,
                    enableDrag: true,
                    enableResize: true,
                    enableContextMenu: true,
                    ...options
                },
                onError: (error) => {
                    this.handleError(error, `editor:${editorId}`)
                }
            })

            // 初始化适配器
            await adapter.create(element, {
                type,
                sceneTemplate: options.sceneTemplate || SceneTemplate.WRITING,
                theme: options.theme || 'auto',
                enableSelection: true,
                enableDrag: true,
                enableResize: true,
                enableContextMenu: true,
                ...options
            })

            // 渲染初始AST
            adapter.render(this.ast)

            // 设置事件监听
            this.setupEditorEvents(adapter, editorId)

            // 创建编辑器实例
            const editorInstance: EditorInstance = {
                id: editorId,
                type,
                adapter,
                element,
                options: {
                    type,
                    sceneTemplate: options.sceneTemplate || SceneTemplate.WRITING,
                    theme: options.theme || 'auto',
                    enableSelection: true,
                    enableDrag: true,
                    enableResize: true,
                    enableContextMenu: true,
                    ...options
                },
                isActive: false,
                lastActivity: Date.now()
            }

            this.editors.set(editorId, editorInstance)

            // 如果是第一个编辑器，设为活动状态
            if (this.editors.size === 1) {
                this.setActiveEditor(editorId)
            }

            this.triggerEvent('editorCreated', { editorId, type })
            return editorId

        } catch (error) {
            this.handleError(error as Error, `createEditor:${type}`)
            throw error
        }
    }

    /**
     * 销毁编辑器实例
     */
    destroyEditor(editorId: string): void {
        const editor = this.editors.get(editorId)
        if (!editor) {
            this.handleError(new Error(`Editor ${editorId} not found`), 'destroyEditor')
            return
        }

        try {
            editor.adapter.destroy()
            this.editors.delete(editorId)

            // 如果销毁的是活动编辑器，选择新的活动编辑器
            if (this.activeEditorId === editorId) {
                const remainingEditors = Array.from(this.editors.keys())
                if (remainingEditors.length > 0) {
                    this.setActiveEditor(remainingEditors[0])
                } else {
                    this.activeEditorId = null
                }
            }

            this.triggerEvent('editorDestroyed', { editorId })
        } catch (error) {
            this.handleError(error as Error, `destroyEditor:${editorId}`)
        }
    }

    /**
     * 设置活动编辑器
     */
    setActiveEditor(editorId: string): void {
        const editor = this.editors.get(editorId)
        if (!editor) {
            this.handleError(new Error(`Editor ${editorId} not found`), 'setActiveEditor')
            return
        }

        // 取消之前活动编辑器的活动状态
        if (this.activeEditorId && this.editors.has(this.activeEditorId)) {
            const previousEditor = this.editors.get(this.activeEditorId)!
            previousEditor.isActive = false
        }

        // 设置新的活动编辑器
        editor.isActive = true
        this.activeEditorId = editorId
        editor.lastActivity = Date.now()

        this.triggerEvent('activeEditorChanged', { editorId, type: editor.type })
    }

    /**
     * 获取活动编辑器
     */
    getActiveEditor(): EditorInstance | null {
        if (!this.activeEditorId) return null
        return this.editors.get(this.activeEditorId) || null
    }

    /**
     * 获取所有编辑器
     */
    getAllEditors(): EditorInstance[] {
        return Array.from(this.editors.values())
    }

    /**
     * 更新AST
     */
    updateAST(ast: DocumentAST): void {
        this.ast = ast

        // 更新所有编辑器
        this.editors.forEach(editor => {
            try {
                editor.adapter.update(ast)
            } catch (error) {
                this.handleError(error as Error, `updateAST:${editor.id}`)
            }
        })

        this.triggerEvent('astUpdated', { ast })
    }

    /**
     * 执行AST操作
     */
    executeOperation(operation: ASTOperation): boolean {
        try {
            let newAST: DocumentAST

            switch (operation.type) {
                case 'insert':
                    const insertResult = addNode(
                        this.ast,
                        operation.node,
                        operation.parentId,
                        operation.index
                    )
                    if (!insertResult.success) {
                        this.handleError(new Error(insertResult.error!), 'executeOperation:insert')
                        return false
                    }
                    newAST = insertResult.ast!
                    break

                case 'delete':
                    const deleteResult = removeNode(this.ast, operation.nodeId)
                    if (!deleteResult.success) {
                        this.handleError(new Error(deleteResult.error!), 'executeOperation:delete')
                        return false
                    }
                    newAST = deleteResult.ast!
                    break

                case 'update':
                    const updateResult = updateNode(
                        this.ast,
                        operation.nodeId,
                        operation.updates
                    )
                    if (!updateResult.success) {
                        this.handleError(new Error(updateResult.error!), 'executeOperation:update')
                        return false
                    }
                    newAST = updateResult.ast!
                    break

                case 'move':
                    const moveResult = moveNode(
                        this.ast,
                        operation.nodeId,
                        operation.newParentId,
                        operation.newIndex
                    )
                    if (!moveResult.success) {
                        this.handleError(new Error(moveResult.error!), 'executeOperation:move')
                        return false
                    }
                    newAST = moveResult.ast!
                    break

                case 'duplicate':
                    const duplicateResult = duplicateNode(
                        this.ast,
                        operation.nodeId,
                        operation.newParentId
                    )
                    if (!duplicateResult.success) {
                        this.handleError(new Error(duplicateResult.error!), 'executeOperation:duplicate')
                        return false
                    }
                    newAST = duplicateResult.ast!
                    break

                default:
                    this.handleError(new Error(`Unknown operation type: ${(operation as any).type}`), 'executeOperation')
                    return false
            }

            // 添加到历史记录
            this.addToHistory({
                id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                operation,
                description: this.getOperationDescription(operation),
                astSnapshot: this.ast
            })

            // 更新AST
            this.updateAST(newAST)

            return true

        } catch (error) {
            this.handleError(error as Error, 'executeOperation')
            return false
        }
    }

    /**
     * 撤销操作
     */
    undo(): boolean {
        if (!this.config.enableUndoRedo || this.historyIndex <= 0) {
            return false
        }

        this.historyIndex--
        const historyItem = this.history[this.historyIndex]

        if (historyItem.astSnapshot) {
            this.updateAST(historyItem.astSnapshot)
            this.triggerEvent('undo', { operation: historyItem.operation })
            return true
        }

        return false
    }

    /**
     * 重做操作
     */
    redo(): boolean {
        if (!this.config.enableUndoRedo || this.historyIndex >= this.history.length - 1) {
            return false
        }

        this.historyIndex++
        const historyItem = this.history[this.historyIndex]

        if (historyItem.astSnapshot) {
            this.updateAST(historyItem.astSnapshot)
            this.triggerEvent('redo', { operation: historyItem.operation })
            return true
        }

        return false
    }

    /**
     * 获取历史记录
     */
    getHistory(): HistoryItem[] {
        return [...this.history]
    }

    /**
     * 清空历史记录
     */
    clearHistory(): void {
        this.history = []
        this.historyIndex = -1
        this.triggerEvent('historyCleared', {})
    }

    /**
     * 保存文档
     */
    async saveDocument(): Promise<boolean> {
        try {
            const serialized = serialize(this.ast)
            // 这里可以添加实际的保存逻辑，比如保存到本地存储或服务器
            localStorage.setItem('editor_document', serialized)

            this.triggerEvent('documentSaved', { ast: this.ast })
            return true
        } catch (error) {
            this.handleError(error as Error, 'saveDocument')
            return false
        }
    }

    /**
     * 加载文档
     */
    async loadDocument(data: string): Promise<boolean> {
        try {
            const ast = deserialize(data)
            const validation = validateAST(ast)

            if (!validation.success) {
                this.handleError(new Error(validation.error!), 'loadDocument')
                return false
            }

            this.ast = ast
            this.updateAST(ast)
            this.clearHistory()

            this.triggerEvent('documentLoaded', { ast })
            return true
        } catch (error) {
            this.handleError(error as Error, 'loadDocument')
            return false
        }
    }

    /**
     * 导出文档
     */
    async exportDocument(format: 'json' | 'html' | 'markdown' = 'json'): Promise<string> {
        switch (format) {
            case 'json':
                return serialize(this.ast)
            case 'html':
                return await this.astToHtml()
            case 'markdown':
                return await this.astToMarkdown()
            default:
                return serialize(this.ast)
        }
    }

    /**
     * 获取编辑器状态
     */
    getEditorState(): EditorState {
        const activeEditor = this.getActiveEditor()
        return {
            ast: this.ast,
            selection: activeEditor ? activeEditor.adapter.getSelection() : { nodeIds: [], type: 'node' },
            viewport: activeEditor ? activeEditor.adapter.getViewport() : { x: 0, y: 0, width: 0, height: 0, zoom: 1 },
            theme: activeEditor?.options.theme || 'auto',
            zoom: activeEditor ? activeEditor.adapter.getViewport().zoom : 1
        }
    }

    /**
     * 设置编辑器状态
     */
    setEditorState(state: Partial<EditorState>): void {
        if (state.ast) {
            this.updateAST(state.ast)
        }

        const activeEditor = this.getActiveEditor()
        if (activeEditor) {
            if (state.selection) {
                activeEditor.adapter.setSelection(state.selection)
            }
            if (state.viewport) {
                activeEditor.adapter.setViewport(state.viewport)
            }
        }
    }

    /**
     * 事件监听
     */
    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    /**
     * 移除事件监听
     */
    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            const index = listeners.indexOf(callback)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }

    /**
     * 销毁管理器
     */
    destroy(): void {
        // 停止自动保存
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer)
            this.autoSaveTimer = null
        }

        // 销毁所有编辑器
        this.editors.forEach(editor => {
            editor.adapter.destroy()
        })
        this.editors.clear()

        // 清空历史记录
        this.history = []
        this.historyIndex = -1

        // 清空事件监听器
        this.eventListeners.clear()

        this.triggerEvent('managerDestroyed', {})
    }

    // 私有方法
    /**
     * 设置编辑器事件监听
     */
    private setupEditorEvents(adapter: ViewAdapter, editorId: string): void {
        adapter.onSelectionChange((selection) => {
            this.triggerEvent('selectionChanged', { editorId, selection })
        })

        adapter.onViewChange((viewData) => {
            this.triggerEvent('viewChanged', { editorId, viewData })
        })

        adapter.onNodeClick((data) => {
            this.triggerEvent('nodeClicked', { editorId, ...data })
        })

        adapter.onNodeDoubleClick((data) => {
            this.triggerEvent('nodeDoubleClicked', { editorId, ...data })
        })

        adapter.onFocus(() => {
            this.setActiveEditor(editorId)
        })

        adapter.onError((error) => {
            this.handleError(error, `editor:${editorId}`)
        })
    }

    /**
     * 添加到历史记录
     */
    private addToHistory(item: HistoryItem): void {
        // 移除当前位置之后的历史记录
        this.history = this.history.slice(0, this.historyIndex + 1)

        // 添加新记录
        this.history.push(item)
        this.historyIndex++

        // 限制历史记录大小
        if (this.history.length > this.config.maxHistorySize!) {
            this.history.shift()
            this.historyIndex--
        }
    }

    /**
     * 获取操作描述
     */
    private getOperationDescription(operation: ASTOperation): string {
        switch (operation.type) {
            case 'insert':
                return `插入节点: ${operation.node.type}`
            case 'delete':
                return `删除节点: ${operation.nodeId}`
            case 'update':
                return `更新节点: ${operation.nodeId}`
            case 'move':
                return `移动节点: ${operation.nodeId}`
            case 'duplicate':
                return `复制节点: ${operation.nodeId}`
            default:
                return '未知操作'
        }
    }

    /**
     * 初始化自动保存
     */
    private initializeAutoSave(): void {
        if (this.config.autoSaveInterval && this.config.autoSaveInterval > 0) {
            this.autoSaveTimer = setInterval(() => {
                this.saveDocument()
            }, this.config.autoSaveInterval)
        }
    }

    /**
     * 触发事件
     */
    private triggerEvent(event: string, data: any): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    this.handleError(error as Error, `event:${event}`)
                }
            })
        }
    }

    /**
     * 处理错误
     */
    private handleError(error: Error, context: string): void {
        console.error(`[EditorManager] Error in ${context}:`, error)
        this.triggerEvent('error', { error, context })
    }

    /**
     * AST转HTML
     */
    private async astToHtml(): Promise<string> {
        try {
            const { ASTExporter } = await import('../utils/ASTExporter')
            const result = ASTExporter.exportToHTML(this.ast)
            // TODO: review看看是不是有异步问题
            return result.success ? result.content! : `<div>导出失败: ${result.error}</div>`
        } catch (error) {
            return `<div>导出失败: ${error instanceof Error ? error.message : '未知错误'}</div>`
        }
    }

    /**
     * AST转Markdown
     */
    private async astToMarkdown(): Promise<string> {
        try {
            const { ASTExporter } = await import('../utils/ASTExporter')
            const result = ASTExporter.exportToMarkdown(this.ast)
            return result.success ? result.content! : `# 导出失败: ${result.error}`
        } catch (error) {
            return `# 导出失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
    }
} 