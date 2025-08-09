/**
 * 适配器混入接口，将多种职责与核心接口分离
 */

/**
 * 性能监控混入接口
 */
export interface IPerformanceMonitoringMixin {
  // 获取性能统计数据
  getPerformanceStats(): any
  // 开始性能分析
  startProfiling(): void
  // 停止性能分析
  stopProfiling(): void
  // 清除性能指标
  clearMetrics(): void
}

/**
 * AI 功能混入接口
 * TODO: 下沉后端，前端只负责调用
 */
export interface IAIMixin {
  requestAICompletion(context: string, position: number): Promise<string>
  requestAIRewrite(content: string, style: string): Promise<string>
  getAISuggestions(context?: string): Promise<string[]>
  applyAISuggestion(suggestion: string): Promise<void>
}

/**
 * 错误处理接口
 */
export interface IErrorHandlingMixin {
  getErrorHistory(): any
  clearErrorHistory(): void
  setErrorHandler(handler: (error: Error) => void): void
}


/**
 * 混入配置接口
 */
export interface MixinConfig {
  errorHanding?: boolean
  performanceMonitoring?: boolean
  ai?: boolean
}