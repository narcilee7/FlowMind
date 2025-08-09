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
import { AdapterCapabilities, AdapterEventMap, AdapterState, LifecycleHooks } from '../types/OptimizedViewAdapter'
import { ErrorHandlingMixin } from '../mixins/ErrorHandlingMixin'
import { PerformanceMonitoringMixin } from '../mixins/PerformanceMonitoringMixin'
import { AIMixin } from '../mixins/AIMixin'

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
        // 验证状态
        // TODO：思考是否需要这一步
        if (this.state !== AdapterState.UNINITIALIZED) {
            throw new Error(`Invalid state: ${this.state}. Expected: ${AdapterState.UNINITIALIZED}`)
        }
        // // 验证输入
        this.validateInput(element, 'element')
        this.validateInput(options, 'options')

        // 修改状态为初始化中
        this.setState(AdapterState.INITIALIZING)

        try {
            // 执行生命周期钩子
            await this.hooks.beforeCreate?.()

            // 设置元素和选项
            this.element = element
            this.options = { ...options }

            // 执行真正的实体类创建方法
            await this.performCreate(element, options)

            // 修改状态为就绪
            this.setState(AdapterState.READY)
            // 执行生命周期钩子
            await this.hooks.created?.()

        } catch (error) {
            // 设置状态为错误
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
            // 执行生命周期钩子
            await this.hooks.beforeDestroy?.()
            // 执行真正的实体类销毁方法
            this.performDestroy()
            // 清理资源
            this.cleanup()
            // 修改状态为已销毁
            this.setState(AdapterState.DESTROYED)
            // 执行生命周期钩子
            await this.hooks.destroyed?.()
        } catch (error) {
            // 设置状态为错误
            this.setState(AdapterState.ERROR)
            throw error
        }
    }

    /**
     * 渲染 AST
     */
    async render(ast: DocumentAST): Promise<void> {
        // 验证状态
        this.validateState([AdapterState.READY])
        // 验证输入
        this.validateInput(ast, 'ast')

        // 保存当前状态
        const previousState = this.state
        this.setState(AdapterState.UPDATING)

        try {
            // 执行生命周期钩子
            const shouldContinue = await this.hooks.beforeUpdate?.(ast) ?? true
            if (!shouldContinue) return
            // 执行真正的实体类渲染方法
            this.performRender(ast)
            // 恢复状态
            this.setState(previousState)
            // 执行生命周期钩子
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
