/**
 * 图谱视图适配器
 * 基于vis-network实现，提供知识图谱可视化功能
 */

import { ViewAdapterOptions, GraphViewAdapter as IGraphViewAdapter, GraphLayout } from '@/components/Editor/types/ViewAdapter'
import { EditorType } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, GraphNode, GraphEdge } from '@/components/Editor/types/EditorAST'
import { BaseViewAdapter } from './BaseViewAdapter'
import { ASTUtils } from '../utils/ASTUtils'

/**
 * vis-network类型定义
 */
interface VisNetwork {
    body: {
        data: {
            nodes: {
                add: (node: any) => void
                update: (node: any) => void
                remove: (nodeId: string) => void
            }
            edges: {
                add: (edge: any) => void
                update: (edge: any) => void
                remove: (edgeId: string) => void
            }
        }
    }
    setData: (data: { nodes: any[]; edges: any[] }) => void
    setOptions: (options: any) => void
    selectNodes: (nodeIds: string[]) => void
    getSelectedNodes: () => string[]
    focus: (nodeId?: string, options?: any) => void
    moveTo: (options: any) => void
    fit: (options?: any) => void
    getScale: () => number
    getViewPosition: () => { x: number; y: number }
    getPositions: (nodeIds: string[]) => Record<string, { x: number; y: number }>
    destroy: () => void
    on: (event: string, callback: Function) => void
    canvas: { width: number; height: number }
}

/**
 * 图谱视图适配器实现
 */
export class GraphViewAdapter extends BaseViewAdapter implements IGraphViewAdapter {
    public readonly type: EditorType.GRAPH = EditorType.GRAPH
    
    private network: VisNetwork | null = null
    private nodes: any[] = []
    private edges: any[] = []
    private currentLayout: GraphLayout = 'force'
    private nodePositions: Map<string, { x: number; y: number }> = new Map()

    /**
     * 创建适配器
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        if (this.isInitialized) {
            this.handleError(new Error('Adapter already initialized'), 'create')
            return
        }

        this.element = element
        this.options = options

        try {
            // 动态导入vis-network
            const { Network } = await import('vis-network')
            const { DataSet } = await import('vis-data')

            // 创建数据集
            const nodesDataset = new DataSet([])
            const edgesDataset = new DataSet([])

            // 配置网络选项
            const networkOptions = {
                // 节点配置
                nodes: {
                    shape: 'dot',
                    size: 16,
                    font: {
                        size: 12,
                        face: 'Arial'
                    },
                    borderWidth: 2,
                    shadow: true
                },
                // 边配置
                edges: {
                    width: 2,
                    shadow: true,
                    smooth: {
                        type: 'continuous'
                    }
                },
                // 物理配置
                physics: {
                    stabilization: false,
                    barnesHut: {
                        gravitationalConstant: -80000,
                        springConstant: 0.001,
                        springLength: 200
                    }
                },
                // 交互配置
                interaction: {
                    navigationButtons: true,
                    keyboard: true,
                    hover: true,
                    tooltipDelay: 200
                }
            }

            // 创建网络实例
            this.network = new Network(element, {
                nodes: nodesDataset,
                edges: edgesDataset
            }, networkOptions as any) as any

            // 设置事件监听
            this.setupEventListeners()

            // 设置主题样式
            this.applyTheme(options.theme || 'auto')
            
            this.isInitialized = true
            this.triggerEvent('viewChange', { type: 'initialized' })

        } catch (error) {
            this.handleError(error as Error, 'create')
            throw error
        }
    }

    /**
     * 执行销毁逻辑
     */
    protected performDestroy(): void {
        if (this.network) {
            this.network.destroy()
            this.network = null
        }
        this.nodes = []
        this.edges = []
        this.nodePositions.clear()
    }

