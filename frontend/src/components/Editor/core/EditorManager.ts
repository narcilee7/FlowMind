/**
 * 编辑器内核管理器
 * 负责协调各个功能模块
 */

import { ErrorHandlingMixin } from "../mixins/ErrorHandlingMixin"
import { PerformanceMonitoringMixin } from "../mixins/PerformanceMonitoringMixin"
import { AIMixin } from "../mixins/AIMixin"

export class EditorManager {
    private errorHandler: ErrorHandlingMixin
    private performanceMonitor: PerformanceMonitoringMixin
    private aiManager: AIMixin

    constructor() {
        this.errorHandler = new ErrorHandlingMixin()
        this.performanceMonitor = new PerformanceMonitoringMixin()
        this.aiManager = new AIMixin()

        this.initializeModules()
    }

    private initializeModules(): void {
        // 初始化错误处理
        this.errorHandler.configureErrorHandling({
            maxHistorySize: 100,
            maxRetryAttempts: 3,
            enableAutoRecovery: true,
            recoveryDelay: 1000,
            errorThreshold: 5
        })

        // 初始化性能监控
        this.performanceMonitor.configurePerformanceMonitoring({
            enableProfiling: true,
            maxMetricsHistory: 500,
            slowOperationThreshold: 100,
            memoryWarningThreshold: 50 * 1024 * 1024,
            samplingInterval: 2000
        })

        // 初始化AI功能
        this.aiManager.configureAI({
            timeout: 30000,
            maxRetries: 3,
            temperature: 0.7
        })
    }

    public getErrorHandler(): ErrorHandlingMixin {
        return this.errorHandler
    }

    public getPerformanceMonitor(): PerformanceMonitoringMixin {
        return this.performanceMonitor
    }

    public getAIManager(): AIMixin {
        return this.aiManager
    }

    public destroy(): void {
        this.performanceMonitor.stopMonitoring()
        this.errorHandler.clearErrorHistory()
        this.aiManager.cancelAllAIRequests()
    }
}
