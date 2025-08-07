
/**
 * AST工具函数
 */


import { ASTNode, DocumentAST, DocumentMetadata, DocumentSettings, GraphEdge, GraphNode, RichTextNode, Selection } from "@/components/Editor/types/EditorAST";
import { generateRandomId } from "./CommonUtils";

/**
 * AST操作结果
 */
interface ASTOperationResult<T = any> {
    success: boolean
    data?: T
    error?: string
    ast?: DocumentAST
}

/**
 * 节点位置信息
 */
interface NodePosition {
    start: number
    end: number
    nodeId: string
    path: number[]
}

/**
 * 创建文档AST
 * @param title 文档标题
 * @param metadata 文档元数据
 * @param version 文档版本
 * @param settings 文档设置
 * @returns 创建的文档AST
 */
function createDocumentAST(
    title?: string,
    metadata?: DocumentMetadata,
    version: string = '1.0.0',
    settings?: DocumentSettings
): DocumentAST {
    const id = generateRandomId()
    return {
        id,
        type: 'document',
        version,
        title: title ?? 'Untitled Document',
        root: {
            id: 'root',
            type: 'group',
            position: { x: 0, y: 0 },
            children: [],
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...metadata
        },
        settings: {
            theme: 'light',
            fontSize: 14,
            fontFamily: 'Arial',
            lineHeight: 1.5,
            autoSave: true,
            collaboration: false,
            ...settings
        }
    }
}
/**
 * 查找节点
 * @param ast 文档AST
 * @param predicate 节点匹配条件
 * @returns 匹配的节点或null
 */
