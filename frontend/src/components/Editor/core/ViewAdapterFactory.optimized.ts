/**
 * 优化后的视图适配器工厂
 * 
 * 基于新的组合式架构，支持功能混入和动态适配器创建
 * 
 * 改进点：
 * 1. 支持功能混入的动态组合
 * 2. 适配器依赖检查和延迟加载
 * 3. 更好的错误处理和日志记录
 * 4. 性能监控和健康检查
 * 5. 场景模板智能推荐
 */

import { CoreViewAdapter, AdapterBuilder } from '../adapters/BaseViewAdapter.optimized'
import { OptimizedRichTextViewAdapter } from '../adapters/RichTextViewAdapter.optimized'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { ViewAdapterOptions } from '../types/ViewAdapter'

/**
 * 适配器注册信息
 */
interface AdapterRegistration {
    type: EditorType
    name: string
    description: string
    supportedScenes: SceneTemplate[]
    dependencies: string[]
    adapterClass: new (sceneTemplate: SceneTemplate) => CoreViewAdapter
    isLazy: boolean
    loader?: () => Promise<new (sceneTemplate: SceneTemplate) => CoreViewAdapter>
}

/**
 * 适配器创建选项
 */
interface CreateAdapterOptions {
    sceneTemplate: SceneTemplate
    options?: Partial<ViewAdapterOptions>
    enableErrorHandling?: boolean
    enablePerformanceMonitoring?: boolean
    enableAI?: boolean
    onError?: (error: Error) => void
    onProgress?: (progress: { loaded: number; total: number; message: string }) => void
}

/**
 * 适配器健康状态
 */
interface AdapterHealth {
    type: EditorType
    isHealthy: boolean
    lastCheck: number
    issues: string[]
    performance: {
        averageCreateTime: number
        successRate: number
        errorCount: number
    }
}

/**
 * 工厂统计信息
 */
interface FactoryStats {
    totalAdapters: number
    registeredTypes: EditorType[]
    createdInstances: number
    failedCreations: number
    averageCreationTime: number
    healthyAdapters: number
    lastCleanup: number
}

/**
 * 优化后的视图适配器工厂
 */
export class OptimizedViewAdapterFactory {
    private static instance: OptimizedViewAdapterFactory | null = null
    private adapters = new Map<EditorType, AdapterRegistration>()
    private instances = new Map<string, CoreViewAdapter>()
    private healthStatus = new Map<EditorType, AdapterHealth>()
    private isInitialized = false
    private creationStats = {
        total: 0,
        failed: 0,
        timings: [] as number[]
    }

    // === 单例模式 ===

    public static getInstance(): OptimizedViewAdapterFactory {
        if (!this.instance) {
            this.instance = new OptimizedViewAdapterFactory()
        }
        return this.instance
    }

    private constructor() {
        this.initialize()
    }

    // === 初始化 ===

    /**
     * 初始化工厂
     */
    private initialize(): void {
        if (this.isInitialized) return

        try {
            console.log('[AdapterFactory] Initializing optimized adapter factory...')

            // 注册核心适配器
            this.registerCoreAdapters()

            // 启动定期健康检查
            this.startHealthMonitoring()

            this.isInitialized = true
            console.log('[AdapterFactory] Initialization completed successfully')

        } catch (error) {
            console.error('[AdapterFactory] Initialization failed:', error)
            throw error
        }
    }

