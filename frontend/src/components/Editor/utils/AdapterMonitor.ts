/**
 * 适配器监控工具类
 * 提供全局的适配器监控、性能分析和健康检查功能
 */

import { ViewAdapter } from '../types/ViewAdapter'
import { BaseViewAdapter } from '../adapters/BaseViewAdapter'

/**
 * 适配器监控配置
 */
export interface AdapterMonitorConfig {
    enableGlobalMonitoring: boolean
    healthCheckInterval: number
    performanceAlertThreshold: number
    errorAlertThreshold: number
    maxAdaptersToMonitor: number
}

/**
 * 全局监控统计
 */
export interface GlobalMonitorStats {
    totalAdapters: number
    healthyAdapters: number
    errorCount: number
    averagePerformanceScore: number
    totalMemoryUsage: number
    recommendations: string[]
}

/**
 * 适配器监控项
 */
interface AdapterMonitorItem {
    id: string
    adapter: ViewAdapter
    type: string
    createdAt: number
    lastActivity: number
    healthStatus: HealthStatus
    performanceScore: number
    errorCount: number
}

/**
 * 适配器监控事件
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical'
/**
 * 适配器监控工具类
 */
export class AdapterMonitor {
    private static instance: AdapterMonitor
    private adapters: Map<string, AdapterMonitorItem> = new Map()
    private config: AdapterMonitorConfig = {
        enableGlobalMonitoring: true,
        healthCheckInterval: 30000, // 30秒
        performanceAlertThreshold: 70,
        errorAlertThreshold: 5,
        maxAdaptersToMonitor: 100
    }
    private healthCheckTimer: NodeJS.Timeout | null = null
    private eventListeners: Map<string, Function[]> = new Map()

    /**
     * 获取单例实例
     */
    static getInstance(): AdapterMonitor {
        if (!AdapterMonitor.instance) {
            AdapterMonitor.instance = new AdapterMonitor()
        }
        return AdapterMonitor.instance
    }

    /**
     * 注册适配器
     */
    registerAdapter(id: string, adapter: ViewAdapter): void {
        if (this.adapters.size >= this.config.maxAdaptersToMonitor) {
            console.warn('[AdapterMonitor] Maximum adapters reached, removing oldest')
            this.removeOldestAdapter()
        }

        const monitorItem: AdapterMonitorItem = {
            id,
            adapter,
            type: adapter.constructor.name,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            healthStatus: 'healthy',
            performanceScore: 100,
            errorCount: 0
        }

        this.adapters.set(id, monitorItem)
        this.triggerEvent('adapterRegistered', { id, type: adapter.constructor.name })
        
        console.log(`[AdapterMonitor] Registered adapter: ${id} (${adapter.constructor.name})`)
    }

    /**
     * 注销适配器
     */
    unregisterAdapter(id: string): void {
        const adapter = this.adapters.get(id)
        if (adapter) {
            this.adapters.delete(id)
            this.triggerEvent('adapterUnregistered', { id, type: adapter.type })
            console.log(`[AdapterMonitor] Unregistered adapter: ${id}`)
        }
    }

    /**
     * 更新适配器状态
     */
    updateAdapterStatus(id: string): void {
        const item = this.adapters.get(id)
        if (!item) return

        try {
            const baseAdapter = item.adapter as BaseViewAdapter
            const status = baseAdapter.getStatusSummary()
            const health = baseAdapter.healthCheck()
            const performanceStats = baseAdapter.getPerformanceStats()

            item.lastActivity = Date.now()
            item.healthStatus = health.isHealthy ? 'healthy' : 
                               health.issues.length > 2 ? 'critical' : 'warning'
            item.performanceScore = health.stats.performanceScore
            item.errorCount = status.errorCount

            // 检查是否需要触发警报
            this.checkAlerts(id, item, health, performanceStats)

        } catch (error) {
            console.error(`[AdapterMonitor] Failed to update status for adapter ${id}:`, error)
        }
    }

    /**
     * 检查警报条件
     */
    private checkAlerts(id: string, item: AdapterMonitorItem, health: any, performanceStats: any): void {
        // 性能警报
        if (item.performanceScore < this.config.performanceAlertThreshold) {
            this.triggerEvent('performanceAlert', {
                id,
                type: item.type,
                score: item.performanceScore,
                threshold: this.config.performanceAlertThreshold
            })
        }

        // 错误警报
        if (item.errorCount > this.config.errorAlertThreshold) {
            this.triggerEvent('errorAlert', {
                id,
                type: item.type,
                errorCount: item.errorCount,
                threshold: this.config.errorAlertThreshold
            })
        }

        // 健康状态变化警报
        if (item.healthStatus === 'critical') {
            this.triggerEvent('criticalHealthAlert', {
                id,
                type: item.type,
                issues: health.issues
            })
        }
    }

