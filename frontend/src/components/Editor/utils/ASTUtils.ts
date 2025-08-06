import { ASTNode, DocumentAST, DocumentMetadata } from "@/components/Editor/types/EditorAST";

/**
 * AST工具类
 */
export class ASTUtils {
    /**
     * 创建文档AST
     */
    static createDocument(
        id: string,
        title?: string,
        metadata?: DocumentMetadata,
        version: string = '1.0.0'
    ): DocumentAST {
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