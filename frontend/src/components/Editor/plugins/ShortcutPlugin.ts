/**
 * 快捷键插件
 */

import { BasePlugin, PluginConfig } from '../types/EditorPlugin'

/**
 * 快捷键定义
 */
interface ShortcutDefinition {
    key: string
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
    action: () => void
    description?: string
}

/**
 * 快捷键插件配置
 */
interface ShortcutPluginConfig extends PluginConfig {
    options?: {
        enableGlobalShortcuts?: boolean
        enableContextShortcuts?: boolean
    }
}

/**
 * 快捷键插件
 */
export class ShortcutPlugin extends BasePlugin {
    private shortcuts: Map<string, ShortcutDefinition> = new Map()
    private enableGlobalShortcuts: boolean
    private enableContextShortcuts: boolean

    constructor(config: Partial<ShortcutPluginConfig> = {}) {
        super({
            name: 'shortcut',
            version: '1.0.0',
            description: '快捷键支持插件',
            enabled: config.enabled ?? true
        })

        this.enableGlobalShortcuts = config.options?.enableGlobalShortcuts ?? true
        this.enableContextShortcuts = config.options?.enableContextShortcuts ?? true
    }

    protected async onInit(): Promise<void> {
        console.log('Shortcut Plugin initialized')
        this.registerDefaultShortcuts()
    }

    protected onDestroy(): void {
        console.log('Shortcut Plugin destroyed')
        this.shortcuts.clear()
    }

    protected setupEventListeners(): void {
        // 监听键盘事件
        this.addEventListener('keydown', this.handleKeyDown.bind(this))
    }

    protected onEnable(): void {
        console.log('Shortcut Plugin enabled')
    }

    protected onDisable(): void {
        console.log('Shortcut Plugin disabled')
    }

    /**
     * 注册默认快捷键
     */
    private registerDefaultShortcuts(): void {
        const adapter = this.getAdapter()
        if (!adapter) return

        // 文件操作快捷键
        this.registerShortcut({
            key: 's',
            ctrl: true,
            action: () => this.saveDocument(),
            description: '保存文档'
        })

        this.registerShortcut({
            key: 'o',
            ctrl: true,
            action: () => this.openDocument(),
            description: '打开文档'
        })

        this.registerShortcut({
            key: 'n',
            ctrl: true,
            action: () => this.newDocument(),
            description: '新建文档'
        })

        // 编辑操作快捷键
        this.registerShortcut({
            key: 'z',
            ctrl: true,
            action: () => adapter.undo(),
            description: '撤销'
        })

        this.registerShortcut({
            key: 'y',
            ctrl: true,
            action: () => adapter.redo(),
            description: '重做'
        })

        this.registerShortcut({
            key: 'a',
            ctrl: true,
            action: () => this.selectAll(),
            description: '全选'
        })

        this.registerShortcut({
            key: 'c',
            ctrl: true,
            action: () => this.copy(),
            description: '复制'
        })

        this.registerShortcut({
            key: 'v',
            ctrl: true,
            action: () => this.paste(),
            description: '粘贴'
        })

        this.registerShortcut({
            key: 'x',
            ctrl: true,
            action: () => this.cut(),
            description: '剪切'
        })

        // 格式化快捷键
        this.registerShortcut({
            key: 'b',
            ctrl: true,
            action: () => adapter.formatBold(),
            description: '粗体'
        })

        this.registerShortcut({
            key: 'i',
            ctrl: true,
            action: () => adapter.formatItalic(),
            description: '斜体'
        })

        this.registerShortcut({
            key: 'u',
            ctrl: true,
            action: () => adapter.formatUnderline(),
            description: '下划线'
        })

        // 插入快捷键
        this.registerShortcut({
            key: 'k',
            ctrl: true,
            action: () => this.insertLink(),
            description: '插入链接'
        })

        this.registerShortcut({
            key: 'Enter',
            shift: true,
            action: () => adapter.insertParagraph(),
            description: '插入段落'
        })

        // 搜索快捷键
        this.registerShortcut({
            key: 'f',
            ctrl: true,
            action: () => this.find(),
            description: '查找'
        })

        this.registerShortcut({
            key: 'f',
            ctrl: true,
            shift: true,
            action: () => this.findAndReplace(),
            description: '查找替换'
        })

        // 命令面板快捷键
        this.registerShortcut({
            key: 'k',
            ctrl: true,
            meta: true,
            action: () => this.openCommandPalette(),
            description: '打开命令面板'
        })

        // 帮助快捷键
        this.registerShortcut({
            key: 'F1',
            action: () => this.showHelp(),
            description: '显示帮助'
        })

        this.registerShortcut({
            key: '/',
            ctrl: true,
            action: () => this.showShortcuts(),
            description: '显示快捷键'
        })
    }