    /**
     * 注册核心适配器
     */
    private registerCoreAdapters(): void {
        // 注册富文本适配器
        this.registerAdapter({
            type: EditorType.RICH_TEXT,
            name: '富文本编辑器',
            description: '基于TipTap的优化富文本编辑器，支持AI功能和性能监控',
            supportedScenes: [
                SceneTemplate.WRITING,
                SceneTemplate.RESEARCH,
                SceneTemplate.LEARNING
            ],
            dependencies: ['@tiptap/react', '@tiptap/starter-kit'],
            adapterClass: OptimizedRichTextViewAdapter,
            isLazy: false
        })

        // 注册其他适配器（延迟加载）
        this.registerAdapter({
            type: EditorType.GRAPH,
            name: '知识图谱编辑器',
            description: '基于vis-network的知识图谱可视化编辑器',
            supportedScenes: [
                SceneTemplate.RESEARCH,
                SceneTemplate.LEARNING,
                SceneTemplate.PLANNING
            ],
            dependencies: ['vis-network', 'd3'],
            adapterClass: null as any, // 延迟加载
            isLazy: true,
            loader: async () => {
                const { GraphViewAdapter } = await import('../adapters/GraphViewAdapter')
                return GraphViewAdapter as any
            }
        })

        this.registerAdapter({
            type: EditorType.CANVAS,
            name: '画布编辑器',
            description: '基于Fabric.js的画布编辑器',
            supportedScenes: [
                SceneTemplate.CREATIVE,
                SceneTemplate.PLANNING,
                SceneTemplate.LEARNING
            ],
            dependencies: ['fabric'],
            adapterClass: null as any, // 延迟加载
            isLazy: true,
            loader: async () => {
                const { CanvasViewAdapter } = await import('../adapters/CanvasViewAdapter')
                return CanvasViewAdapter as any
            }
        })

        this.registerAdapter({
            type: EditorType.TABLE,
            name: '表格编辑器',
            description: '功能强大的表格编辑器',
            supportedScenes: [
                SceneTemplate.RESEARCH,
                SceneTemplate.PLANNING,
                SceneTemplate.LEARNING
            ],
            dependencies: [],
            adapterClass: null as any, // 延迟加载
            isLazy: true,
            loader: async () => {
                const { TableViewAdapter } = await import('../adapters/TableViewAdapter')
                return TableViewAdapter as any
            }
        })

        this.registerAdapter({
            type: EditorType.TIMELINE,
            name: '时间线编辑器',
            description: '时间线编辑器，支持项目管理',
            supportedScenes: [
                SceneTemplate.PLANNING,
                SceneTemplate.RESEARCH,
                SceneTemplate.LEARNING
            ],
            dependencies: [],
            adapterClass: null as any, // 延迟加载
            isLazy: true,
            loader: async () => {
                const { TimelineViewAdapter } = await import('../adapters/TimelineViewAdapter')
                return TimelineViewAdapter as any
            }
        })
    }

    // === 核心功能 ===

    /**
     * 创建适配器
     */
    public async createAdapter(
        type: EditorType,
        options: CreateAdapterOptions
    ): Promise<CoreViewAdapter> {
        const startTime = performance.now()

        try {
            console.log(`[AdapterFactory] Creating adapter: ${type}`)

            // 验证输入
            this.validateCreateOptions(type, options)

            // 获取适配器注册信息
            const _registration = this.getRegistration(type)

            // 检查依赖
            await this.checkDependencies(_registration)

            // 加载适配器类（如果是延迟加载）
            const AdapterClass = await this.loadAdapterClass(_registration)

            // 创建增强的适配器
            const adapter = this.buildEnhancedAdapter(AdapterClass, options)

            // 创建实例
            const instance = new adapter(options.sceneTemplate)

            // 记录实例
            const instanceId = this.generateInstanceId(type)
            this.instances.set(instanceId, instance)

            // 记录统计信息
            const duration = performance.now() - startTime
            this.recordCreationStats(true, duration)

            // 报告进度
            options.onProgress?.({
                loaded: 1,
                total: 1,
                message: `${_registration.name} 创建完成`
            })

            console.log(`[AdapterFactory] Adapter ${type} created successfully in ${duration.toFixed(2)}ms`)
            return instance

        } catch (error) {
            const duration = performance.now() - startTime
            this.recordCreationStats(false, duration)

            console.error(`[AdapterFactory] Failed to create adapter ${type}:`, error)
            options.onError?.(error as Error)
            throw error
        }
    }

