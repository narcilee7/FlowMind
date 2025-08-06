/**
 * 编辑器插件管理器
 */

import { IEditorCore } from '../types/EditorCore'
import { EditorPlugin } from '../types/EditorPlugin'

/**
 * 插件管理器
 */
export default class EditorPluginManager {
    private core: IEditorCore
    private plugins: Map<string, EditorPlugin> = new Map()
    private isInitialized = false

    constructor(core: IEditorCore) {
        this.core = core
    }

    /**
     * 初始化插件管理器
     */
    async init(): Promise<void> {
        if (this.isInitialized) return

        // 注册默认插件
        await this.registerDefaultPlugins()

        // 初始化所有插件
        for (const plugin of this.plugins.values()) {
            try {
                await plugin.init(this.core)
            } catch (error) {
                console.error(`Failed to initialize plugin ${plugin.name}:`, error)
            }
        }

        this.isInitialized = true
    }

    /**
     * 销毁插件管理器
     */
    destroy(): void {
        // 销毁所有插件
        for (const plugin of this.plugins.values()) {
            try {
                plugin.destroy()
            } catch (error) {
                console.error(`Failed to destroy plugin ${plugin.name}:`, error)
            }
        }

        this.plugins.clear()
        this.isInitialized = false
    }

    /**
     * 注册插件
     */
    register(plugin: EditorPlugin): void {
        if (this.plugins.has(plugin.name)) {
            console.warn(`Plugin ${plugin.name} already registered`)
            return
        }

        this.plugins.set(plugin.name, plugin)

        // 如果已经初始化，立即初始化新插件
        if (this.isInitialized) {
            plugin.init(this.core).catch(error => {
                console.error(`Failed to initialize plugin ${plugin.name}:`, error)
            })
        }
    }

    /**
     * 注销插件
     */
    unregister(pluginName: string): void {
        const plugin = this.plugins.get(pluginName)
        if (plugin) {
            try {
                plugin.destroy()
            } catch (error) {
                console.error(`Failed to destroy plugin ${pluginName}:`, error)
            }
            this.plugins.delete(pluginName)
        }
    }

    /**
     * 获取插件
     */
    getPlugin(pluginName: string): EditorPlugin | undefined {
        return this.plugins.get(pluginName)
    }

    /**
     * 获取所有插件
     */
    getAllPlugins(): EditorPlugin[] {
        return Array.from(this.plugins.values())
    }

    /**
     * 检查插件是否已注册
     */
    hasPlugin(pluginName: string): boolean {
        return this.plugins.has(pluginName)
    }

    /**
     * 注册默认插件
     */
    private async registerDefaultPlugins(): Promise<void> {
        // 注册AI助手插件
        const { AIAssistantPlugin } = await import('../plugins/AIAssistantPlugin')
        this.register(new AIAssistantPlugin())

        // 注册Markdown插件
        const { MarkdownPlugin } = await import('../plugins/MarkdownPlugin')
        this.register(new MarkdownPlugin())

        // 注册快捷键插件
        const { ShortcutPlugin } = await import('../plugins/ShortcutPlugin')
        this.register(new ShortcutPlugin())

        // 注册自动保存插件
        const { AutoSavePlugin } = await import('../plugins/AutoSavePlugin')
        this.register(new AutoSavePlugin())

        // 注册目录生成插件
        const { TOCPlugin } = await import('../plugins/TOCPlugin')
        this.register(new TOCPlugin())
    }
} 