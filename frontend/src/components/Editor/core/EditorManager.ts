/**
 * 编辑器管理器 - 基于PRD重构
 */

import { EditorAdapter, EditorOptions } from "../types/editorAdapter"
import { EditorType, SceneTemplate } from "../types/editorType"
import { TOCItem } from "../types/editorState"
import EditorAdapterFactory from "./EditorAdapterFactory"

export default class EditorManager {
    private currentAdapter: EditorAdapter | null = null
    private element: HTMLElement | null = null
    private options: EditorOptions | null = null
    private tocUpdateTimer: NodeJS.Timeout | null = null

    /**
     * 创建编辑器
     */
    async createEditor(
        element: HTMLElement,
        type: EditorType,
        sceneTemplate: SceneTemplate,
        options: Partial<EditorOptions> = {}
    ): Promise<EditorAdapter | null> {
        // 销毁当前编辑器
        await this.destroyEditor()

        this.element = element
        
        // 合并选项
        this.options = {
            type,
            sceneTemplate,
            ...options
        }

        // 创建适配器
        this.currentAdapter = EditorAdapterFactory.createAdapter(type, sceneTemplate)

        if (!this.currentAdapter) {
            throw new Error(`Failed to create editor adapter for type: ${type}`)
        }

        // 初始化编辑器
        await this.currentAdapter.create(element, this.options)

        // 设置自动TOC更新
        this.setupAutoTOCUpdate()

        return this.currentAdapter
    }

    /**
     * 销毁编辑器
     */
    async destroyEditor(): Promise<void> {
        // 清理TOC更新定时器
        if (this.tocUpdateTimer) {
            clearInterval(this.tocUpdateTimer)
            this.tocUpdateTimer = null
        }

        // 销毁适配器
        if (this.currentAdapter) {
            this.currentAdapter.destroy()
            this.currentAdapter = null
        }

        this.element = null
        this.options = null
    }

    /**
     * 切换编辑器类型
     */
    async switchEditorType(type: EditorType): Promise<EditorAdapter | null> {
        if (!this.element || !this.options) {
            throw new Error('Editor not initialized')
        }

        const sceneTemplate = this.options.sceneTemplate
        return this.createEditor(this.element, type, sceneTemplate, this.options)
    }

    /**
     * 切换场景模板
     */
    async switchSceneTemplate(template: SceneTemplate): Promise<EditorAdapter | null> {
        if (!this.element || !this.options) {
            throw new Error('Editor not initialized')
        }

        const type = this.options.type
        return this.createEditor(this.element, type, template, this.options)
    }

    /**
     * 获取当前编辑器适配器
     */
    getCurrentAdapter(): EditorAdapter | null {
        return this.currentAdapter
    }

    /**
     * 获取当前编辑器类型
     */
    getCurrentType(): EditorType | null {
        return this.currentAdapter?.type || null
    }

    /**
     * 获取当前场景模板
     */
    getCurrentSceneTemplate(): SceneTemplate | null {
        return this.currentAdapter?.sceneTemplate || null
    }

    /**
     * 获取当前编辑器选项
     */
    getCurrentOptions(): EditorOptions | null {
        return this.options || null
    }

    /**
     * 生成目录
     */
    generateTOC(): TOCItem[] {
        if (!this.currentAdapter) {
            return []
        }
        return this.currentAdapter.generateTOC()
    }

    /**
     * 导航到指定章节
     */
    navigateToSection(sectionId: string): void {
        if (!this.currentAdapter) {
            return
        }
        this.currentAdapter.navigateToSection(sectionId)
    }

    /**
     * 更新目录
     */
    updateTOC(): void {
        if (!this.currentAdapter) {
            return
        }
        this.currentAdapter.updateTOC()
    }

    /**
     * 处理AI输入
     */
    async processAIInput(input: string): Promise<void> {
        if (!this.currentAdapter) {
            throw new Error('Editor not initialized')
        }
        await this.currentAdapter.processAIInput(input)
    }

    /**
     * 应用AI建议
     */
    async applyAISuggestion(suggestionId: string): Promise<void> {
        if (!this.currentAdapter) {
            throw new Error('Editor not initialized')
        }
        await this.currentAdapter.applyAISuggestion(suggestionId)
    }

    /**
     * 设置自动TOC更新
     */
    private setupAutoTOCUpdate(): void {
        if (!this.options?.autoGenerateTOC) {
            return
        }

        const interval = this.options.tocUpdateInterval || 5000 // 默认5秒

        this.tocUpdateTimer = setInterval(() => {
            this.updateTOC()
        }, interval)
    }

    /**
     * 获取编辑器内容
     */
    getContent(): string {
        if (!this.currentAdapter) {
            return ''
        }
        return this.currentAdapter.getValue()
    }

    /**
     * 设置编辑器内容
     */
    setContent(content: string): void {
        if (!this.currentAdapter) {
            return
        }
        this.currentAdapter.setValue(content)
    }

    /**
     * 获取选择内容
     */
    getSelection(): string {
        if (!this.currentAdapter) {
            return ''
        }
        return this.currentAdapter.getSelection()
    }

    /**
     * 设置选择范围
     */
    setSelection(start: number, end: number): void {
        if (!this.currentAdapter) {
            return
        }
        this.currentAdapter.setSelection(start, end)
    }

    /**
     * 聚焦编辑器
     */
    focus(): void {
        if (!this.currentAdapter) {
            return
        }
        this.currentAdapter.focus()
    }

    /**
     * 失焦编辑器
     */
    blur(): void {
        if (!this.currentAdapter) {
            return
        }
        this.currentAdapter.blur()
    }

    /**
     * 检查编辑器是否聚焦
     */
    isFocused(): boolean {
        if (!this.currentAdapter) {
            return false
        }
        return this.currentAdapter.isFocused()
    }
}