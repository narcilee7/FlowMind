/**
 * Canvas视图适配器
 * 基于Fabric.js实现，提供完整的白板绘图功能
 * 
 * 架构说明：
 * 1. 使用Fabric.js作为底层绘图引擎
 * 2. AST作为数据源，Canvas对象作为视图层
 * 3. 支持多种Canvas工具：选择、绘制、形状、文本、图片、连接线
 * 4. 完整的事件系统，支持选择、拖拽、缩放等交互
 * 5. 支持导出为多种格式
 */

import { ViewAdapterOptions, CanvasViewAdapter as ICanvasViewAdapter, CanvasTool, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, CanvasNode, CanvasData, Point } from '@/components/Editor/types/EditorAST'
import { BaseViewAdapter } from './BaseViewAdapter'
import { traverse } from '@/components/Editor/utils/ASTUtils'

/**
 * Fabric.js类型定义
 */
export interface FabricCanvas {
    // 添加对象
    add: (object: any) => void
    // 移除对象
    remove: (object: any) => void
    // 获取所有对象
    getObjects: () => any[]
    getActiveObject: () => any
    getActiveObjects: () => any[]
    // 设置活动对象
    setActiveObject: (object: any) => void
    // 设置活动对象
    setActiveObjects: (objects: any[]) => void
    // 清空
    clear: () => void
    // 渲染所有
    renderAll: () => void
    // 设置缩放
    setZoom: (zoom: number) => void
    // 获取缩放
    getZoom: () => number
    // 设置视口变换
    setViewportTransform: (transform: number[]) => void
    getViewportTransform: () => number[]
    // 绝对平移
    absolutePan: (point: { x: number; y: number }) => void
    // 相对平移
    relativePan: (point: { x: number; y: number }) => void
    // 居中对象
    centerObject: (object: any) => void
    centerObjectH: (object: any) => void
    centerObjectV: (object: any) => void
    // 事件监听
    on: (event: string, callback: Function) => void
    // 事件移除
    off: (event: string, callback: Function) => void
    // 销毁
    dispose: () => void
    // 宽度
    width: number
    height: number
    // 背景颜色
    backgroundColor: string
    // 选择
    selection: boolean
    // 保留对象堆叠
    preserveObjectStacking: boolean
    // 默认光标
    defaultCursor: string
    // 转换为数据URL
    toDataURL: (options?: any) => string
    // 转换为SVG
    toSVG: (options?: any) => string
    // 获取指针
    getPointer: (e: any) => { x: number; y: number }
}

export interface FabricObject {
    // 唯一标识
    id?: string
    // 左上角坐标
    left: number
    // 左上角坐标
    top: number
    // 宽度
    width: number
    height: number
    // 缩放X
    scaleX: number
    // 缩放Y
    scaleY: number
    // 角度
    angle: number
    // 填充颜色
    fill: string
    // 描边颜色
    stroke: string
    // 描边宽度
    strokeWidth: number
    // 可选择
    selectable: boolean
    // 事件
    evented: boolean
    // 事件监听
    on: (event: string, callback: Function) => void
    // 事件移除
    off: (event: string, callback: Function) => void
    // 设置
    set: (options: any) => void
    // 获取
    get: (property: string) => any
    // 转换为对象
    toObject: () => any
    clone: () => FabricObject
}

/**
 * Fabric.js库
 */
export interface FabricLibrary {
    // 画布
    Canvas: new (element: HTMLCanvasElement, options?: any) => FabricCanvas
    // 矩形
    Rect: new (options?: any) => FabricObject
    // 圆形
    Circle: new (options?: any) => FabricObject
    // 三角形
    Triangle: new (options?: any) => FabricObject
    // 文本
    Text: new (text: string, options?: any) => FabricObject
    // 图片
    Image: new (element: HTMLImageElement, options?: any) => FabricObject
    // 路径
    Path: new (path: string, options?: any) => FabricObject
    // 线条
    Line: new (points: number[], options?: any) => FabricObject
    // 组
    Group: new (objects: FabricObject[], options?: any) => FabricObject
}

