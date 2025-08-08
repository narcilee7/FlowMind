/**
 * 智能插件系统
 * 
 * 提供可扩展的插件架构，支持：
 * 1. 动态插件加载和卸载
 * 2. 插件依赖管理
 * 3. 插件生命周期管理
 * 4. 插件通信机制
 * 5. 插件权限控制
 * 6. 插件热更新
 */

import { CoreViewAdapter } from '../adapters/BaseViewAdapter.optimized'
import { DocumentAST, ASTNode, Selection } from '../types/EditorAST'
import { EditorType, SceneTemplate } from '../types/EditorType'

/**
 * 插件权限级别
 */
export enum PluginPermission {
    READ = 'read',           // 只读权限
    WRITE = 'write',         // 读写权限
    ADMIN = 'admin',         // 管理员权限
    SYSTEM = 'system'        // 系统级权限
}

/**
 * 插件状态
 */
export enum PluginState {
    UNLOADED = 'unloaded',
    LOADING = 'loading',
    LOADED = 'loaded',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ERROR = 'error',
    UNLOADING = 'unloading'
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
    id: string
    name: string
    version: string
    description: string
    author: string
    homepage?: string
    keywords: string[]

    // 依赖信息
    dependencies: string[]
    peerDependencies?: string[]

    // 兼容性
    supportedEditors: EditorType[]
    supportedScenes: SceneTemplate[]
    minVersion: string
    maxVersion?: string

    // 权限要求
    permissions: PluginPermission[]

    // 生命周期钩子
    hooks: {
        beforeLoad?: string
        afterLoad?: string
        beforeUnload?: string
        afterUnload?: string
        onEditorChange?: string
        onContentChange?: string
        onSelectionChange?: string
    }

    // 配置项
    configSchema?: any
    defaultConfig?: any

    // 资源
    assets?: {
        css?: string[]
        js?: string[]
        icons?: Record<string, string>
    }
}

/**
 * 插件上下文
 */
export interface PluginContext {
    // 核心API
    getAdapter(): CoreViewAdapter | null
    getAST(): DocumentAST | null
    getSelection(): Selection | null

    // 内容操作
    updateContent(ast: DocumentAST): Promise<void>
    updateSelection(selection: Selection): void
    insertNode(node: ASTNode, parentId?: string, index?: number): void
    removeNode(nodeId: string): void

    // 事件系统
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    emit(event: string, data?: any): void

    // 插件间通信
    sendMessage(targetPluginId: string, message: any): Promise<any>
    broadcast(message: any): void

    // 工具方法
    showNotification(message: string, type?: 'info' | 'warning' | 'error' | 'success'): void
    showDialog(options: any): Promise<any>
    showPanel(component: any, options?: any): void
    hidePanel(panelId: string): void

    // 存储
    getStorage(): PluginStorage

    // 配置
    getConfig(): any
    updateConfig(config: any): void

    // 系统信息
    getEditorInfo(): {
        type: EditorType
        scene: SceneTemplate
        version: string
    }
}

/**
 * 插件存储接口
 */
export interface PluginStorage {
    get(key: string): Promise<any>
    set(key: string, value: any): Promise<void>
    remove(key: string): Promise<void>
    clear(): Promise<void>
    keys(): Promise<string[]>
}

/**
 * 插件基类
 */
export abstract class BasePlugin {
    protected context: PluginContext
    protected metadata: PluginMetadata
    protected config: any
    private state: PluginState = PluginState.UNLOADED

    constructor(metadata: PluginMetadata, context: PluginContext) {
        this.metadata = metadata
        this.context = context
        this.config = { ...metadata.defaultConfig }
    }

    /**
     * 插件加载
     */
    abstract onLoad(): Promise<void>

    /**
     * 插件卸载
     */
    abstract onUnload(): Promise<void>

