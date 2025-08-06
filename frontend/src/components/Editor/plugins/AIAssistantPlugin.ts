/**
 * AI助手插件
 */

import { BasePlugin, PluginConfig } from '../types/EditorPlugin'

/**
 * AI助手插件配置
 */
interface AIAssistantPluginConfig extends PluginConfig {
    options?: {
        apiEndpoint?: string
        apiKey?: string
        enableAutoComplete?: boolean
        enableSmartSuggestions?: boolean
    }
}

/**
 * AI助手插件
 */
export class AIAssistantPlugin extends BasePlugin {
    private apiEndpoint: string
    private apiKey: string
    private enableAutoComplete: boolean
    private enableSmartSuggestions: boolean

    constructor(config: Partial<AIAssistantPluginConfig> = {}) {
        super({
            name: 'ai-assistant',
            version: '1.0.0',
            description: 'AI助手插件，提供智能写作和内容生成功能',
            enabled: config.enabled ?? true
        })

        this.apiEndpoint = config.options?.apiEndpoint || '/api/ai'
        this.apiKey = config.options?.apiKey || ''
        this.enableAutoComplete = config.options?.enableAutoComplete ?? true
        this.enableSmartSuggestions = config.options?.enableSmartSuggestions ?? true
    }

    protected async onInit(): Promise<void> {
        console.log('AI Assistant Plugin initialized')
    }

    protected onDestroy(): void {
        console.log('AI Assistant Plugin destroyed')
    }

    protected setupEventListeners(): void {
        // 监听内容变化，提供智能建议
        this.addEventListener('content:change', this.handleContentChange.bind(this))
        
        // 监听选择变化，提供上下文相关的AI建议
        this.addEventListener('selection:change', this.handleSelectionChange.bind(this))
        
        // 监听键盘事件，处理AI快捷键
        this.addEventListener('keydown', this.handleKeyDown.bind(this))
    }

    protected onEnable(): void {
        console.log('AI Assistant Plugin enabled')
    }

    protected onDisable(): void {
        console.log('AI Assistant Plugin disabled')
    }

    /**
     * 处理内容变化
     */
    private async handleContentChange(content: string): Promise<void> {
        if (!this.enableAutoComplete || !this.enabled) return

        // 分析内容变化，提供智能补全
        const lastChar = content.slice(-1)
        if (lastChar === ' ' || lastChar === '\n') {
            await this.provideAutoComplete(content)
        }
    }

    /**
     * 处理选择变化
     */
    private async handleSelectionChange(selection: string): Promise<void> {
        if (!this.enableSmartSuggestions || !this.enabled) return

        if (selection.length > 0) {
            await this.provideSmartSuggestions(selection)
        }
    }

    /**
     * 处理键盘事件
     */
    private async handleKeyDown(event: KeyboardEvent): Promise<void> {
        if (!this.enabled) return

        // Ctrl+Shift+A: AI续写
        if (event.ctrlKey && event.shiftKey && event.key === 'A') {
            event.preventDefault()
            await this.continueWriting()
        }

        // Ctrl+Shift+R: AI改写
        if (event.ctrlKey && event.shiftKey && event.key === 'R') {
            event.preventDefault()
            await this.rewriteSelection()
        }

        // Ctrl+Shift+S: AI摘要
        if (event.ctrlKey && event.shiftKey && event.key === 'S') {
            event.preventDefault()
            await this.generateSummary()
        }
    }

    /**
     * 提供自动补全
     */
    private async provideAutoComplete(content: string): Promise<void> {
        try {
            const response = await this.callAIAPI({
                type: 'auto-complete',
                content: content.slice(-200), // 只发送最后200个字符
                context: this.getContext()
            })

            if (response.suggestions && response.suggestions.length > 0) {
                this.emit('ai:suggestions', {
                    type: 'auto-complete',
                    suggestions: response.suggestions,
                    position: content.length
                })
            }
        } catch (error) {
            console.error('Auto-complete failed:', error)
        }
    }

    /**
     * 提供智能建议
     */
    private async provideSmartSuggestions(selection: string): Promise<void> {
        try {
            const response = await this.callAIAPI({
                type: 'smart-suggestions',
                content: selection,
                context: this.getContext()
            })

            if (response.suggestions && response.suggestions.length > 0) {
                this.emit('ai:suggestions', {
                    type: 'smart-suggestions',
                    suggestions: response.suggestions,
                    selection: selection
                })
            }
        } catch (error) {
            console.error('Smart suggestions failed:', error)
        }
    }

    /**
     * AI续写
     */
    private async continueWriting(): Promise<void> {
        const content = this.getContent()
        const lastParagraph = this.getLastParagraph(content)

        try {
            const response = await this.callAIAPI({
                type: 'continue-writing',
                content: lastParagraph,
                context: this.getContext()
            })

            if (response.content) {
                this.insertAIContent(response.content, 'continue')
            }
        } catch (error) {
            console.error('Continue writing failed:', error)
        }
    }

    /**
     * AI改写选中内容
     */
    private async rewriteSelection(): Promise<void> {
        const selection = this.getAdapter()?.getSelection() || ''
        
        if (!selection) {
            console.warn('No text selected for rewriting')
            return
        }

        try {
            const response = await this.callAIAPI({
                type: 'rewrite',
                content: selection,
                context: this.getContext()
            })

            if (response.content) {
                this.replaceSelectionWithAI(response.content)
            }
        } catch (error) {
            console.error('Rewrite failed:', error)
        }
    }

    /**
     * 生成摘要
     */
    private async generateSummary(): Promise<void> {
        const content = this.getContent()
        
        if (!content) {
            console.warn('No content to summarize')
            return
        }

        try {
            const response = await this.callAIAPI({
                type: 'summarize',
                content: content,
                context: this.getContext()
            })

            if (response.content) {
                this.insertAIContent(response.content, 'summary')
            }
        } catch (error) {
            console.error('Summary generation failed:', error)
        }
    }

    /**
     * 调用AI API
     */
    private async callAIAPI(request: {
        type: string
        content: string
        context?: any
    }): Promise<any> {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(request)
        })

        if (!response.ok) {
            throw new Error(`AI API request failed: ${response.statusText}`)
        }

        return await response.json()
    }

    /**
     * 获取上下文信息
     */
    private getContext(): any {
        const adapter = this.getAdapter()
        return {
            editorType: adapter?.type,
            sceneTemplate: adapter?.sceneTemplate,
            contentLength: this.getContent().length,
            selection: adapter?.getSelection() || ''
        }
    }

    /**
     * 获取最后一段内容
     */
    private getLastParagraph(content: string): string {
        const paragraphs = content.split('\n').filter(p => p.trim())
        return paragraphs[paragraphs.length - 1] || ''
    }

    /**
     * 插入AI生成的内容
     */
    private insertAIContent(content: string, type: string): void {
        const adapter = this.getAdapter()
        if (!adapter) return

        // 在当前位置插入AI内容
        const currentContent = this.getContent()
        const newContent = currentContent + '\n\n' + content
        
        this.setContent(newContent)
        
        // 触发AI内容插入事件
        this.emit('ai:content-inserted', {
            type,
            content,
            position: currentContent.length
        })
    }

    /**
     * 用AI内容替换选中内容
     */
    private replaceSelectionWithAI(content: string): void {
        const adapter = this.getAdapter()
        if (!adapter) return

        // 这里需要根据具体适配器实现替换逻辑
        console.log('Replace selection with AI content:', content)
        
        // 触发AI内容替换事件
        this.emit('ai:content-replaced', {
            content,
            originalSelection: adapter.getSelection()
        })
    }
} 