    /**
     * 注册适配器
     */
    public registerAdapter(registration: Omit<AdapterRegistration, 'adapterClass'> & {
        adapterClass?: new (sceneTemplate: SceneTemplate) => CoreViewAdapter
    }): void {
        try {
            if (this.adapters.has(registration.type)) {
                console.warn(`[AdapterFactory] Overwriting existing adapter: ${registration.type}`)
            }

            this.adapters.set(registration.type, registration as AdapterRegistration)

            // 初始化健康状态
            this.healthStatus.set(registration.type, {
                type: registration.type,
                isHealthy: true,
                lastCheck: Date.now(),
                issues: [],
                performance: {
                    averageCreateTime: 0,
                    successRate: 1,
                    errorCount: 0
                }
            })

            console.log(`[AdapterFactory] Registered adapter: ${registration.name} (${registration.type})`)

        } catch (error) {
            console.error('[AdapterFactory] Failed to register adapter:', error)
            throw error
        }
    }

    /**
     * 获取支持的编辑器类型
     */
    public getSupportedTypes(): EditorType[] {
        return Array.from(this.adapters.keys())
    }

    /**
     * 检查是否支持编辑器类型
     */
    public isSupported(type: EditorType): boolean {
        return this.adapters.has(type)
    }

    /**
     * 根据场景模板获取推荐的编辑器类型
     */
    public getRecommendedTypes(sceneTemplate: SceneTemplate): Array<{
        type: EditorType
        name: string
        confidence: number
        reason: string
    }> {
        const recommendations: Array<{
            type: EditorType
            name: string
            confidence: number
            reason: string
        }> = []

        this.adapters.forEach((registration) => {
            if (registration.supportedScenes.includes(sceneTemplate)) {
                let confidence = 0.5 // 基础分数
                let reason = `支持 ${sceneTemplate} 场景`

                // 根据适配器特性调整推荐分数
                switch (sceneTemplate) {
                    case SceneTemplate.WRITING:
                        if (registration.type === EditorType.RICH_TEXT) {
                            confidence = 0.95
                            reason = '富文本编辑器最适合写作场景'
                        }
                        break
                    case SceneTemplate.RESEARCH:
                        if (registration.type === EditorType.GRAPH) {
                            confidence = 0.9
                            reason = '知识图谱最适合研究场景'
                        } else if (registration.type === EditorType.RICH_TEXT) {
                            confidence = 0.8
                            reason = '富文本编辑器也适合研究笔记'
                        }
                        break
                    case SceneTemplate.PLANNING:
                        if (registration.type === EditorType.TIMELINE) {
                            confidence = 0.9
                            reason = '时间线编辑器最适合规划场景'
                        } else if (registration.type === EditorType.CANVAS) {
                            confidence = 0.85
                            reason = '画布编辑器适合可视化规划'
                        }
                        break
                    case SceneTemplate.CREATIVE:
                        if (registration.type === EditorType.CANVAS) {
                            confidence = 0.95
                            reason = '画布编辑器最适合创意设计'
                        }
                        break
                    case SceneTemplate.LEARNING:
                        if (registration.type === EditorType.TIMELINE) {
                            confidence = 0.8
                            reason = '时间线适合学习进度管理'
                        } else if (registration.type === EditorType.GRAPH) {
                            confidence = 0.85
                            reason = '知识图谱适合学习知识整理'
                        }
                        break
                }

                // 考虑适配器健康状况
                const health = this.healthStatus.get(registration.type)
                if (health && !health.isHealthy) {
                    confidence *= 0.7 // 降低不健康适配器的推荐度
                    reason += '（当前适配器存在性能问题）'
                }

                recommendations.push({
                    type: registration.type,
                    name: registration.name,
                    confidence,
                    reason
                })
            }
        })

        // 按推荐度排序
        return recommendations.sort((a, b) => b.confidence - a.confidence)
    }

    /**
     * 获取适配器信息
     */
    public getAdapterInfo(type: EditorType): AdapterRegistration | null {
        return this.adapters.get(type) || null
    }

