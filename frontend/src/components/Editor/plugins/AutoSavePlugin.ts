/**
 * 自动保存插件
 */

import { BasePlugin, PluginConfig } from '../types/EditorPlugin'

/**
 * 自动保存插件配置
 */
interface AutoSavePluginConfig extends PluginConfig {
    options?: {
        interval?: number
        enableAutoSave?: boolean
        saveOnBlur?: boolean
        saveOnChange?: boolean
        maxBackups?: number
    }
}

/**
 * 自动保存插件
 */
export class AutoSavePlugin extends BasePlugin {
    private interval: number
    private enableAutoSave: boolean
    private saveOnBlur: boolean
    private saveOnChange: boolean
    private maxBackups: number
    private saveTimer: NodeJS.Timeout | null = null
    private lastSavedContent: string = ''
    private isDirty: boolean = false

    constructor(config: Partial<AutoSavePluginConfig> = {}) {
        super({
            name: 'auto-save',
            version: '1.0.0',
            description: '自动保存插件',
            enabled: config.enabled ?? true
        })

        this.interval = config.options?.interval || 30000 // 默认30秒
        this.enableAutoSave = config.options?.enableAutoSave ?? true
        this.saveOnBlur = config.options?.saveOnBlur ?? true
        this.saveOnChange = config.options?.saveOnChange ?? false
        this.maxBackups = config.options?.maxBackups || 5
    }

    protected async onInit(): Promise<void> {
        console.log('Auto Save Plugin initialized')
        this.lastSavedContent = this.getContent()
        this.startAutoSave()
    }

    protected onDestroy(): void {
        console.log('Auto Save Plugin destroyed')
        this.stopAutoSave()
    }

    protected setupEventListeners(): void {
        // 监听内容变化
        this.addEventListener('content:change', this.handleContentChange.bind(this))
        
        // 监听失焦事件
        this.addEventListener('blur', this.handleBlur.bind(this))
        
        // 监听窗口关闭事件
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
    }

    protected onEnable(): void {
        console.log('Auto Save Plugin enabled')
        this.startAutoSave()
    }

    protected onDisable(): void {
        console.log('Auto Save Plugin disabled')
        this.stopAutoSave()
    }

    /**
     * 处理内容变化
     */
    private handleContentChange(content: string): void {
        if (!this.enabled) return

        this.isDirty = content !== this.lastSavedContent

        // 如果启用了变化时保存
        if (this.saveOnChange && this.isDirty) {
            this.debouncedSave()
        }
    }

    /**
     * 处理失焦事件
     */
    private handleBlur(): void {
        if (!this.enabled || !this.saveOnBlur) return

        if (this.isDirty) {
            this.saveDocument()
        }
    }

