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
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, CanvasNode, CanvasData, Point } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'

/**
 * Fabric.js对象映射
 */
interface FabricObjectMap {
    [nodeId: string]: any // Fabric.js对象
}

/**
 * Canvas视图适配器实现
 */
export class CanvasViewAdapter implements ICanvasViewAdapter {
    public type: EditorType.CANVAS = EditorType.CANVAS
    public sceneTemplate: SceneTemplate
    
    // 核心属性
    private element: HTMLElement | null = null
    private canvas: any = null // Fabric.js画布实例
    private fabric: any = null // Fabric.js库引用
    private currentTool: CanvasTool = 'select'
    private eventCallbacks: Map<string, Function[]> = new Map()
    private isDestroyed = false
    
    // 状态管理
    private fabricObjectMap: FabricObjectMap = {} // 节点ID到Fabric对象的映射
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

    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
    }

    /**
     * 创建适配器
     * 初始化Fabric.js画布和相关配置
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        this.element = element

        // 动态导入Fabric.js
        const fabricModule = await import('fabric')
        this.fabric = fabricModule
        
        // 创建Canvas元素
        const canvasElement = document.createElement('canvas')
        canvasElement.width = element.clientWidth || 800
        canvasElement.height = element.clientHeight || 600
        element.appendChild(canvasElement)

        // 初始化Fabric.js画布
        this.canvas = new this.fabric.Canvas(canvasElement, {
            width: canvasElement.width,
            height: canvasElement.height,
            backgroundColor: '#ffffff',
            selection: true,
            preserveObjectStacking: true
        })

        // 设置画布事件监听
        this.setupCanvasEvents()
        
        // 设置主题样式
        this.applyTheme(options?.theme || 'auto')
        
        // 初始化工具
        this.selectTool('select')
    }

    /**
     * 销毁适配器
     * 清理Fabric.js画布和事件监听
     */
    destroy(): void {
        if (this.isDestroyed) return

        // 清理Fabric.js画布
        if (this.canvas) {
            this.canvas.dispose()
            this.canvas = null
        }

        // 清理DOM元素
        if (this.element) {
            this.element.innerHTML = ''
        }

        // 清理状态
        this.element = null
        this.fabricObjectMap = {}
        this.eventCallbacks.clear()
        this.isDestroyed = true
    }

    /**
     * 渲染AST
     * 将AST节点转换为Fabric.js对象并渲染到画布
     */
    render(ast: DocumentAST): void {
        if (!this.canvas || this.isDestroyed) return

        // 清空画布
        this.canvas.clear()
        this.fabricObjectMap = {}

        // 异步渲染根节点及其子节点
        this.renderNode(ast.root).then(() => {
            // 刷新画布
            this.canvas.renderAll()
        }).catch(error => {
            console.error('Error rendering AST:', error)
        })
    }

    /**
     * 更新AST
     */
    update(ast: DocumentAST): void {
        this.render(ast)
    }

    /**
     * 更新节点
     * 更新特定节点的Fabric.js对象
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.canvas || this.isDestroyed) return

        const fabricObject = this.fabricObjectMap[nodeId]
        if (fabricObject) {
            // 更新Fabric对象属性
            this.updateFabricObject(fabricObject, node)
            this.canvas.renderAll()
        }
    }

    /**
     * 删除节点
     * 从画布中删除对应的Fabric.js对象
     */
    removeNode(nodeId: string): void {
        if (!this.canvas || this.isDestroyed) return

        const fabricObject = this.fabricObjectMap[nodeId]
        if (fabricObject) {
            this.canvas.remove(fabricObject)
            delete this.fabricObjectMap[nodeId]
            this.canvas.renderAll()
        }
    }

    /**
     * 添加节点
     * 将新节点转换为Fabric.js对象并添加到画布
     */
    addNode(node: ASTNode, _parentId?: string, _index?: number): void {
        if (!this.canvas || this.isDestroyed) return

        const fabricObject = this.createFabricObject(node)
        if (fabricObject) {
            this.canvas.add(fabricObject)
            this.fabricObjectMap[node.id] = fabricObject
            this.canvas.renderAll()
        }
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.canvas || this.isDestroyed) return

        // 清除当前选择
        this.canvas.discardActiveObject()
        
        if (selection.nodeIds.length > 0) {
            // 选择指定节点
            const objects = selection.nodeIds
                .map(id => this.fabricObjectMap[id])
                .filter(obj => obj)
            
            if (objects.length > 0) {
                const activeGroup = new this.fabric.ActiveSelection(objects, { canvas: this.canvas })
                this.canvas.setActiveObject(activeGroup)
            }
        }
        
        this.canvas.renderAll()
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.canvas || this.isDestroyed) {
            return { nodeIds: [], type: 'node' }
        }

        const activeObject = this.canvas.getActiveObject()
        if (activeObject) {
            const nodeIds: string[] = []
            
            if (activeObject.type === 'activeSelection') {
                // 多选
                activeObject.getObjects().forEach((obj: any) => {
                    const nodeId = this.getNodeIdFromFabricObject(obj)
                    if (nodeId) nodeIds.push(nodeId)
                })
            } else {
                // 单选
                const nodeId = this.getNodeIdFromFabricObject(activeObject)
                if (nodeId) nodeIds.push(nodeId)
            }
            
            return { nodeIds, type: 'node' }
        }
        
        return { nodeIds: [], type: 'node' }
    }

    /**
     * 设置焦点
     */
    focus(): void {
        if (this.canvas && !this.isDestroyed) {
            this.canvas.setActive()
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        if (this.canvas && !this.isDestroyed) {
            this.canvas.deactivate()
        }
    }

    /**
     * 是否获得焦点
     */
    isFocused(): boolean {
        return this.canvas ? this.canvas.isActive : false
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
        this.currentTool = tool
        
        if (!this.canvas || this.isDestroyed) return

        // 重置画布状态
        this.canvas.isDrawingMode = false
        this.canvas.selection = true
        
        // 清除之前的事件监听器
        this.clearToolEventListeners()
        
        switch (tool) {
            case 'select':
                this.canvas.defaultCursor = 'default'
                this.canvas.selection = true
                break
            case 'draw':
                this.canvas.isDrawingMode = true
                this.canvas.freeDrawingBrush.width = 2
                this.canvas.freeDrawingBrush.color = this.defaultStyles.strokeColor
                break
            case 'shape':
                this.canvas.defaultCursor = 'crosshair'
                this.setupShapeTool()
                break
            case 'text':
                this.canvas.defaultCursor = 'text'
                this.setupTextTool()
                break
            case 'image':
                this.canvas.defaultCursor = 'crosshair'
                this.setupImageTool()
                break
            case 'connector':
                this.canvas.defaultCursor = 'crosshair'
                this.setupConnectorTool()
                break
        }
    }

    /**
     * 清空画布
     */
    clearCanvas(): void {
        if (!this.canvas || this.isDestroyed) return

        this.canvas.clear()
        this.fabricObjectMap = {}
        this.canvas.renderAll()
    }

    /**
     * 导出图片
     */
    exportImage(format: 'png' | 'jpg' | 'svg'): string {
        if (!this.canvas || this.isDestroyed) return ''

        switch (format) {
            case 'png':
                return this.canvas.toDataURL({ format: 'png' })
            case 'jpg':
                return this.canvas.toDataURL({ format: 'jpeg' })
            case 'svg':
                return this.canvas.toSVG()
            default:
                return ''
        }
    }

    // 视图控制方法

    /**
     * 滚动到节点
     */
    scrollToNode(nodeId: string): void {
        if (!this.canvas || this.isDestroyed) return

        const fabricObject = this.fabricObjectMap[nodeId]
        if (fabricObject) {
            this.canvas.setViewportTransform([1, 0, 0, 1, 
                -fabricObject.left + this.canvas.width / 2, 
                -fabricObject.top + this.canvas.height / 2])
            this.canvas.renderAll()
        }
    }

    /**
     * 放大
     */
    zoomIn(): void {
        if (!this.canvas || this.isDestroyed) return

        const zoom = this.canvas.getZoom()
        this.canvas.setZoom(zoom * 1.1)
        this.canvas.renderAll()
    }

    /**
     * 缩小
     */
    zoomOut(): void {
        if (!this.canvas || this.isDestroyed) return

        const zoom = this.canvas.getZoom()
        this.canvas.setZoom(zoom / 1.1)
        this.canvas.renderAll()
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        if (!this.canvas || this.isDestroyed) return

        this.canvas.setZoom(1)
        this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
        this.canvas.renderAll()
    }

    /**
     * 适应视图
     */
    fitToView(): void {
        if (!this.canvas || this.isDestroyed) return

        const objects = this.canvas.getObjects()
        if (objects.length === 0) return

        // 计算所有对象的边界
        const bounds = objects.reduce((acc: any, obj: any) => {
            const objBounds = obj.getBoundingRect()
            return {
                left: Math.min(acc.left, objBounds.left),
                top: Math.min(acc.top, objBounds.top),
                right: Math.max(acc.right, objBounds.left + objBounds.width),
                bottom: Math.max(acc.bottom, objBounds.top + objBounds.height)
            }
        }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })

        // 计算缩放比例
        const canvasWidth = this.canvas.width
        const canvasHeight = this.canvas.height
        const contentWidth = bounds.right - bounds.left
        const contentHeight = bounds.bottom - bounds.top
        
        const scaleX = canvasWidth / contentWidth
        const scaleY = canvasHeight / contentHeight
        const scale = Math.min(scaleX, scaleY, 1) * 0.9 // 留10%边距

        // 应用变换
        this.canvas.setZoom(scale)
        this.canvas.setViewportTransform([scale, 0, 0, scale, 
            (canvasWidth - contentWidth * scale) / 2 - bounds.left * scale,
            (canvasHeight - contentHeight * scale) / 2 - bounds.top * scale])
        this.canvas.renderAll()
    }

    /**
     * 获取视口
     */
    getViewport(): Viewport {
        if (!this.canvas || this.isDestroyed) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const vpt = this.canvas.viewportTransform
        return {
            x: vpt[4],
            y: vpt[5],
            width: this.canvas.width,
            height: this.canvas.height,
            zoom: this.canvas.getZoom()
        }
    }

    /**
     * 设置视口
     */
    setViewport(viewport: Viewport): void {
        if (!this.canvas || this.isDestroyed) return

        this.canvas.setZoom(viewport.zoom)
        this.canvas.setViewportTransform([viewport.zoom, 0, 0, viewport.zoom, viewport.x, viewport.y])
        this.canvas.renderAll()
    }

    // 事件监听方法

    onNodeClick(callback: (nodeId: string, event: MouseEvent) => void): void {
        this.addEventListener('nodeClick', callback)
    }

    onNodeDoubleClick(callback: (nodeId: string, event: MouseEvent) => void): void {
        this.addEventListener('nodeDoubleClick', callback)
    }

    onSelectionChange(callback: (selection: Selection) => void): void {
        this.addEventListener('selectionChange', callback)
    }

    onViewChange(callback: (viewData: any) => void): void {
        this.addEventListener('viewChange', callback)
    }

    onFocus(callback: () => void): void {
        this.addEventListener('focus', callback)
    }

    onBlur(callback: () => void): void {
        this.addEventListener('blur', callback)
    }

    onDraw(callback: (path: { x: number; y: number }[]) => void): void {
        this.addEventListener('draw', callback)
    }

    onShapeResize(callback: (nodeId: string, size: { width: number; height: number }) => void): void {
        this.addEventListener('shapeResize', callback)
    }

    // 私有方法

    /**
     * 设置画布事件监听
     */
    private setupCanvasEvents(): void {
        if (!this.canvas) return

        // 先清除所有事件监听器，避免重复绑定
        this.canvas.off('selection:created')
        this.canvas.off('selection:updated')
        this.canvas.off('selection:cleared')
        this.canvas.off('object:modified')
        this.canvas.off('object:moving')
        this.canvas.off('object:scaling')
        this.canvas.off('mouse:down')
        this.canvas.off('mouse:up')
        this.canvas.off('path:created')

        // 对象选择事件
        this.canvas.on('selection:created', () => {
            this.handleSelectionChange()
        })

        this.canvas.on('selection:updated', () => {
            this.handleSelectionChange()
        })

        this.canvas.on('selection:cleared', () => {
            this.handleSelectionChange()
        })

        // 对象修改事件
        this.canvas.on('object:modified', (e: any) => {
            this.handleObjectModified(e)
        })

        // 对象移动事件
        this.canvas.on('object:moving', (e: any) => {
            this.handleObjectMoving(e)
        })

        // 对象缩放事件
        this.canvas.on('object:scaling', (e: any) => {
            this.handleObjectScaling(e)
        })

        // 鼠标事件
        this.canvas.on('mouse:down', (e: any) => {
            this.handleMouseDown(e)
        })

        this.canvas.on('mouse:up', (e: any) => {
            this.handleMouseUp(e)
        })

        // 绘制事件
        this.canvas.on('path:created', (e: any) => {
            this.handlePathCreated(e)
        })
    }

    /**
     * 渲染节点
     */
    private async renderNode(node: ASTNode): Promise<void> {
        const fabricObject = await this.createFabricObject(node)
        if (fabricObject) {
            this.canvas.add(fabricObject)
            this.fabricObjectMap[node.id] = fabricObject
        }

        // 递归渲染子节点
        if (node.children) {
            for (const child of node.children) {
                await this.renderNode(child)
            }
        }
    }

    /**
     * 创建Fabric.js对象
     */
    private async createFabricObject(node: ASTNode): Promise<any> {
        if (!this.canvas || !this.fabric) return null

        const canvasData = (node as CanvasNode).canvasData || {}

        switch (node.type) {
            case 'shape':
                return this.createShapeObject(node, canvasData)
            case 'text':
                return this.createTextObject(node, canvasData)
            case 'image':
                return await this.createImageObject(node, canvasData)
            case 'path':
                return this.createPathObject(node, canvasData)
            case 'connector':
                return this.createConnectorObject(node, canvasData)
            default:
                return null
        }
    }

    /**
     * 创建形状对象
     */
    private createShapeObject(node: ASTNode, canvasData: CanvasData): any {
        if (!this.fabric) return null
        
        const shapeType = canvasData.shapeType || 'rectangle'
        const position = node.position || { x: 0, y: 0 }
        const width = position.width || 100
        const height = position.height || 100

        let shape: any

        switch (shapeType) {
            case 'rectangle':
                shape = new this.fabric.Rect({
                    left: position.x,
                    top: position.y,
                    width,
                    height,
                    fill: canvasData.fillColor || this.defaultStyles.fillColor,
                    stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                    strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
                })
                break
            case 'circle':
                shape = new this.fabric.Circle({
                    left: position.x,
                    top: position.y,
                    radius: Math.min(width, height) / 2,
                    fill: canvasData.fillColor || this.defaultStyles.fillColor,
                    stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                    strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
                })
                break
            case 'triangle':
                shape = new this.fabric.Triangle({
                    left: position.x,
                    top: position.y,
                    width,
                    height,
                    fill: canvasData.fillColor || this.defaultStyles.fillColor,
                    stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
                    strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
                })
                break
            default:
                return null
        }

        // 设置节点ID
        shape.nodeId = node.id
        return shape
    }

    /**
     * 创建文本对象
     */
    private createTextObject(node: ASTNode, canvasData: CanvasData): any {
        if (!this.fabric) return null
        
        const position = node.position || { x: 0, y: 0 }
        const text = canvasData.text || ''

        const textObject = new this.fabric.Text(text, {
            left: position.x,
            top: position.y,
            fontSize: canvasData.fontSize || this.defaultStyles.fontSize,
            fontFamily: canvasData.fontFamily || this.defaultStyles.fontFamily,
            fill: canvasData.fillColor || this.defaultStyles.strokeColor
        })

        textObject.nodeId = node.id
        return textObject
    }

    /**
     * 创建图片对象
     */
    private createImageObject(node: ASTNode, canvasData: CanvasData): any {
        if (!this.fabric) return null
        
        const position = node.position || { x: 0, y: 0 }
        const src = canvasData.src || ''

        return new Promise((resolve) => {
            this.fabric.Image.fromURL(src, (img: any) => {
                img.set({
                    left: position.x,
                    top: position.y,
                    nodeId: node.id
                })
                resolve(img)
            })
        })
    }

    /**
     * 创建路径对象
     */
    private createPathObject(node: ASTNode, canvasData: CanvasData): any {
        if (!this.fabric) return null
        
        const points = canvasData.points || []
        
        if (points.length < 2) return null

        const path = new this.fabric.Path(this.pointsToPath(points), {
            fill: 'transparent',
            stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
            strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth
        })

        path.nodeId = node.id
        return path
    }

    /**
     * 创建连接线对象
     */
    private createConnectorObject(node: ASTNode, canvasData: CanvasData): any {
        if (!this.fabric) return null
        
        const points = canvasData.points || []
        
        if (points.length < 2) return null

        const line = new this.fabric.Line(points, {
            stroke: canvasData.strokeColor || this.defaultStyles.strokeColor,
            strokeWidth: canvasData.strokeWidth || this.defaultStyles.strokeWidth,
            selectable: true
        })

        line.nodeId = node.id
        return line
    }

    /**
     * 更新Fabric对象
     */
    private updateFabricObject(fabricObject: any, node: ASTNode): void {
        const canvasData = (node as CanvasNode).canvasData || {}
        const position = node.position || { x: 0, y: 0 }

        // 更新位置
        fabricObject.set({
            left: position.x,
            top: position.y
        })

        // 更新尺寸
        if (position.width !== undefined) {
            fabricObject.set('width', position.width)
        }
        if (position.height !== undefined) {
            fabricObject.set('height', position.height)
        }

        // 更新样式
        if (canvasData.fillColor) {
            fabricObject.set('fill', canvasData.fillColor)
        }
        if (canvasData.strokeColor) {
            fabricObject.set('stroke', canvasData.strokeColor)
        }
        if (canvasData.strokeWidth) {
            fabricObject.set('strokeWidth', canvasData.strokeWidth)
        }

        // 更新文本内容
        if (node.type === 'text' && canvasData.text) {
            fabricObject.set('text', canvasData.text)
        }
    }

    /**
     * 从Fabric对象获取节点ID
     */
    private getNodeIdFromFabricObject(fabricObject: any): string | null {
        return fabricObject.nodeId || null
    }

    /**
     * 将点数组转换为路径字符串
     */
    private pointsToPath(points: Point[]): string {
        if (points.length === 0) return ''
        
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

        this.canvas.on('mouse:down', (e: any) => {
            if (this.currentTool === 'shape') {
                const pointer = this.canvas.getPointer(e.e)
                this.createShapeAtPosition(pointer)
            }
        })
    }

    /**
     * 设置文本工具
     */
    private setupTextTool(): void {
        if (!this.canvas) return

        this.canvas.on('mouse:down', (e: any) => {
            if (this.currentTool === 'text') {
                const pointer = this.canvas.getPointer(e.e)
                this.createTextAtPosition(pointer)
            }
        })
    }

    /**
     * 设置图片工具
     */
    private setupImageTool(): void {
        if (!this.canvas) return

        // 创建文件输入
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e: any) => {
            const file = e.target.files[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (e: any) => {
                    this.addImageFromUrl(e.target.result)
                }
                reader.readAsDataURL(file)
            }
        }
        input.click()
    }

    /**
     * 设置连接线工具
     */
    private setupConnectorTool(): void {
        if (!this.canvas) return

        this.isDrawing = false
        this.drawingPath = []

        this.canvas.on('mouse:down', (e: any) => {
            if (this.currentTool === 'connector') {
                this.isDrawing = true
                const pointer = this.canvas.getPointer(e.e)
                this.drawingPath = [pointer]
            }
        })

        this.canvas.on('mouse:move', (e: any) => {
            if (this.isDrawing && this.currentTool === 'connector') {
                const pointer = this.canvas.getPointer(e.e)
                this.drawingPath = [this.drawingPath[0], pointer]
                this.updateDrawingPath()
            }
        })

        this.canvas.on('mouse:up', () => {
            if (this.isDrawing && this.currentTool === 'connector') {
                this.isDrawing = false
                this.finalizeDrawingPath()
            }
        })
    }

    /**
     * 在指定位置创建形状
     */
    private createShapeAtPosition(pointer: any): void {
        const shapeNode: CanvasNode = {
            id: `shape_${Date.now()}`,
            type: 'shape',
            position: { x: pointer.x, y: pointer.y, width: 100, height: 100 },
            canvasData: {
                shapeType: 'rectangle',
                fillColor: this.defaultStyles.fillColor,
                strokeColor: this.defaultStyles.strokeColor,
                strokeWidth: this.defaultStyles.strokeWidth
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        this.addNode(shapeNode)
    }

    /**
     * 在指定位置创建文本
     */
    private createTextAtPosition(pointer: any): void {
        const textNode: CanvasNode = {
            id: `text_${Date.now()}`,
            type: 'text',
            position: { x: pointer.x, y: pointer.y },
            canvasData: {
                text: '双击编辑文本',
                fontSize: this.defaultStyles.fontSize,
                fontFamily: this.defaultStyles.fontFamily,
                fillColor: this.defaultStyles.strokeColor
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        this.addNode(textNode)
    }

    /**
     * 从URL添加图片
     */
    private addImageFromUrl(url: string): void {
        const imageNode: CanvasNode = {
            id: `image_${Date.now()}`,
            type: 'image',
            position: { x: 100, y: 100 },
            canvasData: {
                src: url
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        this.addNode(imageNode)
    }

    /**
     * 更新绘制路径
     */
    private updateDrawingPath(): void {
        if (!this.canvas || this.drawingPath.length < 2) return

        // 移除之前的临时路径
        this.canvas.getObjects().forEach((obj: any) => {
            if (obj.isTemporaryPath) {
                this.canvas.remove(obj)
            }
        })

        // 创建新的临时路径
        if (!this.fabric) return
        
        const path = new this.fabric.Path(this.pointsToPath(this.drawingPath), {
            stroke: this.defaultStyles.strokeColor,
            strokeWidth: this.defaultStyles.strokeWidth,
            fill: 'transparent',
            selectable: false,
            isTemporaryPath: true
        })

        this.canvas.add(path)
        this.canvas.renderAll()
    }

    /**
     * 完成绘制路径
     */
    private finalizeDrawingPath(): void {
        if (!this.canvas || this.drawingPath.length < 2) return

        // 移除临时路径
        this.canvas.getObjects().forEach((obj: any) => {
            if (obj.isTemporaryPath) {
                this.canvas.remove(obj)
            }
        })

        // 创建最终的连接线节点
        const connectorNode: CanvasNode = {
            id: `connector_${Date.now()}`,
            type: 'connector',
            position: { x: 0, y: 0 },
            canvasData: {
                points: this.drawingPath,
                strokeColor: this.defaultStyles.strokeColor,
                strokeWidth: this.defaultStyles.strokeWidth
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        this.addNode(connectorNode)
        this.drawingPath = []
    }

    /**
     * 处理选择变化
     */
    private handleSelectionChange(): void {
        const selection = this.getSelection()
        this.triggerEvent('selectionChange', selection)
        
        // 触发视图变化事件
        this.triggerEvent('viewChange', {
            selection,
            viewport: this.getViewport()
        })
    }

    /**
     * 处理对象修改
     */
    private handleObjectModified(e: any): void {
        const fabricObject = e.target
        const nodeId = this.getNodeIdFromFabricObject(fabricObject)
        
        if (nodeId) {
            // 更新节点位置和尺寸
            const updates: Partial<ASTNode> = {
                position: {
                    x: fabricObject.left,
                    y: fabricObject.top,
                    width: fabricObject.width * fabricObject.scaleX,
                    height: fabricObject.height * fabricObject.scaleY,
                    rotation: fabricObject.angle
                }
            }

            // 触发节点更新事件
            this.triggerEvent('nodeUpdate', { nodeId, updates })
        }
    }

    /**
     * 处理对象移动
     */
    private handleObjectMoving(e: any): void {
        const fabricObject = e.target
        const nodeId = this.getNodeIdFromFabricObject(fabricObject)
        
        if (nodeId) {
            // 触发节点移动事件
            this.triggerEvent('nodeMove', { 
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
            const size = {
                width: fabricObject.width * fabricObject.scaleX,
                height: fabricObject.height * fabricObject.scaleY
            }
            
            this.triggerEvent('shapeResize', { nodeId, size })
        }
    }

    /**
     * 处理鼠标按下
     */
    private handleMouseDown(e: any): void {
        const fabricObject = e.target
        if (fabricObject) {
            const nodeId = this.getNodeIdFromFabricObject(fabricObject)
            if (nodeId) {
                const currentTime = Date.now()
                
                // 检查是否为双击
                if (currentTime - this.lastClickTime < 300) {
                    // 双击事件
                    this.triggerEvent('nodeDoubleClick', nodeId, e.e)
                    this.lastClickTime = 0
                } else {
                    // 单击事件
                    this.triggerEvent('nodeClick', nodeId, e.e)
                    this.lastClickTime = currentTime
                }
            }
        }
    }

    /**
     * 处理鼠标抬起
     */
    private handleMouseUp(e: any): void {
        // 鼠标抬起事件主要用于处理拖拽结束等
        const fabricObject = e.target
        if (fabricObject) {
            const nodeId = this.getNodeIdFromFabricObject(fabricObject)
            if (nodeId) {
                // 可以在这里处理拖拽结束等事件
            }
        }
    }

    /**
     * 处理路径创建
     */
    private handlePathCreated(e: any): void {
        const path = e.path
        const points: Point[] = []
        
        // 从Fabric.js路径对象提取点
        if (path.path) {
            path.path.forEach((command: any) => {
                if (command[0] === 'M' || command[0] === 'L') {
                    points.push({ x: command[1], y: command[2] })
                }
            })
        }

        if (points.length > 0) {
            this.triggerEvent('draw', points)
        }
    }

    /**
     * 添加事件监听器
     */
    private addEventListener(event: string, callback: Function): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, [])
        }
        this.eventCallbacks.get(event)!.push(callback)
    }

    /**
     * 触发事件
     */
    private triggerEvent(event: string, ...args: any[]): void {
        const callbacks = this.eventCallbacks.get(event)
        if (callbacks) {
            callbacks.forEach(callback => callback(...args))
        }
    }

    /**
     * 应用主题样式
     */
    private applyTheme(theme: EditorTheme): void {
        if (!this.element) return

        const themeClass = theme === 'auto' ? 'theme-auto' : `theme-${theme}`
        this.element.classList.add(themeClass)

        // 根据主题调整默认样式
        if (theme === 'dark') {
            this.defaultStyles = {
                ...this.defaultStyles,
                fillColor: '#2d2d2d',
                strokeColor: '#ffffff',
                strokeWidth: 2
            }
        } else {
            this.defaultStyles = {
                ...this.defaultStyles,
                fillColor: '#ffffff',
                strokeColor: '#000000',
                strokeWidth: 2
            }
        }
    }

    /**
     * 获取画布统计信息
     */
    public getCanvasStats(): any {
        if (!this.canvas) return {}

        const objects = this.canvas.getObjects()
        const stats = {
            totalObjects: objects.length,
            shapes: 0,
            texts: 0,
            images: 0,
            paths: 0,
            connectors: 0
        }

        objects.forEach((obj: any) => {
            switch (obj.type) {
                case 'rect':
                case 'circle':
                case 'triangle':
                    stats.shapes++
                    break
                case 'text':
                    stats.texts++
                    break
                case 'image':
                    stats.images++
                    break
                case 'path':
                    stats.paths++
                    break
                case 'line':
                    stats.connectors++
                    break
            }
        })

        return stats
    }

    /**
     * 设置画布背景
     */
    public setBackground(color: string): void {
        if (!this.canvas) return
        this.canvas.setBackgroundColor(color, () => {
            this.canvas.renderAll()
        })
    }

    /**
     * 获取画布背景
     */
    public getBackground(): string {
        return this.canvas ? this.canvas.backgroundColor : '#ffffff'
    }

    /**
     * 设置网格
     */
    public setGrid(show: boolean, size: number = 20): void {
        if (!this.canvas) return

        if (show) {
            // 创建网格背景
            const gridSize = size
            const canvasWidth = this.canvas.width
            const canvasHeight = this.canvas.height

            // 移除现有网格
            this.canvas.getObjects().forEach((obj: any) => {
                if (obj.isGrid) {
                    this.canvas.remove(obj)
                }
            })

            // 创建新的网格线
            if (!this.fabric) return
            
            for (let i = 0; i <= canvasWidth; i += gridSize) {
                const line = new this.fabric.Line([i, 0, i, canvasHeight], {
                    stroke: '#e0e0e0',
                    strokeWidth: 1,
                    selectable: false,
                    evented: false,
                    isGrid: true
                })
                this.canvas.add(line)
            }

            for (let i = 0; i <= canvasHeight; i += gridSize) {
                const line = new this.fabric.Line([0, i, canvasWidth, i], {
                    stroke: '#e0e0e0',
                    strokeWidth: 1,
                    selectable: false,
                    evented: false,
                    isGrid: true
                })
                this.canvas.add(line)
            }
        } else {
            // 移除网格
            this.canvas.getObjects().forEach((obj: any) => {
                if (obj.isGrid) {
                    this.canvas.remove(obj)
                }
            })
        }

        this.canvas.renderAll()
    }

    /**
     * 清除工具事件监听器
     */
    private clearToolEventListeners(): void {
        if (!this.canvas) return

        // 清除特定工具的事件监听器
        this.canvas.off('mouse:down')
        this.canvas.off('mouse:move')
        this.canvas.off('mouse:up')
    }

    /**
     * 对齐到网格
     */
    public snapToGrid(enabled: boolean, gridSize: number = 20): void {
        if (!this.canvas) return

        if (enabled) {
            this.canvas.on('object:moving', (e: any) => {
                const obj = e.target
                obj.set({
                    left: Math.round(obj.left / gridSize) * gridSize,
                    top: Math.round(obj.top / gridSize) * gridSize
                })
            })
        } else {
            this.canvas.off('object:moving')
        }
    }

    /**
     * 调整画布大小
     */
    public resize(width: number, height: number): void {
        if (!this.canvas) return

        this.canvas.setWidth(width)
        this.canvas.setHeight(height)
        this.canvas.renderAll()
    }

    /**
     * 获取当前工具
     */
    public getCurrentTool(): CanvasTool {
        return this.currentTool
    }

    /**
     * 设置默认样式
     */
    public setDefaultStyles(styles: Partial<typeof this.defaultStyles>): void {
        this.defaultStyles = { ...this.defaultStyles, ...styles }
    }

    /**
     * 获取默认样式
     */
    public getDefaultStyles(): typeof this.defaultStyles {
        return { ...this.defaultStyles }
    }
}