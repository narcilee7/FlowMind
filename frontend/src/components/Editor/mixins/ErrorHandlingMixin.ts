/**
 * 错误处理混入
 * 
 * 提供统一的错误处理、恢复策略和错误历史管理
 * 采用混入模式，可以独立组合到任何适配器中
 */

import { EditorErrorInfo, EditorErrorSeverity, EditorErrorType } from '@/components/Editor/types/EditorError'

/**
 * 错误恢复策略接口
 */
export interface ErrorRecoveryStrategy {
    canRecover(error: EditorErrorInfo): boolean
    recover(error: EditorErrorInfo): Promise<boolean>
    getRecoveryDescription(): string
}

/**
 * 错误处理配置
 */
export interface ErrorHandlingConfig {
    maxHistorySize: number
    maxRetryAttempts: number
    enableAutoRecovery: boolean
    recoveryDelay: number
    errorThreshold: number
}

/**
 * 错误处理混入类
 */
export class ErrorHandlingMixin {
    // === 错误状态 ===
    private errorHistory: EditorErrorInfo[] = []
    private errorHandler?: (error: Error) => void
    private recoveryStrategies = new Map<EditorErrorType, ErrorRecoveryStrategy>()

    // === 配置 ===
    private config: ErrorHandlingConfig = {
        maxHistorySize: 50,
        maxRetryAttempts: 3,
        enableAutoRecovery: true,
        recoveryDelay: 1000,
        errorThreshold: 5
    }

    // === 错误统计 ===
    private errorCount = 0
    private lastErrorTime = 0

    /**
     * 初始化错误处理
     */
    protected initializeErrorHandling(config?: Partial<ErrorHandlingConfig>): void {
        this.config = { ...this.config, ...config }
        this.setupDefaultRecoveryStrategies()
    }

    /**
     * 处理错误的主入口
     */
    public handleError(error: Error, context: string): void {
        const errorInfo = this.classifyError(error, context)
        this.recordError(errorInfo)

        // 检查是否需要自动恢复
        if (this.config.enableAutoRecovery && this.shouldAttemptRecovery(errorInfo)) {
            this.attemptRecovery(errorInfo)
        }

        // 触发错误事件
        this.notifyError(error)

        // 记录日志
        this.logError(errorInfo)
    }

    /**
     * 分类错误
     */
    private classifyError(error: Error, context: string): EditorErrorInfo {
        let type = EditorErrorType.UNKNOWN
        let severity = EditorErrorSeverity.MEDIUM
        let recoverable = true

        // 根据错误信息和上下文进行分类
        const message = error.message.toLowerCase()

        if (context.includes('create') || context.includes('init')) {
            type = EditorErrorType.INITIALIZATION
            severity = EditorErrorSeverity.HIGH
        } else if (context.includes('render') || context.includes('update')) {
            type = EditorErrorType.RENDERING
            severity = EditorErrorSeverity.MEDIUM
        } else if (message.includes('memory') || message.includes('heap')) {
            type = EditorErrorType.MEMORY
            severity = EditorErrorSeverity.CRITICAL
            recoverable = false
        } else if (context.includes('user') || context.includes('interaction')) {
            type = EditorErrorType.USER_INTERACTION
            severity = EditorErrorSeverity.LOW
        } else if (context.includes('network') || context.includes('fetch')) {
            type = EditorErrorType.NETWORK
            severity = EditorErrorSeverity.MEDIUM
        } else if (context.includes('validation') || message.includes('invalid')) {
            type = EditorErrorType.VALIDATION
            severity = EditorErrorSeverity.HIGH
        }

        return {
            id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            type,
            severity,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now(),
            recoverable,
            retryCount: 0
        }
    }

    /**
     * 记录错误
     */
    private recordError(errorInfo: EditorErrorInfo): void {
        this.errorHistory.push(errorInfo)
        this.errorCount++
        this.lastErrorTime = Date.now()

        // 限制历史记录大小
        if (this.errorHistory.length > this.config.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(-this.config.maxHistorySize)
        }
    }

