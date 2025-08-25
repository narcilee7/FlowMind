/**
 * 基础视图适配器
 * 提供通用的适配器功能实现，减少代码重复
 */

import { ViewAdapter, ViewAdapterOptions, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'
import { EditorErrorInfo, EditorErrorSeverity, EditorErrorType } from '@/components/Editor/types/EditorError'
import { PerformanceMetrics, PerformanceConfig } from '@/components/Editor/types/EditorPerformance'

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
    // 编辑器类型：抽象属性只读，由子类实现
    public abstract readonly type: EditorType
    // 场景模板：由子类实现构造函数初始化，用于存储适配器创建的场景模板
    public sceneTemplate: SceneTemplate

    // 基础属性
    // 元素：用于存储适配器创建的DOM元素
    protected element: HTMLElement | null = null
    // 选项：用于存储适配器创建时的配置选项
    protected options: ViewAdapterOptions | null = null
    // 事件回调：用于存储事件回调函数
    protected eventCallbacks: Map<keyof EventMap, EventCallback[]> = new Map()
    // 销毁状态：用于标识适配器是否已销毁
    protected isDestroyed = false
    // 初始化状态：用于标识适配器是否已初始化
    protected isInitialized = false
    // 错误处理器：用于处理错误事件
    protected errorHandler?: (error: Error) => void
    // 错误计数：用于记录错误发生的次数
    protected errorCount = 0
    // 最后一次错误时间：用于记录最后一次错误发生的时间
    protected lastErrorTime = 0

    // 错误历史：用于记录错误发生的历史
    private errorHistory: EditorErrorInfo[] = []
    // 最大错误历史：用于限制错误历史记录的最大数量
    private readonly MAX_ERROR_HISTORY = 50
    // 最大重试次数：用于限制错误重试的最大次数
    private readonly MAX_RETRY_ATTEMPTS = 3
    // 错误恢复策略：用于存储不同错误类型的恢复策略
    private readonly errorRecoveryStrategies: Map<EditorErrorType, () => void> = new Map()
    // 性能指标：用于记录性能指标
    private performanceMetricsList: PerformanceMetrics[] = []
    // 性能配置：用于存储性能配置选项
    private performanceMetricsOptions: PerformanceConfig | null = null
    // 操作开始时间：用于记录操作开始的时间
    private operationStartTime: number = 0

    /**
     * 构造函数
     */
    constructor(sceneTemplate: SceneTemplate, options: ViewAdapterOptions) {
        // 初始化场景模板
        this.sceneTemplate = sceneTemplate
        // 初始化错误恢复策略
        this.initializeErrorRecoveryStrategies()
        // 初始化性能监控配置
        const performanceMetricsOptions = {
            enableProfiling: options.enableProfiling,
            maxMetricsHistory: options.maxMetricsHistory ?? 100,
            slowOperationThreshold: options.slowOperationThreshold ?? 100,
            memoryWarningThreshold: options.memoryWarningThreshold ?? 50 * 1024 * 1024
        } as PerformanceConfig
        // 初始化性能配置
        this.performanceMetricsOptions = performanceMetricsOptions
        // 初始化性能监控
        this.initializePerformanceMonitoring(performanceMetricsOptions)
    }

    /**
     * 初始化错误恢复策略
     */
    private initializeErrorRecoveryStrategies(): void {
        this.errorRecoveryStrategies.set(EditorErrorType.INITIALIZATION, () => {
            this.handleInitializationError()
        })
        
        this.errorRecoveryStrategies.set(EditorErrorType.RENDERING, () => {
            this.handleRenderingError()
        })
        
        this.errorRecoveryStrategies.set(EditorErrorType.MEMORY, () => {
            this.handleMemoryError()
        })
        
        this.errorRecoveryStrategies.set(EditorErrorType.USER_INTERACTION, () => {
            this.handleUserInteractionError()
        })
    }

    /**
     * 初始化性能监控
     */
    private initializePerformanceMonitoring(options: PerformanceConfig): void {
        if (!options.enableProfiling) return
        this.performanceMetricsOptions = {
            // 是否启用性能监控
            enableProfiling: options.enableProfiling,
            // 最大性能指标历史记录数
            maxMetricsHistory: options.maxMetricsHistory,
            // 慢操作阈值
            slowOperationThreshold: options.slowOperationThreshold,
            // 内存警告阈值
            memoryWarningThreshold: options.memoryWarningThreshold
        }
        this.startPerformanceMonitoring()
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

    // AI Native Workspace 核心方法
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
     * 错误处理方法
     */
    protected handleError(error: Error, context: string): void {
        const errorInfo = this.classifyError(error, context)
        this.errorHistory.push(errorInfo)
        
        // 限制错误历史大小
        if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
            this.errorHistory = this.errorHistory.slice(-this.MAX_ERROR_HISTORY)
        }
        
        console.error(`[${this.constructor.name}] Error in ${context}:`, error)
        
        // 尝试自动恢复
        if (errorInfo.recoverable && errorInfo.retryCount < this.MAX_RETRY_ATTEMPTS) {
            this.attemptErrorRecovery(errorInfo)
        }
        
        // 触发错误事件
        if (this.errorHandler) {
            this.errorHandler(error)
        } else {
            this.triggerEvent('error', error)
        }
    }

    /**
     * 错误分类
     */
    private classifyError(error: Error, context: string): EditorErrorInfo {
        let type = EditorErrorType.UNKNOWN
        let severity = EditorErrorSeverity.MEDIUM
        let recoverable = true
        
        // 根据错误信息和上下文分类
        if (context.includes('create') || context.includes('init')) {
            type = EditorErrorType.INITIALIZATION
            severity = EditorErrorSeverity.HIGH
        } else if (context.includes('render') || context.includes('update')) {
            type = EditorErrorType.RENDERING
            severity = EditorErrorSeverity.MEDIUM
        } else if (context.includes('memory') || context.includes('out of memory')) {
            type = EditorErrorType.MEMORY
            severity = EditorErrorSeverity.CRITICAL
            recoverable = false
        } else if (context.includes('click') || context.includes('key') || context.includes('drag')) {
            type = EditorErrorType.USER_INTERACTION
            severity = EditorErrorSeverity.LOW
        }
        
        return {
            id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            type,
            severity,
            message: error.message,
            context,
            timestamp: Date.now(),
            recoverable,
            retryCount: 0
        }
    }

    /**
     * 尝试错误恢复
     */
    private attemptErrorRecovery(errorInfo: EditorErrorInfo): void {
        const strategy = this.errorRecoveryStrategies.get(errorInfo.type)
        if (strategy) {
            try {
                strategy()
                errorInfo.retryCount++
                console.log(`[${this.constructor.name}] Error recovery attempted for ${errorInfo.type}`)
            } catch (recoveryError) {
                console.error(`[${this.constructor.name}] Error recovery failed:`, recoveryError)
            }
        }
    }

    /**
     * 处理初始化错误
     */
    protected handleInitializationError(): void {
        if (this.isInitialized) {
            // 重新初始化
            this.isInitialized = false
            this.cleanup()
            // 子类可以重写此方法实现具体的重新初始化逻辑
        }
    }

    /**
     * 处理渲染错误
     */
    protected handleRenderingError(): void {
        // 子类可以重写此方法实现具体的渲染错误恢复逻辑
        console.log(`[${this.constructor.name}] Rendering error recovery triggered`)
    }

    /**
     * 处理内存错误
     */
    protected handleMemoryError(): void {
        // 子类可以重写此方法实现具体的内存错误恢复逻辑
        console.log(`[${this.constructor.name}] Memory error recovery triggered`)
        
        // 强制垃圾回收（如果可用）
        if (window.gc) {
            window.gc()
        }
    }

    /**
     * 处理用户交互错误
     */
    protected handleUserInteractionError(): void {
        // 子类可以重写此方法实现具体的用户交互错误恢复逻辑
        console.log(`[${this.constructor.name}] User interaction error recovery triggered`)
    }

    /**
     * 获取错误统计信息
     */
    public getErrorStats(): {
        total: number
        byType: Record<EditorErrorType, number>
        bySeverity: Record<EditorErrorSeverity, number>
        recentErrors: EditorErrorInfo[]
    } {
        const stats = {
            total: this.errorHistory.length,
            byType: {} as Record<EditorErrorType, number>,
            bySeverity: {} as Record<EditorErrorSeverity, number>,
            recentErrors: this.errorHistory.slice(-10)
        }
        
        // 统计错误类型
        Object.values(EditorErrorType).forEach(type => {
            stats.byType[type] = this.errorHistory.filter(e => e.type === type).length
        })
        
        // 统计错误严重程度
        Object.values(EditorErrorSeverity).forEach(severity => {
            stats.bySeverity[severity] = this.errorHistory.filter(e => e.severity === severity).length
        })
        
        return stats
    }

    /**
     * 清除错误历史
     */
    public clearErrorHistory(): void {
        if (this.errorHistory.length === 0) return
        this.errorHistory = []
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
     * 批量更新
     */
    protected batchUpdate(updates: (() => void)[]): void {
        if (updates.length === 0) return

        // 使用 requestAnimationFrame 进行批量更新
        requestAnimationFrame(() => {
            updates.forEach(callback => {
                try {
                    callback()
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

    /**
     * 开始性能监控
     */
    protected startPerformanceMonitoring(): void {
        this.operationStartTime = performance.now()
        this.performanceMetricsList.push({
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0,
            operationCount: 0,
            errorRate: 0,
            lastUpdate: this.operationStartTime,
            createdAt: Date.now()
        })
    }

    /**
     * 结束性能监控
     */
    protected endPerformanceMonitoring(operation: string): void {
        if (!this.performanceMetricsOptions?.enableProfiling) return

        const duration = performance.now() - this.operationStartTime
        const memoryUsage = this.getMemoryUsage()
        
        const metrics: PerformanceMetrics = {
            renderTime: operation === 'render' ? duration : 0,
            updateTime: operation === 'update' ? duration : 0,
            memoryUsage,
            operationCount: 1,
            errorRate: 0,
            lastUpdate: Date.now()
        }
        
        this.performanceMetricsList.push(metrics)
        
        // 限制历史记录大小
        if (this.performanceMetricsList.length > this.performanceMetricsOptions.maxMetricsHistory) {
            this.performanceMetricsList = this.performanceMetricsList.slice(-this.performanceMetricsOptions.maxMetricsHistory)
        }
        
        // 检查慢操作
        if (duration > this.performanceMetricsOptions.slowOperationThreshold) {
            console.warn(`[${this.constructor.name}] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`)
        }
        
        // 检查内存使用
        if (memoryUsage > this.performanceMetricsOptions.memoryWarningThreshold) {
            console.warn(`[${this.constructor.name}] High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`)
        }
    }

    /**
     * 获取内存使用情况
     */
    private getMemoryUsage(): number {
        if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize
        }
        return 0
    }

    /**
     * 获取性能统计信息
     */
    public getPerformanceStats(): {
        averageRenderTime: number
        averageUpdateTime: number
        averageMemoryUsage: number
        totalOperations: number
        slowOperations: number
        errorRate: number
        recommendations: string[]
    } {
        if (this.performanceMetricsList.length === 0 || !this.performanceMetricsOptions?.enableProfiling) {
            return {
                averageRenderTime: 0,
                averageUpdateTime: 0,
                averageMemoryUsage: 0,
                totalOperations: 0,
                slowOperations: 0,
                errorRate: 0,
                recommendations: []
            }
        }
        
        const renderTimes = this.performanceMetricsList.filter(m => m.renderTime > 0).map(m => m.renderTime)
        const updateTimes = this.performanceMetricsList.filter(m => m.updateTime > 0).map(m => m.updateTime)
        const memoryUsages = this.performanceMetricsList.map(m => m.memoryUsage)
        
        const averageRenderTime = renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0
        const averageUpdateTime = updateTimes.length > 0 ? updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length : 0
        const averageMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
        const totalOperations = this.performanceMetricsList.length
        const slowOperations = this.performanceMetricsList.filter(m => 
            m.renderTime > this.performanceMetricsOptions!.slowOperationThreshold || 
            m.updateTime > this.performanceMetricsOptions!.slowOperationThreshold
        ).length
        
        const errorRate = this.getErrorStats().total / totalOperations
        
        // 生成优化建议
        const recommendations: string[] = []
        if (averageRenderTime > this.performanceMetricsOptions.slowOperationThreshold) {
            recommendations.push('Consider implementing virtual scrolling for large documents')
        }
        if (averageMemoryUsage > this.performanceMetricsOptions.memoryWarningThreshold) {
            recommendations.push('Consider implementing memory cleanup and object pooling')
        }
        if (errorRate > 0.1) {
            recommendations.push('High error rate detected, review error handling logic')
        }
        
        return {
            averageRenderTime,
            averageUpdateTime,
            averageMemoryUsage,
            totalOperations,
            slowOperations,
            errorRate,
            recommendations
        }
    }

    /**
     * 设置性能监控配置
     */
    public setPerformanceConfig(config: Partial<PerformanceConfig>): void {
        this.performanceMetricsOptions = { ...this.performanceMetricsOptions!, ...config }
    }

    /**
     * 清除性能指标
     */
    public clearPerformanceMetrics(): void {
        this.performanceMetricsList = []
    }

    /**
     * 优化渲染性能
     */
    protected optimizeRendering(): void {
        // 使用 requestAnimationFrame 进行批量更新
        requestAnimationFrame(() => {
            this.performBatchUpdate()
        })
    }

    /**
     * 执行批量更新
     */
    protected performBatchUpdate(): void {
        // 子类可以重写此方法实现具体的批量更新逻辑
        console.log(`[${this.constructor.name}] Batch update performed`)
    }

    /**
     * 智能缓存管理
     */
    protected manageCache(): void {
        // 子类可以重写此方法实现具体的缓存管理逻辑
        console.log(`[${this.constructor.name}] Cache management performed`)
    }

    /**
     * 内存优化
     */
    protected optimizeMemory(): void {
        // 清理过期的性能指标
        if (this.performanceMetricsList.length > this.performanceMetricsOptions!.maxMetricsHistory) {
            this.performanceMetricsList = this.performanceMetricsList.slice(-this.performanceMetricsOptions!.maxMetricsHistory)
        }
        
        // 清理错误历史
        if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
            this.errorHistory = this.errorHistory.slice(-this.MAX_ERROR_HISTORY)
        }
        
        // 强制垃圾回收（如果可用）
        if (window.gc) {
            window.gc()
        }
    }

    /**
     * 健康检查
     */
    public healthCheck(): {
        isHealthy: boolean
        issues: string[]
        recommendations: string[]
        stats: {
            errorRate: number
            performanceScore: number
            memoryUsage: number
        }
    } {
        const errorStats = this.getErrorStats()
        const performanceStats = this.getPerformanceStats()
        
        const issues: string[] = []
        const recommendations: string[] = []
        
        // 检查错误率
        if (errorStats.total > 10) {
            issues.push(`High error count: ${errorStats.total}`)
            recommendations.push('Review error handling and recovery mechanisms')
        }
        
        // 检查性能
        if (performanceStats.averageRenderTime > this.performanceMetricsOptions!.slowOperationThreshold) {
            issues.push(`Slow rendering: ${performanceStats.averageRenderTime.toFixed(2)}ms`)
            recommendations.push('Consider implementing virtual scrolling or lazy loading')
        }
        
        // 检查内存使用
        if (performanceStats.averageMemoryUsage > this.performanceMetricsOptions!.memoryWarningThreshold) {
            issues.push(`High memory usage: ${(performanceStats.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB`)
            recommendations.push('Implement memory cleanup and object pooling')
        }
        
        // 计算健康分数
        const errorRate = errorStats.total / Math.max(performanceStats.totalOperations, 1)
        const performanceScore = Math.max(0, 100 - (performanceStats.averageRenderTime / 10))
        const memoryScore = Math.max(0, 100 - (performanceStats.averageMemoryUsage / this.performanceMetricsOptions!.memoryWarningThreshold * 100))
        
        const overallHealth = (performanceScore + memoryScore) / 2 - errorRate * 100
        
        return {
            isHealthy: overallHealth > 70 && issues.length === 0,
            issues,
            recommendations,
            stats: {
                errorRate,
                performanceScore,
                memoryUsage: performanceStats.averageMemoryUsage
            }
        }
    }

    /**
     * 获取适配器状态摘要
     */
    public getStatusSummary(): {
        type: string
        isInitialized: boolean
        isDestroyed: boolean
        errorCount: number
        performanceScore: number
        lastActivity: number
    } {
        const health = this.healthCheck()
        const performanceStats = this.getPerformanceStats()
        
        return {
            type: this.constructor.name,
            isInitialized: this.isInitialized,
            isDestroyed: this.isDestroyed,
            errorCount: this.getErrorStats().total,
            performanceScore: health.stats.performanceScore,
            lastActivity: performanceStats.totalOperations > 0 ? 
                this.performanceMetricsList[this.performanceMetricsList.length - 1]?.lastUpdate || 0 : 0
        }
    }

    /**
     * 重置适配器状态
     */
    public reset(): void {
        try {
            // 清理资源
            this.cleanup()
            
            // 重置状态
            this.isInitialized = false
            this.isDestroyed = false
            
            // 清除历史数据
            this.clearErrorHistory()
            this.clearPerformanceMetrics()
            
            // 重置错误计数
            this.errorCount = 0
            this.lastErrorTime = 0

            // 重置性能指标
            this.performanceMetricsList = []
            
            console.log(`[${this.constructor.name}] Adapter reset successfully`)
        } catch (error) {
            this.handleError(error as Error, 'reset')
        }
    }

    /**
     * 导出调试信息
     */
    public exportDebugInfo(): {
        adapterInfo: any
        errorHistory: EditorErrorInfo[]
        performanceMetrics: PerformanceMetrics[]
        healthCheck: any
        recommendations: string[]
    } {
        return {
            adapterInfo: this.getStatusSummary(),
            errorHistory: [...this.errorHistory],
            performanceMetrics: [...this.performanceMetricsList],
            healthCheck: this.healthCheck(),
            recommendations: [
                ...this.getPerformanceStats().recommendations,
                ...this.healthCheck().recommendations
            ]
        }
    }
}