    /**
     * 获取全局统计信息
     */
    getGlobalStats(): GlobalMonitorStats {
        const adapters = Array.from(this.adapters.values())
        
        if (adapters.length === 0) {
            return {
                totalAdapters: 0,
                healthyAdapters: 0,
                errorCount: 0,
                averagePerformanceScore: 100,
                totalMemoryUsage: 0,
                recommendations: []
            }
        }

        const healthyCount = adapters.filter(a => a.healthStatus === 'healthy').length
        const totalErrors = adapters.reduce((sum, a) => sum + a.errorCount, 0)
        const avgPerformance = adapters.reduce((sum, a) => sum + a.performanceScore, 0) / adapters.length
        
        // 计算总内存使用
        let totalMemory = 0
        adapters.forEach(item => {
            try {
                const baseAdapter = item.adapter as BaseViewAdapter
                const stats = baseAdapter.getPerformanceStats()
                totalMemory += stats.averageMemoryUsage
            } catch (error) {
                // 忽略无法获取内存信息的适配器
            }
        })

        // 生成全局建议
        const recommendations: string[] = []
        if (healthyCount / adapters.length < 0.8) {
            recommendations.push('More than 20% of adapters are unhealthy, review system stability')
        }
        if (avgPerformance < this.config.performanceAlertThreshold) {
            recommendations.push('Overall performance is below threshold, consider optimization')
        }
        if (totalErrors > adapters.length * 2) {
            recommendations.push('High error rate across adapters, review error handling')
        }

        return {
            totalAdapters: adapters.length,
            healthyAdapters: healthyCount,
            errorCount: totalErrors,
            averagePerformanceScore: avgPerformance,
            totalMemoryUsage: totalMemory,
            recommendations
        }
    }

    /**
     * 获取适配器详情
     */
    getAdapterDetails(id: string): AdapterMonitorItem | null {
        return this.adapters.get(id) || null
    }

    /**
     * 获取所有适配器状态
     */
    getAllAdapterStatus(): AdapterMonitorItem[] {
        return Array.from(this.adapters.values())
    }

    /**
     * 获取不健康的适配器
     */
    getUnhealthyAdapters(): AdapterMonitorItem[] {
        return Array.from(this.adapters.values()).filter(a => a.healthStatus !== 'healthy')
    }

    /**
     * 强制健康检查
     */
    forceHealthCheck(): void {
        this.adapters.forEach((item, id) => {
            this.updateAdapterStatus(id)
        })
        
        const globalStats = this.getGlobalStats()
        this.triggerEvent('healthCheckCompleted', globalStats)
    }

    /**
     * 启动监控
     */
    startMonitoring(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer)
        }

        this.healthCheckTimer = setInterval(() => {
            this.forceHealthCheck()
        }, this.config.healthCheckInterval)

        console.log('[AdapterMonitor] Started monitoring')
    }

    /**
     * 停止监控
     */
    stopMonitoring(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer)
            this.healthCheckTimer = null
        }
        console.log('[AdapterMonitor] Stopped monitoring')
    }

    /**
     * 设置监控配置
     */
    setConfig(config: Partial<AdapterMonitorConfig>): void {
        this.config = { ...this.config, ...config }
        
        // 如果更改了健康检查间隔，重启定时器
        if (this.healthCheckTimer) {
            this.stopMonitoring()
            this.startMonitoring()
        }
    }

    /**
     * 获取监控配置
     */
    getConfig(): AdapterMonitorConfig {
        return { ...this.config }
    }

    /**
     * 添加事件监听器
     */
    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    /**
     * 移除事件监听器
     */
    off(event: string, callback: Function): void {
        const callbacks = this.eventListeners.get(event) || []
        const index = callbacks.indexOf(callback)
        if (index > -1) {
            callbacks.splice(index, 1)
        }
    }

    /**
     * 触发事件
     */
    private triggerEvent(event: string, data: any): void {
        const callbacks = this.eventListeners.get(event) || []
        callbacks.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                console.error(`[AdapterMonitor] Event callback error for ${event}:`, error)
            }
        })
    }

    /**
     * 移除最旧的适配器
     */
    private removeOldestAdapter(): void {
        let oldestId: string | null = null
        let oldestTime = Date.now()

        this.adapters.forEach((item, id) => {
            if (item.createdAt < oldestTime) {
                oldestTime = item.createdAt
                oldestId = id
            }
        })

        if (oldestId) {
            this.unregisterAdapter(oldestId)
        }
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        this.stopMonitoring()
        this.adapters.clear()
        this.eventListeners.clear()
        console.log('[AdapterMonitor] Cleaned up')
    }

    /**
     * 导出监控报告
     */
    exportReport(): {
        timestamp: number
        config: AdapterMonitorConfig
        globalStats: GlobalMonitorStats
        adapters: AdapterMonitorItem[]
        recommendations: string[]
    } {
        const globalStats = this.getGlobalStats()
        const adapters = this.getAllAdapterStatus()
        
        return {
            timestamp: Date.now(),
            config: this.getConfig(),
            globalStats,
            adapters,
            recommendations: [
                ...globalStats.recommendations,
                ...this.generateSystemRecommendations(globalStats, adapters)
            ]
        }
    }

    /**
     * 生成系统级建议
     */
    private generateSystemRecommendations(stats: GlobalMonitorStats, adapters: AdapterMonitorItem[]): string[] {
        const recommendations: string[] = []

        // 基于适配器数量的建议
        if (stats.totalAdapters > 50) {
            recommendations.push('Consider implementing adapter pooling for better resource management')
        }

        // 基于内存使用的建议
        if (stats.totalMemoryUsage > 500 * 1024 * 1024) { // 500MB
            recommendations.push('High total memory usage, consider implementing memory limits per adapter')
        }

        // 基于错误率的建议
        if (stats.errorCount > stats.totalAdapters * 3) {
            recommendations.push('High error rate, consider implementing circuit breaker pattern')
        }

        return recommendations
    }
}

// 导出单例实例
export const adapterMonitor = AdapterMonitor.getInstance()
