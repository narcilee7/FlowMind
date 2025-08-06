import { EditorAdapter, EditorOptions, EditorType, PositionSection } from '../types'

interface CanvasNode {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  content: string
  style: Record<string, any>
}

interface CanvasEdge {
  id: string
  from: string
  to: string
  type: string
  style: Record<string, any>
}

export class CanvasAdapter implements EditorAdapter {
  type = EditorType.CANVAS
  private canvas: HTMLCanvasElement | null = null
  private element: HTMLElement | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  private ctx: CanvasRenderingContext2D | null = null
  private nodes: CanvasNode[] = []
  private edges: CanvasEdge[] = []
  private selectedNodes: string[] = []
  private selectedEdges: string[] = []
  private isDragging = false
  private dragStart = { x: 0, y: 0 }
  private pan = { x: 0, y: 0 }
  private zoom = 1

  async create(element: HTMLElement, options: EditorOptions): Promise<void> {
    this.element = element
    
    // 创建Canvas元素
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'canvas-editor'
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
      background: #f8f9fa;
      cursor: crosshair;
    `
    
    element.appendChild(this.canvas)
    
    // 获取2D上下文
    this.ctx = this.canvas.getContext('2d')
    if (!this.ctx) {
      throw new Error('Failed to get canvas context')
    }
    
    // 设置Canvas尺寸
    this.resizeCanvas()
    
    // 初始化内容
    this.initializeContent(options.value || '')
    
    // 绑定事件
    this.bindEvents()
    
    // 应用配置
    this.applyOptions(options)
    
    // 开始渲染循环
    this.startRenderLoop()
  }

  destroy(): void {
    if (this.canvas && this.element) {
      this.element.removeChild(this.canvas)
      this.canvas = null
      this.ctx = null
      this.element = null
    }
    this.eventListeners.clear()
    this.stopRenderLoop()
  }

  getValue(): string {
    // 将Canvas数据序列化为JSON
    return JSON.stringify({
      nodes: this.nodes,
      edges: this.edges,
      pan: this.pan,
      zoom: this.zoom
    })
  }

  setValue(value: string): void {
    try {
      const data = JSON.parse(value)
      this.nodes = data.nodes || []
      this.edges = data.edges || []
      this.pan = data.pan || { x: 0, y: 0 }
      this.zoom = data.zoom || 1
    } catch (error) {
      console.error('Failed to parse canvas data:', error)
    }
  }

  insertText(text: string, position?: PositionSection): void {
    // 在Canvas中，插入文本意味着创建一个新的文本节点
    const nodeId = this.generateId()
    const node: CanvasNode = {
      id: nodeId,
      type: 'text',
      x: position ? position.column * 20 : 100,
      y: position ? position.line * 30 : 100,
      width: 200,
      height: 100,
      content: text,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        textColor: '#000000',
        fontSize: 14
      }
    }
    
    this.nodes.push(node)
    this.emit('change', this.getValue())
  }

  replaceSelection(text: string): void {
    // 在Canvas中，替换选择意味着更新选中的节点内容
    if (this.selectedNodes.length > 0) {
      const nodeId = this.selectedNodes[0]
      const node = this.nodes.find(n => n.id === nodeId)
      if (node) {
        node.content = text
        this.emit('change', this.getValue())
      }
    }
  }

  getSelection(): string {
    // 返回选中节点的内容
    if (this.selectedNodes.length > 0) {
      const node = this.nodes.find(n => n.id === this.selectedNodes[0])
      return node?.content || ''
    }
    return ''
  }

  setSelection(start: PositionSection, end: PositionSection): void {
    // 在Canvas中，选择是基于节点ID的
    console.log('setSelection not implemented for canvas editor')
  }

  focus(): void {
    this.canvas?.focus()
  }

  blur(): void {
    this.canvas?.blur()
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Canvas编辑器特有方法
  addNode(type: string, x: number, y: number, content?: string): string {
    const nodeId = this.generateId()
    const node: CanvasNode = {
      id: nodeId,
      type,
      x,
      y,
      width: 200,
      height: 100,
      content: content || '',
      style: this.getDefaultNodeStyle(type)
    }
    
    this.nodes.push(node)
    this.emit('change', this.getValue())
    return nodeId
  }

  removeNode(nodeId: string): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId)
    this.edges = this.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
    this.selectedNodes = this.selectedNodes.filter(id => id !== nodeId)
    this.emit('change', this.getValue())
  }

  addEdge(from: string, to: string, type: string = 'line'): string {
    const edgeId = this.generateId()
    const edge: CanvasEdge = {
      id: edgeId,
      from,
      to,
      type,
      style: this.getDefaultEdgeStyle(type)
    }
    
    this.edges.push(edge)
    this.emit('change', this.getValue())
    return edgeId
  }

  removeEdge(edgeId: string): void {
    this.edges = this.edges.filter(e => e.id !== edgeId)
    this.selectedEdges = this.selectedEdges.filter(id => id !== edgeId)
    this.emit('change', this.getValue())
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(3, zoom))
    this.emit('zoomChanged', this.zoom)
  }

  setPan(x: number, y: number): void {
    this.pan = { x, y }
    this.emit('panChanged', this.pan)
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private getDefaultNodeStyle(type: string): Record<string, any> {
    switch (type) {
      case 'text':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#e0e0e0',
          textColor: '#000000',
          fontSize: 14,
          borderRadius: 8
        }
      case 'image':
        return {
          backgroundColor: '#f0f0f0',
          borderColor: '#d0d0d0',
          borderRadius: 4
        }
      default:
        return {
          backgroundColor: '#ffffff',
          borderColor: '#e0e0e0',
          textColor: '#000000',
          fontSize: 14
        }
    }
  }

  private getDefaultEdgeStyle(type: string): Record<string, any> {
    switch (type) {
      case 'line':
        return {
          color: '#666666',
          width: 2,
          style: 'solid'
        }
      case 'arrow':
        return {
          color: '#666666',
          width: 2,
          style: 'solid',
          arrowSize: 8
        }
      default:
        return {
          color: '#666666',
          width: 2,
          style: 'solid'
        }
    }
  }

  private initializeContent(content: string): void {
    if (content.trim()) {
      this.setValue(content)
    } else {
      // 创建默认的欢迎节点
      this.addNode('text', 100, 100, 'Welcome to FlowMind Canvas!')
    }
  }

  private resizeCanvas(): void {
    if (!this.canvas || !this.element) return
    
    const rect = this.element.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio
    this.canvas.style.width = rect.width + 'px'
    this.canvas.style.height = rect.height + 'px'
    
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
  }

  private bindEvents(): void {
    if (!this.canvas) return
    
    // 鼠标事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))
    
    // 键盘事件
    this.canvas.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleKeyDown(e)
      this.emit('keydown', e)
    })
    
    // 窗口事件
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect()
    const x = (e.clientX - rect.left - this.pan.x) / this.zoom
    const y = (e.clientY - rect.top - this.pan.y) / this.zoom
    
    if (e.button === 0) { // 左键
      const clickedNode = this.getNodeAt(x, y)
      if (clickedNode) {
        this.selectedNodes = [clickedNode.id]
        this.isDragging = true
        this.dragStart = { x: x - clickedNode.x, y: y - clickedNode.y }
      } else {
        this.selectedNodes = []
        this.isDragging = false
      }
    } else if (e.button === 1) { // 中键
      this.isDragging = true
      this.dragStart = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y }
    }
    
    this.emit('selectionChanged', {
      nodes: this.selectedNodes,
      edges: this.selectedEdges
    })
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return
    
    const rect = this.canvas!.getBoundingClientRect()
    const x = (e.clientX - rect.left - this.pan.x) / this.zoom
    const y = (e.clientY - rect.top - this.pan.y) / this.zoom
    
    if (this.selectedNodes.length > 0) {
      // 移动选中的节点
      const node = this.nodes.find(n => n.id === this.selectedNodes[0])
      if (node) {
        node.x = x - this.dragStart.x
        node.y = y - this.dragStart.y
        this.emit('change', this.getValue())
      }
    } else {
      // 平移画布
      this.pan.x = e.clientX - this.dragStart.x
      this.pan.y = e.clientY - this.dragStart.y
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    this.isDragging = false
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = this.zoom * delta
    
    if (newZoom >= 0.1 && newZoom <= 3) {
      const rect = this.canvas!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // 以鼠标位置为中心缩放
      this.pan.x = mouseX - (mouseX - this.pan.x) * delta
      this.pan.y = mouseY - (mouseY - this.pan.y) * delta
      
      this.zoom = newZoom
      this.emit('zoomChanged', this.zoom)
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        // 删除选中的节点和边
        this.selectedNodes.forEach(id => this.removeNode(id))
        this.selectedEdges.forEach(id => this.removeEdge(id))
        break
      case 'Escape':
        // 取消选择
        this.selectedNodes = []
        this.selectedEdges = []
        this.emit('selectionChanged', { nodes: [], edges: [] })
        break
    }
  }

  private handleResize(): void {
    this.resizeCanvas()
  }

  private getNodeAt(x: number, y: number): CanvasNode | null {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i]
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        return node
      }
    }
    return null
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render()
      this.renderLoopId = requestAnimationFrame(render)
    }
    render()
  }

  private stopRenderLoop(): void {
    if (this.renderLoopId) {
      cancelAnimationFrame(this.renderLoopId)
      this.renderLoopId = null
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 应用变换
    this.ctx.save()
    this.ctx.translate(this.pan.x, this.pan.y)
    this.ctx.scale(this.zoom, this.zoom)
    
    // 绘制网格
    this.drawGrid()
    
    // 绘制边
    this.edges.forEach(edge => this.drawEdge(edge))
    
    // 绘制节点
    this.nodes.forEach(node => this.drawNode(node))
    
    this.ctx.restore()
  }

  private drawGrid(): void {
    if (!this.ctx) return
    
    const gridSize = 20
    const width = this.canvas!.width / this.zoom
    const height = this.canvas!.height / this.zoom
    
    this.ctx.strokeStyle = '#e0e0e0'
    this.ctx.lineWidth = 1
    
    for (let x = 0; x <= width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, height)
      this.ctx.stroke()
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(width, y)
      this.ctx.stroke()
    }
  }

  private drawNode(node: CanvasNode): void {
    if (!this.ctx) return
    
    const isSelected = this.selectedNodes.includes(node.id)
    
    // 绘制背景
    this.ctx.fillStyle = node.style.backgroundColor
    this.ctx.strokeStyle = isSelected ? '#007acc' : node.style.borderColor
    this.ctx.lineWidth = isSelected ? 3 : 1
    
    if (node.style.borderRadius) {
      this.roundRect(node.x, node.y, node.width, node.height, node.style.borderRadius)
    } else {
      this.ctx.fillRect(node.x, node.y, node.width, node.height)
      this.ctx.strokeRect(node.x, node.y, node.width, node.height)
    }
    
    // 绘制文本
    this.ctx.fillStyle = node.style.textColor
    this.ctx.font = `${node.style.fontSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    const textX = node.x + node.width / 2
    const textY = node.y + node.height / 2
    
    // 简单的文本换行
    const words = node.content.split(' ')
    const lineHeight = node.style.fontSize * 1.2
    let currentLine = ''
    let currentY = textY - (words.length - 1) * lineHeight / 2
    
    words.forEach(word => {
      const testLine = currentLine + word + ' '
      const metrics = this.ctx!.measureText(testLine)
      
      if (metrics.width > node.width - 20) {
        this.ctx.fillText(currentLine, textX, currentY)
        currentLine = word + ' '
        currentY += lineHeight
      } else {
        currentLine = testLine
      }
    })
    
    if (currentLine) {
      this.ctx.fillText(currentLine, textX, currentY)
    }
  }

  private drawEdge(edge: CanvasEdge): void {
    if (!this.ctx) return
    
    const fromNode = this.nodes.find(n => n.id === edge.from)
    const toNode = this.nodes.find(n => n.id === edge.to)
    
    if (!fromNode || !toNode) return
    
    const isSelected = this.selectedEdges.includes(edge.id)
    
    this.ctx.strokeStyle = isSelected ? '#007acc' : edge.style.color
    this.ctx.lineWidth = isSelected ? 3 : edge.style.width
    
    const fromX = fromNode.x + fromNode.width / 2
    const fromY = fromNode.y + fromNode.height / 2
    const toX = toNode.x + toNode.width / 2
    const toY = toNode.y + toNode.height / 2
    
    this.ctx.beginPath()
    this.ctx.moveTo(fromX, fromY)
    this.ctx.lineTo(toX, toY)
    this.ctx.stroke()
    
    // 绘制箭头
    if (edge.type === 'arrow') {
      this.drawArrow(toX, toY, fromX, fromY, edge.style.arrowSize || 8)
    }
  }

  private drawArrow(x: number, y: number, fromX: number, fromY: number, size: number): void {
    if (!this.ctx) return
    
    const angle = Math.atan2(y - fromY, x - fromX)
    
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(
      x - size * Math.cos(angle - Math.PI / 6),
      y - size * Math.sin(angle - Math.PI / 6)
    )
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(
      x - size * Math.cos(angle + Math.PI / 6),
      y - size * Math.sin(angle + Math.PI / 6)
    )
    this.ctx.stroke()
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    if (!this.ctx) return
    
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.stroke()
  }

  private applyOptions(options: EditorOptions): void {
    if (options.canvasOptions) {
      const canvasOptions = options.canvasOptions
      
      if (canvasOptions.zoom !== undefined) {
        this.zoom = canvasOptions.zoom
      }
      
      if (canvasOptions.pan) {
        this.pan = canvasOptions.pan
      }
      
      if (canvasOptions.gridEnabled !== undefined) {
        // 这里可以实现网格显示控制
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  private renderLoopId: number | null = null
} 