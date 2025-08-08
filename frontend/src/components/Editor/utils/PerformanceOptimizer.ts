/**
 * 性能优化工具
 * 
 * 提供各种性能优化策略和工具，包括：
 * 1. 虚拟滚动优化
 * 2. 内存管理优化
 * 3. 渲染性能优化
 * 4. 事件处理优化
 * 5. 批量操作优化
 */

import { ASTNode } from '../types/EditorAST'

/**
 * 性能优化配置
 */
export interface PerformanceOptimizationConfig {
    // 虚拟滚动配置
    enableVirtualScrolling: boolean
    virtualScrollThreshold: number
    virtualScrollBuffer: number

    // 内存管理配置
    enableMemoryOptimization: boolean
    memoryCleanupInterval: number
    maxCacheSize: number

    // 渲染优化配置
    enableRenderOptimization: boolean
    batchUpdateDelay: number
    maxBatchSize: number

    // 事件优化配置
    enableEventOptimization: boolean
    debounceDelay: number
    throttleDelay: number
}

/**
 * 虚拟滚动管理器
 */
export class VirtualScrollManager {
    private visibleItems: ASTNode[] = []
    private totalItems: ASTNode[] = []
    private viewportHeight = 0
    private itemHeight = 0
    private scrollPosition = 0
    private bufferSize = 5

    constructor(
        private container: HTMLElement,
        private renderItem: (item: ASTNode, index: number) => HTMLElement
    ) {
        this.setupScrollListener()
    }

    /**
     * 设置数据
     */
    public setData(items: ASTNode[]): void {
        this.totalItems = items
        this.updateVisibleItems()
    }

    /**
     * 更新可见项目
     */
    private updateVisibleItems(): void {
        if (!this.container || this.itemHeight === 0) return

        const startIndex = Math.max(0,
            Math.floor(this.scrollPosition / this.itemHeight) - this.bufferSize
        )

        const visibleCount = Math.ceil(this.viewportHeight / this.itemHeight) + 2 * this.bufferSize
        const endIndex = Math.min(this.totalItems.length, startIndex + visibleCount)

        this.visibleItems = this.totalItems.slice(startIndex, endIndex)
        this.renderVisibleItems(startIndex)
    }

    /**
     * 渲染可见项目
     */
    private renderVisibleItems(startIndex: number): void {
        // 清空容器
        this.container.innerHTML = ''

        // 创建占位符以保持滚动高度
        const topSpacer = document.createElement('div')
        topSpacer.style.height = `${startIndex * this.itemHeight}px`
        this.container.appendChild(topSpacer)

        // 渲染可见项目
        this.visibleItems.forEach((item, index) => {
            const element = this.renderItem(item, startIndex + index)
            this.container.appendChild(element)
        })

        // 底部占位符
        const remainingItems = this.totalItems.length - (startIndex + this.visibleItems.length)
        if (remainingItems > 0) {
            const bottomSpacer = document.createElement('div')
            bottomSpacer.style.height = `${remainingItems * this.itemHeight}px`
            this.container.appendChild(bottomSpacer)
        }
    }

    /**
     * 设置滚动监听
     */
    private setupScrollListener(): void {
        this.container.addEventListener('scroll', this.handleScroll.bind(this))

        // 观察容器尺寸变化
        const resizeObserver = new ResizeObserver(() => {
            this.viewportHeight = this.container.clientHeight
            this.updateVisibleItems()
        })
        resizeObserver.observe(this.container)
    }

    /**
     * 处理滚动事件
     */
    private handleScroll(): void {
        this.scrollPosition = this.container.scrollTop
        this.updateVisibleItems()
    }

    /**
     * 设置项目高度
     */
    public setItemHeight(height: number): void {
        this.itemHeight = height
        this.updateVisibleItems()
    }

    /**
     * 销毁
     */
    public destroy(): void {
        this.container.removeEventListener('scroll', this.handleScroll)
    }
}

/**
 * 内存管理器
 */
export class MemoryManager {
    private caches = new Map<string, Map<string, any>>()
    private cleanupTimers = new Map<string, NodeJS.Timeout>()
    private maxCacheSize = 1000
    private cleanupInterval = 30000

