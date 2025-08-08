/**
 * 优化后的基础视图适配器
 * 
 * 架构改进：
 * 1. 职责分离：将错误处理、性能监控、AI功能分离到专门的混入类
 * 2. 更清晰的接口设计：简化核心适配器接口
 * 3. 可组合架构：通过混入模式增强功能
 * 4. 防御型编程：增强输入验证和状态检查
 */

import { ViewAdapterOptions, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'
// import { EditorTheme } from '@/components/Editor/types/EditorTheme'

// === 核心接口定义 ===

/**
 * 适配器状态枚举
 */
export enum AdapterState {
    UNINITIALIZED = 'uninitialized',
    INITIALIZING = 'initializing',
    READY = 'ready',
    UPDATING = 'updating',
    DESTROYING = 'destroying',
    DESTROYED = 'destroyed',
    ERROR = 'error'
}

/**
 * 生命周期钩子接口
 */
export interface LifecycleHooks {
    beforeCreate?: () => Promise<void>
    created?: () => Promise<void>
    beforeDestroy?: () => Promise<void>
    destroyed?: () => Promise<void>
    beforeUpdate?: (ast: DocumentAST) => Promise<boolean>
    updated?: (ast: DocumentAST) => Promise<void>
}

/**
 * 适配器能力接口
 */
export interface AdapterCapabilities {
    readonly canEdit: boolean
    readonly canSelect: boolean
    readonly canZoom: boolean
    readonly canDrag: boolean
    readonly supportsUndo: boolean
    readonly supportsSearch: boolean
    readonly supportsAI: boolean
}

/**
 * 事件回调类型映射
 */
export interface AdapterEventMap {
    stateChange: (state: AdapterState) => void
    nodeClick: (data: { nodeId: string; event: MouseEvent }) => void
    nodeDoubleClick: (data: { nodeId: string; event: MouseEvent }) => void
    selectionChange: (selection: Selection) => void
    viewChange: (viewData: any) => void
    focus: () => void
    blur: () => void
    error: (error: Error) => void
}

// === 核心基类 ===

/**
 * 核心视图适配器基类
 * 只包含最基本的适配器功能，职责单一
 */
export abstract class CoreViewAdapter {
    // === 抽象属性（由子类实现）===
    public abstract readonly type: EditorType
    public abstract readonly capabilities: AdapterCapabilities

    // === 核心状态 ===
    protected state: AdapterState = AdapterState.UNINITIALIZED
    protected element: HTMLElement | null = null
    protected options: ViewAdapterOptions | null = null
    protected sceneTemplate: SceneTemplate

    // === 事件系统 ===
    private eventListeners = new Map<keyof AdapterEventMap, Function[]>()

    // === 生命周期钩子 ===
    protected hooks: LifecycleHooks = {}

    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
    }

    // === 抽象方法（子类必须实现）===
    protected abstract performCreate(element: HTMLElement, options: ViewAdapterOptions): Promise<void>
    protected abstract performDestroy(): void
    protected abstract performRender(ast: DocumentAST): void
    protected abstract performUpdateNode(nodeId: string, node: ASTNode): void
    protected abstract performRemoveNode(nodeId: string): void
    protected abstract performAddNode(node: ASTNode, parentId?: string, index?: number): void
    protected abstract performSetSelection(selection: Selection): void
    protected abstract performGetSelection(): Selection
    protected abstract performFocus(): void
    protected abstract performBlur(): void
    protected abstract performGetViewport(): Viewport
    protected abstract performSetViewport(viewport: Viewport): void

    // === 公共 API ===

    /**
     * 创建适配器
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        this.validateState([AdapterState.UNINITIALIZED])
        this.validateInput(element, 'element')
        this.validateInput(options, 'options')

        this.setState(AdapterState.INITIALIZING)

        try {
            await this.hooks.beforeCreate?.()

            this.element = element
            this.options = { ...options }

            await this.performCreate(element, options)

            this.setState(AdapterState.READY)
            await this.hooks.created?.()

        } catch (error) {
            this.setState(AdapterState.ERROR)
            throw error
        }
    }

    /**
     * 销毁适配器
     */
    async destroy(): Promise<void> {
        if (this.isDestroyed()) return

        this.setState(AdapterState.DESTROYING)

        try {
            await this.hooks.beforeDestroy?.()
            this.performDestroy()
            this.cleanup()
            this.setState(AdapterState.DESTROYED)
            await this.hooks.destroyed?.()
        } catch (error) {
            this.setState(AdapterState.ERROR)
            throw error
        }
    }

    /**
     * 渲染 AST
     */
    async render(ast: DocumentAST): Promise<void> {
        this.validateState([AdapterState.READY])
        this.validateInput(ast, 'ast')

        const previousState = this.state
        this.setState(AdapterState.UPDATING)

        try {
            const shouldContinue = await this.hooks.beforeUpdate?.(ast) ?? true
            if (!shouldContinue) return

            this.performRender(ast)

            this.setState(previousState)
            await this.hooks.updated?.(ast)

        } catch (error) {
            this.setState(AdapterState.ERROR)
            throw error
        }
    }

    /**
     * 更新节点
     */
    updateNode(nodeId: string, node: ASTNode): void {
        this.validateState([AdapterState.READY])
        this.validateInput(nodeId, 'nodeId')
        this.validateInput(node, 'node')

        this.performUpdateNode(nodeId, node)
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        this.validateState([AdapterState.READY])
        this.validateInput(nodeId, 'nodeId')

        this.performRemoveNode(nodeId)
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        this.validateState([AdapterState.READY])
        this.validateInput(node, 'node')

        this.performAddNode(node, parentId, index)
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        this.validateState([AdapterState.READY])
        this.validateInput(selection, 'selection')

        this.performSetSelection(selection)
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        this.validateState([AdapterState.READY])
        return this.performGetSelection()
    }

    /**
     * 设置焦点
     */
    focus(): void {
        this.validateState([AdapterState.READY])
        this.performFocus()
    }

    /**
     * 失去焦点
     */
    blur(): void {
        this.validateState([AdapterState.READY])
        this.performBlur()
    }

    /**
     * 获取视口
     */
    getViewport(): Viewport {
        this.validateState([AdapterState.READY])
        return this.performGetViewport()
    }

    /**
     * 设置视口
     */
    setViewport(viewport: Viewport): void {
        this.validateState([AdapterState.READY])
        this.validateInput(viewport, 'viewport')

        this.performSetViewport(viewport)
    }

    // === 状态管理 ===

    /**
     * 获取当前状态
     */
    getState(): AdapterState {
        return this.state
    }

    /**
     * 检查是否已就绪
     */
    isReady(): boolean {
        return this.state === AdapterState.READY
    }

    /**
     * 检查是否已销毁
     */
    isDestroyed(): boolean {
        return this.state === AdapterState.DESTROYED
    }

    /**
     * 检查是否有错误
     */
    hasError(): boolean {
        return this.state === AdapterState.ERROR
    }

    // === 事件系统 ===

    /**
     * 监听事件
     */
    on<K extends keyof AdapterEventMap>(event: K, callback: AdapterEventMap[K]): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    /**
     * 取消监听事件
     */
    off<K extends keyof AdapterEventMap>(event: K, callback: AdapterEventMap[K]): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            const index = listeners.indexOf(callback)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }

    /**
     * 设置生命周期钩子
     */
    setHooks(hooks: Partial<LifecycleHooks>): void {
        this.hooks = { ...this.hooks, ...hooks }
    }

    // === 受保护的方法 ===

    /**
     * 设置状态
     */
    protected setState(newState: AdapterState): void {
        const oldState = this.state
        this.state = newState
        this.emit('stateChange', newState)

        console.debug(`[${this.constructor.name}] State: ${oldState} -> ${newState}`)
    }

    /**
     * 触发事件
     */
    protected emit<K extends keyof AdapterEventMap>(
        event: K,
        data?: Parameters<AdapterEventMap[K]>[0]
    ): void {
        const listeners = this.eventListeners.get(event) || []
        listeners.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                console.error(`[${this.constructor.name}] Event handler error:`, error)
            }
        })
    }

    /**
     * 验证状态
     */
    protected validateState(allowedStates: AdapterState[]): void {
        if (!allowedStates.includes(this.state)) {
            throw new Error(
                `Invalid state: ${this.state}. Expected one of: ${allowedStates.join(', ')}`
            )
        }
    }

    /**
     * 验证输入
     */
    protected validateInput(value: any, name: string): void {
        if (value === null || value === undefined) {
            throw new Error(`Required parameter '${name}' is missing`)
        }
    }

    /**
     * 清理资源
     */
    protected cleanup(): void {
        this.element = null
        this.options = null
        this.eventListeners.clear()
        this.hooks = {}
    }

    // === 便利方法 ===

    /**
     * 安全执行异步操作
     */
    protected async safeAsync<T>(
        operation: () => Promise<T>,
        context: string,
        fallback?: T
    ): Promise<T | undefined> {
        try {
            return await operation()
        } catch (error) {
            console.error(`[${this.constructor.name}] Error in ${context}:`, error)
            this.emit('error', error as Error)
            return fallback
        }
    }

    /**
     * 安全执行同步操作
     */
    protected safeSync<T>(
        operation: () => T,
        context: string,
        fallback?: T
    ): T | undefined {
        try {
            return operation()
        } catch (error) {
            console.error(`[${this.constructor.name}] Error in ${context}:`, error)
            this.emit('error', error as Error)
            return fallback
        }
    }
}

