/**
 * 性能指标类型及接口
 */

/**
 * 性能指标
 */
export interface PerformanceMetrics {
    // 渲染次数
    renderTime: number
    // 更新次数
    updateTime: number
    // 内存使用量
    memoryUsage: number
    // 操作次数
    operationCount: number
    // 错误率
    errorRate: number
    // 最后一次更新时间
    lastUpdate: number
    // 创建时间
    createdAt?: number
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
    // 是否启用性能监控
    enableProfiling: boolean
    // 最大性能指标历史记录数
    maxMetricsHistory: number
    // 慢操作阈值
    slowOperationThreshold: number
    // 内存警告阈值
    memoryWarningThreshold: number
    // 采样间隔
    samplingInterval: number
    // 是否启用内存跟踪
    enableMemoryTracking: boolean
    // 是否启用渲染跟踪
    enableRenderTracking: boolean
}