    /**
     * 创建缓存
     */
    public createCache<T>(name: string, maxSize?: number): Map<string, T> {
        const cache = new Map<string, T>()
        this.caches.set(name, cache)

        // 设置定期清理
        const timer = setInterval(() => {
            this.cleanupCache(name, maxSize || this.maxCacheSize)
        }, this.cleanupInterval)

        this.cleanupTimers.set(name, timer)
        return cache
    }

    /**
     * 获取缓存
     */
    public getCache<T>(name: string): Map<string, T> | undefined {
        return this.caches.get(name) as Map<string, T>
    }

    /**
     * 清理缓存
     */
    private cleanupCache(name: string, maxSize: number): void {
        const cache = this.caches.get(name)
        if (!cache || cache.size <= maxSize) return

        // 删除最旧的条目（简单的LRU策略）
        const entries = Array.from(cache.entries())
        const toDelete = entries.slice(0, entries.length - maxSize)

        toDelete.forEach(([key]) => cache.delete(key))

        console.log(`[MemoryManager] Cleaned up cache ${name}: ${toDelete.length} items removed`)
    }

    /**
     * 强制垃圾回收
     */
    public forceGarbageCollection(): boolean {
        if ('gc' in window && typeof (window as any).gc === 'function') {
            (window as any).gc()
            console.log('[MemoryManager] Forced garbage collection')
            return true
        }
        return false
    }

    /**
     * 获取内存使用情况
     */
    public getMemoryUsage(): {
        used: number
        total: number
        percentage: number
    } {
        if ('memory' in performance) {
            const memory = (performance as any).memory
            return {
                used: memory.usedJSHeapSize || 0,
                total: memory.totalJSHeapSize || 0,
                percentage: memory.totalJSHeapSize > 0
                    ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
                    : 0
            }
        }
        return { used: 0, total: 0, percentage: 0 }
    }

    /**
     * 销毁所有缓存
     */
    public destroy(): void {
        this.caches.clear()
        this.cleanupTimers.forEach(timer => clearInterval(timer))
        this.cleanupTimers.clear()
    }
}

/**
 * 批量操作管理器
 */
export class BatchOperationManager {
    private operationQueue: Array<() => void> = []
    private isProcessing = false
    private batchDelay = 16 // 1 frame at 60fps
    private maxBatchSize = 50

    /**
     * 添加操作到批量队列
     */
    public addOperation(operation: () => void): void {
        this.operationQueue.push(operation)

        if (!this.isProcessing) {
            this.scheduleBatchExecution()
        }
    }

    /**
     * 调度批量执行
     */
    private scheduleBatchExecution(): void {
        this.isProcessing = true

        setTimeout(() => {
            this.executeBatch()
        }, this.batchDelay)
    }

    /**
     * 执行批量操作
     */
    private executeBatch(): void {
        const batch = this.operationQueue.splice(0, this.maxBatchSize)

        // 使用 requestAnimationFrame 确保在渲染帧中执行
        requestAnimationFrame(() => {
            batch.forEach(operation => {
                try {
                    operation()
                } catch (error) {
                    console.error('[BatchOperationManager] Operation failed:', error)
                }
            })

            // 如果还有操作，继续处理
            if (this.operationQueue.length > 0) {
                this.scheduleBatchExecution()
            } else {
                this.isProcessing = false
            }
        })
    }

    /**
     * 清空队列
     */
    public clear(): void {
        this.operationQueue = []
        this.isProcessing = false
    }

    /**
     * 获取队列长度
     */
    public getQueueLength(): number {
        return this.operationQueue.length
    }
}

/**
 * 事件优化器
 */
export class EventOptimizer {
    private debouncedFunctions = new Map<string, Function>()
    private throttledFunctions = new Map<string, Function>()

    /**
     * 创建防抖函数
     */
    public debounce<T extends (...args: any[]) => any>(
        key: string,
        func: T,
        delay: number
    ): T {
        if (this.debouncedFunctions.has(key)) {
            return this.debouncedFunctions.get(key) as T
        }

        let timeoutId: NodeJS.Timeout
        const debouncedFunc = ((...args: Parameters<T>) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => func.apply(null, args), delay)
        }) as T

        this.debouncedFunctions.set(key, debouncedFunc)
        return debouncedFunc
    }

    /**
     * 创建节流函数
     */
    public throttle<T extends (...args: any[]) => any>(
        key: string,
        func: T,
        delay: number
    ): T {
        if (this.throttledFunctions.has(key)) {
            return this.throttledFunctions.get(key) as T
        }

        let lastExecuted = 0
        const throttledFunc = ((...args: Parameters<T>) => {
            const now = Date.now()
            if (now - lastExecuted >= delay) {
                lastExecuted = now
                return func.apply(null, args)
            }
        }) as T

        this.throttledFunctions.set(key, throttledFunc)
        return throttledFunc
    }

    /**
     * 清理缓存的函数
     */
    public clear(): void {
        this.debouncedFunctions.clear()
        this.throttledFunctions.clear()
    }
}

