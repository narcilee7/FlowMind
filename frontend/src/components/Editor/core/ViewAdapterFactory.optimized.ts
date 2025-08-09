/**
 * 优化版视图适配器工厂
 * 
 * 相比基础版本的改进：
 * 1. 集成 Mixin 增强机制
 * 2. 更智能的推荐系统
 * 3. 更好的错误处理和恢复
 * 4. 性能监控和健康检查
 * 5. 懒加载和依赖管理
 */

import { EditorType, SceneTemplate } from '../types/EditorType'
import { CoreViewAdapter, createAdapter } from '../adapters/BaseViewAdapter.optimized'
import { RichTextViewAdapter } from '../adapters/RichTextViewAdapter'

/**
 * 适配器推荐信息
 */
export interface AdapterRecommendation {
    type: EditorType
    confidence: number // 0-1 之间的置信度
    reason: string
    features: string[]
}

/**
 * 优化版适配器创建选项
 */
export interface OptimizedAdapterOptions {
    sceneTemplate: SceneTemplate
    enableErrorHandling?: boolean
    enablePerformanceMonitoring?: boolean
    enableAI?: boolean
    onError?: (error: Error) => void
    onProgress?: (progress: { message: string; percentage: number }) => void
    theme?: 'light' | 'dark' | 'auto'
    autoFocus?: boolean
}

/**
 * 适配器注册信息（优化版）
 */
interface OptimizedAdapterRegistration {
    type: EditorType
    adapterClass: new (sceneTemplate: SceneTemplate) => CoreViewAdapter
    name: string
    description: string
    supportedScenes: SceneTemplate[]
    features: string[]
    dependencies?: string[]
    lazy?: boolean
    priority: number
    matchScore: (scene: SceneTemplate) => number
}

/**
 * 优化版视图适配器工厂
 */
class OptimizedViewAdapterFactory {
    private adapters = new Map<EditorType, OptimizedAdapterRegistration>()
    private loadedAdapters = new Set<EditorType>()
    private healthChecks = new Map<EditorType, () => Promise<boolean>>()
    private isInitialized = false

    constructor() {
        this.init()
    }

