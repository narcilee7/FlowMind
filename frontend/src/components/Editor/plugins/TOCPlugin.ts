/**
 * 目录生成插件
 */

import { BasePlugin, PluginConfig } from '../types/EditorPlugin'
import { TOCItem } from '../types/EditorState'

/**
 * 目录生成插件配置
 */
interface TOCPluginConfig extends PluginConfig {
    options?: {
        enableAutoTOC?: boolean
        updateInterval?: number
        maxDepth?: number
        includeCodeBlocks?: boolean
    }
}

/**
 * 目录生成插件
 */
export class TOCPlugin extends BasePlugin {
    private enableAutoTOC: boolean
    private updateInterval: number
    private maxDepth: number
    private includeCodeBlocks: boolean
    private tocUpdateTimer: NodeJS.Timeout | null = null
    private currentTOC: TOCItem[] = []

    constructor(config: Partial<TOCPluginConfig> = {}) {
        super({
            name: 'toc',
            version: '1.0.0',
            description: '目录生成插件',
            enabled: config.enabled ?? true
        })

        this.enableAutoTOC = config.options?.enableAutoTOC ?? true
        this.updateInterval = config.options?.updateInterval || 5000 // 默认5秒
        this.maxDepth = config.options?.maxDepth || 6
        this.includeCodeBlocks = config.options?.includeCodeBlocks ?? false
    }

    protected async onInit(): Promise<void> {
        console.log('TOC Plugin initialized')
        this.startAutoTOCUpdate()
    }

    protected onDestroy(): void {
        console.log('TOC Plugin destroyed')
        this.stopAutoTOCUpdate()
    }

    protected setupEventListeners(): void {
        // 监听内容变化
        this.addEventListener('content:change', this.handleContentChange.bind(this))
        
        // 监听选择变化
        this.addEventListener('selection:change', this.handleSelectionChange.bind(this))
    }

    protected onEnable(): void {
        console.log('TOC Plugin enabled')
        this.startAutoTOCUpdate()
    }

    protected onDisable(): void {
        console.log('TOC Plugin disabled')
        this.stopAutoTOCUpdate()
    }

    /**
     * 处理内容变化
     */
    private handleContentChange(content: string): void {
        if (!this.enabled || !this.enableAutoTOC) return

        // 延迟更新TOC，避免频繁更新
        this.debouncedUpdateTOC()
    }

    /**
     * 处理选择变化
     */
    private handleSelectionChange(selection: string): void {
        if (!this.enabled) return

        // 可以在这里实现选择高亮等功能
        console.log('Selection changed:', selection.length, 'characters')
    }

    /**
     * 开始自动TOC更新
     */
    private startAutoTOCUpdate(): void {
        if (!this.enableAutoTOC || !this.enabled) return

        this.stopAutoTOCUpdate()

        this.tocUpdateTimer = setInterval(() => {
            this.updateTOC()
        }, this.updateInterval)
    }

    /**
     * 停止自动TOC更新
     */
    private stopAutoTOCUpdate(): void {
        if (this.tocUpdateTimer) {
            clearInterval(this.tocUpdateTimer)
            this.tocUpdateTimer = null
        }
    }

