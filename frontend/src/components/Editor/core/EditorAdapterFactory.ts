/**
 * 编辑器适配器工厂 - 重构版
 * 基于清爽架构的适配器创建和管理
 */

import { EditorAdapter } from '../types/EditorAdapter'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { TipTapAdapter } from '../adapters/TipTapAdapter'

/**
 * 适配器工厂
 */
export default class EditorAdapterFactory {
    private static adapters = new Map<EditorType, new (sceneTemplate: SceneTemplate) => EditorAdapter>()

    /**
     * 初始化适配器注册
     */
    static init(): void {
        // 注册TipTap适配器作为富文本编辑器
        this.registerAdapter(EditorType.RICH_TEXT, TipTapAdapter)
        
        // 其他适配器可以在这里注册
        // this.registerAdapter(EditorType.GRAPH, GraphAdapter)
        // this.registerAdapter(EditorType.CANVAS, CanvasAdapter)
        // this.registerAdapter(EditorType.TABLE, TableAdapter)
        // this.registerAdapter(EditorType.TIMELINE, TimelineAdapter)
    }

    /**
     * 创建适配器
     */
    static createAdapter(type: EditorType, sceneTemplate: SceneTemplate): EditorAdapter {
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
        adapterClass: new (sceneTemplate: SceneTemplate) => EditorAdapter
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
EditorAdapterFactory.init()