/**
 * 渲染优化器
 */
export class RenderOptimizer {
    private frameQueue: Array<() => void> = []
    private isProcessingFrame = false

    /**
     * 调度渲染操作
     */
    public scheduleRender(operation: () => void): void {
        this.frameQueue.push(operation)

        if (!this.isProcessingFrame) {
            this.processNextFrame()
        }
    }

    /**
     * 处理下一帧
     */
    private processNextFrame(): void {
        this.isProcessingFrame = true

        requestAnimationFrame(() => {
            const operations = this.frameQueue.splice(0)

            operations.forEach(operation => {
                try {
                    operation()
                } catch (error) {
                    console.error('[RenderOptimizer] Render operation failed:', error)
                }
            })

            this.isProcessingFrame = false

            // 如果有新的操作加入，继续处理
            if (this.frameQueue.length > 0) {
                this.processNextFrame()
            }
        })
    }

    /**
     * 批量DOM更新
     */
    public batchDOMUpdates(updates: Array<() => void>): void {
        this.scheduleRender(() => {
            // 使用文档片段减少DOM重排
            const fragment = document.createDocumentFragment()
            const tempContainer = document.createElement('div')
            fragment.appendChild(tempContainer)

            updates.forEach(update => {
                try {
                    update()
                } catch (error) {
                    console.error('[RenderOptimizer] DOM update failed:', error)
                }
            })
        })
    }

    /**
     * 测量DOM操作性能
     */
    public measureDOMOperation<T>(
        name: string,
        operation: () => T
    ): { result: T; duration: number } {
        const start = performance.now()
        const result = operation()
        const duration = performance.now() - start

        if (duration > 16) { // 超过一帧的时间
            console.warn(`[RenderOptimizer] Slow DOM operation: ${name} took ${duration.toFixed(2)}ms`)
        }

        return { result, duration }
    }
}

/**
 * 性能优化器主类
 */
export class PerformanceOptimizer {
    private config: PerformanceOptimizationConfig
    private virtualScrollManager?: VirtualScrollManager
    private memoryManager: MemoryManager
    private batchOperationManager: BatchOperationManager
    private eventOptimizer: EventOptimizer
    private renderOptimizer: RenderOptimizer

    constructor(config: Partial<PerformanceOptimizationConfig> = {}) {
        this.config = {
            enableVirtualScrolling: true,
            virtualScrollThreshold: 1000,
            virtualScrollBuffer: 10,
            enableMemoryOptimization: true,
            memoryCleanupInterval: 30000,
            maxCacheSize: 1000,
            enableRenderOptimization: true,
            batchUpdateDelay: 16,
            maxBatchSize: 50,
            enableEventOptimization: true,
            debounceDelay: 100,
            throttleDelay: 16,
            ...config
        }

        this.memoryManager = new MemoryManager()
        this.batchOperationManager = new BatchOperationManager()
        this.eventOptimizer = new EventOptimizer()
        this.renderOptimizer = new RenderOptimizer()
    }

    /**
     * 初始化虚拟滚动
     */
    public initVirtualScrolling(
        container: HTMLElement,
        renderItem: (item: ASTNode, index: number) => HTMLElement
    ): VirtualScrollManager | null {
        if (!this.config.enableVirtualScrolling) return null

        this.virtualScrollManager = new VirtualScrollManager(container, renderItem)
        return this.virtualScrollManager
    }

    /**
     * 优化大列表渲染
     */
    public optimizeLargeList(items: ASTNode[], container: HTMLElement): void {
        if (!this.config.enableVirtualScrolling || items.length < this.config.virtualScrollThreshold) {
            // 正常渲染
            this.renderNormalList(items, container)
            return
        }

        // 使用虚拟滚动
        if (!this.virtualScrollManager) {
            console.warn('[PerformanceOptimizer] Virtual scroll manager not initialized')
            return
        }

        this.virtualScrollManager.setData(items)
    }