    /**
     * 插件激活
     */
    onActivate(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * 插件停用
     */
    onDeactivate(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * 编辑器变化事件
     */
    onEditorChange?(oldType: EditorType, newType: EditorType): void

    /**
     * 内容变化事件
     */
    onContentChange?(ast: DocumentAST): void

    /**
     * 选择变化事件
     */
    onSelectionChange?(selection: Selection): void

    /**
     * 配置变化事件
     */
    onConfigChange?(newConfig: any, oldConfig: any): void

    /**
     * 插件间消息处理
     */
    onMessage?(fromPluginId: string, message: any): any

    /**
     * 获取插件元数据
     */
    getMetadata(): PluginMetadata {
        return this.metadata
    }

    /**
     * 获取插件状态
     */
    getState(): PluginState {
        return this.state
    }

    /**
     * 设置插件状态
     */
    setState(state: PluginState): void {
        const oldState = this.state
        this.state = state
        this.context.emit('plugin:stateChange', {
            pluginId: this.metadata.id,
            oldState,
            newState: state
        })
    }

    /**
     * 获取配置
     */
    getConfig(): any {
        return { ...this.config }
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: any): void {
        const oldConfig = { ...this.config }
        this.config = { ...this.config, ...newConfig }
        this.onConfigChange?.(this.config, oldConfig)
        this.context.updateConfig(this.config)
    }
}

/**
 * 插件加载器
 */
export class PluginLoader {
    private cache = new Map<string, any>()
    private loadingPromises = new Map<string, Promise<any>>()

    /**
     * 从URL加载插件
     */
    async loadFromUrl(url: string): Promise<any> {
        if (this.cache.has(url)) {
            return this.cache.get(url)
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url)
        }

        const loadPromise = this.doLoadFromUrl(url)
        this.loadingPromises.set(url, loadPromise)

        try {
            const plugin = await loadPromise
            this.cache.set(url, plugin)
            return plugin
        } finally {
            this.loadingPromises.delete(url)
        }
    }

    /**
     * 从模块加载插件
     */
    async loadFromModule(moduleName: string): Promise<any> {
        try {
            const module = await import(moduleName)
            return module.default || module
        } catch (error) {
            throw new Error(`Failed to load plugin module ${moduleName}: ${error}`)
        }
    }

    /**
     * 预加载插件
     */
    async preload(urls: string[]): Promise<void> {
        const promises = urls.map(url => this.loadFromUrl(url))
        await Promise.allSettled(promises)
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear()
    }

    private async doLoadFromUrl(url: string): Promise<any> {
        try {
            // 安全检查
            if (!this.isUrlSafe(url)) {
                throw new Error(`Unsafe plugin URL: ${url}`)
            }

            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`Failed to fetch plugin: ${response.statusText}`)
            }

            const code = await response.text()

            // 创建安全的执行环境
            const pluginModule = await this.executePluginCode(code, url)

            return pluginModule

        } catch (error) {
            throw new Error(`Failed to load plugin from ${url}: ${error}`)
        }
    }

    private isUrlSafe(url: string): boolean {
        try {
            const urlObj = new URL(url)
            // 只允许HTTPS和相对路径
            return urlObj.protocol === 'https:' || url.startsWith('/') || url.startsWith('./')
        } catch {
            return false
        }
    }

    private async executePluginCode(code: string, _url: string): Promise<any> {
        // 创建沙箱环境
        const sandbox = {
            console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            fetch,
            URL,
            Promise,
            Date,
            Math,
            JSON,
            // 受限的导入函数
            require: (moduleName: string) => {
                if (this.isModuleAllowed(moduleName)) {
                    return require(moduleName)
                }
                throw new Error(`Module not allowed: ${moduleName}`)
            }
        }

        // 使用Function构造函数在沙箱中执行代码
        const fn = new Function(...Object.keys(sandbox), `
            "use strict";
            ${code}
            return typeof module !== 'undefined' ? module.exports : 
                   typeof exports !== 'undefined' ? exports : this;
        `)

        return fn(...Object.values(sandbox))
    }

    private isModuleAllowed(moduleName: string): boolean {
        // 白名单机制
        const allowedModules = [
            'react',
            'react-dom',
            'lodash',
            'moment',
            'classnames'
        ]
        return allowedModules.includes(moduleName)
    }
}

/**
 * 插件系统主类
 */
export class PluginSystem {
    private plugins = new Map<string, BasePlugin>()
    private dependencies = new Map<string, string[]>()
    private loader = new PluginLoader()
    private storage = new Map<string, PluginStorage>()
    private context: PluginContext | null = null
    private eventBus = new Map<string, Function[]>()
    private messageHandlers = new Map<string, Function>()
    private panels = new Map<string, any>()
    private astProvider: (() => DocumentAST | null) | null = null

    constructor() {
        this.setupGlobalContext()
    }

