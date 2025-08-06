/**
 * 视图适配器工厂 - 基于ViewAdapter架构
 * 负责创建和管理不同类型的视图适配器
 */

import { ViewAdapter, ViewAdapterOptions } from '../types/ViewAdapter'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { RichTextViewAdapter } from '../adapters/RichTextViewAdapter'
import { GraphViewAdapter } from '../adapters/GraphViewAdapter'
import { CanvasViewAdapter } from '../adapters/CanvasViewAdapter'
import { TableViewAdapter } from '../adapters/TableViewAdapter'
import { TimelineViewAdapter } from '../adapters/TimelineViewAdapter'

/**
 * 适配器注册信息
 */
interface AdapterRegistration {
    type: EditorType
    adapterClass: new (sceneTemplate: SceneTemplate) => ViewAdapter
    name: string
    description: string
    supportedScenes: SceneTemplate[]
    dependencies?: string[]
}

/**
 * 适配器创建选项
 */
interface CreateAdapterOptions {
    sceneTemplate: SceneTemplate
    options?: Partial<ViewAdapterOptions>
    onError?: (error: Error) => void
}

/**
 * 视图适配器工厂
 */
export default class ViewAdapterFactory {
    private static adapters = new Map<EditorType, AdapterRegistration>()
    private static isInitialized = false

    /**
     * 初始化适配器注册
     */
    static init(): void {
        if (this.isInitialized) return

        try {
            // 注册各种适配器
            this.registerAdapter({
                type: EditorType.RICH_TEXT,
                adapterClass: RichTextViewAdapter,
                name: '富文本编辑器',
                description: '基于TipTap的富文本编辑器，支持格式化、表格、图片等功能',
                supportedScenes: [
                    SceneTemplate.WRITING,
                    SceneTemplate.RESEARCH,
                    SceneTemplate.LEARNING
                ]
            })

            this.registerAdapter({
                type: EditorType.GRAPH,
                adapterClass: GraphViewAdapter,
                name: '知识图谱',
                description: '基于vis-network的知识图谱可视化编辑器',
                supportedScenes: [
                    SceneTemplate.RESEARCH,
                    SceneTemplate.LEARNING,
                    SceneTemplate.PLANNING
                ]
            })

            this.registerAdapter({
                type: EditorType.CANVAS,
                adapterClass: CanvasViewAdapter,
                name: '画布编辑器',
                description: '基于Fabric.js的画布编辑器，支持绘图、设计等功能',
                supportedScenes: [
                    SceneTemplate.CREATIVE,
                    SceneTemplate.PLANNING,
                    SceneTemplate.LEARNING
                ]
            })

            this.registerAdapter({
                type: EditorType.TABLE,
                adapterClass: TableViewAdapter,
                name: '表格编辑器',
                description: '功能强大的表格编辑器，支持数据分析和可视化',
                supportedScenes: [
                    SceneTemplate.RESEARCH,
                    SceneTemplate.PLANNING,
                    SceneTemplate.LEARNING
                ]
            })

            this.registerAdapter({
                type: EditorType.TIMELINE,
                adapterClass: TimelineViewAdapter,
                name: '时间线编辑器',
                description: '时间线编辑器，支持项目管理、历史记录等功能',
                supportedScenes: [
                    SceneTemplate.PLANNING,
                    SceneTemplate.RESEARCH,
                    SceneTemplate.LEARNING
                ]
            })

            this.isInitialized = true
            console.log('[ViewAdapterFactory] Initialized successfully')
        } catch (error) {
            console.error('[ViewAdapterFactory] Initialization failed:', error)
            throw error
        }
    }

    /**
     * 创建适配器
     */
    static createAdapter(type: EditorType, options: CreateAdapterOptions): ViewAdapter {
        if (!this.isInitialized) {
            this.init()
        }

        const registration = this.adapters.get(type)
        if (!registration) {
            const error = new Error(`Unsupported editor type: ${type}`)
            options.onError?.(error)
            throw error
        }

        // 检查场景模板支持
        if (!registration.supportedScenes.includes(options.sceneTemplate)) {
            const error = new Error(
                `Editor type ${type} does not support scene template: ${options.sceneTemplate}`
            )
            options.onError?.(error)
            throw error
        }

        try {
            const adapter = new registration.adapterClass(options.sceneTemplate)
            
            // 设置错误处理器
            if (options.onError) {
                adapter.onError(options.onError)
            }

            return adapter
        } catch (error) {
            const adapterError = error instanceof Error ? error : new Error('Failed to create adapter')
            options.onError?.(adapterError)
            throw adapterError
        }
    }

    /**
     * 注册适配器
     */
    static registerAdapter(registration: AdapterRegistration): void {
        if (this.adapters.has(registration.type)) {
            console.warn(`[ViewAdapterFactory] Overwriting existing adapter for type: ${registration.type}`)
        }

        this.adapters.set(registration.type, registration)
        console.log(`[ViewAdapterFactory] Registered adapter: ${registration.name} (${registration.type})`)
    }

    /**
     * 获取支持的编辑器类型
     */
    static getSupportedTypes(): EditorType[] {
        if (!this.isInitialized) {
            this.init()
        }
        return Array.from(this.adapters.keys())
    }

    /**
     * 检查是否支持编辑器类型
     */
    static isSupported(type: EditorType): boolean {
        if (!this.isInitialized) {
            this.init()
        }
        return this.adapters.has(type)
    }

    /**
     * 获取适配器信息
     */
    static getAdapterInfo(type: EditorType): AdapterRegistration | null {
        if (!this.isInitialized) {
            this.init()
        }
        return this.adapters.get(type) || null
    }

    /**
     * 获取所有适配器信息
     */
    static getAllAdapterInfo(): AdapterRegistration[] {
        if (!this.isInitialized) {
            this.init()
        }
        return Array.from(this.adapters.values())
    }

    /**
     * 根据场景模板获取推荐的编辑器类型
     */
    static getRecommendedTypes(sceneTemplate: SceneTemplate): EditorType[] {
        if (!this.isInitialized) {
            this.init()
        }

        return Array.from(this.adapters.values())
            .filter(registration => registration.supportedScenes.includes(sceneTemplate))
            .map(registration => registration.type)
    }

    /**
     * 获取适配器统计信息
     */
    static getStats(): {
        total: number
        byScene: Record<SceneTemplate, number>
        byType: Record<EditorType, string>
    } {
        if (!this.isInitialized) {
            this.init()
        }

        const stats = {
            total: this.adapters.size,
            byScene: {} as Record<SceneTemplate, number>,
            byType: {} as Record<EditorType, string>
        }

        // 统计场景支持
        Object.values(SceneTemplate).forEach(scene => {
            stats.byScene[scene] = this.getRecommendedTypes(scene).length
        })

        // 统计类型信息
        this.adapters.forEach((registration, type) => {
            stats.byType[type] = registration.name
        })

        return stats
    }

    /**
     * 验证适配器依赖
     */
    static validateDependencies(type: EditorType): Promise<boolean> {
        const registration = this.adapters.get(type)
        if (!registration) {
            return Promise.resolve(false)
        }

        // 这里可以添加依赖检查逻辑
        // 例如检查第三方库是否可用
        return Promise.resolve(true)
    }

    /**
     * 清理资源
     */
    static cleanup(): void {
        this.adapters.clear()
        this.isInitialized = false
        console.log('[ViewAdapterFactory] Cleaned up')
    }
}

// 自动初始化
ViewAdapterFactory.init()
