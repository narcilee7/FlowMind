/**
 * 编辑器核心类型定义
 */

import { EditorAdapter } from './ViewAdapter'
import { EditorType, SceneTemplate } from './EditorType'
import { ASTNode } from './EditorAST'

/**
 * 编辑器核心接口
 */
export interface IEditorCore {
    // 生命周期
    init(element: HTMLElement, adapter: EditorAdapter, options: EditorCoreOptions): Promise<void>
    destroy(): void
    
    // 适配器管理
    switchAdapter(type: EditorType, template: SceneTemplate): Promise<void>
    getCurrentAdapter(): EditorAdapter | null
    
    // 文档状态管理
    getContent(): string
    setContent(content: string): void
    getAST(): ASTNode
    setAST(ast: ASTNode): void
    
    // 事件系统
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    emit(event: string, data?: any): void
    
    // 编辑器控制
    focus(): void
    blur(): void
    isFocused(): boolean
}

/**
 * 编辑器核心选项
 */
export interface EditorCoreOptions {
    content?: string
    autoSave?: boolean
    autoSaveInterval?: number
    enableAI?: boolean
    theme?: 'light' | 'dark' | 'auto'
    fontSize?: number
}

/**
 * 编辑器核心实现
 */
export class EditorCore implements IEditorCore {
    private element: HTMLElement | null = null
    private adapter: EditorAdapter | null = null
    private options: EditorCoreOptions | null = null
    private eventListeners: Map<string, Function[]> = new Map()
    private ast: ASTNode | null = null
    private isInitialized = false

    /**
     * 初始化编辑器核心
     */
    async init(element: HTMLElement, adapter: EditorAdapter, options: EditorCoreOptions): Promise<void> {
        this.element = element
        this.adapter = adapter
        this.options = options
        
        // 初始化适配器
        await this.adapter.create(element, {
            type: adapter.type,
            sceneTemplate: adapter.sceneTemplate,
            content: options.content,
            theme: options.theme,
            fontSize: options.fontSize,
        })
        
        // 设置事件监听
        this.setupAdapterEvents()
        
        this.isInitialized = true
    }

    /**
     * 销毁编辑器核心
     */
    destroy(): void {
        if (this.adapter) {
            this.adapter.destroy()
            this.adapter = null
        }
        
        this.element = null
        this.options = null
        this.eventListeners.clear()
        this.ast = null
        this.isInitialized = false
    }

    /**
     * 切换适配器
     */
    async switchAdapter(type: EditorType, template: SceneTemplate): Promise<void> {
        if (!this.element || !this.options) {
            throw new Error('Editor not initialized')
        }

        // 保存当前内容
        const currentContent = this.getContent()
        
        // 销毁当前适配器
        if (this.adapter) {
            this.adapter.destroy()
        }
        
        // 创建新适配器
        const { EditorAdapterFactory } = await import('../core/EditorAdapterFactory')
        this.adapter = EditorAdapterFactory.createAdapter(type, template)
        
        // 初始化新适配器
        await this.adapter.create(this.element, {
            type,
            sceneTemplate: template,
            content: currentContent,
            theme: this.options.theme,
            fontSize: this.options.fontSize,
        })
        
        // 重新设置事件监听
        this.setupAdapterEvents()
        
        // 触发类型变化事件
        this.emit('type:change', type)
        this.emit('template:change', template)
    }

    /**
     * 获取当前适配器
     */
    getCurrentAdapter(): EditorAdapter | null {
        return this.adapter
    }

    /**
     * 获取内容
     */
    getContent(): string {
        return this.adapter?.getValue() || ''
    }

    /**
     * 设置内容
     */
    setContent(content: string): void {
        this.adapter?.setValue(content)
    }

    /**
     * 获取AST
     */
    getAST(): ASTNode {
        return this.ast || { type: 'doc', content: [] }
    }

    /**
     * 设置AST
     */
    setAST(ast: ASTNode): void {
        this.ast = ast
        this.emit('ast:change', ast)
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
     * 触发事件
     */
    emit(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error)
                }
            })
        }
    }

    /**
     * 聚焦
     */
    focus(): void {
        this.adapter?.focus()
    }

    /**
     * 失焦
     */
    blur(): void {
        this.adapter?.blur()
    }

    /**
     * 是否聚焦
     */
    isFocused(): boolean {
        return this.adapter?.isFocused() || false
    }

    /**
     * 设置适配器事件监听
     */
    private setupAdapterEvents(): void {
        if (!this.adapter) return

        this.adapter.onContentChange((content: string) => {
            this.emit('content:change', content)
        })

        this.adapter.onSelectionChange((selection: string) => {
            this.emit('selection:change', selection)
        })

        this.adapter.onFocus(() => {
            this.emit('focus')
        })

        this.adapter.onBlur(() => {
            this.emit('blur')
        })

        this.adapter.onKeyDown((event: KeyboardEvent) => {
            this.emit('keydown', event)
        })
    }
} 