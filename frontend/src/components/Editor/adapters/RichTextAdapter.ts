/**
 * 富文本编辑器适配器 - 基于PRD重构
 */

import { EditorAdapter, EditorOptions, RichTextOptions } from '../types/editorAdapter'
import { EditorType, SceneTemplate } from '../types/editorType'
import { TOCItem } from '../types/editorState'

export class RichTextAdapter implements EditorAdapter {
    type: EditorType = EditorType.RICH_TEXT
    sceneTemplate: SceneTemplate
    private element: HTMLElement | null = null
    private contentCallbacks: ((content: string) => void)[] = []
    private selectionCallbacks: ((selection: string) => void)[] = []
    private tocCallbacks: ((toc: TOCItem[]) => void)[] = []

    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
    }

    async create(element: HTMLElement, options: EditorOptions): Promise<void> {
        this.element = element
        
        // 创建富文本编辑器容器
        element.innerHTML = `
            <div class="rich-text-editor" contenteditable="true" style="
                min-height: 400px;
                padding: 20px;
                border: 1px solid #ccc;
                border-radius: 4px;
                outline: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
            ">
                ${options.content || this.getDefaultContent()}
            </div>
        `

        const editor = element.querySelector('.rich-text-editor') as HTMLElement
        
        // 设置事件监听
        editor.addEventListener('input', () => {
            const content = this.getValue()
            this.contentCallbacks.forEach(callback => callback(content))
        })

        editor.addEventListener('keyup', () => {
            const selection = this.getSelection()
            this.selectionCallbacks.forEach(callback => callback(selection))
        })

        // 设置焦点
        editor.focus()
    }

    destroy(): void {
        if (this.element) {
            this.element.innerHTML = ''
            this.element = null
        }
        this.contentCallbacks = []
        this.selectionCallbacks = []
        this.tocCallbacks = []
    }

    getValue(): string {
        if (!this.element) return ''
        const editor = this.element.querySelector('.rich-text-editor') as HTMLElement
        return editor?.innerHTML || ''
    }

    setValue(value: string): void {
        if (!this.element) return
        const editor = this.element.querySelector('.rich-text-editor') as HTMLElement
        if (editor) {
            editor.innerHTML = value
        }
    }

    getSelection(): string {
        const selection = window.getSelection()
        return selection?.toString() || ''
    }

    setSelection(start: number, end: number): void {
        // 简化实现，实际应该根据字符位置设置选择范围
        console.log('Setting selection:', start, end)
    }

    generateTOC(): TOCItem[] {
        if (!this.element) return []
        
        const editor = this.element.querySelector('.rich-text-editor') as HTMLElement
        const headings = editor?.querySelectorAll('h1, h2, h3, h4, h5, h6') || []
        
        const toc: TOCItem[] = []
        let position = 0

        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1))
            const title = heading.textContent || ''
            const id = `heading-${index}`
            
            toc.push({
                id,
                title,
                level,
                children: [],
                position: position++,
            })
        })

        return toc
    }

    navigateToSection(sectionId: string): void {
        if (!this.element) return
        
        const editor = this.element.querySelector('.rich-text-editor') as HTMLElement
        const heading = editor?.querySelector(`[id="${sectionId}"]`) as HTMLElement
        
        if (heading) {
            heading.scrollIntoView({ behavior: 'smooth' })
        }
    }

    updateTOC(): void {
        const toc = this.generateTOC()
        this.tocCallbacks.forEach(callback => callback(toc))
    }

    async processAIInput(input: string): Promise<void> {
        // 模拟AI处理
        console.log('Processing AI input:', input)
        
        // 这里应该调用实际的AI API
        // 暂时只是简单地在编辑器末尾添加内容
        const currentContent = this.getValue()
        const aiResponse = `<p><strong>AI建议:</strong> ${input}</p>`
        this.setValue(currentContent + aiResponse)
    }

    async applyAISuggestion(suggestionId: string): Promise<void> {
        console.log('Applying AI suggestion:', suggestionId)
        // 实现AI建议应用逻辑
    }

    onContentChange(callback: (content: string) => void): void {
        this.contentCallbacks.push(callback)
    }

    onSelectionChange(callback: (selection: string) => void): void {
        this.selectionCallbacks.push(callback)
    }

    onTOCChange(callback: (toc: TOCItem[]) => void): void {
        this.tocCallbacks.push(callback)
    }

    focus(): void {
        const editor = this.element?.querySelector('.rich-text-editor') as HTMLElement
        editor?.focus()
    }

    blur(): void {
        const editor = this.element?.querySelector('.rich-text-editor') as HTMLElement
        editor?.blur()
    }

    isFocused(): boolean {
        const editor = this.element?.querySelector('.rich-text-editor') as HTMLElement
        return document.activeElement === editor
    }

    private getDefaultContent(): string {
        const templates = {
            [SceneTemplate.WRITING]: `
                <h1>新文档</h1>
                <p>开始写作...</p>
            `,
            [SceneTemplate.RESEARCH]: `
                <h1>研究文档</h1>
                <h2>研究目标</h2>
                <p>描述你的研究目标...</p>
                <h2>研究方法</h2>
                <p>描述你的研究方法...</p>
            `,
            [SceneTemplate.LEARNING]: `
                <h1>学习笔记</h1>
                <h2>学习目标</h2>
                <p>记录你的学习目标...</p>
                <h2>学习内容</h2>
                <p>记录学习内容...</p>
            `,
            [SceneTemplate.PLANNING]: `
                <h1>项目规划</h1>
                <h2>项目目标</h2>
                <p>定义项目目标...</p>
                <h2>时间安排</h2>
                <p>制定时间安排...</p>
            `,
            [SceneTemplate.CREATIVE]: `
                <h1>创意项目</h1>
                <h2>创意想法</h2>
                <p>记录你的创意想法...</p>
                <h2>灵感来源</h2>
                <p>记录灵感来源...</p>
            `,
        }

        return templates[this.sceneTemplate] || templates[SceneTemplate.WRITING]
    }
} 