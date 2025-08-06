import { ASTNode, DocumentAST, DocumentMetadata, GraphEdge } from "@/components/Editor/types/EditorAST";

/**
 * AST工具类
 */
export class ASTUtils {
    /**
     * 创建文档AST
     */
    static createDocument(
        title?: string,
        metadata?: DocumentMetadata,
        version: string = '1.0.0'
    ): DocumentAST {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        return {
            version,
            type: 'document',
            id,
            title,
            root: {
                id: 'root',
                type: 'group',
                position: { x: 0, y: 0 },
                children: [],
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...metadata
            }
        }
    }

    /**
     * 查找节点
     */
    static findNode(
        ast: DocumentAST,
        predicate: (node: ASTNode) => boolean
    ): ASTNode | null {
        const search = (nodes: ASTNode[]): ASTNode | null => {
            if (!nodes || nodes.length === 0) return null
            for (const node of nodes) {
                // 如果节点满足条件，则返回节点
                if (predicate(node)) {
                    return node
                }
                // 如果节点有子节点，则递归查找
                if (node.children && node.children.length > 0) {
                    const found = search(node.children)
                    if (found) return found
                }
            }
            return null
        }
        return search([ast.root])
    }

    /**
     * 查找节点ById
     */
    static findNodeById(
        ast: DocumentAST,
        nodeId: string
    ): ASTNode | null {
        return this.findNode(ast, node => node.id === nodeId)
    }

    /**
     * 遍历节点
     */
    static traverse(
        ast: DocumentAST,
        visitor: (node: ASTNode, path: number[]) => void
    ): void {
        const traverse = (nodes: ASTNode[], path: number[] = []) => {
            nodes.forEach((node, index) => {
                visitor(node, [...path, index])
                if (node.children && node.children.length > 0) {
                    traverse(node.children, [...path, index])
                }
            })
        }
        traverse([ast.root])
    }

    /**
     * 获取节点路径
     */
    static getNodePath(ast: DocumentAST, nodeId: string): number[] | null {
        let path: number[] | null = null

        this.traverse(ast, (node, currentPath) => {
            if (node.id === nodeId) {
                path = currentPath
            }
        })

        return path
    }

    /**
     * 克隆节点
     */
    static cloneNode(node: ASTNode): ASTNode {
        return JSON.parse(JSON.stringify(node))
    }

    /**
     * 验证AST结构
     */
    static validateAST(ast: DocumentAST): boolean {
        if (!ast || ast.type !== 'document') {
            return false
        }
        if (!ast.root) {
            return false
        }
        return true
    }

    /**
     * 获取节点类型统计
     */
    static getNodeTypeStats(ast: DocumentAST): Record<string, number> {
        const stats: Record<string, number> = {}
        this.traverse(ast, (node) => {
            stats[node.type] = (stats[node.type] || 0) + 1
        })

        return stats
    }

    /**
     * 添加节点
     */
    static addNode(
        ast: DocumentAST,
        node: ASTNode,
        parentId?: string,
        index?: number
    ): DocumentAST {
        const newAST = { ...ast }
        
        if (parentId) {
            const parent = this.findNodeById(newAST, parentId)
            if (parent) {
                if (!parent.children) parent.children = []
                if (index !== undefined) {
                    parent.children.splice(index, 0, node)
                } else {
                    parent.children.push(node)
                }
            }
        } else {
            // 添加到根节点
            if (!newAST.root.children) newAST.root.children = []
            if (index !== undefined) {
                newAST.root.children.splice(index, 0, node)
            } else {
                newAST.root.children.push(node)
            }
        }

        // 更新元数据
        if (newAST.metadata) {
            newAST.metadata.updatedAt = new Date().toISOString()
        }
        
        return newAST
    }