/**
 * Fabric.js对象映射
 */
export interface FabricObjectMap {
    [nodeId: string]: FabricObject
}

/**
 * Canvas视图适配器实现
 */
export class CanvasViewAdapter extends BaseViewAdapter implements ICanvasViewAdapter {
    public readonly type: EditorType.CANVAS = EditorType.CANVAS
    
    // 核心属性
    private canvas: FabricCanvas | null = null
    private fabric: FabricLibrary | null = null
    private currentTool: CanvasTool = 'select'
    
    // 状态管理
    private fabricObjectMap: FabricObjectMap = {}
    private isDrawing = false
    private drawingPath: Point[] = []
    private lastClickTime = 0
    
    // 默认样式配置
    private defaultStyles = {
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        fontSize: 16,
        fontFamily: 'Arial'
    }

    /**
     * 创建适配器
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        if (this.isInitialized) {
            // 如果已经初始化，则抛出错误
            this.handleError(new Error('Adapter already initialized'), 'create')
            return
        }

        // 设置元素和选项
        this.element = element
        this.options = options

        try {
            // 动态导入Fabric.js库
            const fabricModule = await import('fabric')
            this.fabric = fabricModule as unknown as FabricLibrary
            
            // 创建Canvas元素，并设置宽高
            const canvasElement = document.createElement('canvas')
            canvasElement.width = element.clientWidth || 800
            canvasElement.height = element.clientHeight || 600
            element.appendChild(canvasElement)

            // 初始化Fabric.js画布，并设置背景颜色
            this.canvas = new this.fabric.Canvas(canvasElement, {
                width: canvasElement.width,
                height: canvasElement.height,
                backgroundColor: '#ffffff',
                selection: true,
                preserveObjectStacking: true
            })

            // 设置画布事件监听，包括鼠标事件、键盘事件、画布事件
            this.setupCanvasEvents()
            
            // 设置主题样式，默认使用auto主题
            this.applyTheme(options?.theme || 'auto')
            
            // 初始化工具，默认使用选择工具
            this.selectTool('select')
            
            // 设置初始化状态
            this.isInitialized = true
            // 触发视图变化事件
            this.triggerEvent('viewChange', { type: 'initialized' })

        // 捕获错误，并抛出
        } catch (error) {
            this.handleError(error as Error, 'create')
            throw error
        }
    }

    /**
     * 执行销毁逻辑
     */
    protected performDestroy(): void {
        // 如果画布存在，则销毁
        if (this.canvas) {
            // 销毁画布
            this.canvas.dispose()
            // 清空画布
            this.canvas = null
        }
        // 清空Fabric.js库
        this.fabric = null
        // 清空Fabric.js对象映射
        this.fabricObjectMap = {} as FabricObjectMap
        // 清空绘制路径
        this.drawingPath = []
    }

    /**
     * 渲染AST
     */
    render(ast: DocumentAST): void {
        if (!this.validateInitialized() || !this.canvas) return

        try {
            // 清空画布
            this.canvas.clear()
            this.fabricObjectMap = {}

            // 渲染所有节点
            const renderPromises = this.safeSync(() => {
                const promises: Promise<void>[] = []
                traverse(ast, (node) => {
                    promises.push(this.renderNode(node))
                })
                return promises
            }, 'render')

            if (renderPromises && renderPromises.length > 0) {
                // 使用Promise.allSettled，避免单个渲染失败导致整个渲染失败
                Promise.allSettled(renderPromises).then(() => {
                    this.canvas!.renderAll()
                    this.triggerEvent('viewChange', { type: 'rendered', ast })
                }).catch(error => {
                    this.handleError(error as Error, 'render')
                })
            }
        } catch (error) {
            this.handleError(error as Error, 'render')
        }
    }