    /**
     * 防抖更新TOC
     */
    private debouncedUpdateTOC = this.debounce(() => {
        this.updateTOC()
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
     * 更新目录
     */
    private updateTOC(): void {
        const adapter = this.getAdapter()
        if (!adapter) return

        try {
            const newTOC = adapter.generateTOC()
            
            // 检查TOC是否有变化
            if (this.hasTOCChanged(newTOC)) {
                this.currentTOC = newTOC
                
                // 触发TOC更新事件
                this.emit('toc:updated', {
                    toc: newTOC,
                    timestamp: new Date().toISOString()
                })
                
                console.log('TOC updated:', newTOC.length, 'items')
            }
        } catch (error) {
            console.error('Failed to update TOC:', error)
        }
    }

    /**
     * 检查TOC是否有变化
     */
    private hasTOCChanged(newTOC: TOCItem[]): boolean {
        if (this.currentTOC.length !== newTOC.length) {
            return true
        }

        for (let i = 0; i < newTOC.length; i++) {
            const oldItem = this.currentTOC[i]
            const newItem = newTOC[i]
            
            if (oldItem.id !== newItem.id ||
                oldItem.title !== newItem.title ||
                oldItem.level !== newItem.level ||
                oldItem.position !== newItem.position) {
                return true
            }
        }

        return false
    }

    /**
     * 获取当前目录
     */
    public getCurrentTOC(): TOCItem[] {
        return [...this.currentTOC]
    }

    /**
     * 手动更新目录
     */
    public async manualUpdateTOC(): Promise<TOCItem[]> {
        const adapter = this.getAdapter()
        if (!adapter) return []

        try {
            const newTOC = adapter.generateTOC()
            this.currentTOC = newTOC
            
            this.emit('toc:manual-updated', {
                toc: newTOC,
                timestamp: new Date().toISOString()
            })
            
            return newTOC
        } catch (error) {
            console.error('Manual TOC update failed:', error)
            return []
        }
    }

    /**
     * 导航到指定章节
     */
    public navigateToSection(sectionId: string): boolean {
        const adapter = this.getAdapter()
        if (!adapter) return false

        try {
            adapter.navigateToSection(sectionId)
            
            this.emit('toc:navigated', {
                sectionId,
                timestamp: new Date().toISOString()
            })
            
            return true
        } catch (error) {
            console.error('Navigation failed:', error)
            return false
        }
    }

    /**
     * 获取章节统计信息
     */
    public getTOCStats(): {
        totalSections: number
        maxDepth: number
        averageDepth: number
        depthDistribution: Record<number, number>
    } {
        const toc = this.getCurrentTOC()
        
        if (toc.length === 0) {
            return {
                totalSections: 0,
                maxDepth: 0,
                averageDepth: 0,
                depthDistribution: {}
            }
        }

        const depths = toc.map(item => item.level)
        const maxDepth = Math.max(...depths)
        const averageDepth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length
        
        const depthDistribution: Record<number, number> = {}
        depths.forEach(depth => {
            depthDistribution[depth] = (depthDistribution[depth] || 0) + 1
        })

        return {
            totalSections: toc.length,
            maxDepth,
            averageDepth: Math.round(averageDepth * 100) / 100,
            depthDistribution
        }
    }

    /**
     * 过滤目录
     */
    public filterTOC(filter: {
        minLevel?: number
        maxLevel?: number
        searchText?: string
    }): TOCItem[] {
        let filteredTOC = this.getCurrentTOC()

        // 按层级过滤
        if (filter.minLevel !== undefined) {
            filteredTOC = filteredTOC.filter(item => item.level >= filter.minLevel!)
        }
        
        if (filter.maxLevel !== undefined) {
            filteredTOC = filteredTOC.filter(item => item.level <= filter.maxLevel!)
        }

        // 按文本搜索过滤
        if (filter.searchText) {
            const searchLower = filter.searchText.toLowerCase()
            filteredTOC = filteredTOC.filter(item => 
                item.title.toLowerCase().includes(searchLower)
            )
        }

        return filteredTOC
    }

    /**
     * 导出目录
     */
    public exportTOC(format: 'json' | 'markdown' | 'html' = 'json'): string {
        const toc = this.getCurrentTOC()
        
        switch (format) {
            case 'json':
                return JSON.stringify(toc, null, 2)
            
            case 'markdown':
                return this.generateMarkdownTOC(toc)
            
            case 'html':
                return this.generateHTMLTOC(toc)
            
            default:
                return JSON.stringify(toc, null, 2)
        }
    }

    /**
     * 生成Markdown格式的目录
     */
    private generateMarkdownTOC(toc: TOCItem[]): string {
        return toc.map(item => {
            const indent = '  '.repeat(item.level - 1)
            const link = `[${item.title}](#${item.id})`
            return `${indent}- ${link}`
        }).join('\n')
    }

    /**
     * 生成HTML格式的目录
     */
    private generateHTMLTOC(toc: TOCItem[]): string {
        const items = toc.map(item => {
            const indent = '  '.repeat(item.level - 1)
            return `${indent}<li><a href="#${item.id}">${item.title}</a></li>`
        }).join('\n')
        
        return `<ul class="toc">\n${items}\n</ul>`
    }

    /**
     * 更新配置
     */
    public updateConfig(config: Partial<TOCPluginConfig['options']>): void {
        if (config?.enableAutoTOC !== undefined) {
            this.enableAutoTOC = config.enableAutoTOC
        }
        if (config?.updateInterval !== undefined) {
            this.updateInterval = config.updateInterval
        }
        if (config?.maxDepth !== undefined) {
            this.maxDepth = config.maxDepth
        }
        if (config?.includeCodeBlocks !== undefined) {
            this.includeCodeBlocks = config.includeCodeBlocks
        }
        
        // 重新启动自动更新
        this.startAutoTOCUpdate()
    }
} 