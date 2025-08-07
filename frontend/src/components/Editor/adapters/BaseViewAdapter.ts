/**
 * 基础视图适配器
 * 提供通用的适配器功能实现，减少代码重复
 */

import { ViewAdapter, ViewAdapterOptions, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'

/**
 * 事件回调类型
 */
export type EventCallback<T = any> = (data: T) => void

/**
 * 事件映射类型
 */
export type EventMap = {
    nodeClick: (data: { nodeId: string; event: MouseEvent }) => void
    nodeDoubleClick: (data: { nodeId: string; event: MouseEvent }) => void
    selectionChange: (selection: Selection) => void
    viewChange: (viewData: any) => void
    focus: () => void
    blur: () => void
    textChange: (text: string) => void
    formatChange: (format: any) => void
    error: (error: Error) => void
    nodeDrag: (data: { nodeId: string; position: { x: number; y: number } }) => void
    edgeClick: (data: { edgeId: string; event: MouseEvent }) => void
}

/**
 * 基础视图适配器实现
 */
export abstract class BaseViewAdapter implements ViewAdapter {
    public abstract readonly type: EditorType
    public sceneTemplate: SceneTemplate
    
    protected element: HTMLElement | null = null
    protected options: ViewAdapterOptions | null = null
    protected eventCallbacks: Map<keyof EventMap, EventCallback[]> = new Map()
    protected isDestroyed = false
    protected isInitialized = false
    protected errorHandler?: (error: Error) => void

    /**
     * 构造函数
     */
    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
    }

    /**
     * 创建适配器 - 抽象方法，由子类实现
     */
    abstract create(element: HTMLElement, options: ViewAdapterOptions): Promise<void>

    /**
     * 销毁适配器
     */
    destroy(): void {
        if (this.isDestroyed) return

        try {
            this.performDestroy()
        } catch (error) {
            this.handleError(error as Error, 'destroy')
        } finally {
            this.cleanup()
        }
    }

    /**
     * 执行销毁逻辑 - 由子类实现
     */
    protected abstract performDestroy(): void

    /**
     * 清理资源
     */
    protected cleanup(): void {
        this.element = null
        this.options = null
        this.eventCallbacks.clear()
        this.isDestroyed = true
        this.isInitialized = false
    }

    /**
     * 渲染AST - 抽象方法，由子类实现
     */
    abstract render(ast: DocumentAST): void

    /**
     * 更新AST
     */
    update(ast: DocumentAST): void {
        if (!this.isInitialized || this.isDestroyed) {
            this.handleError(new Error('Adapter not initialized'), 'update')
            return
        }

        try {
            this.render(ast)
        } catch (error) {
            this.handleError(error as Error, 'update')
        }
    }

    /**
     * 更新节点 - 抽象方法，由子类实现
     */
    abstract updateNode(nodeId: string, node: ASTNode): void

    /**
     * 删除节点 - 抽象方法，由子类实现
     */
    abstract removeNode(nodeId: string): void

    /**
     * 添加节点 - 抽象方法，由子类实现
     */
    abstract addNode(node: ASTNode, parentId?: string, index?: number): void

    /**
     * 设置选择状态 - 抽象方法，由子类实现
     */
    abstract setSelection(selection: Selection): void

    /**
     * 获取选择状态 - 抽象方法，由子类实现
     */
    abstract getSelection(): Selection

    /**
     * 设置焦点 - 抽象方法，由子类实现
     */
    abstract focus(): void

    /**
     * 失去焦点 - 抽象方法，由子类实现
     */
    abstract blur(): void

    /**
     * 是否获得焦点 - 抽象方法，由子类实现
     */
    abstract isFocused(): boolean

    /**
     * 滚动到节点 - 抽象方法，由子类实现
     */
    abstract scrollToNode(nodeId: string): void

    /**
     * 放大视图 - 抽象方法，由子类实现
     */
    abstract zoomIn(): void

    /**
     * 缩小视图 - 抽象方法，由子类实现
     */
    abstract zoomOut(): void

    /**
     * 重置缩放 - 抽象方法，由子类实现
     */
    abstract resetZoom(): void

    /**
     * 适应视图 - 抽象方法，由子类实现
     */
    abstract fitToView(): void

    /**
     * 获取视口 - 抽象方法，由子类实现
     */
    abstract getViewport(): Viewport

    /**
     * 设置视口 - 抽象方法，由子类实现
     */
    abstract setViewport(viewport: Viewport): void

    // 事件监听方法
    /**
     * 节点点击事件
     */
    onNodeClick(callback: (data: { nodeId: string; event: MouseEvent }) => void): void {
        this.addEventListener('nodeClick', callback)
    }

    /**
     * 节点双击事件
     */
    onNodeDoubleClick(callback: (data: { nodeId: string; event: MouseEvent }) => void): void {
        this.addEventListener('nodeDoubleClick', callback)
    }

    /**
     * 选择状态变化事件
     */
    onSelectionChange(callback: EventCallback<Selection>): void {
        this.addEventListener('selectionChange', callback)
    }

    /**
     * 视图变化事件
     */
    onViewChange(callback: EventCallback<any>): void {
        this.addEventListener('viewChange', callback)
    }

    /**
     * 获得焦点事件
     */
    onFocus(callback: EventCallback<void>): void {
        this.addEventListener('focus', callback)
    }

    /**
     * 失去焦点事件
     */
    onBlur(callback: EventCallback<void>): void {
        this.addEventListener('blur', callback)
    }

    /**
     * 错误事件
     */
    onError(callback: EventCallback<Error>): void {
        this.errorHandler = callback
    }

    // 场景模板方法 - 简化实现

    // 场景模板方法 - 默认实现
    /**
     * 应用场景模板
     */
    applySceneTemplate(template: SceneTemplate): void {
        this.sceneTemplate = template
        this.triggerEvent('viewChange', { type: 'templateChange', template })
    }

    /**
     * 获取场景特性
     */
    getSceneFeatures(): any {
        return {
            templates: [],
            tools: [],
            shortcuts: []
        }
    }

    /**
     * 自定义场景设置
     */
    customizeSceneSettings(settings: any): void {
        this.triggerEvent('viewChange', { type: 'settingsChange', settings })
    }

    // 协作方法已移除 - 面向C端，不需要协同编辑功能

    // AI Native Editor 核心方法
    /**
     * 请求AI补全 - 智能文本补全
     */
    async requestAICompletion(context: string, position: number): Promise<string> {
        // 子类可以重写此方法实现具体的AI补全逻辑
        throw new Error('AI completion not implemented in this adapter')
    }

    /**
     * 请求AI重写 - 智能内容重写
     */
    async requestAIRewrite(content: string, style: string): Promise<string> {
        // 子类可以重写此方法实现具体的AI重写逻辑
        throw new Error('AI rewrite not implemented in this adapter')
    }

    /**
     * 请求AI研究 - 智能研究助手
     */
    async requestAIResearch(query: string): Promise<any> {
        // 子类可以重写此方法实现具体的AI研究逻辑
        throw new Error('AI research not implemented in this adapter')
    }

    /**
     * 提取知识 - 智能知识提取
     */
    async extractKnowledge(content: string): Promise<any> {
        // 子类可以重写此方法实现具体的知识提取逻辑
        throw new Error('Knowledge extraction not implemented in this adapter')
    }

    /**
     * 获取当前内容上下文 - 用于AI分析
     */
    protected getCurrentContext(): string {
        // 子类可以重写此方法提供当前编辑器的上下文信息
        return ''
    }

    /**
     * 获取AI建议 - 智能建议系统
     */
    async getAISuggestions(context?: string): Promise<string[]> {
        // 子类可以重写此方法实现智能建议功能
        return []
    }

    /**
     * 应用AI建议 - 应用AI生成的建议
     */
    async applyAISuggestion(suggestion: string): Promise<void> {
        // 子类可以重写此方法实现建议应用逻辑
        throw new Error('AI suggestion application not implemented in this adapter')
    }

    // 保护方法
    /**
     * 添加事件监听器
     */
    protected addEventListener<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, [])
        }
        this.eventCallbacks.get(event)!.push(callback)
    }

    /**
     * 触发事件
     */
    protected triggerEvent<K extends keyof EventMap>(event: K, data?: Parameters<EventMap[K]>[0]): void {
        if (this.isDestroyed || !this.isInitialized) return

        const callbacks = this.eventCallbacks.get(event)
        if (callbacks) {
            callbacks.forEach(callback => {
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
    protected handleError(error: Error, context: string): void {
        console.error(`[${this.constructor.name}] Error in ${context}:`, error)
        
        if (this.errorHandler) {
            this.errorHandler(error)
        } else {
            this.triggerEvent('error', error)
        }
    }

    /**
     * 验证初始化状态
     */
    protected validateInitialized(): boolean {
        if (!this.isInitialized || this.isDestroyed) {
            this.handleError(new Error('Adapter not initialized'), 'validateInitialized')
            return false
        }
        return true
    }

    /**
     * 应用主题样式
     */
    protected applyTheme(theme: EditorTheme): void {
        if (!this.element) return

        // 移除现有主题类
        this.element.classList.remove('theme-light', 'theme-dark', 'theme-auto')
        
        // 添加新主题类
        const themeClass = theme === 'auto' ? 'theme-auto' : `theme-${theme}`
        this.element.classList.add(themeClass)
    }

    /**
     * 防抖函数
     */
    protected debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout | null = null
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => func(...args), wait)
        }
    }

    /**
     * 节流函数
     */
    protected throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean = false
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args)
                inThrottle = true
                setTimeout(() => inThrottle = false, limit)
            }
        }
    }

    /**
     * 批量更新
     */
    protected batchUpdate(updates: (() => void)[]): void {
        if (updates.length === 0) return

        // 使用 requestAnimationFrame 进行批量更新
        requestAnimationFrame(() => {
            updates.forEach(update => {
                try {
                    update()
                } catch (error) {
                    this.handleError(error as Error, 'batchUpdate')
                }
            })
        })
    }

    /**
     * 安全执行异步操作
     */
    protected async safeAsync<T>(operation: () => Promise<T>, context: string): Promise<T | null> {
        try {
            return await operation()
        } catch (error) {
            this.handleError(error as Error, context)
            return null
        }
    }

    /**
     * 安全执行同步操作
     */
    protected safeSync<T>(operation: () => T, context: string): T | null {
        try {
            return operation()
        } catch (error) {
            this.handleError(error as Error, context)
            return null
        }
    }
} 