    /**
     * 初始化适配器注册
     */
    private init(): void {
        if (this.isInitialized) return

        try {
            // 注册富文本适配器
            this.registerAdapter({
                type: EditorType.RICH_TEXT,
                adapterClass: RichTextViewAdapter,
                name: '富文本编辑器',
                description: '基于 TipTap 的功能完整的富文本编辑器',
                supportedScenes: [
                    SceneTemplate.WRITING,
                    SceneTemplate.RESEARCH,
                    SceneTemplate.LEARNING
                ],
                features: [
                    '完整的富文本编辑',
                    'Markdown 支持',
                    '表格和图片',
                    '协作编辑',
                    'AI 智能补全'
                ],
                priority: 10,
                matchScore: (scene) => {
                    switch (scene) {
                        case SceneTemplate.WRITING: return 0.95
                        case SceneTemplate.RESEARCH: return 0.85
                        case SceneTemplate.LEARNING: return 0.80
                        default: return 0.60
                    }
                }
            })

            // 注册图谱适配器（目前使用占位符）
            this.registerAdapter({
                type: EditorType.GRAPH,
                adapterClass: this.createPlaceholderAdapter('Graph'),
                name: '知识图谱',
                description: '可视化知识网络和关系图谱',
                supportedScenes: [
                    SceneTemplate.RESEARCH,
                    SceneTemplate.LEARNING,
                    SceneTemplate.PLANNING
                ],
                features: [
                    '节点关系可视化',
                    '智能图谱布局',
                    '知识抽取',
                    '语义搜索'
                ],
                priority: 8,
                lazy: true,
                matchScore: (scene) => {
                    switch (scene) {
                        case SceneTemplate.RESEARCH: return 0.90
                        case SceneTemplate.LEARNING: return 0.75
                        case SceneTemplate.PLANNING: return 0.70
                        default: return 0.40
                    }
                }
            })

            // 注册画布适配器（目前使用占位符）
            this.registerAdapter({
                type: EditorType.CANVAS,
                adapterClass: this.createPlaceholderAdapter('Canvas'),
                name: '画布编辑器',
                description: '自由绘图和视觉设计工具',
                supportedScenes: [
                    SceneTemplate.CREATIVE,
                    SceneTemplate.PLANNING,
                    SceneTemplate.WHITEBOARD,
                    SceneTemplate.WIREFRAME,
                    SceneTemplate.DIAGRAM
                ],
                features: [
                    '自由绘图',
                    '图形工具',
                    '协作白板',
                    '模板库'
                ],
                priority: 7,
                lazy: true,
                matchScore: (scene) => {
                    switch (scene) {
                        case SceneTemplate.CREATIVE: return 0.95
                        case SceneTemplate.WHITEBOARD: return 0.90
                        case SceneTemplate.WIREFRAME: return 0.85
                        case SceneTemplate.DIAGRAM: return 0.85
                        case SceneTemplate.PLANNING: return 0.70
                        default: return 0.30
                    }
                }
            })

            // 注册表格适配器（目前使用占位符）
            this.registerAdapter({
                type: EditorType.TABLE,
                adapterClass: this.createPlaceholderAdapter('Table'),
                name: '表格编辑器',
                description: '数据表格和分析工具',
                supportedScenes: [
                    SceneTemplate.RESEARCH,
                    SceneTemplate.PLANNING,
                    SceneTemplate.LEARNING
                ],
                features: [
                    '数据编辑',
                    '排序过滤',
                    '图表生成',
                    '数据分析'
                ],
                priority: 6,
                lazy: true,
                matchScore: (scene) => {
                    switch (scene) {
                        case SceneTemplate.RESEARCH: return 0.75
                        case SceneTemplate.PLANNING: return 0.70
                        default: return 0.40
                    }
                }
            })

            // 注册时间线适配器（目前使用占位符）
            this.registerAdapter({
                type: EditorType.TIMELINE,
                adapterClass: this.createPlaceholderAdapter('Timeline'),
                name: '时间线编辑器',
                description: '时间线和项目管理工具',
                supportedScenes: [
                    SceneTemplate.PLANNING,
                    SceneTemplate.RESEARCH,
                    SceneTemplate.LEARNING
                ],
                features: [
                    '时间线视图',
                    '项目管理',
                    '里程碑',
                    '进度跟踪'
                ],
                priority: 5,
                lazy: true,
                matchScore: (scene) => {
                    switch (scene) {
                        case SceneTemplate.PLANNING: return 0.85
                        case SceneTemplate.RESEARCH: return 0.60
                        case SceneTemplate.LEARNING: return 0.55
                        default: return 0.30
                    }
                }
            })

            this.isInitialized = true
            console.log('[OptimizedFactory] Initialized with', this.adapters.size, 'adapters')

        } catch (error) {
            console.error('[OptimizedFactory] Initialization failed:', error)
            throw error
        }
    }