    /**
     * 渲染AST
     */
    render(ast: DocumentAST): void {
        if (!this.validateInitialized() || !this.network) return

        const result = this.safeSync(() => this.parseASTToGraphData(ast), 'render')
        if (result) {
            this.nodes = result.nodes
            this.edges = result.edges

            // 更新网络数据
            this.network.setData({ nodes: result.nodes, edges: result.edges })

            // 应用布局
            this.applyLayout(this.currentLayout)
        }
    }

    /**
     * 更新节点
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.validateInitialized() || !this.network) return

        const graphNode = this.safeSync(() => this.astNodeToVisNode(node), 'updateNode')
        if (graphNode) {
            this.network.body.data.nodes.update(graphNode)
        }
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.network) return

        this.network.body.data.nodes.remove(nodeId)
        
        // 删除相关的边
        const edgesToRemove = this.edges.filter(edge => 
            edge.from === nodeId || edge.to === nodeId
        )
        edgesToRemove.forEach(edge => {
            this.network!.body.data.edges.remove(edge.id)
        })

        // 更新本地数据
        this.nodes = this.nodes.filter(node => node.id !== nodeId)
        this.edges = this.edges.filter(edge => 
            edge.from !== nodeId && edge.to !== nodeId
        )
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.validateInitialized() || !this.network) return

        const graphNode = this.safeSync(() => this.astNodeToVisNode(node), 'addNode')
        if (!graphNode) return

        this.network.body.data.nodes.add(graphNode)
        this.nodes.push(graphNode)

        // 如果有父节点，创建连接
        if (parentId) {
            const edge = {
                id: `${parentId}-${node.id}`,
                from: parentId,
                to: node.id,
                arrows: 'to',
                label: 'contains'
            }
            this.network.body.data.edges.add(edge)
            this.edges.push(edge)
        }
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.validateInitialized() || !this.network) return

        if (selection.type === 'node' && selection.nodeIds.length > 0) {
            this.network.selectNodes(selection.nodeIds)
        }
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.validateInitialized() || !this.network) {
            return { nodeIds: [], type: 'node' }
        }

        const selectedNodes = this.network.getSelectedNodes()
        return {
            nodeIds: selectedNodes,
            type: 'node'
        }
    }

    /**
     * 设置焦点
     */
    focus(): void {
        if (this.validateInitialized() && this.network) {
            this.network.focus()
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        // vis-network没有直接的blur方法，通过选择空节点实现
        if (this.validateInitialized() && this.network) {
            this.network.selectNodes([])
        }
    }

    /**
     * 是否获得焦点
     */
    isFocused(): boolean {
        // vis-network没有直接的isFocused方法
        return false
    }

    /**
     * 滚动到节点
     */
    scrollToNode(nodeId: string): void {
        this.centerOnNode(nodeId)
    }

    /**
     * 放大视图
     */
    zoomIn(): void {
        if (!this.validateInitialized() || !this.network) return

        const scale = this.network.getScale()
        this.network.moveTo({
            scale: scale * 1.2,
            animation: {
                duration: 300,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    /**
     * 缩小视图
     */
    zoomOut(): void {
        if (!this.validateInitialized() || !this.network) return

        const scale = this.network.getScale()
        this.network.moveTo({
            scale: scale * 0.8,
            animation: {
                duration: 300,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        if (!this.validateInitialized() || !this.network) return

        this.network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    /**
     * 适应视图
     */
    fitToView(): void {
        this.resetZoom()
    }

    /**
     * 获取视口
     */
    getViewport(): any {
        if (!this.validateInitialized() || !this.network) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const view = this.network.getViewPosition()
        const scale = this.network.getScale()
        const canvas = this.network.canvas

        return {
            x: view.x,
            y: view.y,
            width: canvas.width,
            height: canvas.height,
            zoom: scale
        }
    }

    /**
     * 设置视口
     */
    setViewport(viewport: any): void {
        if (!this.validateInitialized() || !this.network) return

        this.network.moveTo({
            position: { x: viewport.x, y: viewport.y },
            scale: viewport.zoom,
            animation: {
                duration: 300,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    // 图谱特有方法
    /**
     * 添加图谱节点
     */
    addGraphNode(node: ASTNode, position?: { x: number; y: number }): void {
        if (!this.validateInitialized() || !this.network) return

        const graphNode = this.safeSync(() => this.astNodeToVisNode(node), 'addGraphNode')
        if (!graphNode) return

        if (position) {
            graphNode.x = position.x
            graphNode.y = position.y
            graphNode.fixed = true
            this.nodePositions.set(node.id, position)
        }

        this.network.body.data.nodes.add(graphNode)
        this.nodes.push(graphNode)
    }

    /**
     * 添加边
     */
    addEdge(edge: ASTNode): void {
        if (!this.validateInitialized() || !this.network) return

        const graphEdge = this.safeSync(() => this.astEdgeToVisEdge(edge), 'addEdge')
        if (graphEdge) {
            this.network.body.data.edges.add(graphEdge)
            this.edges.push(graphEdge)
        }
    }

    /**
     * 删除图谱节点
     */
    removeGraphNode(nodeId: string): void {
        this.removeNode(nodeId)
    }

    /**
     * 删除边
     */
    removeEdge(edgeId: string): void {
        if (!this.validateInitialized() || !this.network) return

        this.network.body.data.edges.remove(edgeId)
        this.edges = this.edges.filter(edge => edge.id !== edgeId)
    }

    /**
     * 更新节点位置
     */
    updateNodePosition(nodeId: string, position: { x: number; y: number }): void {
        if (!this.validateInitialized() || !this.network) return

        this.network.body.data.nodes.update({
            id: nodeId,
            x: position.x,
            y: position.y,
            fixed: true
        })
        this.nodePositions.set(nodeId, position)
    }

    /**
     * 应用布局
     */
    applyLayout(layout: GraphLayout): void {
        if (!this.validateInitialized() || !this.network) return

        this.currentLayout = layout

        switch (layout) {
            case 'force':
                this.network.setOptions({
                    physics: {
                        enabled: true,
                        barnesHut: {
                            gravitationalConstant: -80000,
                            springConstant: 0.001,
                            springLength: 200
                        }
                    }
                })
                break
            case 'hierarchical':
                this.network.setOptions({
                    layout: {
                        hierarchical: {
                            enabled: true,
                            direction: 'UD',
                            sortMethod: 'directed'
                        }
                    },
                    physics: {
                        enabled: false
                    }
                })
                break
            case 'circular':
                this.network.setOptions({
                    layout: {
                        circular: {
                            enabled: true,
                            levelSeparation: 150
                        }
                    },
                    physics: {
                        enabled: false
                    }
                })
                break
            case 'grid':
                this.network.setOptions({
                    layout: {
                        improvedLayout: false,
                        randomSeed: 2
                    },
                    physics: {
                        enabled: false
                    }
                })
                break
            case 'random':
                this.network.setOptions({
                    layout: {
                        randomSeed: Math.floor(Math.random() * 1000)
                    },
                    physics: {
                        enabled: false
                    }
                })
                break
        }

        this.triggerEvent('viewChange', { type: 'layoutChange', layout })
    }

    /**
     * 自动布局
     */
    autoLayout(): void {
        this.applyLayout('force')
    }

    /**
     * 居中到节点
     */
    centerOnNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.network) return

        this.network.focus(nodeId, {
            scale: 1,
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    /**
     * 节点拖拽事件
     */
    onNodeDrag(callback: (nodeId: string, position: { x: number; y: number }) => void): void {
        this.addEventListener('nodeDrag', callback)
    }

    /**
     * 边点击事件
     */
    onEdgeClick(callback: (edgeId: string, event: MouseEvent) => void): void {
        this.addEventListener('edgeClick', callback)
    }

    // 私有方法
    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        if (!this.network) return

        this.network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0]
                this.triggerEvent('nodeClick', { nodeId, event: params.event })
            } else if (params.edges.length > 0) {
                const edgeId = params.edges[0]
                this.triggerEvent('edgeClick', { edgeId, event: params.event })
            }
        })

        this.network.on('doubleClick', (params: any) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0]
                this.triggerEvent('nodeDoubleClick', { nodeId, event: params.event })
            }
        })

        this.network.on('select', (params: any) => {
            const selection: Selection = {
                nodeIds: params.nodes,
                type: 'node'
            }
            this.triggerEvent('selectionChange', selection)
        })

        this.network.on('dragEnd', (params: any) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0]
                const position = this.network!.getPositions([nodeId])[nodeId]
                this.triggerEvent('nodeDrag', nodeId, position)
            }
        })

        this.network.on('stabilizationProgress', (params: any) => {
            this.triggerEvent('viewChange', { type: 'stabilization', progress: params.iterations })
        })

        this.network.on('stabilizationIterationsDone', () => {
            this.triggerEvent('viewChange', { type: 'stabilization', status: 'done' })
        })
    }

    /**
     * 解析AST为图谱数据
     */
    private parseASTToGraphData(ast: DocumentAST): { nodes: any[], edges: any[] } {
        const nodes: any[] = []
        const edges: any[] = []

        // 递归遍历AST节点
        const traverse = (node: ASTNode) => {
            if (node.type === 'graphNode') {
                nodes.push(this.astNodeToVisNode(node))
            } else if (node.type === 'graphEdge') {
                edges.push(this.astEdgeToVisEdge(node))
            }

            if (node.children) {
                node.children.forEach(traverse)
            }
        }

        traverse(ast.root)

        return { nodes, edges }
    }

    /**
     * 将AST节点转换为vis-network节点
     */
    private astNodeToVisNode(node: ASTNode): any {
        const graphNode = node as GraphNode
        return {
            id: node.id,
            label: graphNode.label || node.id,
            x: node.position.x,
            y: node.position.y,
            group: graphNode.graphData?.group || 'default',
            title: graphNode.graphData?.properties?.description || '',
            color: this.getNodeColor(graphNode),
            size: this.getNodeSize(graphNode),
            shape: this.getNodeShape(graphNode)
        }
    }

    /**
     * 将AST边转换为vis-network边
     */
    private astEdgeToVisEdge(edge: ASTNode): any {
        const graphEdge = edge as GraphEdge
        return {
            id: edge.id,
            from: graphEdge.source,
            to: graphEdge.target,
            label: graphEdge.label || '',
            arrows: graphEdge.directed ? 'to' : '',
            width: graphEdge.weight || 1,
            color: this.getEdgeColor(graphEdge),
            dashes: graphEdge.edgeType === 'dashed' ? [5, 5] : false
        }
    }

    /**
     * 获取节点颜色
     */
    private getNodeColor(node: GraphNode): string {
        const nodeType = node.graphData?.nodeType
        switch (nodeType) {
            case 'concept': return '#4CAF50'
            case 'entity': return '#2196F3'
            case 'event': return '#FF9800'
            case 'person': return '#9C27B0'
            case 'place': return '#795548'
            default: return '#607D8B'
        }
    }

    /**
     * 获取节点大小
     */
    private getNodeSize(node: GraphNode): number {
        const importance = node.graphData?.properties?.importance || 1
        return Math.max(10, Math.min(30, importance * 15))
    }

    /**
     * 获取节点形状
     */
    private getNodeShape(node: GraphNode): string {
        const nodeType = node.graphData?.nodeType
        switch (nodeType) {
            case 'concept': return 'dot'
            case 'entity': return 'box'
            case 'event': return 'diamond'
            case 'person': return 'circle'
            case 'place': return 'square'
            default: return 'dot'
        }
    }

    /**
     * 获取边颜色
     */
    private getEdgeColor(edge: GraphEdge): string {
        const edgeType = edge.edgeType
        switch (edgeType) {
            case 'contains': return '#4CAF50'
            case 'references': return '#2196F3'
            case 'causes': return '#F44336'
            case 'similar': return '#FF9800'
            default: return '#9E9E9E'
        }
    }
}
