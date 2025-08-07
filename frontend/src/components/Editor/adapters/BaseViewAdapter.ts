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
 * 错误类型枚举
 */
export enum ErrorType {
    INITIALIZATION = 'initialization',
    RENDERING = 'rendering',
    USER_INTERACTION = 'user_interaction',
    NETWORK = 'network',
    MEMORY = 'memory',
    UNKNOWN = 'unknown'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

/**
 * 错误信息结构
 */
export interface ErrorInfo {
    type: ErrorType
    severity: ErrorSeverity
    message: string
    context: string
    timestamp: number
    recoverable: boolean
    retryCount: number
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
    renderTime: number
    updateTime: number
    memoryUsage: number
    operationCount: number
    errorRate: number
    lastUpdate: number
}

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
    enableProfiling: boolean
    maxMetricsHistory: number
    slowOperationThreshold: number
    memoryWarningThreshold: number
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

    // 错误管理增强
    private errorHistory: ErrorInfo[] = []
    private readonly MAX_ERROR_HISTORY = 50
    private readonly MAX_RETRY_ATTEMPTS = 3
    private readonly ERROR_RECOVERY_STRATEGIES = new Map<ErrorType, () => void>()
    protected errorCount = 0
    protected lastErrorTime = 0

    // 性能监控
    private performanceMetrics: PerformanceMetrics[] = []
    private performanceConfig: PerformanceConfig = {
        enableProfiling: true,
        maxMetricsHistory: 100,
        slowOperationThreshold: 100, // 100ms
        memoryWarningThreshold: 50 * 1024 * 1024 // 50MB
    }
    private operationStartTime: number = 0