    /**
     * 更新节点
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 获取Fabric.js对象
        const fabricObject = this.fabricObjectMap[nodeId]
        if (fabricObject) {
            // 更新Fabric.js对象
            this.safeSync(() => this.updateFabricObject(fabricObject, node), 'updateNode')
            // 渲染所有
            this.canvas.renderAll()
        }
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 获取Fabric.js对象
        const fabricObject = this.fabricObjectMap[nodeId]
        if (fabricObject) {
            // 移除Fabric.js对象
            this.canvas.remove(fabricObject)
            // 删除Fabric.js对象映射
            delete this.fabricObjectMap[nodeId]
            // 渲染所有
            this.canvas.renderAll()
        }
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, _parentId?: string, _index?: number): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 渲染节点
        this.safeAsync(async () => {
            await this.renderNode(node)
            // 渲染所有
            this.canvas!.renderAll()
        }, 'addNode')
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 如果选择类型为节点，并且节点ID列表不为空
        if (selection.type === 'node' && selection.nodeIds.length > 0) {
            // 获取Fabric.js对象列表
            const objects = selection.nodeIds
                .map(id => this.fabricObjectMap[id])
                // 过滤掉undefined对象
                .filter(obj => obj !== undefined)

            // 如果对象列表不为空
            if (objects.length > 0) {
                // 设置活动对象
                this.canvas.setActiveObjects(objects)
                // 渲染所有
                this.canvas.renderAll()
            }
        } else {
            this.canvas.setActiveObject(null)
            this.canvas.renderAll()
        }
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.validateInitialized() || !this.canvas) {
            return { nodeIds: [], type: 'node' }
        }

        // 获取活动对象
        const activeObjects = this.canvas.getActiveObjects()

        // 如果活动对象列表不为空
        if (activeObjects.length > 0) {
            const nodeIds = activeObjects
                .map(obj => this.getNodeIdFromFabricObject(obj))
                .filter(id => id !== null) as string[]

            // 返回选择状态
            return {
                nodeIds,
                type: 'node'
            }
        }

        return { nodeIds: [], type: 'node' }
    }

    /**
     * 设置焦点
     */
    focus(): void {
        if (this.validateInitialized() && this.canvas) {
            this.canvas.renderAll()
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        if (this.validateInitialized() && this.canvas) {
            this.canvas.setActiveObject(null)
            this.canvas.renderAll()
        }
    }

    /**
     * 是否获得焦点
     */
    isFocused(): boolean {
        if (!this.validateInitialized() || !this.canvas) return false
        return this.canvas.getActiveObject() !== null
    }

    /**
     * 滚动到节点
     */
    scrollToNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 获取Fabric.js对象
        const fabricObject = this.fabricObjectMap[nodeId]
        if (fabricObject) {
            // 居中对象
            this.canvas.centerObject(fabricObject)
            this.canvas.renderAll()
        }
    }

