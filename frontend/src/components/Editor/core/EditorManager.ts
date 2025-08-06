/**
 * 编辑器管理器
 */

import { EditorAdapter, EditorMode, EditorOptions, EditorType } from "../types";
import EditorAdapterFactory from "./EditorAdapterFactory";

export default class EditorManager {
    private currentAdapter: EditorAdapter | null = null

    private element: HTMLElement | null = null

    private options: EditorOptions | null = null
    /**
     * 创建编辑器
     * @param element 编辑器元素
     * @param type 编辑器类型
     * @param options 编辑器选项
     * @returns 编辑器适配器
     */
    async createEditor(
        element: HTMLElement,
        type: EditorType,
        options: EditorOptions
    ): Promise<EditorAdapter | null> {
        // 销毁当前编辑器
        await this.destroyEditor()

        this.element = element
        this.options = options
        this.currentAdapter = EditorAdapterFactory.createAdapter(type)

        if (!this.currentAdapter) {
            throw new Error('Failed to create editor adapter')
        }

        await this.currentAdapter.create(element, options)

        return this.currentAdapter
    }

    /**
     * 销毁编辑器
     */
    async destroyEditor(): Promise<void> {
        if (this.currentAdapter) {
            this.currentAdapter.destroy()
            this.currentAdapter = null
        }

        this.element = null
        this.options = null
    }

    /**
     * 获取当前编辑器适配器
     * @returns 编辑器适配器
     */
    getCurrentAdapter(): EditorAdapter | null {
        return this.currentAdapter
    }

    /**
     * 获取当前编辑器类型
     * @returns 编辑器类型
     */
    getCurrentType(): EditorType | null {
        return this.currentAdapter?.type || null
    }

    /**
     * 获取当前编辑器选项
     * @returns 编辑器选项
     */
    getCurrentOptions(): EditorOptions | null {
        return this.options || null
    }

    /**
     * 切换编辑器类型
     * @param type 编辑器类型
     * @returns 编辑器适配器
     */
    async switchEditorType(type: EditorType): Promise<EditorAdapter | null> {
        if (!this.element || !this.options) {
            throw new Error('Editor not initialized')
        }

        return this.createEditor(this.element, type, this.options)
    }

    /**
     * 切换编辑器模式
     * @param mode 编辑器模式
     * @returns 编辑器适配器
     */
    async switchEditorMode(mode: EditorMode): Promise<EditorAdapter | null> {
        if (!this.element || !this.options) {
            throw new Error('Editor not initialized')
        }

        return this.createEditor(this.element, this.options.type, {
            ...this.options,
            mode
        })
    }
}