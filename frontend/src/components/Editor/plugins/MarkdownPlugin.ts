/**
 * Markdown插件
 */

import { BasePlugin, PluginConfig } from '../types/EditorPlugin'

/**
 * Markdown插件配置
 */
interface MarkdownPluginConfig extends PluginConfig {
    options?: {
        enableAutoLink?: boolean
        enableTableSupport?: boolean
        enableMathSupport?: boolean
        enableMermaidSupport?: boolean
    }
}

/**
 * Markdown插件
 */
export class MarkdownPlugin extends BasePlugin {
    private enableAutoLink: boolean
    private enableTableSupport: boolean
    private enableMathSupport: boolean
    private enableMermaidSupport: boolean

    constructor(config: Partial<MarkdownPluginConfig> = {}) {
        super({
            name: 'markdown',
            version: '1.0.0',
            description: 'Markdown语法支持插件',
            enabled: config.enabled ?? true
        })

        this.enableAutoLink = config.options?.enableAutoLink ?? true
        this.enableTableSupport = config.options?.enableTableSupport ?? true
        this.enableMathSupport = config.options?.enableMathSupport ?? true
        this.enableMermaidSupport = config.options?.enableMermaidSupport ?? true
    }

    protected async onInit(): Promise<void> {
        console.log('Markdown Plugin initialized')
    }

    protected onDestroy(): void {
        console.log('Markdown Plugin destroyed')
    }

    protected setupEventListeners(): void {
        // 监听内容变化，处理Markdown语法
        this.addEventListener('content:change', this.handleContentChange.bind(this))
        
        // 监听键盘事件，处理Markdown快捷键
        this.addEventListener('keydown', this.handleKeyDown.bind(this))
    }

    protected onEnable(): void {
        console.log('Markdown Plugin enabled')
    }

    protected onDisable(): void {
        console.log('Markdown Plugin disabled')
    }

    /**
     * 处理内容变化
     */
    private handleContentChange(content: string): void {
        if (!this.enabled) return

        // 处理自动链接
        if (this.enableAutoLink) {
            this.processAutoLinks(content)
        }

        // 处理表格语法
        if (this.enableTableSupport) {
            this.processTableSyntax(content)
        }

        // 处理数学公式
        if (this.enableMathSupport) {
            this.processMathSyntax(content)
        }

        // 处理Mermaid图表
        if (this.enableMermaidSupport) {
            this.processMermaidSyntax(content)
        }
    }

    /**
     * 处理键盘事件
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.enabled) return

        const adapter = this.getAdapter()
        if (!adapter) return

        // 处理Markdown快捷键
        switch (event.key) {
            case '#':
                if (event.ctrlKey) {
                    event.preventDefault()
                    adapter.insertHeading(1)
                }
                break
            case 'b':
                if (event.ctrlKey) {
                    event.preventDefault()
                    adapter.formatBold()
                }
                break
            case 'i':
                if (event.ctrlKey) {
                    event.preventDefault()
                    adapter.formatItalic()
                }
                break
            case 'k':
                if (event.ctrlKey) {
                    event.preventDefault()
                    const url = prompt('请输入链接地址:')
                    if (url) {
                        adapter.formatLink(url)
                    }
                }
                break
            case 'Enter':
                if (event.shiftKey) {
                    event.preventDefault()
                    adapter.insertParagraph()
                }
                break
        }
    }

    /**
     * 处理自动链接
     */
    private processAutoLinks(content: string): void {
        // 检测URL并自动转换为链接
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const matches = content.match(urlRegex)
        
        if (matches) {
            matches.forEach(url => {
                // 这里可以实现自动链接转换逻辑
                console.log('Auto-link detected:', url)
            })
        }
    }

    /**
     * 处理表格语法
     */
    private processTableSyntax(content: string): void {
        // 检测表格语法并转换为HTML表格
        const tableRegex = /\|(.+)\|\n\|[\s\-:]+\|\n(\|.+\|\n?)+/g
        const matches = content.match(tableRegex)
        
        if (matches) {
            matches.forEach(table => {
                console.log('Table syntax detected:', table)
                // 这里可以实现表格转换逻辑
            })
        }
    }

    /**
     * 处理数学公式语法
     */
    private processMathSyntax(content: string): void {
        // 检测数学公式语法
        const inlineMathRegex = /\$([^$]+)\$/g
        const blockMathRegex = /\$\$([^$]+)\$\$/g
        
        const inlineMatches = content.match(inlineMathRegex)
        const blockMatches = content.match(blockMathRegex)
        
        if (inlineMatches || blockMatches) {
            console.log('Math syntax detected:', { inlineMatches, blockMatches })
            // 这里可以实现数学公式渲染逻辑
        }
    }

    /**
     * 处理Mermaid图表语法
     */
    private processMermaidSyntax(content: string): void {
        // 检测Mermaid图表语法
        const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g
        const matches = content.match(mermaidRegex)
        
        if (matches) {
            matches.forEach(mermaid => {
                console.log('Mermaid syntax detected:', mermaid)
                // 这里可以实现Mermaid图表渲染逻辑
            })
        }
    }

    /**
     * 转换Markdown为HTML
     */
    public convertMarkdownToHTML(markdown: string): string {
        // 这里可以实现完整的Markdown到HTML转换
        // 目前返回简单的转换结果
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`(.*)`/gim, '<code>$1</code>')
            .replace(/\n/gim, '<br>')
    }

    /**
     * 转换HTML为Markdown
     */
    public convertHTMLToMarkdown(html: string): string {
        // 这里可以实现HTML到Markdown的转换
        return html
            .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n')
            .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n')
            .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n')
            .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
            .replace(/<em>(.*?)<\/em>/gim, '*$1*')
            .replace(/<code>(.*?)<\/code>/gim, '`$1`')
            .replace(/<br\s*\/?>/gim, '\n')
    }
} 