    /**
     * 处理窗口关闭事件
     */
    private handleBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.isDirty) {
            event.preventDefault()
            event.returnValue = '文档尚未保存，确定要离开吗？'
            return event.returnValue
        }
    }

    /**
     * 开始自动保存
     */
    private startAutoSave(): void {
        if (!this.enableAutoSave || !this.enabled) return

        this.stopAutoSave()

        this.saveTimer = setInterval(() => {
            if (this.isDirty) {
                this.saveDocument()
            }
        }, this.interval)
    }

    /**
     * 停止自动保存
     */
    private stopAutoSave(): void {
        if (this.saveTimer) {
            clearInterval(this.saveTimer)
            this.saveTimer = null
        }
    }

    /**
     * 防抖保存
     */
    private debouncedSave = this.debounce(() => {
        this.saveDocument()
    }, 1000)

    /**
     * 防抖函数
     */
    private debounce(func: Function, delay: number): Function {
        let timeoutId: NodeJS.Timeout
        return function (this: any, ...args: any[]) {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => func.apply(this, args), delay)
        }
    }

    /**
     * 保存文档
     */
    private async saveDocument(): Promise<void> {
        if (!this.enabled) return

        const content = this.getContent()
        
        try {
            // 创建备份
            await this.createBackup(content)
            
            // 保存到本地存储
            await this.saveToLocalStorage(content)
            
            // 保存到服务器（如果有的话）
            await this.saveToServer(content)
            
            this.lastSavedContent = content
            this.isDirty = false
            
            // 触发保存成功事件
            this.emit('auto-save:success', {
                timestamp: new Date().toISOString(),
                content: content
            })
            
            console.log('Document auto-saved successfully')
        } catch (error) {
            console.error('Auto-save failed:', error)
            
            // 触发保存失败事件
            this.emit('auto-save:error', {
                timestamp: new Date().toISOString(),
                error: error
            })
        }
    }

    /**
     * 创建备份
     */
    private async createBackup(content: string): Promise<void> {
        const backups = this.getBackups()
        const backup = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            content: content
        }
        
        backups.unshift(backup)
        
        // 限制备份数量
        if (backups.length > this.maxBackups) {
            backups.splice(this.maxBackups)
        }
        
        localStorage.setItem('editor-backups', JSON.stringify(backups))
    }

    /**
     * 获取备份列表
     */
    public getBackups(): any[] {
        try {
            const backups = localStorage.getItem('editor-backups')
            return backups ? JSON.parse(backups) : []
        } catch (error) {
            console.error('Failed to get backups:', error)
            return []
        }
    }

    /**
     * 恢复备份
     */
    public async restoreBackup(backupId: string): Promise<boolean> {
        try {
            const backups = this.getBackups()
            const backup = backups.find(b => b.id === backupId)
            
            if (backup) {
                this.setContent(backup.content)
                this.lastSavedContent = backup.content
                this.isDirty = false
                
                this.emit('auto-save:restored', {
                    backup: backup
                })
                
                return true
            }
            
            return false
        } catch (error) {
            console.error('Failed to restore backup:', error)
            return false
        }
    }

    /**
     * 保存到本地存储
     */
    private async saveToLocalStorage(content: string): Promise<void> {
        const documentData = {
            content: content,
            lastModified: new Date().toISOString(),
            version: '1.0'
        }
        
        localStorage.setItem('editor-document', JSON.stringify(documentData))
    }

    /**
     * 从本地存储加载
     */
    public async loadFromLocalStorage(): Promise<string> {
        try {
            const documentData = localStorage.getItem('editor-document')
            if (documentData) {
                const data = JSON.parse(documentData)
                return data.content || ''
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error)
        }
        
        return ''
    }

    /**
     * 保存到服务器
     */
    private async saveToServer(content: string): Promise<void> {
        // 这里可以实现保存到服务器的逻辑
        // 目前只是模拟
        console.log('Saving to server:', content.length, 'characters')
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    /**
     * 检查是否有未保存的更改
     */
    public hasUnsavedChanges(): boolean {
        return this.isDirty
    }

    /**
     * 获取最后保存时间
     */
    public getLastSavedTime(): Date | null {
        try {
            const documentData = localStorage.getItem('editor-document')
            if (documentData) {
                const data = JSON.parse(documentData)
                return new Date(data.lastModified)
            }
        } catch (error) {
            console.error('Failed to get last saved time:', error)
        }
        
        return null
    }

    /**
     * 强制保存
     */
    public async forceSave(): Promise<void> {
        await this.saveDocument()
    }

    /**
     * 更新配置
     */
    public updateConfig(config: Partial<AutoSavePluginConfig['options']>): void {
        if (config?.interval !== undefined) {
            this.interval = config.interval
        }
        if (config?.enableAutoSave !== undefined) {
            this.enableAutoSave = config.enableAutoSave
        }
        if (config?.saveOnBlur !== undefined) {
            this.saveOnBlur = config.saveOnBlur
        }
        if (config?.saveOnChange !== undefined) {
            this.saveOnChange = config.saveOnChange
        }
        if (config?.maxBackups !== undefined) {
            this.maxBackups = config.maxBackups
        }
        
        // 重新启动自动保存
        this.startAutoSave()
    }
}
