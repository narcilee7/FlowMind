/**
 * 视图适配器工厂 - 基于ViewAdapter架构
 * 负责创建和管理不同类型的视图适配器
 */

import { ViewAdapter } from '../types/ViewAdapter'
import { EditorType, SceneTemplate } from '../types/EditorType'

/**
 * 视图适配器工厂
 */
export default class ViewAdapterFactory {
    private static adapters = new Map<EditorType, new (sceneTemplate: SceneTemplate) => ViewAdapter>()

    /**
     * 初始化适配器注册
     */
    static init(): void {
        // 注册各种适配器
        // this.registerAdapter(EditorType.RICH_TEXT, RichTextViewAdapter)
        // this.registerAdapter(EditorType.GRAPH, GraphViewAdapter)
        // this.registerAdapter(EditorType.CANVAS, CanvasViewAdapter)
        // this.registerAdapter(EditorType.TABLE, TableViewAdapter)
        // this.registerAdapter(EditorType.TIMELINE, TimelineViewAdapter)
    }

    /**
     * 创建适配器
     */
    static createAdapter(type: EditorType, sceneTemplate: SceneTemplate): ViewAdapter {
        const AdapterClass = this.adapters.get(type)
        if (!AdapterClass) {
            throw new Error(`Unsupported editor type: ${type}`)
        }
        return new AdapterClass(sceneTemplate)
    }

    /**
     * 注册适配器
     */
    static registerAdapter(
        type: EditorType, 
        adapterClass: new (sceneTemplate: SceneTemplate) => ViewAdapter
    ): void {
        this.adapters.set(type, adapterClass)
    }

    /**
     * 获取支持的编辑器类型
     */
    static getSupportedTypes(): EditorType[] {
        return Array.from(this.adapters.keys())
    }

    /**
     * 检查是否支持编辑器类型
     */
    static isSupported(type: EditorType): boolean {
        return this.adapters.has(type)
    }
    
}

// 初始化适配器注册
ViewAdapterFactory.init() 