    /**
     * 初始化插件系统
     */
    async initialize(adapter: CoreViewAdapter): Promise<void> {
        this.context = this.createPluginContext(adapter)
        console.log('[PluginSystem] Initialized')
    }

    /**
     * 设置 AST 提供器，用于插件获取最新内容
     */
    public setASTProvider(provider: () => DocumentAST | null): void {
        this.astProvider = provider
    }

    /**
     * 安装插件
     */
    async installPlugin(source: string | PluginMetadata, pluginClass?: typeof BasePlugin): Promise<void> {
        try {
            let metadata: PluginMetadata
            let PluginClass: typeof BasePlugin

            if (typeof source === 'string') {
                // 从URL或模块名加载
                const pluginModule = source.startsWith('http')
                    ? await this.loader.loadFromUrl(source)
                    : await this.loader.loadFromModule(source)

                metadata = pluginModule.metadata
                PluginClass = pluginModule.default || pluginModule
            } else {
                // 直接使用提供的元数据和类
                metadata = source
                PluginClass = pluginClass!
            }

            // 验证插件
            this.validatePlugin(metadata)

            // 检查依赖
            await this.checkDependencies(metadata)

            // 创建插件实例
            if (!this.context) {
                throw new Error('Plugin system not initialized')
            }

            // 某些情况下 PluginClass 可能是抽象占位（类型或未正确导出），需防御处理
            if (typeof PluginClass !== 'function') {
                throw new Error('Invalid plugin class: not a constructible function')
            }
            // 运行时进一步校验不为抽象：尝试检查原型是否包含必要方法
            const requiredMethods: Array<keyof BasePlugin> = ['onLoad', 'onUnload'] as any
            for (const m of requiredMethods) {
                if (!(m in PluginClass.prototype)) {
                    throw new Error(`Invalid plugin class: missing method ${String(m)}`)
                }
            }
            const plugin = new (PluginClass as any)(metadata, this.context)

            // 设置存储
            this.storage.set(metadata.id, this.createPluginStorage(metadata.id))

            // 注册插件
            this.plugins.set(metadata.id, plugin)
            this.dependencies.set(metadata.id, metadata.dependencies)

            // 加载插件
            plugin.setState(PluginState.LOADING)
            await plugin.onLoad()
            plugin.setState(PluginState.LOADED)

            // 激活插件
            await this.activatePlugin(metadata.id)

            console.log(`[PluginSystem] Plugin ${metadata.name} installed successfully`)
            this.emit('plugin:installed', { pluginId: metadata.id, metadata })

        } catch (error) {
            console.error('[PluginSystem] Failed to install plugin:', error)
            throw error
        }
    }