    /**
     * 删除节点
     */
    static removeNode(ast: DocumentAST, nodeId: string): DocumentAST {
        const newAST = { ...ast }
        
        const removeFromParent = (parent: ASTNode): boolean => {
            if (parent.children) {
                const index = parent.children.findIndex(child => child.id === nodeId)
                if (index !== -1) {
                    parent.children.splice(index, 1)
                    return true
                }
                
                // 递归查找子节点
                for (const child of parent.children) {
                    if (removeFromParent(child)) {
                        return true
                    }
                }
            }
            return false
        }

        removeFromParent(newAST.root)
        
        // 更新元数据
        if (newAST.metadata) {
            newAST.metadata.updatedAt = new Date().toISOString()
        }
        
        return newAST
    }

    /**
     * 更新节点
     */
    static updateNode(
        ast: DocumentAST,
        nodeId: string,
        updates: Partial<ASTNode>
    ): DocumentAST {
        const newAST = { ...ast }
        
        const updateNodeRecursive = (node: ASTNode): boolean => {
            if (node.id === nodeId) {
                Object.assign(node, updates)
                return true
            }
            
            if (node.children) {
                for (const child of node.children) {
                    if (updateNodeRecursive(child)) {
                        return true
                    }
                }
            }
            return false
        }

        updateNodeRecursive(newAST.root)
        
        // 更新元数据
        if (newAST.metadata) {
            newAST.metadata.updatedAt = new Date().toISOString()
        }
        
        return newAST
    }

    /**
     * 移动节点
     */
    static moveNode(
        ast: DocumentAST,
        nodeId: string,
        newParentId: string,
        newIndex: number
    ): DocumentAST {
        // 先删除节点
        let nodeToMove: ASTNode | null = null
        const tempAST = this.removeNode(ast, nodeId)
        
        // 找到要移动的节点
        this.traverse(ast, (node) => {
            if (node.id === nodeId) {
                nodeToMove = node
            }
        })
        
        if (nodeToMove) {
            // 添加到新位置
            return this.addNode(tempAST, nodeToMove, newParentId, newIndex)
        }
        
        return tempAST
    }

    /**
     * 复制节点
     */
    static duplicateNode(
        ast: DocumentAST,
        nodeId: string,
        newParentId?: string
    ): DocumentAST {
        const originalNode = this.findNodeById(ast, nodeId)
        if (!originalNode) return ast

        // 创建新节点
        const newNode = this.cloneNode(originalNode)
        newNode.id = `${originalNode.id}_copy_${Date.now()}`
        newNode.metadata = {
            ...newNode.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // 递归更新子节点ID
        this.updateChildrenIds(newNode)

        return this.addNode(ast, newNode, newParentId)
    }

    /**
     * 更新子节点ID
     */
    private static updateChildrenIds(node: ASTNode): void {
        if (node.children) {
            node.children.forEach((child, index) => {
                const oldId = child.id
                child.id = `${node.id}_child_${index}_${Date.now()}`
                child.parent = node.id
                
                // 递归更新子节点
                this.updateChildrenIds(child)
            })
        }
    }

    /**
     * 创建富文本节点
     */
    static createRichTextNode(
        type: any,
        content?: string,
        attributes?: any,
        position?: any
    ): ASTNode {
        return {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            content,
            attributes,
            position: position || { x: 0, y: 0 },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }
    }

    /**
     * 创建图谱节点
     */
    static createGraphNode(
        label: string,
        nodeType?: string,
        properties?: any,
        position?: any
    ): ASTNode {
        return {
            id: `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'graphNode',
            label,
            graphData: {
                nodeType,
                properties
            },
            position: position || { x: 0, y: 0 },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }
    }

    /**
     * 创建图谱边
     */
    static createGraphEdge(
        source: string,
        target: string,
        label?: string,
        edgeType?: string
    ): GraphEdge {
        return {
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'graphEdge',
            source,
            target,
            label: label || '',
            edgeType,
            position: { x: 0, y: 0 },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }
    }

    /**
     * 序列化AST
     */
    static serialize(ast: DocumentAST): string {
        return JSON.stringify(ast, null, 2)
    }

    /**
     * 反序列化AST
     */
    static deserialize(data: string): DocumentAST {
        return JSON.parse(data)
    }
}