    /**
     * 获取所有适配器信息
     */
    public getAllAdapterInfo(): AdapterRegistration[] {
        return Array.from(this.adapters.values())
    }

    /**
     * 获取工厂统计信息
     */
    public getFactoryStats(): FactoryStats {
        const healthyCount = Array.from(this.healthStatus.values())
            .filter(h => h.isHealthy).length

        return {
            totalAdapters: this.adapters.size,
            registeredTypes: Array.from(this.adapters.keys()),
            createdInstances: this.creationStats.total,
            failedCreations: this.creationStats.failed,
            averageCreationTime: this.creationStats.timings.length > 0
                ? this.creationStats.timings.reduce((a, b) => a + b, 0) / this.creationStats.timings.length
                : 0,
            healthyAdapters: healthyCount,
            lastCleanup: Date.now()
        }
    }

    /**
     * 获取适配器健康状态
     */
    public getAdapterHealth(type?: EditorType): AdapterHealth | AdapterHealth[] | null {
        if (type) {
            return this.healthStatus.get(type) || null
        }
        return Array.from(this.healthStatus.values())
    }

    // === 私有方法 ===

    /**
     * 验证创建选项
     */
    private validateCreateOptions(type: EditorType, options: CreateAdapterOptions): void {
        if (!type) {
            throw new Error('Adapter type is required')
        }

        if (!options.sceneTemplate) {
            throw new Error('Scene template is required')
        }

        if (!this.adapters.has(type)) {
            throw new Error(`Unsupported adapter type: ${type}`)
        }

        const registration = this.adapters.get(type)!
        if (!registration.supportedScenes.includes(options.sceneTemplate)) {
            throw new Error(
                `Adapter ${type} does not support scene template: ${options.sceneTemplate}`
            )
        }
    }

    /**
     * 获取适配器注册信息
     */
    private getRegistration(type: EditorType): AdapterRegistration {
        const registration = this.adapters.get(type)
        if (!registration) {
            throw new Error(`Adapter ${type} not found`)
        }
        return registration
    }

    /**
     * 检查依赖
     */
    private async checkDependencies(registration: AdapterRegistration): Promise<void> {
        for (const dependency of registration.dependencies) {
            try {
                // 简化的依赖检查，实际项目中可能需要更复杂的逻辑
                await import(dependency)
            } catch (error) {
                throw new Error(
                    `Missing dependency for ${registration.name}: ${dependency}. ` +
                    `Please install it using: npm install ${dependency}`
                )
            }
        }
    }

    /**
     * 加载适配器类
     */
    private async loadAdapterClass(
        registration: AdapterRegistration
    ): Promise<new (sceneTemplate: SceneTemplate) => CoreViewAdapter> {
        if (!registration.isLazy && registration.adapterClass) {
            return registration.adapterClass
        }

        if (registration.isLazy && registration.loader) {
            console.log(`[AdapterFactory] Loading adapter: ${registration.type}`)
            return await registration.loader()
        }

        throw new Error(`No adapter class or loader found for ${registration.type}`)
    }

    /**
     * 构建增强的适配器
     */
    private buildEnhancedAdapter(
        AdapterClass: new (sceneTemplate: SceneTemplate) => CoreViewAdapter,
        _options: CreateAdapterOptions
    ): new (sceneTemplate: SceneTemplate) => CoreViewAdapter {

        // 使用适配器构建器创建增强版本
        let builder = new AdapterBuilder(AdapterClass)

        // 根据选项添加功能
        if (_options.enableErrorHandling !== false) {
            builder = builder.withErrorHandling()
        }

        if (_options.enablePerformanceMonitoring !== false) {
            builder = builder.withPerformanceMonitoring()
        }

        if (_options.enableAI !== false) {
            builder = builder.withAI()
        }

        return builder.build()
    }

