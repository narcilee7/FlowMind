/**
 * 性能监控混入
 * 
 * 提供全面的性能监控、分析和优化建议
 * 包括渲染性能、内存使用、操作延迟等指标
 */

import { PerformanceMetrics, PerformanceConfig } from '@/components/Editor/types/EditorPerformance'

/**
 * 操作性能指标
 */
export interface OperationMetrics {
    operationName: string
    startTime: number
    endTime: number
    duration: number
    memoryBefore: number
    memoryAfter: number
    success: boolean
    error?: string
}

/**
 * 渲染性能指标
 */
export interface RenderMetrics {
    renderType: 'full' | 'partial' | 'update'
    nodeCount: number
    duration: number
    fps?: number
    memoryUsage: number
    timestamp: number
}

/**
 * 内存使用分析
 */
export interface MemoryAnalysis {
    used: number
    total: number
    percentage: number
    trend: 'increasing' | 'decreasing' | 'stable'
    leakSuspected: boolean
    recommendations: string[]
}

/**
 * 性能报告
 */
export interface PerformanceReport {
    overview: {
        averageRenderTime: number
        averageOperationTime: number
        memoryUsage: MemoryAnalysis
        errorRate: number
        totalOperations: number
    }
    details: {
        slowOperations: OperationMetrics[]
        renderingBottlenecks: RenderMetrics[]
        memorySpikes: number[]
        recommendations: string[]
    }
    score: number // 0-100 的性能分数
}

/**
 * 性能监控混入类
 */
export class PerformanceMonitoringMixin {
    // === 配置 ===
    private config: PerformanceConfig = {
        enableProfiling: true,
        maxMetricsHistory: 1000,
        slowOperationThreshold: 100,
        memoryWarningThreshold: 50 * 1024 * 1024,
        samplingInterval: 1000,
        enableMemoryTracking: true,
        enableRenderTracking: true
    }

    // === 性能数据 ===
    private operationMetrics: OperationMetrics[] = []
    private renderMetrics: RenderMetrics[] = []
    private memoryHistory: number[] = []
    private currentOperations = new Map<string, OperationMetrics>()

    // === 监控状态 ===
    private isMonitoring = false
    private monitoringInterval?: NodeJS.Timeout
    private lastMemoryCheck = 0

    /**
     * 初始化性能监控
     */
    protected initializePerformanceMonitoring(config?: Partial<PerformanceConfig>): void {
        this.config = { ...this.config, ...config }

        if (this.config.enableProfiling) {
            this.startMonitoring()
        }
    }

    /**
     * 开始监控
     */
    public startMonitoring(): void {
        if (this.isMonitoring) return

        this.isMonitoring = true
        console.log('[Performance] Monitoring started')

        // 定期采集内存数据
        if (this.config.enableMemoryTracking) {
            this.monitoringInterval = setInterval(() => {
                this.collectMemoryMetrics()
            }, this.config.samplingInterval)
        }
    }

    /**
     * 停止监控
     */
    public stopMonitoring(): void {
        if (!this.isMonitoring) return

        this.isMonitoring = false

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = undefined
        }

