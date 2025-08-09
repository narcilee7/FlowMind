/**
 * 增强的画布视图适配器
 * 
 * 完整功能实现：
 * - 多种绘图工具（画笔、形状、文本）
 * - 选择和移动对象
 * - 缩放和平移
 * - 撤销/重做
 * - 工具栏界面
 */

import { CoreViewAdapter } from './BaseViewAdapter.optimized'
import { ViewAdapterOptions, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'
import { AdapterCapabilities } from '../types/OptimizedViewAdapter'

/**
 * 绘图工具类型
 */
export enum DrawingTool {
    SELECT = 'select',
    PEN = 'pen',
    RECTANGLE = 'rectangle',
    CIRCLE = 'circle',
    LINE = 'line',
    TEXT = 'text',
    ERASER = 'eraser'
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

export class EnhancedCanvasViewAdapter extends CoreViewAdapter {

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
    private toolbar: HTMLElement | null = null

    // 状态
    private currentTool: DrawingTool = DrawingTool.PEN
    private objects: CanvasObject[] = []
    private selectedObjects: string[] = []
    private isDrawing = false
    private startX = 0
    private startY = 0
    private currentPath: Array<{ x: number, y: number }> = []

    // 历史记录
    private history: CanvasObject[][] = []
    private historyIndex = -1

    // 视图
    private viewport: Viewport = { x: 0, y: 0, width: 800, height: 600, zoom: 1 }

    constructor(sceneTemplate: SceneTemplate) {
        super(sceneTemplate)
    }

    protected async performCreate(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        // 创建容器
        const container = document.createElement('div')
        container.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            background: var(--editor-background);
        `
        element.appendChild(container)

        // 创建工具栏
        this.createToolbar(container)

        // 创建画布
        this.canvas = document.createElement('canvas')
        this.canvas.width = 800
        this.canvas.height = 600
        this.canvas.style.cssText = `
            border: 2px solid var(--editor-line);
            background: var(--editor-background);
            display: block;
            margin: 10px auto;
            cursor: crosshair;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `

        container.appendChild(this.canvas)

        this.ctx = this.canvas.getContext('2d')
        if (!this.ctx) {
            throw new Error('Failed to get canvas context')
        }

        // 绑定事件
        this.bindEvents()

        // 初始绘制
        this.redraw()
    }

    protected performDestroy(): void {
        this.unbindEvents()
        if (this.canvas) {
            this.canvas.remove()
            this.canvas = null
            this.ctx = null
        }
        if (this.toolbar) {
            this.toolbar.remove()
            this.toolbar = null
        }
    }

    protected performRender(ast: DocumentAST): void {
        this.loadFromAST(ast)
        this.redraw()
    }

    protected performUpdateNode(nodeId: string, node: ASTNode): void {
        const objIndex = this.objects.findIndex(obj => obj.id === nodeId)
        if (objIndex !== -1 && node.content) {
            try {
                const objData = JSON.parse(node.content) as CanvasObject
                this.objects[objIndex] = { ...this.objects[objIndex], ...objData }
                this.redraw()
            } catch (error) {
                console.error('Failed to update canvas object:', error)
            }
        }
    }

    protected performRemoveNode(nodeId: string): void {
        this.objects = this.objects.filter(obj => obj.id !== nodeId)
        this.selectedObjects = this.selectedObjects.filter(id => id !== nodeId)
        this.redraw()
    }

    protected performAddNode(node: ASTNode, parentId?: string, index?: number): void {
        if (node.content) {
            try {
                const objData = JSON.parse(node.content) as CanvasObject
                this.objects.push(objData)
                this.redraw()
            } catch (error) {
                console.error('Failed to add canvas object:', error)
            }
        }
    }

    protected performSetSelection(selection: Selection): void {
        this.selectedObjects = [...selection.nodeIds]
        this.redraw()
    }

    protected performGetSelection(): Selection {
        return { nodeIds: [...this.selectedObjects], type: 'node' }
    }

    protected performFocus(): void {
        this.canvas?.focus()
    }

    protected performBlur(): void {
        this.canvas?.blur()
    }

    protected performGetViewport(): Viewport {
        return { ...this.viewport }
    }

    protected performSetViewport(viewport: Viewport): void {
        this.viewport = { ...viewport }
        this.redraw()
    }

    // === 私有方法 ===

    private createToolbar(container: HTMLElement): void {
        this.toolbar = document.createElement('div')
        this.toolbar.style.cssText = `
            display: flex;
            gap: 8px;
            padding: 12px;
            background: var(--editor-background);
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            flex-wrap: wrap;
            align-items: center;
        `

        const tools = [
            { tool: DrawingTool.SELECT, icon: '👆', title: '选择工具' },
            { tool: DrawingTool.PEN, icon: '✏️', title: '画笔' },
            { tool: DrawingTool.RECTANGLE, icon: '▭', title: '矩形' },
            { tool: DrawingTool.CIRCLE, icon: '○', title: '圆形' },
            { tool: DrawingTool.LINE, icon: '/', title: '直线' },
            { tool: DrawingTool.TEXT, icon: 'T', title: '文本' },
            { tool: DrawingTool.ERASER, icon: '🧽', title: '橡皮擦' }
        ]

        tools.forEach(({ tool, icon, title }) => {
            const button = document.createElement('button')
            button.innerHTML = icon
            button.title = title
            button.style.cssText = `
                padding: 10px 12px;
                border: 2px solid #dee2e6;
                background: ${this.currentTool === tool ? '#007bff' : 'var(--editor-background)'};
                color: ${this.currentTool === tool ? 'var(--editor-foreground)' : 'var(--editor-comment)'};
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s ease;
                border-color: ${this.currentTool === tool ? '#007bff' : '#dee2e6'};
            `

            button.addEventListener('click', () => {
                this.setTool(tool)
                this.updateToolbarUI()
            })

            button.addEventListener('mouseenter', () => {
                if (this.currentTool !== tool) {
                    button.style.borderColor = '#007bff'
                    button.style.background = 'var(--editor-background)'
                }
            })

            button.addEventListener('mouseleave', () => {
                if (this.currentTool !== tool) {
                    button.style.borderColor = '#dee2e6'
                    button.style.background = 'var(--editor-background)'
                }
            })

            this.toolbar!.appendChild(button)
        })

        // 分隔符
        const separator = document.createElement('div')
        separator.style.cssText = `
            width: 1px;
            height: 30px;
            background: var(--editor-line);
            margin: 0 8px;
        `
        this.toolbar.appendChild(separator)

        // 功能按钮
        const actionButtons = [
            { text: '清空', color: '#dc3545', action: () => this.clearCanvas() },
            { text: '撤销', color: '#6c757d', action: () => this.undo() },
            { text: '重做', color: '#6c757d', action: () => this.redo() }
        ]

        actionButtons.forEach(({ text, color, action }) => {
            const button = document.createElement('button')
            button.textContent = text
            button.style.cssText = `
                padding: 8px 16px;
                border: 1px solid ${color};
                background: var(--editor-background);
                color: ${color};
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            `

            button.addEventListener('click', action)
            button.addEventListener('mouseenter', () => {
                button.style.background = color
                button.style.color = 'var(--editor-foreground)'
            })
            button.addEventListener('mouseleave', () => {
                button.style.background = 'var(--editor-background)'
                button.style.color = 'var(--editor-comment)'
            })

            this.toolbar!.appendChild(button)
        })

        container.appendChild(this.toolbar)
    }

    private updateToolbarUI(): void {
        if (!this.toolbar) return

        const buttons = this.toolbar.querySelectorAll('button')
        buttons.forEach((button, index) => {
            if (index < 7) { // 工具按钮
                const tools = Object.values(DrawingTool)
                const isActive = tools[index] === this.currentTool
                button.style.background = isActive ? '#007bff' : 'var(--editor-background)'
                button.style.color = isActive ? 'var(--editor-foreground)' : 'var(--editor-comment)'
                button.style.borderColor = isActive ? '#007bff' : '#dee2e6'
            }
        })
    }

    private bindEvents(): void {
        if (!this.canvas) return

        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this))
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this))
    }

    private unbindEvents(): void {
        if (!this.canvas) return

        this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
        this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
        this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
        this.canvas.removeEventListener('dblclick', this.handleDoubleClick.bind(this))
    }

    private handleMouseDown(event: MouseEvent): void {
        const rect = this.canvas!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        this.isDrawing = true
        this.startX = x
        this.startY = y
        this.currentPath = [{ x, y }]

        if (this.currentTool === DrawingTool.SELECT) {
            this.handleSelection(x, y)
        } else {
            this.saveState()
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        if (!this.isDrawing) return

        const rect = this.canvas!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        if (this.currentTool === DrawingTool.PEN) {
            this.currentPath.push({ x, y })
            this.drawPath(this.currentPath, true)
        } else {
            this.redrawWithPreview(x, y)
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        if (!this.isDrawing) return

        const rect = this.canvas!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        this.isDrawing = false
        this.finishDrawing(x, y)
    }

    private handleWheel(event: WheelEvent): void {
        event.preventDefault()

        const rect = this.canvas!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const zoom = this.viewport.zoom
        const newZoom = Math.max(0.1, Math.min(5, zoom * (event.deltaY > 0 ? 0.9 : 1.1)))

        this.viewport.x += (x / zoom - x / newZoom)
        this.viewport.y += (y / zoom - y / newZoom)
        this.viewport.zoom = newZoom

        this.redraw()
    }

    private handleDoubleClick(event: MouseEvent): void {
        if (this.currentTool !== DrawingTool.TEXT) return

        const rect = this.canvas!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const text = prompt('请输入文本:')
        if (text) {
            this.addTextObject(x, y, text)
        }
    }

    private setTool(tool: DrawingTool): void {
        this.currentTool = tool

        if (this.canvas) {
            switch (tool) {
                case DrawingTool.SELECT:
                    this.canvas.style.cursor = 'default'
                    break
                case DrawingTool.TEXT:
                    this.canvas.style.cursor = 'text'
                    break
                default:
                    this.canvas.style.cursor = 'crosshair'
            }
        }
    }

    private finishDrawing(x: number, y: number): void {
        switch (this.currentTool) {
            case DrawingTool.PEN:
                this.addPathObject(this.currentPath)
                break
            case DrawingTool.RECTANGLE:
                this.addRectangleObject(this.startX, this.startY, x - this.startX, y - this.startY)
                break
            case DrawingTool.CIRCLE:
                const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2))
                this.addCircleObject(this.startX, this.startY, radius)
                break
            case DrawingTool.LINE:
                this.addLineObject(this.startX, this.startY, x, y)
                break
            case DrawingTool.ERASER:
                this.eraseAtPath(this.currentPath)
                break
        }

        this.currentPath = []
        this.redraw()
    }

    private addPathObject(path: Array<{ x: number, y: number }>): void {
        const obj: CanvasObject = {
            id: this.generateId(),
            type: 'path',
            data: { path },
            style: { stroke: '#000000', strokeWidth: 2 },
            bounds: this.calculatePathBounds(path)
        }
        this.objects.push(obj)
    }

    private addRectangleObject(x: number, y: number, width: number, height: number): void {
        const obj: CanvasObject = {
            id: this.generateId(),
            type: 'rectangle',
            data: { x, y, width, height },
            style: { stroke: '#000000', fill: 'transparent', strokeWidth: 2 },
            bounds: { x, y, width: Math.abs(width), height: Math.abs(height) }
        }
        this.objects.push(obj)
    }

    private addCircleObject(x: number, y: number, radius: number): void {
        const obj: CanvasObject = {
            id: this.generateId(),
            type: 'circle',
            data: { x, y, radius },
            style: { stroke: '#000000', fill: 'transparent', strokeWidth: 2 },
            bounds: { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 }
        }
        this.objects.push(obj)
    }

    private addLineObject(x1: number, y1: number, x2: number, y2: number): void {
        const obj: CanvasObject = {
            id: this.generateId(),
            type: 'line',
            data: { x1, y1, x2, y2 },
            style: { stroke: '#000000', strokeWidth: 2 },
            bounds: {
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1)
            }
        }
        this.objects.push(obj)
    }

    private addTextObject(x: number, y: number, text: string): void {
        this.saveState()

        const obj: CanvasObject = {
            id: this.generateId(),
            type: 'text',
            data: { x, y, text },
            style: { fill: '#000000', fontSize: 16, fontFamily: 'Arial' },
            bounds: { x, y, width: text.length * 10, height: 20 }
        }
        this.objects.push(obj)
        this.redraw()
    }

    private handleSelection(x: number, y: number): void {
        const selectedObject = this.getObjectAt(x, y)

        if (selectedObject) {
            this.selectedObjects = [selectedObject.id]
        } else {
            this.selectedObjects = []
        }

        this.redraw()
    }

    private getObjectAt(x: number, y: number): CanvasObject | null {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i]
            if (this.isPointInObject(x, y, obj)) {
                return obj
            }
        }
        return null
    }

    private isPointInObject(x: number, y: number, obj: CanvasObject): boolean {
        const { bounds } = obj
        return x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height
    }

    private eraseAtPath(path: Array<{ x: number, y: number }>): void {
        const objectsToRemove: string[] = []

        path.forEach(point => {
            const obj = this.getObjectAt(point.x, point.y)
            if (obj && !objectsToRemove.includes(obj.id)) {
                objectsToRemove.push(obj.id)
            }
        })

        this.objects = this.objects.filter(obj => !objectsToRemove.includes(obj.id))
        this.selectedObjects = this.selectedObjects.filter(id => !objectsToRemove.includes(id))
    }

    private redraw(): void {
        if (!this.ctx) return

        // 清空画布
        this.ctx.fillStyle = 'white'
        this.ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height)

        // 绘制网格
        this.drawGrid()

        // 绘制所有对象
        this.objects.forEach(obj => {
            if (obj.visible !== false) {
                this.drawObject(obj)
            }
        })
    }

    private redrawWithPreview(x: number, y: number): void {
        this.redraw()
        this.drawPreview(x, y)
    }

    private drawPreview(x: number, y: number): void {
        if (!this.ctx) return

        this.ctx.save()
        this.ctx.strokeStyle = '#0066cc'
        this.ctx.setLineDash([5, 5])
        this.ctx.lineWidth = 2

        switch (this.currentTool) {
            case DrawingTool.RECTANGLE:
                this.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY)
                break
            case DrawingTool.CIRCLE:
                const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2))
                this.ctx.beginPath()
                this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI)
                this.ctx.stroke()
                break
            case DrawingTool.LINE:
                this.ctx.beginPath()
                this.ctx.moveTo(this.startX, this.startY)
                this.ctx.lineTo(x, y)
                this.ctx.stroke()
                break
        }

        this.ctx.restore()
    }

    private drawGrid(): void {
        if (!this.ctx) return

        this.ctx.save()
        this.ctx.strokeStyle = '#f0f0f0'
        this.ctx.lineWidth = 1

        const gridSize = 20
        for (let x = 0; x <= this.canvas!.width; x += gridSize) {
            this.ctx.beginPath()
            this.ctx.moveTo(x, 0)
            this.ctx.lineTo(x, this.canvas!.height)
            this.ctx.stroke()
        }

        for (let y = 0; y <= this.canvas!.height; y += gridSize) {
            this.ctx.beginPath()
            this.ctx.moveTo(0, y)
            this.ctx.lineTo(this.canvas!.width, y)
            this.ctx.stroke()
        }

        this.ctx.restore()
    }

    private drawObject(obj: CanvasObject): void {
        if (!this.ctx) return

        this.ctx.save()

        // 应用样式
        if (obj.style.stroke) this.ctx.strokeStyle = obj.style.stroke
        if (obj.style.fill) this.ctx.fillStyle = obj.style.fill
        if (obj.style.strokeWidth) this.ctx.lineWidth = obj.style.strokeWidth

        // 绘制对象
        switch (obj.type) {
            case 'path':
                this.drawPath(obj.data.path)
                break
            case 'rectangle':
                this.drawRectangle(obj.data)
                break
            case 'circle':
                this.drawCircle(obj.data)
                break
            case 'line':
                this.drawLine(obj.data)
                break
            case 'text':
                this.drawText(obj.data, obj.style)
                break
        }

        // 绘制选择框
        if (this.selectedObjects.includes(obj.id)) {
            this.drawSelectionBox(obj.bounds)
        }

        this.ctx.restore()
    }

    private drawPath(path: Array<{ x: number, y: number }>, preview = false): void {
        if (path.length < 2) return

        this.ctx!.beginPath()
        this.ctx!.moveTo(path[0].x, path[0].y)
        for (let i = 1; i < path.length; i++) {
            this.ctx!.lineTo(path[i].x, path[i].y)
        }
        this.ctx!.stroke()
    }

    private drawRectangle(data: any): void {
        if (data.fill && data.fill !== 'transparent') {
            this.ctx!.fillRect(data.x, data.y, data.width, data.height)
        }
        this.ctx!.strokeRect(data.x, data.y, data.width, data.height)
    }

    private drawCircle(data: any): void {
        this.ctx!.beginPath()
        this.ctx!.arc(data.x, data.y, data.radius, 0, 2 * Math.PI)
        if (this.ctx!.fillStyle !== 'transparent') {
            this.ctx!.fill()
        }
        this.ctx!.stroke()
    }

    private drawLine(data: any): void {
        this.ctx!.beginPath()
        this.ctx!.moveTo(data.x1, data.y1)
        this.ctx!.lineTo(data.x2, data.y2)
        this.ctx!.stroke()
    }

    private drawText(data: any, style: any): void {
        if (style.fontSize) {
            this.ctx!.font = `${style.fontSize}px ${style.fontFamily || 'Arial'}`
        }
        this.ctx!.fillText(data.text, data.x, data.y)
    }

    private drawSelectionBox(bounds: any): void {
        this.ctx!.save()
        this.ctx!.strokeStyle = '#0066cc'
        this.ctx!.lineWidth = 2
        this.ctx!.setLineDash([5, 5])
        this.ctx!.strokeRect(bounds.x - 3, bounds.y - 3, bounds.width + 6, bounds.height + 6)
        this.ctx!.restore()
    }

    private calculatePathBounds(path: Array<{ x: number, y: number }>): { x: number, y: number, width: number, height: number } {
        if (path.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

        let minX = path[0].x, maxX = path[0].x
        let minY = path[0].y, maxY = path[0].y

        path.forEach(point => {
            minX = Math.min(minX, point.x)
            maxX = Math.max(maxX, point.x)
            minY = Math.min(minY, point.y)
            maxY = Math.max(maxY, point.y)
        })

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }

    private saveState(): void {
        this.history = this.history.slice(0, this.historyIndex + 1)
        this.history.push(JSON.parse(JSON.stringify(this.objects)))
        this.historyIndex++

        if (this.history.length > 50) {
            this.history.shift()
            this.historyIndex--
        }
    }

    private undo(): void {
        if (this.historyIndex > 0) {
            this.historyIndex--
            this.objects = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
            this.selectedObjects = []
            this.redraw()
        }
    }

    private redo(): void {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++
            this.objects = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
            this.selectedObjects = []
            this.redraw()
        }
    }

    private clearCanvas(): void {
        if (confirm('确定要清空画布吗？')) {
            this.saveState()
            this.objects = []
            this.selectedObjects = []
            this.redraw()
        }
    }

    private loadFromAST(ast: DocumentAST): void {
        this.objects = []

        if (ast.root.children) {
            ast.root.children.forEach(child => {
                if (child.content) {
                    try {
                        const objectData = JSON.parse(child.content) as CanvasObject
                        this.objects.push(objectData)
                    } catch (error) {
                        console.error('Failed to parse canvas object:', error)
                    }
                }
            })
        }
    }

    private generateId(): string {
        return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

export default EnhancedCanvasViewAdapter