    /**
     * 正常列表渲染
     */
    private renderNormalList(items: ASTNode[], container: HTMLElement): void {
        this.renderOptimizer.scheduleRender(() => {
            container.innerHTML = ''
            const fragment = document.createDocumentFragment()

            items.forEach(item => {
                const element = this.createListItem(item)
                fragment.appendChild(element)
            })

            container.appendChild(fragment)
        })
    }

    /**
     * 创建列表项（示例实现）
     */
    private createListItem(item: ASTNode): HTMLElement {
        const element = document.createElement('div')
        element.className = 'list-item'
        element.textContent = item.id
        element.setAttribute('data-node-id', item.id)
        return element
    }

    /**
     * 批量更新操作
     */
    public batchUpdate(operations: Array<() => void>): void {
        if (!this.config.enableRenderOptimization) {
            operations.forEach(op => op())
            return
        }

        operations.forEach(operation => {
            this.batchOperationManager.addOperation(operation)
        })
    }

    /**
     * 创建优化的事件处理器
     */
    public createOptimizedEventHandler<T extends (...args: any[]) => any>(
        key: string,
        handler: T,
        type: 'debounce' | 'throttle' = 'debounce'
    ): T {
        if (!this.config.enableEventOptimization) {
            return handler
        }

        const delay = type === 'debounce' ? this.config.debounceDelay : this.config.throttleDelay

        return type === 'debounce'
            ? this.eventOptimizer.debounce(key, handler, delay)
            : this.eventOptimizer.throttle(key, handler, delay)
    }

    /**
     * 获取或创建缓存
     */
    public getCache<T>(name: string): Map<string, T> {
        if (!this.config.enableMemoryOptimization) {
            return new Map<string, T>()
        }

        return this.memoryManager.getCache<T>(name) || this.memoryManager.createCache<T>(name)
    }

    /**
     * 获取性能统计
     */
    public getPerformanceStats(): {
        memoryUsage: { used: number; total: number; percentage: number }
        batchQueueLength: number
        cacheStats: { totalCaches: number }
        config: PerformanceOptimizationConfig
    } {
        return {
            memoryUsage: this.memoryManager.getMemoryUsage(),
            batchQueueLength: this.batchOperationManager.getQueueLength(),
            cacheStats: {
                totalCaches: (this.memoryManager as any).caches.size
            },
            config: this.config
        }
    }

    /**
     * 优化建议
     */
    public getOptimizationRecommendations(): string[] {
        const recommendations: string[] = []
        const stats = this.getPerformanceStats()

        if (stats.memoryUsage.percentage > 80) {
            recommendations.push('内存使用率过高，建议清理缓存或减少数据量')
        }

        if (stats.batchQueueLength > 100) {
            recommendations.push('批量操作队列过长，建议增加批量处理大小')
        }

        if (!this.config.enableVirtualScrolling) {
            recommendations.push('建议启用虚拟滚动以优化大列表性能')
        }

        if (!this.config.enableMemoryOptimization) {
            recommendations.push('建议启用内存优化以改善内存使用')
        }

        return recommendations
    }

    /**
     * 销毁
     */
    public destroy(): void {
        this.virtualScrollManager?.destroy()
        this.memoryManager.destroy()
        this.batchOperationManager.clear()
        this.eventOptimizer.clear()
    }
}

// === 导出便利函数 ===

/**
 * 创建性能优化器实例
 */
export function createPerformanceOptimizer(
    config?: Partial<PerformanceOptimizationConfig>
): PerformanceOptimizer {
    return new PerformanceOptimizer(config)
}

/**
 * 创建默认优化配置
 */
export function createDefaultOptimizationConfig(): PerformanceOptimizationConfig {
    return {
        enableVirtualScrolling: true,
        virtualScrollThreshold: 1000,
        virtualScrollBuffer: 10,
        enableMemoryOptimization: true,
        memoryCleanupInterval: 30000,
        maxCacheSize: 1000,
        enableRenderOptimization: true,
        batchUpdateDelay: 16,
        maxBatchSize: 50,
        enableEventOptimization: true,
        debounceDelay: 100,
        throttleDelay: 16
    }
}

export default PerformanceOptimizer