    /**
     * 注册快捷键
     */
    public registerShortcut(shortcut: ShortcutDefinition): void {
        const key = this.generateShortcutKey(shortcut)
        this.shortcuts.set(key, shortcut)
    }

    /**
     * 注销快捷键
     */
    public unregisterShortcut(shortcut: ShortcutDefinition): void {
        const key = this.generateShortcutKey(shortcut)
        this.shortcuts.delete(key)
    }

    /**
     * 处理键盘事件
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.enabled) return

        const key = this.generateShortcutKeyFromEvent(event)
        const shortcut = this.shortcuts.get(key)

        if (shortcut) {
            event.preventDefault()
            event.stopPropagation()
            
            try {
                shortcut.action()
            } catch (error) {
                console.error('Shortcut action failed:', error)
            }
        }
    }

    /**
     * 生成快捷键键值
     */
    private generateShortcutKey(shortcut: ShortcutDefinition): string {
        const parts: string[] = []
        
        if (shortcut.ctrl) parts.push('ctrl')
        if (shortcut.shift) parts.push('shift')
        if (shortcut.alt) parts.push('alt')
        if (shortcut.meta) parts.push('meta')
        
        parts.push(shortcut.key.toLowerCase())
        
        return parts.join('+')
    }

    /**
     * 从事件生成快捷键键值
     */
    private generateShortcutKeyFromEvent(event: KeyboardEvent): string {
        const parts: string[] = []
        
        if (event.ctrlKey) parts.push('ctrl')
        if (event.shiftKey) parts.push('shift')
        if (event.altKey) parts.push('alt')
        if (event.metaKey) parts.push('meta')
        
        parts.push(event.key.toLowerCase())
        
        return parts.join('+')
    }

    /**
     * 获取所有快捷键
     */
    public getAllShortcuts(): ShortcutDefinition[] {
        return Array.from(this.shortcuts.values())
    }

    /**
     * 获取快捷键描述
     */
    public getShortcutDescription(action: string): string | undefined {
        for (const shortcut of this.shortcuts.values()) {
            if (shortcut.action.name === action) {
                return shortcut.description
            }
        }
        return undefined
    }

    // 快捷键动作实现
    private saveDocument(): void {
        this.emit('document:save')
    }

    private openDocument(): void {
        this.emit('document:open')
    }

    private newDocument(): void {
        this.emit('document:new')
    }

    private selectAll(): void {
        const adapter = this.getAdapter()
        if (adapter) {
            const content = this.getContent()
            adapter.setSelection(0, content.length)
        }
    }

    private copy(): void {
        this.emit('clipboard:copy')
    }

    private paste(): void {
        this.emit('clipboard:paste')
    }

    private cut(): void {
        this.emit('clipboard:cut')
    }

    private insertLink(): void {
        const url = prompt('请输入链接地址:')
        if (url) {
            const adapter = this.getAdapter()
            adapter?.formatLink(url)
        }
    }

    private find(): void {
        this.emit('search:find')
    }

    private findAndReplace(): void {
        this.emit('search:findAndReplace')
    }

    private openCommandPalette(): void {
        this.emit('command:openPalette')
    }

    private showHelp(): void {
        this.emit('help:show')
    }

    private showShortcuts(): void {
        this.emit('help:showShortcuts')
    }
} 