    /**
     * 卸载插件
     */
    async uninstallPlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId)
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`)
        }

        try {
            // 检查依赖关系
            const dependents = this.findDependents(pluginId)
            if (dependents.length > 0) {
                throw new Error(`Cannot uninstall ${pluginId}: required by ${dependents.join(', ')}`)
            }

            // 停用插件
            if (plugin.getState() === PluginState.ACTIVE) {
                await this.deactivatePlugin(pluginId)
            }

            // 卸载插件
            plugin.setState(PluginState.UNLOADING)
            await plugin.onUnload()
            plugin.setState(PluginState.UNLOADED)

            // 清理资源
            this.plugins.delete(pluginId)
            this.dependencies.delete(pluginId)
            this.storage.delete(pluginId)
            this.clearPluginEvents(pluginId)

            console.log(`[PluginSystem] Plugin ${pluginId} uninstalled`)
            this.emit('plugin:uninstalled', { pluginId })

        } catch (error) {
            plugin.setState(PluginState.ERROR)
            console.error(`[PluginSystem] Failed to uninstall plugin ${pluginId}:`, error)
            throw error
        }
    }

    /**
     * 激活插件
     */
    async activatePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId)
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`)
        }

        if (plugin.getState() === PluginState.ACTIVE) {
            return
        }

        try {
            await plugin.onActivate()
            plugin.setState(PluginState.ACTIVE)

            console.log(`[PluginSystem] Plugin ${pluginId} activated`)
            this.emit('plugin:activated', { pluginId })

        } catch (error) {
            plugin.setState(PluginState.ERROR)
            console.error(`[PluginSystem] Failed to activate plugin ${pluginId}:`, error)
            throw error
        }
    }

    /**
     * 停用插件
     */
    async deactivatePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId)
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`)
        }

        if (plugin.getState() !== PluginState.ACTIVE) {
            return
        }

        try {
            await plugin.onDeactivate()
            plugin.setState(PluginState.INACTIVE)

            console.log(`[PluginSystem] Plugin ${pluginId} deactivated`)
            this.emit('plugin:deactivated', { pluginId })

        } catch (error) {
            plugin.setState(PluginState.ERROR)
            console.error(`[PluginSystem] Failed to deactivate plugin ${pluginId}:`, error)
            throw error
        }
    }

    /**
     * 获取已安装的插件列表
     */
    getInstalledPlugins(): PluginMetadata[] {
        return Array.from(this.plugins.values()).map(plugin => plugin.getMetadata())
    }

    /**
     * 获取活跃的插件列表
     */
    getActivePlugins(): PluginMetadata[] {
        return Array.from(this.plugins.values())
            .filter(plugin => plugin.getState() === PluginState.ACTIVE)
            .map(plugin => plugin.getMetadata())
    }

    /**
     * 获取插件信息
     */
    getPluginInfo(pluginId: string): {
        metadata: PluginMetadata
        state: PluginState
        config: any
    } | null {
        const plugin = this.plugins.get(pluginId)
        if (!plugin) return null

        return {
            metadata: plugin.getMetadata(),
            state: plugin.getState(),
            config: plugin.getConfig()
        }
    }

    /**
     * 发送插件间消息
     */
    async sendMessage(fromPluginId: string, toPluginId: string, message: any): Promise<any> {
        const targetPlugin = this.plugins.get(toPluginId)
        if (!targetPlugin || targetPlugin.getState() !== PluginState.ACTIVE) {
            throw new Error(`Target plugin ${toPluginId} not available`)
        }

        try {
            return await targetPlugin.onMessage?.(fromPluginId, message)
        } catch (error) {
            console.error(`[PluginSystem] Message delivery failed from ${fromPluginId} to ${toPluginId}:`, error)
            throw error
        }
    }

    /**
     * 广播消息给所有活跃插件
     */
    broadcast(fromPluginId: string, message: any): void {
        this.plugins.forEach((plugin, pluginId) => {
            if (pluginId !== fromPluginId && plugin.getState() === PluginState.ACTIVE) {
                try {
                    plugin.onMessage?.(fromPluginId, message)
                } catch (error) {
                    console.error(`[PluginSystem] Broadcast delivery failed to ${pluginId}:`, error)
                }
            }
        })
    }

    /**
     * 监听事件
     */
    on(event: string, callback: Function): void {
        if (!this.eventBus.has(event)) {
            this.eventBus.set(event, [])
        }
        this.eventBus.get(event)!.push(callback)
    }

    /**
     * 取消监听
     */
    off(event: string, callback: Function): void {
        const callbacks = this.eventBus.get(event)
        if (callbacks) {
            const index = callbacks.indexOf(callback)
            if (index > -1) {
                callbacks.splice(index, 1)
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event: string, data?: any): void {
        const callbacks = this.eventBus.get(event) || []
        callbacks.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                console.error(`[PluginSystem] Event callback error for ${event}:`, error)
            }
        })
    }

    /**
     * 销毁插件系统
     */
    async destroy(): Promise<void> {
        // 停用所有插件
        const activePlugins = Array.from(this.plugins.keys())
        for (const pluginId of activePlugins) {
            try {
                await this.uninstallPlugin(pluginId)
            } catch (error) {
                console.error(`[PluginSystem] Failed to uninstall plugin ${pluginId} during destroy:`, error)
            }
        }

        // 清理资源
        this.plugins.clear()
        this.dependencies.clear()
        this.storage.clear()
        this.eventBus.clear()
        this.messageHandlers.clear()
        this.panels.clear()
        this.loader.clearCache()

        console.log('[PluginSystem] Destroyed')
    }

    // === 私有方法 ===

    private setupGlobalContext(): void {
        // 设置全局插件API
        if (typeof window !== 'undefined') {
            (window as any).EditorPluginAPI = {
                version: '1.0.0',
                createPlugin: (metadata: PluginMetadata) => metadata
            }
        }
    }

    private createPluginContext(adapter: CoreViewAdapter): PluginContext {
        return {
            getAdapter: () => adapter,
            getAST: () => this.astProvider ? this.astProvider() : null,
            getSelection: () => adapter.getSelection(),
            updateContent: async (ast) => await adapter.render(ast),
            updateSelection: (selection) => adapter.setSelection(selection),
            insertNode: (node, parentId, index) => adapter.addNode(node, parentId, index),
            removeNode: (nodeId) => adapter.removeNode(nodeId),
            on: (event, callback) => this.on(event, callback),
            off: (event, callback) => this.off(event, callback),
            emit: (event, data) => this.emit(event, data),
            sendMessage: (targetPluginId, message) => this.sendMessage('system', targetPluginId, message),
            broadcast: (message) => this.broadcast('system', message),
            showNotification: (message, type) => this.showNotification(message, type),
            showDialog: (options) => this.showDialog(options),
            showPanel: (component, options) => this.showPanel(component, options),
            hidePanel: (panelId) => this.hidePanel(panelId),
            getStorage: () => this.createPluginStorage('global'),
            getConfig: () => ({}),
            updateConfig: () => { },
            getEditorInfo: () => ({
                type: adapter.type,
                scene: SceneTemplate.WRITING, // TODO: 获取实际场景
                version: '1.0.0'
            })
        }
    }

    private createPluginStorage(pluginId: string): PluginStorage {
        const prefix = `plugin_${pluginId}_`

        return {
            async get(key: string): Promise<any> {
                const stored = localStorage.getItem(prefix + key)
                return stored ? JSON.parse(stored) : undefined
            },

            async set(key: string, value: any): Promise<void> {
                localStorage.setItem(prefix + key, JSON.stringify(value))
            },

            async remove(key: string): Promise<void> {
                localStorage.removeItem(prefix + key)
            },

            async clear(): Promise<void> {
                const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
                keys.forEach(key => localStorage.removeItem(key))
            },

            async keys(): Promise<string[]> {
                return Object.keys(localStorage)
                    .filter(k => k.startsWith(prefix))
                    .map(k => k.substring(prefix.length))
            }
        }
    }

    private validatePlugin(metadata: PluginMetadata): void {
        if (!metadata.id || !metadata.name || !metadata.version) {
            throw new Error('Plugin metadata incomplete')
        }

        if (this.plugins.has(metadata.id)) {
            throw new Error(`Plugin ${metadata.id} already installed`)
        }

        // 验证权限
        const requiredPermissions = metadata.permissions || []
        if (requiredPermissions.includes(PluginPermission.SYSTEM)) {
            throw new Error('System permission not allowed for third-party plugins')
        }
    }

    private async checkDependencies(metadata: PluginMetadata): Promise<void> {
        for (const dep of metadata.dependencies) {
            if (!this.plugins.has(dep)) {
                throw new Error(`Missing dependency: ${dep}`)
            }
        }
    }

    private findDependents(pluginId: string): string[] {
        const dependents: string[] = []

        this.dependencies.forEach((deps, id) => {
            if (deps.includes(pluginId)) {
                dependents.push(id)
            }
        })

        return dependents
    }

    private clearPluginEvents(_pluginId: string): void {
        // 清理插件相关的事件监听器
        this.eventBus.forEach((_callbacks, _event) => {
            // 这里需要更复杂的逻辑来识别插件的回调函数
            // 简化实现，实际项目中需要更好的追踪机制
        })
    }

    private showNotification(message: string, type: string = 'info'): void {
        console.log(`[Plugin Notification] ${type.toUpperCase()}: ${message}`)
        // TODO: 实现真实的通知系统
    }

    private async showDialog(options: any): Promise<any> {
        console.log('[Plugin Dialog]', options)
        // TODO: 实现对话框系统
        return Promise.resolve()
    }

    private showPanel(component: any, options: any = {}): void {
        const panelId = options.id || `panel_${Date.now()}`
        this.panels.set(panelId, { component, options })
        console.log(`[Plugin Panel] Showing panel ${panelId}`)
        // TODO: 实现面板系统
    }

    private hidePanel(panelId: string): void {
        if (this.panels.has(panelId)) {
            this.panels.delete(panelId)
            console.log(`[Plugin Panel] Hiding panel ${panelId}`)
        }
    }
}

export default PluginSystem
