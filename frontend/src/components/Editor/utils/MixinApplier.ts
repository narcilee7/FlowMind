/**
 * 混入应用器
 * 
 * 实现真正的功能混入机制，将错误处理、性能监控、AI功能等
 * 动态组合到核心适配器类中
 * 
 * 设计模式：
 * - 混入模式 (Mixin Pattern)
 * - 装饰器模式 (Decorator Pattern)
 * - 组合模式 (Composition Pattern)
 */

import { CoreViewAdapter } from '../adapters/BaseViewAdapter.optimized'
import { ErrorHandlingMixin } from '../mixins/ErrorHandlingMixin'
import { PerformanceMonitoringMixin } from '../mixins/PerformanceMonitoringMixin'
import { AIMixin } from '../mixins/AIMixin'
import { SceneTemplate } from '../types/EditorType'

/**
 * 混入标识符
 */
export enum MixinType {
    ERROR_HANDLING = 'errorHandling',
    PERFORMANCE_MONITORING = 'performanceMonitoring',
    AI = 'ai'
}

/**
 * 混入配置
 */
export interface MixinConfig {
    type: MixinType
    enabled: boolean
    options?: any
}

/**
 * 增强适配器接口
 */
export interface EnhancedAdapter extends CoreViewAdapter {
    // 错误处理能力
    getErrorHistory?(): any[]
    clearErrorHistory?(): void
    setErrorHandler?(handler: (error: Error) => void): void

    // 性能监控能力
    getPerformanceStats?(): any
    getPerformanceReport?(): any
    startProfiling?(): void
    stopProfiling?(): void
    clearMetrics?(): void
    checkPerformanceHealth?(): any

    // AI功能能力
    requestAICompletion?(context: string, position: number): Promise<string>
    requestAIRewrite?(content: string, style: string): Promise<string>
    getAISuggestions?(context?: string): Promise<any[]>
    applyAISuggestion?(suggestion: any): Promise<void>
    getAIProcessingState?(): any
    configureAI?(config: any): void
}

/**
 * 混入应用器类
 */
export class MixinApplier {
    private mixins = new Map<MixinType, any>()
    private appliedMixins = new Set<MixinType>()

    constructor() {
        this.initializeMixins()
    }

    /**
     * 初始化混入实例
     */
    private initializeMixins(): void {
        this.mixins.set(MixinType.ERROR_HANDLING, ErrorHandlingMixin)
        this.mixins.set(MixinType.PERFORMANCE_MONITORING, PerformanceMonitoringMixin)
        this.mixins.set(MixinType.AI, AIMixin)
    }

    /**
     * 应用错误处理混入
     */
    public applyErrorHandling<T extends CoreViewAdapter>(
        adapter: T,
        config?: any
    ): T & ErrorHandlingMixin {
        if (this.appliedMixins.has(MixinType.ERROR_HANDLING)) {
            return adapter as T & ErrorHandlingMixin
        }

        const errorHandler = new ErrorHandlingMixin()

        // 初始化错误处理
        if (config) {
            errorHandler.configureErrorHandling(config)
        }

        // 将错误处理方法混入到适配器
        this.mixinMethods(adapter, errorHandler, [
            'handleError',
            'getErrorHistory',
            'clearErrorHistory',
            'setErrorHandler',
            'getErrorStats',
            'isErrorThresholdExceeded',
            'resetErrorCount',
            'configureErrorHandling',
            'triggerRecovery',
            'hasCriticalErrors',
            'getLastError'
        ])

        // 重写适配器的错误处理
        this.overrideErrorHandling(adapter, errorHandler)

        this.appliedMixins.add(MixinType.ERROR_HANDLING)
        console.log('[MixinApplier] Applied error handling mixin')

        return adapter as T & ErrorHandlingMixin
    }

    /**
     * 应用性能监控混入
     */
    public applyPerformanceMonitoring<T extends CoreViewAdapter>(
        adapter: T,
        config?: any
    ): T & PerformanceMonitoringMixin {
        if (this.appliedMixins.has(MixinType.PERFORMANCE_MONITORING)) {
            return adapter as T & PerformanceMonitoringMixin
        }

        const perfMonitor = new PerformanceMonitoringMixin()

        // 初始化性能监控
        if (config) {
            perfMonitor.configurePerformanceMonitoring(config)
        }

        // 将性能监控方法混入到适配器
        this.mixinMethods(adapter, perfMonitor, [
            'startMonitoring',
            'stopMonitoring',
            'startOperation',
            'endOperation',
            'recordRenderMetrics',
            'getPerformanceStats',
            'getPerformanceReport',
            'clearMetrics',
            'configurePerformanceMonitoring',
            'getRealTimeMetrics',
            'forceGarbageCollection',
            'checkPerformanceHealth',
            'exportMetrics'
        ])

        // 重写适配器的关键方法以添加性能监控
        this.overridePerformanceMonitoring(adapter, perfMonitor)

        this.appliedMixins.add(MixinType.PERFORMANCE_MONITORING)
        console.log('[MixinApplier] Applied performance monitoring mixin')

        return adapter as T & PerformanceMonitoringMixin
    }