    /**
     * 构造函数
     */
    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
        this.initializeErrorRecoveryStrategies()
    }

    /**
     * 初始化错误恢复策略
     */
    private initializeErrorRecoveryStrategies(): void {
        this.ERROR_RECOVERY_STRATEGIES.set(ErrorType.INITIALIZATION, () => {
            this.handleInitializationError()
        })
        
        this.ERROR_RECOVERY_STRATEGIES.set(ErrorType.RENDERING, () => {
            this.handleRenderingError()
        })
        
        this.ERROR_RECOVERY_STRATEGIES.set(ErrorType.MEMORY, () => {
            this.handleMemoryError()
        })
        
        this.ERROR_RECOVERY_STRATEGIES.set(ErrorType.USER_INTERACTION, () => {
            this.handleUserInteractionError()
        })
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
     * 增强的错误处理方法
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
    private classifyError(error: Error, context: string): ErrorInfo {
        let type = ErrorType.UNKNOWN
        let severity = ErrorSeverity.MEDIUM
        let recoverable = true
        
        // 根据错误信息和上下文分类
        if (context.includes('create') || context.includes('init')) {
            type = ErrorType.INITIALIZATION
            severity = ErrorSeverity.HIGH
        } else if (context.includes('render') || context.includes('update')) {
            type = ErrorType.RENDERING
            severity = ErrorSeverity.MEDIUM
        } else if (context.includes('memory') || context.includes('out of memory')) {
            type = ErrorType.MEMORY
            severity = ErrorSeverity.CRITICAL
            recoverable = false
        } else if (context.includes('click') || context.includes('key') || context.includes('drag')) {
            type = ErrorType.USER_INTERACTION
            severity = ErrorSeverity.LOW
        }
        
        return {
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
    private attemptErrorRecovery(errorInfo: ErrorInfo): void {
        const strategy = this.ERROR_RECOVERY_STRATEGIES.get(errorInfo.type)
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
        byType: Record<ErrorType, number>
        bySeverity: Record<ErrorSeverity, number>
        recentErrors: ErrorInfo[]
    } {
        const stats = {
            total: this.errorHistory.length,
            byType: {} as Record<ErrorType, number>,
            bySeverity: {} as Record<ErrorSeverity, number>,
            recentErrors: this.errorHistory.slice(-10)
        }
        
        // 统计错误类型
        Object.values(ErrorType).forEach(type => {
            stats.byType[type] = this.errorHistory.filter(e => e.type === type).length
        })
        
        // 统计错误严重程度
        Object.values(ErrorSeverity).forEach(severity => {
            stats.bySeverity[severity] = this.errorHistory.filter(e => e.severity === severity).length
        })
        
        return stats
    }

    /**
     * 清除错误历史
     */
    public clearErrorHistory(): void {
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

    /**
     * 开始性能监控
     */
    protected startPerformanceMonitoring(): void {
        this.operationStartTime = performance.now()
    }

    /**
     * 结束性能监控
     */
    protected endPerformanceMonitoring(operation: string): void {
        if (!this.performanceConfig.enableProfiling) return

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
        
        this.performanceMetrics.push(metrics)
        
        // 限制历史记录大小
        if (this.performanceMetrics.length > this.performanceConfig.maxMetricsHistory) {
            this.performanceMetrics = this.performanceMetrics.slice(-this.performanceConfig.maxMetricsHistory)
        }
        
        // 检查慢操作
        if (duration > this.performanceConfig.slowOperationThreshold) {
            console.warn(`[${this.constructor.name}] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`)
        }
        
        // 检查内存使用
        if (memoryUsage > this.performanceConfig.memoryWarningThreshold) {
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
        if (this.performanceMetrics.length === 0) {
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
        
        const renderTimes = this.performanceMetrics.filter(m => m.renderTime > 0).map(m => m.renderTime)
        const updateTimes = this.performanceMetrics.filter(m => m.updateTime > 0).map(m => m.updateTime)
        const memoryUsages = this.performanceMetrics.map(m => m.memoryUsage)
        
        const averageRenderTime = renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0
        const averageUpdateTime = updateTimes.length > 0 ? updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length : 0
        const averageMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
        const totalOperations = this.performanceMetrics.length
        const slowOperations = this.performanceMetrics.filter(m => 
            m.renderTime > this.performanceConfig.slowOperationThreshold || 
            m.updateTime > this.performanceConfig.slowOperationThreshold
        ).length
        
        const errorRate = this.getErrorStats().total / totalOperations
        
        // 生成优化建议
        const recommendations: string[] = []
        if (averageRenderTime > this.performanceConfig.slowOperationThreshold) {
            recommendations.push('Consider implementing virtual scrolling for large documents')
        }
        if (averageMemoryUsage > this.performanceConfig.memoryWarningThreshold) {
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
        this.performanceConfig = { ...this.performanceConfig, ...config }
    }

    /**
     * 清除性能指标
     */
    public clearPerformanceMetrics(): void {
        this.performanceMetrics = []
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
        if (this.performanceMetrics.length > this.performanceConfig.maxMetricsHistory) {
            this.performanceMetrics = this.performanceMetrics.slice(-this.performanceConfig.maxMetricsHistory)
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
        if (performanceStats.averageRenderTime > this.performanceConfig.slowOperationThreshold) {
            issues.push(`Slow rendering: ${performanceStats.averageRenderTime.toFixed(2)}ms`)
            recommendations.push('Consider implementing virtual scrolling or lazy loading')
        }
        
        // 检查内存使用
        if (performanceStats.averageMemoryUsage > this.performanceConfig.memoryWarningThreshold) {
            issues.push(`High memory usage: ${(performanceStats.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB`)
            recommendations.push('Implement memory cleanup and object pooling')
        }
        
        // 计算健康分数
        const errorRate = errorStats.total / Math.max(performanceStats.totalOperations, 1)
        const performanceScore = Math.max(0, 100 - (performanceStats.averageRenderTime / 10))
        const memoryScore = Math.max(0, 100 - (performanceStats.averageMemoryUsage / this.performanceConfig.memoryWarningThreshold * 100))
        
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
                this.performanceMetrics[this.performanceMetrics.length - 1]?.lastUpdate || 0 : 0
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
        errorHistory: ErrorInfo[]
        performanceMetrics: PerformanceMetrics[]
        healthCheck: any
        recommendations: string[]
    } {
        return {
            adapterInfo: this.getStatusSummary(),
            errorHistory: [...this.errorHistory],
            performanceMetrics: [...this.performanceMetrics],
            healthCheck: this.healthCheck(),
            recommendations: [
                ...this.getPerformanceStats().recommendations,
                ...this.healthCheck().recommendations
            ]
        }
    }
} 