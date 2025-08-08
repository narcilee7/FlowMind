/**
 * 知识图谱视图适配器
 * 
 * 基于 vis-network 实现的知识图谱编辑器
 * 专注于核心功能：节点创建、连接、编辑
 */

import { CoreViewAdapter, AdapterCapabilities } from './BaseViewAdapter.optimized'
import { ViewAdapterOptions, Viewport } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'

/**
 * 图节点
 */
interface GraphNode {
    id: string
    label: string
    x?: number
    y?: number
    color?: string
    shape?: 'circle' | 'box' | 'ellipse' | 'diamond'
    size?: number
    group?: string
}

/**
 * 图边
 */
interface GraphEdge {
    id: string
    from: string
    to: string
    label?: string
    color?: string
    arrows?: 'to' | 'from' | 'middle'
    width?: number
}

/**
 * 网络实例接口
 */
interface NetworkInstance {
    setData(data: { nodes: any[]; edges: any[] }): void
    getSelectedNodes(): string[]
    getSelectedEdges(): string[]
    addNodeMode(): void
    addEdgeMode(): void
    editNode(): void
    deleteSelected(): void
    fit(): void
    getViewPosition(): { x: number; y: number; scale: number }
    moveTo(options: { position: { x: number; y: number }; scale?: number }): void
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    destroy(): void
}

/**
 * 知识图谱适配器
 */
export class GraphViewAdapter extends CoreViewAdapter {
    public readonly type: EditorType.GRAPH = EditorType.GRAPH
    public readonly capabilities: AdapterCapabilities = {
        canEdit: true,
        canSelect: true,
        canZoom: true,
        canDrag: true,
        supportsUndo: false, // 暂时不支持撤销
        supportsSearch: true,
        supportsAI: true
    }

    private network: NetworkInstance | null = null
    private nodes: GraphNode[] = []
    private edges: GraphEdge[] = []
    private container: HTMLElement | null = null

    constructor(sceneTemplate: SceneTemplate) {
        super(sceneTemplate)
    }

    protected async performCreate(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        this.container = element
        
        try {
            // 动态加载 vis-network
            const { Network, DataSet } = await import('vis-network/standalone')
            
            // 初始化数据
            const nodesDataSet = new DataSet(this.nodes)
            const edgesDataSet = new DataSet(this.edges)
            
            // 网络配置
            const networkOptions = {
                nodes: {
                    shape: 'circle',
                    size: 20,
                    font: {
                        size: 14,
                        color: options.theme === 'dark' ? '#ffffff' : '#000000'
                    },
                    borderWidth: 2,
                    shadow: true
                },
                edges: {
                    arrows: 'to',
                    smooth: {
                        type: 'continuous'
                    },
                    font: {
                        size: 12,
                        color: options.theme === 'dark' ? '#ffffff' : '#000000'
                    }
                },
                physics: {
                    enabled: true,
                    stabilization: {
                        iterations: 100
                    }
                },
                interaction: {
                    multiselect: true,
                    selectConnectedEdges: false
                },
                manipulation: {
                    enabled: true,
                    addNode: (data: any, callback: Function) => {
                        this.handleAddNode(data, callback)
                    },
                    editNode: (data: any, callback: Function) => {
                        this.handleEditNode(data, callback)
                    },
                    addEdge: (data: any, callback: Function) => {
                        this.handleAddEdge(data, callback)
                    },
                    deleteNode: (data: any, callback: Function) => {
                        this.handleDeleteNode(data, callback)
                    },
                    deleteEdge: (data: any, callback: Function) => {
                        this.handleDeleteEdge(data, callback)
                    }
                }
            }

            // 创建网络实例
            this.network = new Network(element, {
                nodes: nodesDataSet,
                edges: edgesDataSet
            }, networkOptions) as NetworkInstance

            // 设置事件监听
            this.setupEventListeners()
            
            // 添加默认节点（如果是新图）
            if (this.nodes.length === 0) {
                this.addDefaultNodes()
            }

        } catch (error) {
            throw new Error(`Failed to create graph adapter: ${error}`)
        }
    }

    protected performDestroy(): void {
        if (this.network) {
            this.network.destroy()
            this.network = null
        }
        this.nodes = []
        this.edges = []
        this.container = null
    }