    /**
     * 应用AI功能混入
     */
    public applyAI<T extends CoreViewAdapter>(
        adapter: T,
        config?: any
    ): T & AIMixin {
        if (this.appliedMixins.has(MixinType.AI)) {
            return adapter as T & AIMixin
        }

        const aiManager = new AIMixin()

        // 初始化AI功能
        if (config) {
            aiManager.configureAI(config)
        }

        // 将AI方法混入到适配器
        this.mixinMethods(adapter, aiManager, [
            'requestAICompletion',
            'requestAIRewrite',
            'requestAIResearch',
            'extractKnowledge',
            'getAISuggestions',
            'applyAISuggestion',
            'analyzeContent',
            'smartFormat',
            'onAIEvent',
            'offAIEvent',
            'getAIProcessingState',
            'getCurrentAISuggestions',
            'clearAISuggestions',
            'configureAI',
            'getAIStats',
            'cancelAllAIRequests'
        ])

        this.appliedMixins.add(MixinType.AI)
        console.log('[MixinApplier] Applied AI mixin')

        return adapter as T & AIMixin
    }

    /**
     * 批量应用混入
     */
    public applyMixins<T extends CoreViewAdapter>(
        adapter: T,
        configs: MixinConfig[]
    ): EnhancedAdapter {
        let enhancedAdapter: any = adapter

        for (const config of configs) {
            if (!config.enabled) continue

            switch (config.type) {
                case MixinType.ERROR_HANDLING:
                    enhancedAdapter = this.applyErrorHandling(enhancedAdapter, config.options)
                    break
                case MixinType.PERFORMANCE_MONITORING:
                    enhancedAdapter = this.applyPerformanceMonitoring(enhancedAdapter, config.options)
                    break
                case MixinType.AI:
                    enhancedAdapter = this.applyAI(enhancedAdapter, config.options)
                    break
                default:
                    console.warn(`[MixinApplier] Unknown mixin type: ${config.type}`)
            }
        }

        return enhancedAdapter as EnhancedAdapter
    }

    /**
     * 创建增强适配器类
     */
    public createEnhancedAdapterClass<T extends CoreViewAdapter>(
        BaseAdapterClass: new (sceneTemplate: SceneTemplate) => T,
        configs: MixinConfig[]
    ): new (sceneTemplate: SceneTemplate) => EnhancedAdapter {

        const applier = this

        return class EnhancedAdapterClass {
            private baseInstance: T

            constructor(sceneTemplate: SceneTemplate) {
                this.baseInstance = new BaseAdapterClass(sceneTemplate)

                // 应用混入并返回增强的实例
                return applier.applyMixins(this.baseInstance, configs) as any
            }
        } as any
    }

    // === 私有方法 ===

    /**
     * 混入方法到目标对象
     */
    private mixinMethods(target: any, source: any, methods: string[]): void {
        methods.forEach(method => {
            if (typeof source[method] === 'function') {
                target[method] = source[method].bind(source)
            } else if (source[method] !== undefined) {
                target[method] = source[method]
            }
        })
    }

    /**
     * 重写错误处理
     */
    private overrideErrorHandling(adapter: any, errorHandler: ErrorHandlingMixin): void {
        const originalMethods = {
            create: adapter.create?.bind(adapter),
            destroy: adapter.destroy?.bind(adapter),
            render: adapter.render?.bind(adapter),
            updateNode: adapter.updateNode?.bind(adapter),
            removeNode: adapter.removeNode?.bind(adapter),
            addNode: adapter.addNode?.bind(adapter)
        }

        // 包装create方法
        if (originalMethods.create) {
            adapter.create = async function (...args: any[]) {
                try {
                    return await originalMethods.create(...args)
                } catch (error) {
                    errorHandler.handleError(error as Error, 'create')
                    throw error
                }
            }
        }

        // 包装destroy方法
        if (originalMethods.destroy) {
            adapter.destroy = async function (...args: any[]) {
                try {
                    return await originalMethods.destroy(...args)
                } catch (error) {
                    errorHandler.handleError(error as Error, 'destroy')
                    throw error
                }
            }
        }

        // 包装render方法
        if (originalMethods.render) {
            adapter.render = async function (...args: any[]) {
                try {
                    return await originalMethods.render(...args)
                } catch (error) {
                    errorHandler.handleError(error as Error, 'render')
                    throw error
                }
            }
        }

        // 包装节点操作方法
        ['updateNode', 'removeNode', 'addNode'].forEach(methodName => {
            const originalMethod = (originalMethods as any)[methodName]
            if (originalMethod) {
                (adapter as any)[methodName] = function (...args: any[]) {
                    try {
                        return originalMethod(...args)
                    } catch (error) {
                        errorHandler.handleError(error as Error, methodName)
                        throw error
                    }
                }
            }
        })
    }