    /**
     * 生成实例ID
     */
    private generateInstanceId(type: EditorType): string {
        return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 记录创建统计
     */
    private recordCreationStats(success: boolean, duration: number): void {
        this.creationStats.total++
        if (!success) {
            this.creationStats.failed++
        }
        this.creationStats.timings.push(duration)

        // 限制统计数据大小
        if (this.creationStats.timings.length > 100) {
            this.creationStats.timings = this.creationStats.timings.slice(-50)
        }
    }

    /**
     * 启动健康监控
     */
    private startHealthMonitoring(): void {
        // 每5分钟检查一次适配器健康状况
        setInterval(() => {
            this.performHealthCheck()
        }, 5 * 60 * 1000)
    }

    /**
     * 执行健康检查
     */
    private performHealthCheck(): void {
        console.log('[AdapterFactory] Performing health check...')

        this.adapters.forEach((registration, type) => {
            const currentHealth = this.healthStatus.get(type)
            if (!currentHealth) return

            // 更新健康状态
            const updatedHealth: AdapterHealth = {
                ...currentHealth,
                lastCheck: Date.now(),
                performance: {
                    ...currentHealth.performance,
                    successRate: this.calculateSuccessRate(type),
                    averageCreateTime: this.calculateAverageCreateTime(type)
                }
            }

            // 检查是否有性能问题
            updatedHealth.issues = []
            if (updatedHealth.performance.successRate < 0.8) {
                updatedHealth.issues.push('Low success rate')
                updatedHealth.isHealthy = false
            }
            if (updatedHealth.performance.averageCreateTime > 5000) {
                updatedHealth.issues.push('Slow creation time')
                updatedHealth.isHealthy = false
            }

            if (updatedHealth.issues.length === 0) {
                updatedHealth.isHealthy = true
            }

            this.healthStatus.set(type, updatedHealth)
        })
    }

    /**
     * 计算成功率
     */
    private calculateSuccessRate(_type: EditorType): number {
        // 简化实现，实际项目中需要跟踪每种类型的成功/失败次数
        const total = this.creationStats.total
        const failed = this.creationStats.failed
        return total > 0 ? (total - failed) / total : 1
    }

    /**
     * 计算平均创建时间
     */
    private calculateAverageCreateTime(_type: EditorType): number {
        // 简化实现，实际项目中需要分类型跟踪
        const timings = this.creationStats.timings
        return timings.length > 0
            ? timings.reduce((a, b) => a + b, 0) / timings.length
            : 0
    }

    /**
     * 清理资源
     */
    public cleanup(): void {
        console.log('[AdapterFactory] Cleaning up resources...')

        // 销毁所有实例
        this.instances.forEach((instance, id) => {
            try {
                instance.destroy()
            } catch (error) {
                console.error(`[AdapterFactory] Failed to destroy instance ${id}:`, error)
            }
        })

        this.instances.clear()
        this.adapters.clear()
        this.healthStatus.clear()
        this.isInitialized = false

        console.log('[AdapterFactory] Cleanup completed')
    }

    /**
     * 重置工厂
     */
    public reset(): void {
        this.cleanup()
        this.initialize()
    }
}

// === 导出单例实例 ===
export const optimizedAdapterFactory = OptimizedViewAdapterFactory.getInstance()

// === 便利函数 ===

/**
 * 创建适配器的便利函数
 */
export async function createOptimizedAdapter(
    type: EditorType,
    sceneTemplate: SceneTemplate,
    options?: Partial<ViewAdapterOptions>
): Promise<CoreViewAdapter> {
    return optimizedAdapterFactory.createAdapter(type, {
        sceneTemplate,
        options,
        enableErrorHandling: true,
        enablePerformanceMonitoring: true,
        enableAI: true
    })
}

/**
 * 获取场景推荐的便利函数
 */
export function getSceneRecommendations(sceneTemplate: SceneTemplate) {
    return optimizedAdapterFactory.getRecommendedTypes(sceneTemplate)
}

/**
 * 健康检查的便利函数
 */
export function checkFactoryHealth() {
    return {
        stats: optimizedAdapterFactory.getFactoryStats(),
        adapters: optimizedAdapterFactory.getAdapterHealth()
    }
}

export default OptimizedViewAdapterFactory