    protected performRender(ast: DocumentAST): void {
        if (!this.network) return

        // 从 AST 提取图数据
        const { nodes, edges } = this.extractGraphFromAST(ast)
        this.nodes = nodes
        this.edges = edges

        // 更新网络数据
        this.network.setData({ nodes, edges })
    }

    protected performUpdateNode(nodeId: string, node: ASTNode): void {
        const graphNode = this.nodes.find(n => n.id === nodeId)
        if (graphNode && node.type === 'graph-node') {
            const content = (node as any).content || {}
            graphNode.label = content.label || graphNode.label
            graphNode.color = content.color || graphNode.color
            
            if (this.network) {
                this.network.setData({ nodes: this.nodes, edges: this.edges })
            }
        }
    }

    protected performRemoveNode(nodeId: string): void {
        // 移除节点和相关边
        this.nodes = this.nodes.filter(n => n.id !== nodeId)
        this.edges = this.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
        
        if (this.network) {
            this.network.setData({ nodes: this.nodes, edges: this.edges })
        }
    }

    protected performAddNode(node: ASTNode, parentId?: string, index?: number): void {
        if (node.type === 'graph-node') {
            const content = (node as any).content || {}
            const graphNode: GraphNode = {
                id: node.id,
                label: content.label || '新节点',
                color: content.color || '#97C2FC',
                shape: content.shape || 'circle',
                size: content.size || 20
            }
            
            this.nodes.push(graphNode)
            
            // 如果有父节点，创建连接
            if (parentId) {
                const edge: GraphEdge = {
                    id: `edge_${parentId}_${node.id}`,
                    from: parentId,
                    to: node.id,
                    arrows: 'to'
                }
                this.edges.push(edge)
            }
            
            if (this.network) {
                this.network.setData({ nodes: this.nodes, edges: this.edges })
            }
        }
    }

    protected performSetSelection(selection: Selection): void {
        // Graph 选择逻辑
        if (selection.nodeIds.length > 0) {
            // 这里需要使用 vis-network 的选择 API
            console.log('Graph selection:', selection.nodeIds)
        }
    }

    protected performGetSelection(): Selection {
        if (!this.network) {
            return { nodeIds: [], type: 'node' }
        }

        const selectedNodes = this.network.getSelectedNodes()
        const selectedEdges = this.network.getSelectedEdges()
        
        return {
            nodeIds: [...selectedNodes, ...selectedEdges],
            type: 'node'
        }
    }

    protected performFocus(): void {
        if (this.container) {
            this.container.focus()
        }
    }

    protected performBlur(): void {
        if (this.container) {
            this.container.blur()
        }
    }

    protected performGetViewport(): Viewport {
        if (!this.network || !this.container) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const position = this.network.getViewPosition()
        return {
            x: position.x,
            y: position.y,
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            zoom: position.scale
        }
    }

    protected performSetViewport(viewport: Viewport): void {
        if (!this.network) return

        this.network.moveTo({
            position: { x: viewport.x, y: viewport.y },
            scale: viewport.zoom
        })
    }

    // === 图谱特定方法 ===

    /**
     * 添加节点
     */
    public addGraphNode(label: string, position?: { x: number; y: number }): string {
        const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const node: GraphNode = {
            id: nodeId,
            label,
            x: position?.x,
            y: position?.y,
            color: '#97C2FC',
            shape: 'circle',
            size: 20
        }
        
        this.nodes.push(node)
        
        if (this.network) {
            this.network.setData({ nodes: this.nodes, edges: this.edges })
        }
        
        return nodeId
    }

    /**
     * 连接节点
     */
    public connectNodes(fromId: string, toId: string, label?: string): string {
        const edgeId = `edge_${fromId}_${toId}`
        const edge: GraphEdge = {
            id: edgeId,
            from: fromId,
            to: toId,
            label,
            arrows: 'to'
        }
        
        this.edges.push(edge)
        
        if (this.network) {
            this.network.setData({ nodes: this.nodes, edges: this.edges })
        }
        
        return edgeId
    }

    /**
     * 设置布局
     */
    public setLayout(layout: 'hierarchical' | 'physics' | 'static'): void {
        // 这里可以重新配置网络布局
        console.log(`Setting layout to: ${layout}`)
    }