    /**
     * 放大视图
     */
    zoomIn(): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 获取当前缩放
        const currentZoom = this.canvas.getZoom()
        // 设置缩放: 最大为5, 按比例1.2放大, 最小为0.1
        this.canvas.setZoom(Math.min(currentZoom * 1.2, 5))
        // 渲染所有
        this.canvas.renderAll()
        this.triggerEvent('viewChange', { type: 'zoom', zoom: this.canvas.getZoom() })
    }

    /**
     * 缩小视图
     */
    zoomOut(): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 获取当前缩放
        const currentZoom = this.canvas.getZoom()
        // 设置缩放: 最小为0.1, 按比例0.8缩小
        this.canvas.setZoom(Math.max(currentZoom * 0.8, 0.1))
        // 渲染所有
        this.canvas.renderAll()
        this.triggerEvent('viewChange', { type: 'zoom', zoom: this.canvas.getZoom() })
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 设置缩放为1
        this.canvas.setZoom(1)
        // 渲染所有
        this.canvas.renderAll()
        this.triggerEvent('viewChange', { type: 'zoom', zoom: 1 })
    }

    /**
     * 适应视图
     */
    fitToView(): void {
        if (!this.validateInitialized() || !this.canvas) return

        // 获取所有Fabric.js对象
        const objects = this.canvas.getObjects()
        // 如果对象列表为空，则返回
        if (objects.length === 0) return

        // 计算所有对象的边界: 左上角和右下角
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        
        objects.forEach(obj => {
            const left = obj.left || 0
            const top = obj.top || 0
            const width = (obj.width || 0) * (obj.scaleX || 1)
            const height = (obj.height || 0) * (obj.scaleY || 1)
            
            // 更新左上角和右下角
            minX = Math.min(minX, left)
            minY = Math.min(minY, top)
            // 更新右下角
            maxX = Math.max(maxX, left + width)
            maxY = Math.max(maxY, top + height)
        })

        // 计算合适的缩放比例: 画布宽度/内容宽度, 画布高度/内容高度, 取最小值, 再乘以0.9
        const canvasWidth = this.canvas.width
        const canvasHeight = this.canvas.height
        const contentWidth = maxX - minX
        const contentHeight = maxY - minY
        
        const scaleX = canvasWidth / contentWidth
        const scaleY = canvasHeight / contentHeight
        const scale = Math.min(scaleX, scaleY, 1) * 0.9 // 留10%边距

        this.canvas.setZoom(scale)
        this.canvas.absolutePan({ x: -minX * scale, y: -minY * scale })
        this.canvas.renderAll()
    }

    /**
     * 获取视口
     */
    getViewport(): Viewport {
        if (!this.validateInitialized() || !this.canvas) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const transform = this.canvas.getViewportTransform()
        return {
            x: transform[4],
            y: transform[5],
            width: this.canvas.width,
            height: this.canvas.height,
            zoom: this.canvas.getZoom()
        }
    }

    /**
     * 设置视口
     */
    setViewport(viewport: Viewport): void {
        if (!this.validateInitialized() || !this.canvas) return

        this.canvas.setZoom(viewport.zoom)
        this.canvas.absolutePan({ x: viewport.x, y: viewport.y })
        this.canvas.renderAll()
        this.triggerEvent('viewChange', { type: 'viewport', viewport })
    }

    // Canvas特有方法
    /**
     * 添加形状
     */
    addShape(shape: ASTNode): void {
        this.addNode(shape)
    }

    /**
     * 添加图片
     */
    addImage(image: ASTNode): void {
        this.addNode(image)
    }

    /**
     * 添加文本
     */
    addText(text: ASTNode): void {
        this.addNode(text)
    }

    /**
     * 添加路径
     */
    addPath(path: ASTNode): void {
        this.addNode(path)
    }

    /**
     * 选择工具
     */
    selectTool(tool: CanvasTool): void {
        if (!this.validateInitialized() || !this.canvas) return

        this.currentTool = tool
        this.clearToolEventListeners()

        switch (tool) {
            case 'select':
                this.canvas.selection = true
                this.canvas.defaultCursor = 'default'
                break
            case 'draw':
                this.setupDrawTool()
                break
            case 'shape':
                this.setupShapeTool()
                break
            case 'text':
                this.setupTextTool()
                break
            case 'image':
                this.setupImageTool()
                break
            case 'connector':
                this.setupConnectorTool()
                break
        }

        this.triggerEvent('viewChange', { type: 'toolChanged', tool })
    }

    /**
     * 清空画布
     */
    clearCanvas(): void {
        if (!this.validateInitialized() || !this.canvas) return

        this.canvas.clear()
        this.fabricObjectMap = {}
        this.triggerEvent('viewChange', { type: 'canvasCleared' })
    }

    /**
     * 导出图片
     */
    exportImage(format: 'png' | 'jpg' | 'svg'): string {
        if (!this.validateInitialized() || !this.canvas) return ''

        try {
            switch (format) {
                case 'png':
                    return this.canvas.toDataURL({ format: 'png' })
                case 'jpg':
                    return this.canvas.toDataURL({ format: 'jpeg' })
                case 'svg':
                    return this.canvas.toSVG()
                default:
                    return this.canvas.toDataURL()
            }
        } catch (error) {
            this.handleError(error as Error, 'exportImage')
            return ''
        }
    }

    /**
     * 绘制事件
     */
    onDraw(callback: (path: { x: number; y: number }[]) => void): void {
        // 使用自定义事件处理，不继承BaseViewAdapter的事件系统
        const customEventCallbacks = (this as any).customEventCallbacks || new Map()
        if (!customEventCallbacks.has('draw')) {
            customEventCallbacks.set('draw', [])
        }
        customEventCallbacks.get('draw').push(callback)
        ;(this as any).customEventCallbacks = customEventCallbacks
    }

    /**
     * 形状调整事件
     */
    onShapeResize(callback: (nodeId: string, size: { width: number; height: number }) => void): void {
        // 使用自定义事件处理，不继承BaseViewAdapter的事件系统
        const customEventCallbacks = (this as any).customEventCallbacks || new Map()
        if (!customEventCallbacks.has('shapeResize')) {
            customEventCallbacks.set('shapeResize', [])
        }
        customEventCallbacks.get('shapeResize').push(callback)
        ;(this as any).customEventCallbacks = customEventCallbacks
    }

    // 私有方法
    /**
     * 设置画布事件监听
     */
    private setupCanvasEvents(): void {
        if (!this.canvas) return

        this.canvas.on('selection:created', () => {
            this.handleSelectionChange()
        })

        this.canvas.on('selection:updated', () => {
            this.handleSelectionChange()
        })

        this.canvas.on('selection:cleared', () => {
            this.handleSelectionChange()
        })

        this.canvas.on('object:modified', (e: any) => {
            this.handleObjectModified(e)
        })

        this.canvas.on('object:moving', (e: any) => {
            this.handleObjectMoving(e)
        })

        this.canvas.on('object:scaling', (e: any) => {
            this.handleObjectScaling(e)
        })

        this.canvas.on('mouse:down', (e: any) => {
            this.handleMouseDown(e)
        })

        this.canvas.on('mouse:up', (e: any) => {
            this.handleMouseUp(e)
        })
    }

    /**
     * 渲染节点
     */
    private async renderNode(node: ASTNode): Promise<void> {
        if (!this.canvas || !this.fabric) return

        try {
            const fabricObject = await this.createFabricObject(node)
            if (fabricObject) {
                this.canvas.add(fabricObject)
                this.fabricObjectMap[node.id] = fabricObject
            }
        } catch (error) {
            this.handleError(error as Error, `renderNode:${node.id}`)
        }
    }

    /**
     * 创建Fabric对象
     */
    private async createFabricObject(node: ASTNode): Promise<FabricObject | null> {
        if (!this.fabric) return null

        const canvasNode = node as CanvasNode
        const canvasData = canvasNode.canvasData

        if (!canvasData) return null

        let fabricObject: FabricObject | null = null

        switch (node.type) {
            case 'shape':
                fabricObject = this.createShapeObject(node, canvasData)
                break
            case 'text':
                fabricObject = this.createTextObject(node, canvasData)
                break
            case 'image':
                fabricObject = await this.createImageObject(node, canvasData)
                break
            case 'path':
                fabricObject = this.createPathObject(node, canvasData)
                break
            case 'connector':
                fabricObject = this.createConnectorObject(node, canvasData)
                break
        }

        if (fabricObject) {
            fabricObject.id = node.id
            fabricObject.set({
                left: node.position.x,
                top: node.position.y,
                fill: canvasData.fillColor || this.defaultStyles.fillColor,
                stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
            })
        }

        return fabricObject
    }

    /**
     * 创建形状对象
     */
    private createShapeObject(node: ASTNode, canvasData: CanvasData): FabricObject | null {
        if (!this.fabric) return null

        const shapeType = canvasData.shapeType || 'rectangle'
        const width = node.position.width || 100
        const height = node.position.height || 100

        switch (shapeType) {
            case 'rectangle':
                return new this.fabric.Rect({
                    width,
                    height,
                    fill: canvasData.fillColor || this.defaultStyles.fillColor,
                    stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                    strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
                })
            case 'circle':
                return new this.fabric.Circle({
                    radius: Math.min(width, height) / 2,
                    fill: canvasData.fillColor || this.defaultStyles.fillColor,
                    stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                    strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
                })
            case 'triangle':
                return new this.fabric.Triangle({
                    width,
                    height,
                    fill: canvasData.fillColor || this.defaultStyles.fillColor,
                    stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                    strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
                })
            default:
                return new this.fabric.Rect({
                    width,
                    height,
                    fill: canvasData.fillColor || this.defaultStyles.fillColor,
                    stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                    strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
                })
        }
    }

    /**
     * 创建文本对象
     */
    private createTextObject(_node: ASTNode, canvasData: CanvasData): FabricObject | null {
        if (!this.fabric) return null

        const text = canvasData.text || 'Text'
        return new this.fabric.Text(text, {
            fontSize: canvasData.fontSize || this.defaultStyles.fontSize,
            fontFamily: canvasData.fontFamily || this.defaultStyles.fontFamily,
            fill: canvasData.fillColor || this.defaultStyles.fillColor
        })
    }

    /**
     * 创建图片对象
     */
    private async createImageObject(node: ASTNode, canvasData: CanvasData): Promise<FabricObject | null> {
        if (!this.fabric) return null

        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                const fabricImage = new this.fabric!.Image(img, {
                    width: node.position.width || img.width,
                    height: node.position.height || img.height
                })
                resolve(fabricImage)
            }
            img.onerror = () => {
                resolve(null)
            }
            img.src = canvasData.src || ''
        })
    }

    /**
     * 创建路径对象
     */
    private createPathObject(_node: ASTNode, canvasData: CanvasData): FabricObject | null {
        if (!this.fabric) return null

        const path = canvasData.points ? this.pointsToPath(canvasData.points) : 'M 0 0 L 100 100'
        return new this.fabric.Path(path, {
            fill: canvasData.fillColor || this.defaultStyles.fillColor,
            stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
            strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
        })
    }

    /**
     * 创建连接线对象
     */
    private createConnectorObject(_node: ASTNode, canvasData: CanvasData): FabricObject | null {
        if (!this.fabric) return null

        const points = canvasData.points || [{ x: 0, y: 0 }, { x: 100, y: 100 }]
        const linePoints = [
            points[0].x, points[0].y,
            points[1].x, points[1].y
        ]

        return new this.fabric.Line(linePoints, {
            stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
            strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth,
            selectable: true,
            evented: true
        })
    }

    /**
     * 更新Fabric对象
     */
    private updateFabricObject(fabricObject: FabricObject, node: ASTNode): void {
        const canvasNode = node as CanvasNode
        const canvasData = canvasNode.canvasData

        if (canvasData) {
            fabricObject.set({
                left: node.position.x,
                top: node.position.y,
                width: node.position.width,
                height: node.position.height,
                fill: canvasData.fillColor || this.defaultStyles.fillColor,
                stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
            })
        }
    }

    /**
     * 从Fabric对象获取节点ID
     */
    private getNodeIdFromFabricObject(fabricObject: FabricObject): string | null {
        return fabricObject.id || null
    }

    /**
     * 将点数组转换为路径字符串
     */
    private pointsToPath(points: Point[]): string {
        if (points.length === 0) return 'M 0 0'

        let path = `M ${points[0].x} ${points[0].y}`
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`
        }
        return path
    }

    /**
     * 设置形状工具
     */
    private setupShapeTool(): void {
        if (!this.canvas) return

        this.canvas.selection = false
        this.canvas.defaultCursor = 'crosshair'

        this.canvas.on('mouse:down', (e: any) => {
            if (this.currentTool === 'shape') {
                this.createShapeAtPosition(e.pointer)
            }
        })
    }

    /**
     * 设置文本工具
     */
    private setupTextTool(): void {
        if (!this.canvas) return

        this.canvas.selection = false
        this.canvas.defaultCursor = 'text'

        this.canvas.on('mouse:down', (e: any) => {
            if (this.currentTool === 'text') {
                this.createTextAtPosition(e.pointer)
            }
        })
    }

    /**
     * 设置图片工具
     */
    private setupImageTool(): void {
        if (!this.canvas) return

        this.canvas.selection = false
        this.canvas.defaultCursor = 'crosshair'

        // 创建文件输入
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.style.display = 'none'
        document.body.appendChild(input)

        input.onchange = (e: any) => {
            const file = e.target.files[0]
            if (file) {
                const url = URL.createObjectURL(file)
                this.addImageFromUrl(url)
            }
            document.body.removeChild(input)
        }

        input.click()
    }

    /**
     * 设置连接线工具
     */
    private setupConnectorTool(): void {
        if (!this.canvas) return

        this.canvas.selection = false
        this.canvas.defaultCursor = 'crosshair'

        this.canvas.on('mouse:down', (e: any) => {
            if (this.currentTool === 'connector') {
                this.startConnector(e.pointer)
            }
        })
    }

    /**
     * 设置绘制工具
     */
    private setupDrawTool(): void {
        if (!this.canvas) return

        this.canvas.selection = false
        this.canvas.defaultCursor = 'crosshair'

        this.canvas.on('mouse:down', (e: any) => {
            if (this.currentTool === 'draw') {
                this.startDrawing(e.pointer)
            }
        })

        this.canvas.on('mouse:move', (e: any) => {
            if (this.currentTool === 'draw' && this.isDrawing) {
                this.updateDrawingPath(e.pointer)
            }
        })

        this.canvas.on('mouse:up', () => {
            if (this.currentTool === 'draw' && this.isDrawing) {
                this.finalizeDrawingPath()
            }
        })
    }

    /**
     * 在指定位置创建形状
     */
    private createShapeAtPosition(pointer: any): void {
        if (!this.fabric || !this.canvas) return

        const shape = new this.fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 100,
            height: 100,
            fill: this.defaultStyles.fillColor,
            stroke: this.defaultStyles.strokeColor,
            strokeWidth: this.defaultStyles.strokeWidth
        })

        this.canvas.add(shape)
        this.canvas.setActiveObject(shape)
        this.canvas.renderAll()
    }

    /**
     * 在指定位置创建文本
     */
    private createTextAtPosition(pointer: any): void {
        if (!this.fabric || !this.canvas) return

        const text = new this.fabric.Text('Text', {
            left: pointer.x,
            top: pointer.y,
            fontSize: this.defaultStyles.fontSize,
            fontFamily: this.defaultStyles.fontFamily,
            fill: this.defaultStyles.fillColor
        })

        this.canvas.add(text)
        this.canvas.setActiveObject(text)
        this.canvas.renderAll()
    }

    /**
     * 从URL添加图片
     */
    private addImageFromUrl(url: string): void {
        if (!this.fabric || !this.canvas) return

        const img = new Image()
        img.onload = () => {
            const fabricImage = new this.fabric!.Image(img, {
                left: 100,
                top: 100
            })
            this.canvas!.add(fabricImage)
            this.canvas!.setActiveObject(fabricImage)
            this.canvas!.renderAll()
        }
        img.src = url
    }

    /**
     * 开始绘制
     */
    private startDrawing(pointer: any): void {
        this.isDrawing = true
        this.drawingPath = [{ x: pointer.x, y: pointer.y }]
    }

    /**
     * 更新绘制路径
     */
    private updateDrawingPath(pointer: any): void {
        if (this.isDrawing) {
            this.drawingPath.push({ x: pointer.x, y: pointer.y })
        }
    }

    /**
     * 完成绘制路径
     */
    private finalizeDrawingPath(): void {
        if (!this.fabric || !this.canvas || !this.isDrawing) return

        if (this.drawingPath.length > 1) {
            const path = this.pointsToPath(this.drawingPath)
            const fabricPath = new this.fabric.Path(path, {
                fill: 'transparent',
                stroke: this.defaultStyles.strokeColor,
                strokeWidth: this.defaultStyles.strokeWidth
            })

            this.canvas.add(fabricPath)
            this.canvas.renderAll()

            // 触发自定义事件
            const customEventCallbacks = (this as any).customEventCallbacks
            if (customEventCallbacks && customEventCallbacks.has('draw')) {
                customEventCallbacks.get('draw').forEach((callback: Function) => {
                    callback(this.drawingPath)
                })
            }
        }

        this.isDrawing = false
        this.drawingPath = []
    }

    /**
     * 开始连接线
     */
    private startConnector(pointer: any): void {
        // 实现连接线创建逻辑
        console.log('Start connector at:', pointer)
    }

    /**
     * 处理选择变化
     */
    private handleSelectionChange(): void {
        const selection = this.getSelection()
        this.triggerEvent('selectionChange', selection)
    }

    /**
     * 处理对象修改
     */
    private handleObjectModified(e: any): void {
        const fabricObject = e.target
        const nodeId = this.getNodeIdFromFabricObject(fabricObject)
        
        if (nodeId) {
            // 触发自定义事件
            const customEventCallbacks = (this as any).customEventCallbacks
            if (customEventCallbacks && customEventCallbacks.has('shapeResize')) {
                customEventCallbacks.get('shapeResize').forEach((callback: Function) => {
                    callback(nodeId, {
                        width: fabricObject.width * fabricObject.scaleX,
                        height: fabricObject.height * fabricObject.scaleY
                    })
                })
            }
        }
    }

    /**
     * 处理对象移动
     */
    private handleObjectMoving(e: any): void {
        const fabricObject = e.target
        const nodeId = this.getNodeIdFromFabricObject(fabricObject)
        
        if (nodeId) {
            this.triggerEvent('viewChange', {
                type: 'objectMoving',
                nodeId,
                position: { x: fabricObject.left, y: fabricObject.top }
            })
        }
    }

    /**
     * 处理对象缩放
     */
    private handleObjectScaling(e: any): void {
        const fabricObject = e.target
        const nodeId = this.getNodeIdFromFabricObject(fabricObject)
        
        if (nodeId) {
            // 触发自定义事件
            const customEventCallbacks = (this as any).customEventCallbacks
            if (customEventCallbacks && customEventCallbacks.has('shapeResize')) {
                customEventCallbacks.get('shapeResize').forEach((callback: Function) => {
                    callback(nodeId, {
                        width: fabricObject.width * fabricObject.scaleX,
                        height: fabricObject.height * fabricObject.scaleY
                    })
                })
            }
        }
    }

    /**
     * 处理鼠标按下
     */
    private handleMouseDown(e: any): void {
        const now = Date.now()
        if (now - this.lastClickTime < 300) {
            // 双击事件
            const fabricObject = e.target
            if (fabricObject) {
                const nodeId = this.getNodeIdFromFabricObject(fabricObject)
                if (nodeId) {
                    this.triggerEvent('nodeDoubleClick', { nodeId, event: e.e })
                }
            }
        }
        this.lastClickTime = now
    }

    /**
     * 处理鼠标抬起
     */
    private handleMouseUp(e: any): void {
        const fabricObject = e.target
        if (fabricObject) {
            const nodeId = this.getNodeIdFromFabricObject(fabricObject)
            if (nodeId) {
                this.triggerEvent('nodeClick', { nodeId, event: e.e })
            }
        }
    }

    /**
     * 清除工具事件监听器
     */
    private clearToolEventListeners(): void {
        if (!this.canvas) return

        // 清除特定的事件监听器
        this.canvas.off('mouse:down', () => {})
        this.canvas.off('mouse:move', () => {})
        this.canvas.off('mouse:up', () => {})
    }

    /**
     * 获取当前工具
     */
    getCurrentTool(): CanvasTool {
        return this.currentTool
    }

    /**
     * 设置默认样式
     */
    setDefaultStyles(styles: Partial<typeof this.defaultStyles>): void {
        Object.assign(this.defaultStyles, styles)
    }

    /**
     * 获取默认样式
     */
    getDefaultStyles(): typeof this.defaultStyles {
        return { ...this.defaultStyles }
    }
}