    /**
     * 创建占位符适配器类
     */
    private createPlaceholderAdapter(typeName: string) {
        return class PlaceholderAdapter extends CoreViewAdapter {
            public readonly type = EditorType.RICH_TEXT // 临时占位
            public readonly capabilities = {
                canEdit: false,
                canSelect: false,
                canZoom: false,
                canDrag: false,
                supportsUndo: false,
                supportsSearch: false,
                supportsAI: false
            }

            protected async performCreate(element: HTMLElement): Promise<void> {
                element.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                                color: #666; text-align: center; font-family: sans-serif;">
                        <div>
                            <h3>${typeName} 编辑器</h3>
                            <p>开发中，敬请期待...</p>
                            <small>当前使用富文本编辑器作为替代方案</small>
                        </div>
                    </div>
                `
            }

            protected performDestroy(): void {
                // 占位符无需清理
            }

            protected performRender(): void {
                // 占位符不支持渲染
            }

            protected performUpdateNode(): void {
                // 占位符不支持节点操作
            }

            protected performRemoveNode(): void {
                // 占位符不支持节点操作
            }

            protected performAddNode(): void {
                // 占位符不支持节点操作
            }

            protected performSetSelection(): void {
                // 占位符不支持选择
            }

            protected performGetSelection() {
                return { nodeIds: [], type: 'node' as const }
            }

            protected performFocus(): void {
                // 占位符不支持焦点
            }

            protected performBlur(): void {
                // 占位符不支持焦点
            }

            protected performGetViewport() {
                return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
            }

            protected performSetViewport(): void {
                // 占位符不支持视口操作
            }
        }
    }

    /**
     * 注册适配器
     */
    private registerAdapter(registration: OptimizedAdapterRegistration): void {
        this.adapters.set(registration.type, registration)
        console.debug(`[OptimizedFactory] Registered ${registration.name}`)
    }

    /**
     * 创建增强的适配器实例
     */
    async createAdapter(
        type: EditorType,
        options: OptimizedAdapterOptions
    ): Promise<any> {
        if (!this.isInitialized) {
            this.init()
        }

        const registration = this.adapters.get(type)
        if (!registration) {
            throw new Error(`Unsupported editor type: ${type}`)
        }

        // 检查场景支持
        if (!registration.supportedScenes.includes(options.sceneTemplate)) {
            console.warn(
                `[OptimizedFactory] ${type} doesn't officially support ${options.sceneTemplate}, but proceeding...`
            )
        }

        // 进度报告
        options.onProgress?.({ message: `创建 ${registration.name}...`, percentage: 20 })

        try {
            // 懒加载检查
            if (registration.lazy && !this.loadedAdapters.has(type)) {
                options.onProgress?.({ message: `加载 ${registration.name} 模块...`, percentage: 40 })
                await this.loadAdapter(type)
            }

            options.onProgress?.({ message: `初始化适配器...`, percentage: 60 })

            // 使用增强的适配器构建器
            const EnhancedAdapterClass = createAdapter(registration.adapterClass)
                .withErrorHandling(options.enableErrorHandling ? {} : undefined)
                .withPerformanceMonitoring(options.enablePerformanceMonitoring ? {} : undefined)
                .withAI(options.enableAI ? {} : undefined)
                .build()

            const adapter = new EnhancedAdapterClass(options.sceneTemplate)

            options.onProgress?.({ message: `配置适配器...`, percentage: 80 })

            // 设置错误处理
            if (options.onError && (adapter as any).on) {
                (adapter as any).on('error', options.onError)
            }

            options.onProgress?.({ message: `适配器就绪`, percentage: 100 })

            console.log(`[OptimizedFactory] Created ${registration.name} successfully`)
            return adapter

        } catch (error) {
            const errorMessage = `Failed to create ${registration.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            console.error(`[OptimizedFactory] ${errorMessage}`)
            options.onError?.(new Error(errorMessage))
            throw error
        }
    }

    /**
     * 懒加载适配器
     */
    private async loadAdapter(type: EditorType): Promise<void> {
        // 目前大部分适配器都是占位符，实际加载逻辑在这里实现
        // 例如动态导入具体的适配器模块
        try {
            switch (type) {
                case EditorType.RICH_TEXT:
                    // RichTextViewAdapter 已经直接导入
                    break
                case EditorType.GRAPH:
                    // 将来这里可以动态导入图谱适配器
                    break
                case EditorType.CANVAS:
                    // 将来这里可以动态导入画布适配器
                    break
                default:
                    // 其他适配器的懒加载逻辑
                    break
            }

            this.loadedAdapters.add(type)
            console.log(`[OptimizedFactory] Loaded adapter: ${type}`)

        } catch (error) {
            console.error(`[OptimizedFactory] Failed to load adapter ${type}:`, error)
            throw error
        }
    }

    /**
     * 获取推荐的编辑器类型
     */
    getRecommendedTypes(sceneTemplate: SceneTemplate): AdapterRecommendation[] {
        if (!this.isInitialized) {
            this.init()
        }

        const recommendations: AdapterRecommendation[] = []

        for (const [type, registration] of this.adapters.entries()) {
            if (registration.supportedScenes.includes(sceneTemplate)) {
                const confidence = registration.matchScore(sceneTemplate)
                recommendations.push({
                    type,
                    confidence,
                    reason: this.generateRecommendationReason(type, sceneTemplate, confidence),
                    features: registration.features
                })
            }
        }

        // 按置信度排序
        recommendations.sort((a, b) => b.confidence - a.confidence)

        return recommendations
    }

    /**
     * 生成推荐理由
     */
    private generateRecommendationReason(
        type: EditorType,
        scene: SceneTemplate,
        confidence: number
    ): string {
        const baseReasons = {
            [EditorType.RICH_TEXT]: '完善的文本编辑功能，适合内容创作',
            [EditorType.GRAPH]: '可视化知识关系，便于理解和分析',
            [EditorType.CANVAS]: '自由度高的视觉设计工具',
            [EditorType.TABLE]: '结构化数据处理和分析',
            [EditorType.TIMELINE]: '时间维度的信息组织'
        }

        const sceneReasons: Record<SceneTemplate, string> = {
            [SceneTemplate.WRITING]: '适合长文写作和内容创作',
            [SceneTemplate.RESEARCH]: '支持复杂的研究和分析工作',
            [SceneTemplate.LEARNING]: '便于知识整理和学习记录',
            [SceneTemplate.PLANNING]: '适合项目规划和任务管理',
            [SceneTemplate.CREATIVE]: '支持创意表达和视觉设计',
            [SceneTemplate.WHITEBOARD]: '适合自由创作和协作',
            [SceneTemplate.WIREFRAME]: '适合界面设计和原型制作',
            [SceneTemplate.DIAGRAM]: '适合流程图和图表制作'
        }

        let reason = baseReasons[type] || '通用编辑功能'

        if (confidence > 0.8) {
            reason += `，${sceneReasons[scene] || '适合当前场景'}`
        } else if (confidence > 0.6) {
            reason += '，在当前场景下可以使用'
        } else {
            reason += '，作为备选方案'
        }

        return reason
    }

    /**
     * 检查适配器是否支持场景
     */
    isSceneSupported(type: EditorType, scene: SceneTemplate): boolean {
        if (!this.isInitialized) {
            this.init()
        }

        const registration = this.adapters.get(type)
        return registration ? registration.supportedScenes.includes(scene) : false
    }

    /**
     * 获取适配器信息
     */
    getAdapterInfo(type: EditorType): OptimizedAdapterRegistration | null {
        if (!this.isInitialized) {
            this.init()
        }

        return this.adapters.get(type) || null
    }

    /**
     * 获取所有适配器信息
     */
    getAllAdapterInfo(): OptimizedAdapterRegistration[] {
        if (!this.isInitialized) {
            this.init()
        }

        return Array.from(this.adapters.values())
    }

    /**
     * 健康检查
     */
    async performHealthCheck(type: EditorType): Promise<boolean> {
        const healthCheck = this.healthChecks.get(type)
        if (healthCheck) {
            try {
                return await healthCheck()
            } catch (error) {
                console.error(`[OptimizedFactory] Health check failed for ${type}:`, error)
                return false
            }
        }
        return true
    }

    /**
     * 获取工厂统计信息
     */
    getFactoryStats() {
        return {
            totalAdapters: this.adapters.size,
            loadedAdapters: this.loadedAdapters.size,
            supportedScenes: Object.values(SceneTemplate).length,
            isInitialized: this.isInitialized
        }
    }

    /**
     * 清理资源
     */
    destroy(): void {
        this.adapters.clear()
        this.loadedAdapters.clear()
        this.healthChecks.clear()
        this.isInitialized = false
        console.log('[OptimizedFactory] Destroyed')
    }
}

// 导出单例实例
export const optimizedAdapterFactory = new OptimizedViewAdapterFactory()

export default OptimizedViewAdapterFactory