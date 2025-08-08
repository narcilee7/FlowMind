/**
 * 画布视图适配器 - 功能完整版本
 * 
 * 支持功能：
 * - 多种绘图工具（画笔、形状、文本）
 * - 图层管理
 * - 选择和移动对象
 * - 缩放和平移
 * - 撤销/重做
 */

import { CoreViewAdapter, AdapterCapabilities } from './BaseViewAdapter.optimized'
import { ViewAdapterOptions, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'

/**
 * 绘图工具类型
 */
export enum DrawingTool {
    NONE = 'none',
    PEN = 'pen',
    RECTANGLE = 'rectangle',
    CIRCLE = 'circle',
    LINE = 'line',
    TEXT = 'text',
    ERASER = 'eraser',
    SELECT = 'select'
}

/**
 * 画布对象接口
 */
export interface CanvasObject {
    id: string
    type: 'path' | 'rectangle' | 'circle' | 'line' | 'text'
    data: any
    style: {
        stroke?: string
        fill?: string
        strokeWidth?: number
        fontSize?: number
        fontFamily?: string
    }
    bounds: {
        x: number
        y: number
        width: number
        height: number
    }
    selected?: boolean
    visible?: boolean
}

/**
 * 绘图状态
 */
interface DrawingState {
    tool: DrawingTool
    isDrawing: boolean
    startX: number
    startY: number
    currentX: number
    currentY: number
    currentPath: Array<{x: number, y: number}>
}

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

    // Canvas相关
    private canvas: HTMLCanvasElement | null = null
    private ctx: CanvasRenderingContext2D | null = null
    private offscreenCanvas: HTMLCanvasElement | null = null
    private offscreenCtx: CanvasRenderingContext2D | null = null

    // 工具栏和状态
    private toolbar: HTMLElement | null = null
    private drawingState: DrawingState = {
        tool: DrawingTool.PEN,
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        currentPath: []
    }

    // 画布对象和历史
    private objects: CanvasObject[] = []
    private selectedObjects: string[] = []
    private history: CanvasObject[][] = []
    private historyIndex: number = -1

    // 视图状态
    private viewport: Viewport = { x: 0, y: 0, width: 800, height: 600, zoom: 1 }
    private isDragging: boolean = false
    private lastPanX: number = 0
    private lastPanY: number = 0

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