function findNode(
    ast: DocumentAST,
    predicate: (node: ASTNode) => boolean
): ASTNode | null {
    const search = (nodes: ASTNode[]): ASTNode | null => {
        if (!nodes || nodes.length === 0) return null
        for (const node of nodes) {
            if (predicate(node)) {
                return node
            }
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
function findNodeById(
    ast: DocumentAST,
    nodeId: string
): ASTNode | null {
    return findNode(ast, node => node.id === nodeId)
}

/**
 * 遍历节点
 */
function traverse(
    ast: DocumentAST,
    visitor: (node: ASTNode, path: number[], parent?: ASTNode) => void
): void {
    const traverse = (nodes: ASTNode[], path: number[] = [], parent?: ASTNode) => {
        nodes.forEach((node, index) => {
            visitor(node, [...path, index], parent)
            if (node.children && node.children.length > 0) {
                traverse(node.children, [...path, index], node)
            }
        })
    }
    traverse([ast.root])
}

/**
 * 获取节点路径
 */
function getNodePath(
    ast: DocumentAST,
    nodeId: string
): number[] | null {
    let path: number[] | null = null
    traverse(ast, (node, currentPath) => {
        if (node.id === nodeId) {
            path = currentPath
        }
    })
    return path
}

/**
 * 根据路径获取节点
 */
function getNodeByPath(
    ast: DocumentAST,
    path: number[]
): ASTNode | null {
    let current: ASTNode = ast.root

    for (const index of path) {
        if (!current.children || index >= current.children.length) {
            return null
        }
        current = current.children[index]
    }

    return current
}

/**
 * 克隆节点
 */
function cloneNode(node: ASTNode): ASTNode {
    return JSON.parse(JSON.stringify(node))
}

/**
 * 验证AST结构
 */
function validateAST(ast: DocumentAST): ASTOperationResult<boolean> {
    try {
        if (!ast || ast.type !== 'document') {
            return { success: false, error: 'Invalid AST structure' }
        }
        if (!ast.root) {
            return { success: false, error: 'Missing root node' }
        }

        // 验证节点ID唯一性
        const nodeIds = new Set<string>()
        const checkIds = (node: ASTNode): boolean => {
            if (nodeIds.has(node.id)) {
                return false
            }
            nodeIds.add(node.id)

            if (node.children) {
                return node.children.every(checkIds)
            }
            return true
        }

        if (!checkIds(ast.root)) {
            return { success: false, error: 'Duplicate node IDs found' }
        }

        return { success: true, data: true }
    } catch (error) {
        return { success: false, error: `Validation error: ${error}` }
    }
}

function getNodeTypeStats(ast: DocumentAST): Record<string, number> {
    const stats: Record<string, number> = {}
    traverse(ast, (node) => {
        stats[node.type] = (stats[node.type] || 0) + 1
    })

    return stats
}

function addNode(
    ast: DocumentAST,
    node: ASTNode,
    parentId?: string,
    index?: number
): ASTOperationResult<DocumentAST> {
    try {
        const newAST = { ...ast }

        if (parentId) {
            const parent = findNodeById(newAST, parentId)
            if (!parent) {
                return { success: false, error: `Parent node ${parentId} not found` }
            }
            if (!parent.children) parent.children = []
            if (index !== undefined) {
                parent.children.splice(index, 0, node)
            } else {
                parent.children.push(node)
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

        return { success: true, ast: newAST }
    } catch (error) {
        return { success: false, error: `Add node error: ${error}` }
    }
}

function removeNode(ast: DocumentAST, nodeId: string): ASTOperationResult<DocumentAST> {
    try {
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

        const removed = removeFromParent(newAST.root)
        if (!removed) {
            return { success: false, error: `Node ${nodeId} not found` }
        }

        // 更新元数据
        if (newAST.metadata) {
            newAST.metadata.updatedAt = new Date().toISOString()
        }

        return { success: true, ast: newAST }
    } catch (error) {
        return { success: false, error: `Remove node error: ${error}` }
    }
}

function updateNode(
    ast: DocumentAST,
    nodeId: string,
    updates: Partial<ASTNode>
): ASTOperationResult<DocumentAST> {
    try {
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

        const updated = updateNodeRecursive(newAST.root)
        if (!updated) {
            return { success: false, error: `Node ${nodeId} not found` }
        }

        // 更新元数据
        if (newAST.metadata) {
            newAST.metadata.updatedAt = new Date().toISOString()
        }

        return { success: true, ast: newAST }
    } catch (error) {
        return { success: false, error: `Update node error: ${error}` }
    }
}

function moveNode(
    ast: DocumentAST,
    nodeId: string,
    newParentId: string,
    newIndex: number
): ASTOperationResult<DocumentAST> {
    try {
        // 先删除节点
        const removeResult = removeNode(ast, nodeId)
        if (!removeResult.success) {
            return removeResult
        }

        // 找到要移动的节点
        let nodeToMove: ASTNode | null = null
        traverse(ast, (node) => {
            if (node.id === nodeId) {
                nodeToMove = node
            }
        })

        if (!nodeToMove) {
            return { success: false, error: `Node ${nodeId} not found in original AST` }
        }

        // 添加到新位置
        return addNode(removeResult.ast!, nodeToMove, newParentId, newIndex)
    } catch (error) {
        return { success: false, error: `Move node error: ${error}` }
    }
}

function duplicateNode(
    ast: DocumentAST,
    nodeId: string,
    newParentId?: string
): ASTOperationResult<DocumentAST> {
    try {
        const originalNode = findNodeById(ast, nodeId)
        if (!originalNode) {
            return { success: false, error: `Node ${nodeId} not found` }
        }

        // 创建新节点
        const newNode = cloneNode(originalNode)
        newNode.id = `${originalNode.id}_copy_${Date.now()}`
        newNode.metadata = {
            ...newNode.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // 递归更新子节点ID
        updateChildrenIds(newNode)

        return addNode(ast, newNode, newParentId)
    } catch (error) {
        return { success: false, error: `Duplicate node error: ${error}` }
    }
}

function updateChildrenIds(node: ASTNode): void {
    if (node.children) {
        node.children.forEach((child, index) => {
            // const oldId = child.id
            child.id = `${node.id}_child_${index}_${Date.now()}`
            child.parent = node.id

            // 递归更新子节点
            updateChildrenIds(child)
        })
    }
}

function createRichTextNode(
    type: string,
    content?: string,
    attributes?: any,
    position?: any
): RichTextNode {
    return {
        id: generateRandomId(),
        type: type as any,
        content,
        attributes,
        position: position || { x: 0, y: 0 },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }
}

function createGraphNode(
    label: string,
    nodeType?: string,
    properties?: any,
    position?: any
): GraphNode {
    return {
        id: 'graph_' + generateRandomId(),
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

function createGraphEdge(
    source: string,
    target: string,
    label?: string,
    edgeType?: string
): GraphEdge {
    return {
        id: 'edge_' + generateRandomId(),
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

function calculateNodePosition(ast: DocumentAST, nodeId: string): NodePosition | null {
    const path = getNodePath(ast, nodeId)
    if (!path) return null

    // TODO: 这里应该实现更复杂的位置计算逻辑
    // 目前返回一个简化的实现
    return {
        start: 0,
        end: 0,
        nodeId,
        path
    }
}

function findNodeAtPosition(ast: DocumentAST, position: number): ASTNode | null {
    // TODO: 这里应该实现根据位置查找节点的逻辑
    // 目前返回null
    return null
}

function getAncestors(ast: DocumentAST, nodeId: string): ASTNode[] {
    const ancestors: ASTNode[] = []
    const path = getNodePath(ast, nodeId)

    if (path) {
        let current: ASTNode = ast.root
        for (let i = 0; i < path.length - 1; i++) {
            const index = path[i]
            if (current.children && current.children[index]) {
                ancestors.push(current.children[index])
                current = current.children[index]
            }
        }
    }

    return ancestors
}

function getDescendants(ast: DocumentAST, nodeId: string): ASTNode[] {
    const descendants: ASTNode[] = []
    const node = findNodeById(ast, nodeId)

    if (node && node.children) {
        const collect = (nodes: ASTNode[]) => {
            nodes.forEach(child => {
                descendants.push(child)
                if (child.children) {
                    collect(child.children)
                }
            })
        }
        collect(node.children)
    }

    return descendants
}

function getSiblings(ast: DocumentAST, nodeId: string): ASTNode[] {
    const path = getNodePath(ast, nodeId)
    if (!path || path.length === 0) return []

    const parentPath = path.slice(0, -1)
    const parent = getNodeByPath(ast, parentPath)

    if (parent && parent.children) {
        return parent.children.filter(child => child.id !== nodeId)
    }

    return []
}

/**
 * 序列化AST
 */
function serialize(ast: DocumentAST): string {
    return JSON.stringify(ast, null, 2)
}

/**
 * 反序列化AST
 */
function deserialize(data: string): DocumentAST {
    return JSON.parse(data)
}

/**
 * 比较两个AST
 */
function compareAST(ast1: DocumentAST, ast2: DocumentAST): {
    added: ASTNode[]
    removed: ASTNode[]
    modified: { nodeId: string; changes: any }[]
} {
    const added: ASTNode[] = []
    const removed: ASTNode[] = []
    const modified: { nodeId: string; changes: any }[] = []

    const nodes1 = new Map<string, ASTNode>()
    const nodes2 = new Map<string, ASTNode>()

    // 收集所有节点
    traverse(ast1, (node) => nodes1.set(node.id, node))
    traverse(ast2, (node) => nodes2.set(node.id, node))

    // 找出添加的节点
    nodes2.forEach((node, id) => {
        if (!nodes1.has(id)) {
            added.push(node)
        }
    })

    // 找出删除的节点
    nodes1.forEach((node, id) => {
        if (!nodes2.has(id)) {
            removed.push(node)
        }
    })

    // 找出修改的节点
    nodes1.forEach((node1, id) => {
        const node2 = nodes2.get(id)
        if (node2 && JSON.stringify(node1) !== JSON.stringify(node2)) {
            modified.push({
                nodeId: id,
                changes: { from: node1, to: node2 }
            })
        }
    })

    return { added, removed, modified }
}

/**
 * 创建选择范围
 */
function createSelection(
    nodeIds: string[] = [],
    range?: { start: number; end: number; nodeId: string }
): Selection {
    if (range) {
        return {
            nodeIds,
            range,
            type: nodeIds.length > 0 ? 'mixed' : 'text'
        }
    }
    return {
        nodeIds,
        type: 'node'
    }
}

export {
    createDocumentAST,
    findNode,
    findNodeById,
    traverse,
    getNodePath,
    getNodeByPath,
    cloneNode,
    validateAST,
    getNodeTypeStats,
    addNode,
    removeNode,
    updateNode,
    moveNode,
    duplicateNode,
    createRichTextNode,
    createGraphNode,
    createGraphEdge,
    calculateNodePosition,
    findNodeAtPosition,
    getAncestors,
    getDescendants,
    getSiblings,
    serialize,
    deserialize,
    compareAST,
    createSelection,
    updateChildrenIds,
}