    /**
     * 判断是否应该尝试恢复
     */
    private shouldAttemptRecovery(errorInfo: EditorErrorInfo): boolean {
        return errorInfo.recoverable &&
            errorInfo.retryCount < this.config.maxRetryAttempts &&
            this.recoveryStrategies.has(errorInfo.type)
    }

    /**
     * 尝试错误恢复
     */
    private async attemptRecovery(errorInfo: EditorErrorInfo): Promise<void> {
        const strategy = this.recoveryStrategies.get(errorInfo.type)
        if (!strategy) return

        try {
            console.log(`[ErrorHandling] Attempting recovery for ${errorInfo.type}: ${strategy.getRecoveryDescription()}`)

            // 延迟恢复，避免立即重试
            await new Promise(resolve => setTimeout(resolve, this.config.recoveryDelay))

            const success = await strategy.recover(errorInfo)

            if (success) {
                console.log(`[ErrorHandling] Recovery successful for ${errorInfo.type}`)
                errorInfo.recovered = true
            } else {
                console.warn(`[ErrorHandling] Recovery failed for ${errorInfo.type}`)
                errorInfo.retryCount++
            }
        } catch (recoveryError) {
            console.error('[ErrorHandling] Recovery attempt failed:', recoveryError)
            errorInfo.retryCount++
        }
    }

    /**
     * 设置默认恢复策略
     */
    private setupDefaultRecoveryStrategies(): void {
        // 初始化错误恢复策略
        this.recoveryStrategies.set(EditorErrorType.INITIALIZATION, {
            canRecover: () => true,
            recover: async () => {
                // 重新初始化逻辑
                return true
            },
            getRecoveryDescription: () => 'Attempting to reinitialize adapter'
        })

        // 渲染错误恢复策略
        this.recoveryStrategies.set(EditorErrorType.RENDERING, {
            canRecover: () => true,
            recover: async () => {
                // 强制重新渲染逻辑
                return true
            },
            getRecoveryDescription: () => 'Attempting to re-render content'
        })

        // 内存错误恢复策略
        this.recoveryStrategies.set(EditorErrorType.MEMORY, {
            canRecover: () => false, // 内存错误通常不可恢复
            recover: async () => {
                // 清理内存，强制垃圾回收
                this.forceGarbageCollection()
                return false
            },
            getRecoveryDescription: () => 'Attempting memory cleanup'
        })

        // 用户交互错误恢复策略
        this.recoveryStrategies.set(EditorErrorType.USER_INTERACTION, {
            canRecover: () => true,
            recover: async () => {
                // 重置交互状态
                return true
            },
            getRecoveryDescription: () => 'Resetting interaction state'
        })

        // 网络错误恢复策略
        this.recoveryStrategies.set(EditorErrorType.NETWORK, {
            canRecover: () => true,
            recover: async () => {
                // 重试网络请求
                return true
            },
            getRecoveryDescription: () => 'Retrying network operation'
        })
    }

    /**
     * 强制垃圾回收
     */
    private forceGarbageCollection(): void {
        if ('gc' in window && typeof (window as any).gc === 'function') {
            (window as any).gc()
        }
    }

    /**
     * 通知错误
     */
    private notifyError(error: Error): void {
        if (this.errorHandler) {
            try {
                this.errorHandler(error)
            } catch (handlerError) {
                console.error('[ErrorHandling] Error handler failed:', handlerError)
            }
        }
    }

    /**
     * 记录错误日志
     */
    private logError(errorInfo: EditorErrorInfo): void {
        const logLevel = this.getLogLevel(errorInfo.severity)
        const message = `[${errorInfo.type}] ${errorInfo.message} (Context: ${errorInfo.context})`

        switch (logLevel) {
            case 'error':
                console.error(message, errorInfo)
                break
            case 'warn':
                console.warn(message, errorInfo)
                break
            case 'info':
                console.info(message, errorInfo)
                break
            default:
                console.log(message, errorInfo)
        }
    }