// === 功能混入接口 ===

/**
 * 错误处理混入接口
 */
export interface ErrorHandlingMixin {
    getErrorHistory(): any[]
    clearErrorHistory(): void
    setErrorHandler(handler: (error: Error) => void): void
}

/**
 * 性能监控混入接口
 */
export interface PerformanceMonitoringMixin {
    getPerformanceStats(): any
    startProfiling(): void
    stopProfiling(): void
    clearMetrics(): void
}

/**
 * AI 功能混入接口
 */
export interface AIMixin {
    requestAICompletion(context: string, position: number): Promise<string>
    requestAIRewrite(content: string, style: string): Promise<string>
    getAISuggestions(context?: string): Promise<string[]>
    applyAISuggestion(suggestion: string): Promise<void>
}

// === 实用工具 ===

/**
 * 创建适配器构建器
 */
export class AdapterBuilder<T extends CoreViewAdapter> {
    private enabledMixins: {
        errorHandling: boolean
        performanceMonitoring: boolean
        ai: boolean
    } = {
            errorHandling: false,
            performanceMonitoring: false,
            ai: false
        }

    private mixinConfigs: {
        errorHandling?: any
        performanceMonitoring?: any
        ai?: any
    } = {}

    constructor(private BaseClass: new (sceneTemplate: SceneTemplate) => T) { }