    /**
     * 导出图数据
     */
    public exportGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
        return {
            nodes: [...this.nodes],
            edges: [...this.edges]
        }
    }

    /**
     * 导入图数据
     */
    public importGraph(data: { nodes: GraphNode[]; edges: GraphEdge[] }): void {
        this.nodes = [...data.nodes]
        this.edges = [...data.edges]
        
        if (this.network) {
            this.network.setData({ nodes: this.nodes, edges: this.edges })
        }
    }

    // === 私有方法 ===

    private setupEventListeners(): void {
        if (!this.network) return

        // 节点点击事件
        this.network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
                this.emit('nodeClick', {
                    nodeId: params.nodes[0],
                    event: params.event
                })
            }
        })

        // 节点双击事件
        this.network.on('doubleClick', (params: any) => {
            if (params.nodes.length > 0) {
                this.emit('nodeDoubleClick', {
                    nodeId: params.nodes[0],
                    event: params.event
                })
            }
        })

        // 选择变化事件
        this.network.on('selectNode', (params: any) => {
            this.emit('selectionChange', {
                nodeIds: params.nodes,
                type: 'node'
            })
        })

        // 视图变化事件
        this.network.on('zoom', () => {
            this.emit('viewChange', {
                type: 'zoom',
                viewport: this.performGetViewport()
            })
        })
    }

    private extractGraphFromAST(ast: DocumentAST): { nodes: GraphNode[]; edges: GraphEdge[] } {
        const nodes: GraphNode[] = []
        const edges: GraphEdge[] = []

        const traverse = (node: ASTNode) => {
            if (node.type === 'graph-node') {
                const content = (node as any).content || {}
                nodes.push({
                    id: node.id,
                    label: content.label || '节点',
                    color: content.color || '#97C2FC',
                    shape: content.shape || 'circle',
                    size: content.size || 20,
                    x: content.x,
                    y: content.y
                })
            } else if (node.type === 'graph-edge') {
                const content = (node as any).content || {}
                edges.push({
                    id: node.id,
                    from: content.from,
                    to: content.to,
                    label: content.label,
                    color: content.color,
                    arrows: content.arrows || 'to'
                })
            }

            if (node.children) {
                node.children.forEach(traverse)
            }
        }

        traverse(ast.root)
        return { nodes, edges }
    }

    private addDefaultNodes(): void {
        // 添加示例节点
        const centerNode = this.addGraphNode('中心主题', { x: 0, y: 0 })
        const node1 = this.addGraphNode('想法 1', { x: -200, y: -100 })
        const node2 = this.addGraphNode('想法 2', { x: 200, y: -100 })
        const node3 = this.addGraphNode('想法 3', { x: 0, y: 200 })
        
        // 连接节点
        this.connectNodes(centerNode, node1, '关联')
        this.connectNodes(centerNode, node2, '关联')
        this.connectNodes(centerNode, node3, '关联')
    }

    private handleAddNode(data: any, callback: Function): void {
        // 弹出输入框让用户输入节点标签
        const label = prompt('请输入节点标签:', '新节点') || '新节点'
        data.label = label
        data.color = '#97C2FC'
        callback(data)
        
        // 添加到内部数据
        this.nodes.push(data)
    }

    private handleEditNode(data: any, callback: Function): void {
        const newLabel = prompt('编辑节点标签:', data.label) || data.label
        data.label = newLabel
        callback(data)
        
        // 更新内部数据
        const node = this.nodes.find(n => n.id === data.id)
        if (node) {
            node.label = newLabel
        }
    }

    private handleAddEdge(data: any, callback: Function): void {
        const label = prompt('请输入连接标签 (可选):', '') || undefined
        if (label) {
            data.label = label
        }
        callback(data)
        
        // 添加到内部数据
        this.edges.push(data)
    }

    private handleDeleteNode(data: any, callback: Function): void {
        if (confirm('确定要删除选中的节点吗？')) {
            callback(data)
            
            // 从内部数据中移除
            data.nodes.forEach((nodeId: string) => {
                this.nodes = this.nodes.filter(n => n.id !== nodeId)
            })
            data.edges.forEach((edgeId: string) => {
                this.edges = this.edges.filter(e => e.id !== edgeId)
            })
        }
    }

    private handleDeleteEdge(data: any, callback: Function): void {
        if (confirm('确定要删除选中的连接吗？')) {
            callback(data)
            
            // 从内部数据中移除
            data.edges.forEach((edgeId: string) => {
                this.edges = this.edges.filter(e => e.id !== edgeId)
            })
        }
    }
}

export default GraphViewAdapter