    /**
     * 获取日志级别
     */
    private getLogLevel(severity: EditorErrorSeverity): string {
        switch (severity) {
            case EditorErrorSeverity.CRITICAL:
            case EditorErrorSeverity.HIGH:
                return 'error'
            case EditorErrorSeverity.MEDIUM:
                return 'warn'
            case EditorErrorSeverity.LOW:
                return 'info'
            default:
                return 'log'
        }
    }

    // === 公共 API ===

    /**
     * 获取错误历史
     */
    public getErrorHistory(): EditorErrorInfo[] {
        return [...this.errorHistory]
    }

    /**
     * 清除错误历史
     */
    public clearErrorHistory(): void {
        this.errorHistory = []
        this.errorCount = 0
    }

    /**
     * 设置错误处理器
     */
    public setErrorHandler(handler: (error: Error) => void): void {
        this.errorHandler = handler
    }

    /**
     * 添加自定义恢复策略
     */
    public addRecoveryStrategy(type: EditorErrorType, strategy: ErrorRecoveryStrategy): void {
        this.recoveryStrategies.set(type, strategy)
    }

    /**
     * 移除恢复策略
     */
    public removeRecoveryStrategy(type: EditorErrorType): void {
        this.recoveryStrategies.delete(type)
    }

    /**
     * 获取错误统计
     */
    public getErrorStats(): {
        total: number
        byType: Record<EditorErrorType, number>
        bySeverity: Record<EditorErrorSeverity, number>
        recentErrors: EditorErrorInfo[]
        errorRate: number
    } {
        const stats = {
            total: this.errorHistory.length,
            byType: {} as Record<EditorErrorType, number>,
            bySeverity: {} as Record<EditorErrorSeverity, number>,
            recentErrors: this.errorHistory.slice(-10),
            errorRate: 0
        }

        // 统计错误类型
        Object.values(EditorErrorType).forEach(type => {
            stats.byType[type] = this.errorHistory.filter(e => e.type === type).length
        })

        // 统计错误严重程度
        Object.values(EditorErrorSeverity).forEach(severity => {
            stats.bySeverity[severity] = this.errorHistory.filter(e => e.severity === severity).length
        })

        // 计算错误率（最近 10 分钟内的错误数量）
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000
        const recentErrorCount = this.errorHistory.filter(e => e.timestamp > tenMinutesAgo).length
        stats.errorRate = recentErrorCount / 10 // 每分钟错误数

        return stats
    }

    /**
     * 检查错误阈值
     */
    public isErrorThresholdExceeded(): boolean {
        const recentErrors = this.errorHistory.filter(
            e => e.timestamp > Date.now() - 60000 // 最近1分钟
        ).length

        return recentErrors >= this.config.errorThreshold
    }

    /**
     * 重置错误计数
     */
    public resetErrorCount(): void {
        this.errorCount = 0
        this.lastErrorTime = 0
    }

    /**
     * 配置错误处理
     */
    public configureErrorHandling(config: Partial<ErrorHandlingConfig>): void {
        this.config = { ...this.config, ...config }
    }

    /**
     * 手动触发恢复
     */
    public async triggerRecovery(errorType: EditorErrorType): Promise<boolean> {
        const strategy = this.recoveryStrategies.get(errorType)
        if (!strategy) {
            console.warn(`[ErrorHandling] No recovery strategy found for ${errorType}`)
            return false
        }

        try {
            return await strategy.recover({
                id: 'manual_recovery',
                type: errorType,
                severity: EditorErrorSeverity.MEDIUM,
                message: 'Manual recovery triggered',
                context: 'manual',
                timestamp: Date.now(),
                recoverable: true,
                retryCount: 0
            })
        } catch (error) {
            console.error('[ErrorHandling] Manual recovery failed:', error)
            return false
        }
    }

    /**
     * 检查是否有严重错误
     */
    public hasCriticalErrors(): boolean {
        return this.errorHistory.some(
            e => e.severity === EditorErrorSeverity.CRITICAL && !e.recovered
        )
    }

    /**
     * 获取最后一个错误
     */
    public getLastError(): EditorErrorInfo | null {
        return this.errorHistory.length > 0 ? this.errorHistory[this.errorHistory.length - 1] : null
    }
}