    /**
     * 添加错误处理功能
     */
    withErrorHandling(config?: any): this {
        this.enabledMixins.errorHandling = true
        if (config) {
            this.mixinConfigs.errorHandling = config
        }
        return this
    }

    /**
     * 添加性能监控功能
     */
    withPerformanceMonitoring(config?: any): this {
        this.enabledMixins.performanceMonitoring = true
        if (config) {
            this.mixinConfigs.performanceMonitoring = config
        }
        return this
    }

    /**
     * 添加 AI 功能
     */
    withAI(config?: any): this {
        this.enabledMixins.ai = true
        if (config) {
            this.mixinConfigs.ai = config
        }
        return this
    }

    /**
     * 构建最终的适配器类
     */
    build(): new (sceneTemplate: SceneTemplate) => T & ErrorHandlingMixin & PerformanceMonitoringMixin & AIMixin {
        // 动态导入混入应用器以避免循环依赖
        const { createEnhancedAdapter } = require('../utils/MixinApplier')

        return createEnhancedAdapter(this.BaseClass, {
            enableErrorHandling: this.enabledMixins.errorHandling,
            enablePerformanceMonitoring: this.enabledMixins.performanceMonitoring,
            enableAI: this.enabledMixins.ai,
            errorHandlingConfig: this.mixinConfigs.errorHandling,
            performanceConfig: this.mixinConfigs.performanceMonitoring,
            aiConfig: this.mixinConfigs.ai
        })
    }
}

/**
 * 创建适配器的便利函数
 */
export function createAdapter<T extends CoreViewAdapter>(
    BaseClass: new (sceneTemplate: SceneTemplate) => T
): AdapterBuilder<T> {
    return new AdapterBuilder(BaseClass)
}
