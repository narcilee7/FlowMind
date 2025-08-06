/**
 * 编辑器插件接口定义
 */

import { IEditorCore } from './EditorCore'

/**
 * 插件接口
 */
export interface EditorPlugin {
    // 插件基本信息
    name: string
    version: string
    description?: string
    
    // 生命周期方法
    init(core: IEditorCore): Promise<void>
    destroy(): void
    
    // 插件状态
    isEnabled(): boolean
    enable(): void
    disable(): void
}

/**
 * 插件配置
 */
export interface PluginConfig {
    name: string
    version: string
    description?: string
    enabled?: boolean
    options?: Record<string, any>
}

/**
 * 插件基类
 */
export abstract class BasePlugin implements EditorPlugin {
    public name: string
    public version: string
    public description?: string
    
    protected core: IEditorCore | null = null
    protected enabled: boolean = true
    protected eventListeners: Map<string, Function> = new Map()

    constructor(config: PluginConfig) {
        this.name = config.name
        this.version = config.version
        this.description = config.description
        this.enabled = config.enabled ?? true
    }

    /**
     * 初始化插件
     */
    async init(core: IEditorCore): Promise<void> {
        this.core = core
        await this.onInit()
        this.setupEventListeners()
    }

    /**
     * 销毁插件
     */
    destroy(): void {
        this.removeEventListeners()
        this.onDestroy()
        this.core = null
    }

    /**
     * 检查插件是否启用
     */
    isEnabled(): boolean {
        return this.enabled
    }

    /**
     * 启用插件
     */
    enable(): void {
        this.enabled = true
        this.onEnable()
    }

    /**
     * 禁用插件
     */
    disable(): void {
        this.enabled = false
        this.onDisable()
    }

    /**
     * 添加事件监听器
     */
    protected addEventListener(event: string, callback: Function): void {
        if (!this.core) return
        
        this.core.on(event, callback)
        this.eventListeners.set(event, callback)
    }

    /**
     * 移除事件监听器
     */
    protected removeEventListener(event: string): void {
        if (!this.core) return
        
        const callback = this.eventListeners.get(event)
        if (callback) {
            this.core.off(event, callback)
            this.eventListeners.delete(event)
        }
    }

    /**
     * 移除所有事件监听器
     */
    protected removeEventListeners(): void {
        for (const [event, callback] of this.eventListeners) {
            if (this.core) {
                this.core.off(event, callback)
            }
        }
        this.eventListeners.clear()
    }

    /**
     * 触发事件
     */
    protected emit(event: string, data?: any): void {
        if (!this.core) return
        this.core.emit(event, data)
    }

    /**
     * 获取编辑器核心
     */
    protected getCore(): IEditorCore | null {
        return this.core
    }

    /**
     * 获取当前适配器
     */
    protected getAdapter() {
        return this.core?.getCurrentAdapter()
    }

    /**
     * 获取内容
     */
    protected getContent(): string {
        return this.core?.getContent() || ''
    }

    /**
     * 设置内容
     */
    protected setContent(content: string): void {
        this.core?.setContent(content)
    }

    /**
     * 获取AST
     */
    protected getAST() {
        return this.core?.getAST()
    }

    /**
     * 设置AST
     */
    protected setAST(ast: any): void {
        this.core?.setAST(ast)
    }

    // 抽象方法，子类需要实现
    protected abstract onInit(): Promise<void>
    protected abstract onDestroy(): void
    protected abstract setupEventListeners(): void
    protected abstract onEnable(): void
    protected abstract onDisable(): void
}

/**
 * 插件管理器接口
 */
export interface PluginManager {
    register(plugin: EditorPlugin): void
    unregister(pluginName: string): void
    getPlugin(pluginName: string): EditorPlugin | undefined
    getAllPlugins(): EditorPlugin[]
    hasPlugin(pluginName: string): boolean
    init(): Promise<void>
    destroy(): void
}