        console.log('[Performance] Monitoring stopped')
    }

    /**
     * 开始操作性能测量
     */
    public startOperation(operationName: string): string {
        const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        const metrics: OperationMetrics = {
            operationName,
            startTime: performance.now(),
            endTime: 0,
            duration: 0,
            memoryBefore: this.getCurrentMemoryUsage(),
            memoryAfter: 0,
            success: false
        }

        this.currentOperations.set(operationId, metrics)
        return operationId
    }

    /**
     * 结束操作性能测量
     */
    public endOperation(operationId: string, success: boolean = true, error?: string): void {
        const metrics = this.currentOperations.get(operationId)
        if (!metrics) {
            console.warn(`[Performance] Operation ${operationId} not found`)
            return
        }

        metrics.endTime = performance.now()
        metrics.duration = metrics.endTime - metrics.startTime
        metrics.memoryAfter = this.getCurrentMemoryUsage()
        metrics.success = success
        metrics.error = error

        // 记录到历史
        this.operationMetrics.push(metrics)
        this.currentOperations.delete(operationId)

        // 检查是否为慢操作
        if (metrics.duration > this.config.slowOperationThreshold) {
            console.warn(`[Performance] Slow operation detected: ${metrics.operationName} took ${metrics.duration.toFixed(2)}ms`)
        }

        // 限制历史记录大小
        this.limitHistorySize()
    }

    /**
     * 记录渲染性能
     */
    public recordRenderMetrics(
        renderType: 'full' | 'partial' | 'update',
        nodeCount: number,
        duration: number,
        fps?: number
    ): void {
        if (!this.config.enableRenderTracking) return

        const metrics: RenderMetrics = {
            renderType,
            nodeCount,
            duration,
            fps,
            memoryUsage: this.getCurrentMemoryUsage(),
            timestamp: Date.now()
        }

        this.renderMetrics.push(metrics)

        // 检查渲染性能
        if (duration > this.config.slowOperationThreshold) {
            console.warn(`[Performance] Slow rendering detected: ${renderType} with ${nodeCount} nodes took ${duration.toFixed(2)}ms`)
        }

        // 限制历史记录大小
        this.limitHistorySize()
    }

    /**
     * 收集内存指标
     */
    private collectMemoryMetrics(): void {
        const memoryUsage = this.getCurrentMemoryUsage()
        this.memoryHistory.push(memoryUsage)

        // 检查内存警告
        if (memoryUsage > this.config.memoryWarningThreshold) {
            console.warn(`[Performance] High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`)
        }

        // 限制历史记录大小
        if (this.memoryHistory.length > this.config.maxMetricsHistory) {
            this.memoryHistory = this.memoryHistory.slice(-this.config.maxMetricsHistory)
        }

        this.lastMemoryCheck = Date.now()
    }

    /**
     * 获取当前内存使用量
     */
    private getCurrentMemoryUsage(): number {
        if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize || 0
        }
        return 0
    }

    /**
     * 限制历史记录大小
     */
    private limitHistorySize(): void {
        if (this.operationMetrics.length > this.config.maxMetricsHistory) {
            this.operationMetrics = this.operationMetrics.slice(-this.config.maxMetricsHistory)
        }

        if (this.renderMetrics.length > this.config.maxMetricsHistory) {
            this.renderMetrics = this.renderMetrics.slice(-this.config.maxMetricsHistory)
        }
    }

    /**
     * 分析内存使用情况
     */
    private analyzeMemoryUsage(): MemoryAnalysis {
        if (this.memoryHistory.length < 2) {
            return {
                used: this.getCurrentMemoryUsage(),
                total: 0,
                percentage: 0,
                trend: 'stable',
                leakSuspected: false,
                recommendations: []
            }
        }

        const current = this.memoryHistory[this.memoryHistory.length - 1]
        const previous = this.memoryHistory[this.memoryHistory.length - 2]
        const recommendations: string[] = []

        // 计算趋势
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
        const diff = current - previous
        const threshold = 1024 * 1024 // 1MB

        if (diff > threshold) {
            trend = 'increasing'
        } else if (diff < -threshold) {
            trend = 'decreasing'
        }

        // 检测内存泄漏
        const recentHistory = this.memoryHistory.slice(-10)
        const averageIncrease = recentHistory.length > 1 ?
            (recentHistory[recentHistory.length - 1] - recentHistory[0]) / (recentHistory.length - 1) : 0

        const leakSuspected = averageIncrease > 1024 * 1024 // 平均每次增长超过1MB

        // 生成建议
        if (current > this.config.memoryWarningThreshold) {
            recommendations.push('Memory usage is high, consider implementing cleanup strategies')
        }

        if (leakSuspected) {
            recommendations.push('Potential memory leak detected, review object references and event listeners')
        }

        if (trend === 'increasing') {
            recommendations.push('Memory usage is increasing, monitor for potential leaks')
        }

        // 估算总内存（如果可用）
        let total = 0
        if ('memory' in performance) {
            total = (performance as any).memory.totalJSHeapSize || 0
        }

        return {
            used: current,
            total,
            percentage: total > 0 ? (current / total) * 100 : 0,
            trend,
            leakSuspected,
            recommendations
        }
    }

    /**
     * 计算性能分数
     */
    private calculatePerformanceScore(): number {
        let score = 100

        // 渲染性能评分 (40%)
        const avgRenderTime = this.getAverageRenderTime()
        if (avgRenderTime > this.config.slowOperationThreshold) {
            score -= Math.min(30, (avgRenderTime / this.config.slowOperationThreshold - 1) * 20)
        }

        // 操作性能评分 (30%)
        const avgOperationTime = this.getAverageOperationTime()
        if (avgOperationTime > this.config.slowOperationThreshold) {
            score -= Math.min(20, (avgOperationTime / this.config.slowOperationThreshold - 1) * 15)
        }

        // 内存使用评分 (20%)
        const memoryUsage = this.getCurrentMemoryUsage()
        if (memoryUsage > this.config.memoryWarningThreshold) {
            score -= Math.min(15, (memoryUsage / this.config.memoryWarningThreshold - 1) * 10)
        }

        // 错误率评分 (10%)
        const errorRate = this.getErrorRate()
        if (errorRate > 0.05) { // 5%错误率
            score -= Math.min(10, errorRate * 100)
        }

        return Math.max(0, Math.round(score))
    }

    /**
     * 获取平均渲染时间
     */
    private getAverageRenderTime(): number {
        if (this.renderMetrics.length === 0) return 0

        const total = this.renderMetrics.reduce((sum, metric) => sum + metric.duration, 0)
        return total / this.renderMetrics.length
    }

    /**
     * 获取平均操作时间
     */
    private getAverageOperationTime(): number {
        if (this.operationMetrics.length === 0) return 0

        const total = this.operationMetrics.reduce((sum, metric) => sum + metric.duration, 0)
        return total / this.operationMetrics.length
    }

    /**
     * 获取错误率
     */
    private getErrorRate(): number {
        if (this.operationMetrics.length === 0) return 0

        const errorCount = this.operationMetrics.filter(metric => !metric.success).length
        return errorCount / this.operationMetrics.length
    }

    // === 公共 API ===

    /**
     * 获取性能统计
     */
    public getPerformanceStats(): PerformanceMetrics {
        const memoryAnalysis = this.analyzeMemoryUsage()

        return {
            renderTime: this.getAverageRenderTime(),
            updateTime: this.getAverageOperationTime(),
            memoryUsage: memoryAnalysis.used,
            operationCount: this.operationMetrics.length,
            errorRate: this.getErrorRate(),
            lastUpdate: this.lastMemoryCheck,
            createdAt: Date.now()
        }
    }

    /**
     * 获取详细性能报告
     */
    public getPerformanceReport(): PerformanceReport {
        const memoryAnalysis = this.analyzeMemoryUsage()

        // 找出慢操作
        const slowOperations = this.operationMetrics
            .filter(metric => metric.duration > this.config.slowOperationThreshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)

        // 找出渲染瓶颈
        const renderingBottlenecks = this.renderMetrics
            .filter(metric => metric.duration > this.config.slowOperationThreshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)

        // 找出内存峰值
        const memorySpikes = this.memoryHistory
            .filter(usage => usage > this.config.memoryWarningThreshold)
            .sort((a, b) => b - a)
            .slice(0, 10)

        // 生成优化建议
        const recommendations: string[] = [...memoryAnalysis.recommendations]

        if (slowOperations.length > 0) {
            recommendations.push('Consider optimizing slow operations or implementing progressive loading')
        }

        if (renderingBottlenecks.length > 0) {
            recommendations.push('Implement virtual scrolling or lazy rendering for large datasets')
        }

        if (this.getAverageRenderTime() > this.config.slowOperationThreshold) {
            recommendations.push('Consider using requestAnimationFrame for smoother animations')
        }

        return {
            overview: {
                averageRenderTime: this.getAverageRenderTime(),
                averageOperationTime: this.getAverageOperationTime(),
                memoryUsage: memoryAnalysis,
                errorRate: this.getErrorRate(),
                totalOperations: this.operationMetrics.length
            },
            details: {
                slowOperations,
                renderingBottlenecks,
                memorySpikes,
                recommendations
            },
            score: this.calculatePerformanceScore()
        }
    }

    /**
     * 清除性能指标
     */
    public clearMetrics(): void {
        this.operationMetrics = []
        this.renderMetrics = []
        this.memoryHistory = []
        this.currentOperations.clear()

        console.log('[Performance] Metrics cleared')
    }

    /**
     * 配置性能监控
     */
    public configurePerformanceMonitoring(config: Partial<PerformanceConfig>): void {
        const wasMonitoring = this.isMonitoring

        if (wasMonitoring) {
            this.stopMonitoring()
        }

        this.config = { ...this.config, ...config }

        if (wasMonitoring && this.config.enableProfiling) {
            this.startMonitoring()
        }
    }

    /**
     * 获取实时性能数据
     */
    public getRealTimeMetrics(): {
        currentMemory: number
        activeOperations: number
        lastRenderTime: number
        fps: number
    } {
        const lastRender = this.renderMetrics[this.renderMetrics.length - 1]

        return {
            currentMemory: this.getCurrentMemoryUsage(),
            activeOperations: this.currentOperations.size,
            lastRenderTime: lastRender?.duration || 0,
            fps: lastRender?.fps || 0
        }
    }

    /**
     * 强制垃圾回收（如果可用）
     */
    public forceGarbageCollection(): boolean {
        if ('gc' in window && typeof (window as any).gc === 'function') {
            (window as any).gc()
            console.log('[Performance] Forced garbage collection')
            return true
        }
        return false
    }

    /**
     * 检查性能健康状况
     */
    public checkPerformanceHealth(): {
        isHealthy: boolean
        issues: string[]
        score: number
    } {
        const report = this.getPerformanceReport()
        const issues: string[] = []

        if (report.overview.averageRenderTime > this.config.slowOperationThreshold) {
            issues.push(`Slow rendering: ${report.overview.averageRenderTime.toFixed(2)}ms average`)
        }

        if (report.overview.memoryUsage.percentage > 80) {
            issues.push(`High memory usage: ${report.overview.memoryUsage.percentage.toFixed(1)}%`)
        }

        if (report.overview.errorRate > 0.05) {
            issues.push(`High error rate: ${(report.overview.errorRate * 100).toFixed(1)}%`)
        }

        if (report.details.slowOperations.length > 5) {
            issues.push(`Multiple slow operations detected: ${report.details.slowOperations.length}`)
        }

        return {
            isHealthy: issues.length === 0 && report.score > 70,
            issues,
            score: report.score
        }
    }

    /**
     * 导出性能数据
     */
    public exportMetrics(): {
        operations: OperationMetrics[]
        renders: RenderMetrics[]
        memory: number[]
        config: PerformanceConfig
        timestamp: number
    } {
        return {
            operations: [...this.operationMetrics],
            renders: [...this.renderMetrics],
            memory: [...this.memoryHistory],
            config: { ...this.config },
            timestamp: Date.now()
        }
    }
}