    /**
     * 重写性能监控
     */
    private overridePerformanceMonitoring(adapter: any, perfMonitor: PerformanceMonitoringMixin): void {
        const originalMethods = {
            create: adapter.create?.bind(adapter),
            render: adapter.render?.bind(adapter),
            updateNode: adapter.updateNode?.bind(adapter),
            removeNode: adapter.removeNode?.bind(adapter),
            addNode: adapter.addNode?.bind(adapter)
        }

        // 包装create方法
        if (originalMethods.create) {
            adapter.create = async function (...args: any[]) {
                const operationId = perfMonitor.startOperation('create')
                try {
                    const result = await originalMethods.create(...args)
                    perfMonitor.endOperation(operationId, true)
                    return result
                } catch (error) {
                    perfMonitor.endOperation(operationId, false, (error as Error).message)
                    throw error
                }
            }
        }

        // 包装render方法
        if (originalMethods.render) {
            adapter.render = async function (...args: any[]) {
                const operationId = perfMonitor.startOperation('render')
                const startTime = performance.now()

                try {
                    const result = await originalMethods.render(...args)
                    const duration = performance.now() - startTime

                    // 假设我们可以计算节点数量
                    const nodeCount = args[0]?.root?.children?.length || 1
                    perfMonitor.recordRenderMetrics('full', nodeCount, duration)
                    perfMonitor.endOperation(operationId, true)

                    return result
                } catch (error) {
                    perfMonitor.endOperation(operationId, false, (error as Error).message)
                    throw error
                }
            }
        }

        // 包装节点操作方法
        ['updateNode', 'removeNode', 'addNode'].forEach(methodName => {
            const originalMethod = (originalMethods as any)[methodName]
            if (originalMethod) {
                (adapter as any)[methodName] = function (...args: any[]) {
                    const operationId = perfMonitor.startOperation(methodName)
                    try {
                        const result = originalMethod(...args)
                        perfMonitor.endOperation(operationId, true)
                        return result
                    } catch (error) {
                        perfMonitor.endOperation(operationId, false, (error as Error).message)
                        throw error
                    }
                }
            }
        })
    }

    /**
     * 检查混入是否已应用
     */
    public isMixinApplied(type: MixinType): boolean {
        return this.appliedMixins.has(type)
    }

    /**
     * 获取已应用的混入
     */
    public getAppliedMixins(): MixinType[] {
        return Array.from(this.appliedMixins)
    }

    /**
     * 重置混入状态
     */
    public reset(): void {
        this.appliedMixins.clear()
        console.log('[MixinApplier] Reset applied mixins')
    }
}

// === 导出单例实例 ===
export const mixinApplier = new MixinApplier()

// === 便利函数 ===

/**
 * 创建增强适配器的便利函数
 */
export function createEnhancedAdapter<T extends CoreViewAdapter>(
    BaseAdapterClass: new (sceneTemplate: SceneTemplate) => T,
    options: {
        enableErrorHandling?: boolean
        enablePerformanceMonitoring?: boolean
        enableAI?: boolean
        errorHandlingConfig?: any
        performanceConfig?: any
        aiConfig?: any
    } = {}
): new (sceneTemplate: SceneTemplate) => EnhancedAdapter {

    const configs: MixinConfig[] = [
        {
            type: MixinType.ERROR_HANDLING,
            enabled: options.enableErrorHandling !== false,
            options: options.errorHandlingConfig
        },
        {
            type: MixinType.PERFORMANCE_MONITORING,
            enabled: options.enablePerformanceMonitoring !== false,
            options: options.performanceConfig
        },
        {
            type: MixinType.AI,
            enabled: options.enableAI !== false,
            options: options.aiConfig
        }
    ]

    return mixinApplier.createEnhancedAdapterClass(BaseAdapterClass, configs)
}

/**
 * 应用标准混入配置的便利函数
 */
export function applyStandardMixins<T extends CoreViewAdapter>(
    adapter: T
): EnhancedAdapter {
    return mixinApplier.applyMixins(adapter, [
        { type: MixinType.ERROR_HANDLING, enabled: true },
        { type: MixinType.PERFORMANCE_MONITORING, enabled: true },
        { type: MixinType.AI, enabled: true }
    ])
}

export default MixinApplier
