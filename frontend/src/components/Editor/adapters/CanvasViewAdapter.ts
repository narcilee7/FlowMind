/**
 * 画布视图适配器 - 简化版本
 */

import { CoreViewAdapter, AdapterCapabilities } from './BaseViewAdapter.optimized'
import { ViewAdapterOptions, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'

export class CanvasViewAdapter extends CoreViewAdapter {
    public readonly type: EditorType.CANVAS = EditorType.CANVAS
    public readonly capabilities: AdapterCapabilities = {
        canEdit: true,
        canSelect: true,
        canZoom: true,
        canDrag: true,
        supportsUndo: true,
        supportsSearch: false,
        supportsAI: true
    }

    private canvas: HTMLCanvasElement | null = null
    private ctx: CanvasRenderingContext2D | null = null

    constructor(sceneTemplate: SceneTemplate) {
        super(sceneTemplate)
    }

    protected async performCreate(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        this.canvas = document.createElement('canvas')
        this.canvas.width = 800
        this.canvas.height = 600
        this.canvas.style.border = '1px solid #ccc'
        this.canvas.style.background = 'white'

        element.appendChild(this.canvas)

        this.ctx = this.canvas.getContext('2d')
        if (!this.ctx) {
            throw new Error('Failed to get canvas context')
        }

        // 绘制示例内容
        this.drawExample()
    }

    protected performDestroy(): void {
        if (this.canvas) {
            this.canvas.remove()
            this.canvas = null
            this.ctx = null
        }
    }

    protected performRender(ast: DocumentAST): void {
        this.drawExample()
    }

    protected performUpdateNode(nodeId: string, node: ASTNode): void { }
    protected performRemoveNode(nodeId: string): void { }
    protected performAddNode(node: ASTNode, parentId?: string, index?: number): void { }
    protected performSetSelection(selection: Selection): void { }
    protected performGetSelection(): Selection {
        return { nodeIds: [], type: 'node' }
    }
    protected performFocus(): void { }
    protected performBlur(): void { }
    protected performGetViewport(): Viewport {
        return { x: 0, y: 0, width: 800, height: 600, zoom: 1 }
    }
    protected performSetViewport(viewport: Viewport): void { }

    private drawExample(): void {
        if (!this.ctx) return

        this.ctx.fillStyle = 'white'
        this.ctx.fillRect(0, 0, 800, 600)

        this.ctx.fillStyle = '#007bff'
        this.ctx.font = '24px Arial'
        this.ctx.fillText('画布编辑器', 350, 100)

        this.ctx.strokeStyle = '#28a745'
        this.ctx.lineWidth = 3
        this.ctx.strokeRect(200, 150, 400, 200)

        this.ctx.fillStyle = '#ffc107'
        this.ctx.beginPath()
        this.ctx.arc(400, 450, 50, 0, 2 * Math.PI)
        this.ctx.fill()
    }
}

export default CanvasViewAdapter
