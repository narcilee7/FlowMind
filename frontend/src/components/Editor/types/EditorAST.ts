/**
 * 编辑器AST数据结构定义
 */

/**
 * AST节点类型
 */
export type ASTNodeType = 
    | 'doc'           // 文档根节点
    | 'paragraph'     // 段落
    | 'heading'       // 标题
    | 'text'          // 文本
    | 'bold'          // 粗体
    | 'italic'        // 斜体
    | 'underline'     // 下划线
    | 'strikethrough' // 删除线
    | 'code'          // 行内代码
    | 'codeBlock'     // 代码块
    | 'link'          // 链接
    | 'image'         // 图片
    | 'list'          // 列表
    | 'listItem'      // 列表项
    | 'blockquote'    // 引用
    | 'table'         // 表格
    | 'tableRow'      // 表格行
    | 'tableCell'     // 表格单元格
    | 'horizontalRule' // 分割线
    | 'graphNode'     // 图谱节点
    | 'graphEdge'     // 图谱边
    | 'canvas'        // Canvas
    | 'aiBlock'       // AI生成块

/**
 * AST节点属性
 */
export interface ASTNodeAttrs {
    [key: string]: any
}

/**
 * AST节点
 */
export interface ASTNode {
    type: ASTNodeType
    attrs?: ASTNodeAttrs
    content?: ASTNode[]
    text?: string
    marks?: ASTMark[]
}

/**
 * AST标记
 */
export interface ASTMark {
    type: string
    attrs?: ASTNodeAttrs
}

/**
 * 文档AST
 */
export interface DocumentAST {
    version: string
    type: 'doc'
    content: ASTNode[]
    metadata?: DocumentMetadata
}

/**
 * 文档元数据
 */
export interface DocumentMetadata {
    title?: string
    author?: string
    createdAt?: string
    updatedAt?: string
    tags?: string[]
    sceneTemplate?: string
    editorType?: string
}

/**
 * AST操作类型
 */
export type ASTOperation = 
    | { type: 'insert'; pos: number; node: ASTNode }
    | { type: 'delete'; pos: number; length: number }
    | { type: 'replace'; pos: number; length: number; node: ASTNode }
    | { type: 'addMark'; pos: number; length: number; mark: ASTMark }
    | { type: 'removeMark'; pos: number; length: number; markType: string }

/**
 * AST历史记录
 */
export interface ASTHistory {
    operations: ASTOperation[]
    timestamp: number
    description?: string
}

/**
 * AST工具类
 */
export class ASTUtils {
    /**
     * 创建文档AST
     */
    static createDocument(content: ASTNode[] = [], metadata?: DocumentMetadata): DocumentAST {
        return {
            version: '1.0',
            type: 'doc',
            content,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...metadata
            }
        }
    }

    /**
     * 创建文本节点
     */
    static createTextNode(text: string, marks: ASTMark[] = []): ASTNode {
        return {
            type: 'text',
            text,
            marks
        }
    }

    /**
     * 创建段落节点
     */
    static createParagraphNode(content: ASTNode[] = []): ASTNode {
        return {
            type: 'paragraph',
            content
        }
    }

    /**
     * 创建标题节点
     */
    static createHeadingNode(level: number, content: ASTNode[] = []): ASTNode {
        return {
            type: 'heading',
            attrs: { level },
            content
        }
    }

    /**
     * 创建代码块节点
     */
    static createCodeBlockNode(code: string, language: string = ''): ASTNode {
        return {
            type: 'codeBlock',
            attrs: { language },
            content: [this.createTextNode(code)]
        }
    }

    /**
     * 创建链接节点
     */
    static createLinkNode(href: string, content: ASTNode[] = []): ASTNode {
        return {
            type: 'link',
            attrs: { href },
            content
        }
    }

    /**
     * 创建图片节点
     */
    static createImageNode(src: string, alt: string = ''): ASTNode {
        return {
            type: 'image',
            attrs: { src, alt }
        }
    }

    /**
     * 创建列表节点
     */
    static createListNode(ordered: boolean = false, content: ASTNode[] = []): ASTNode {
        return {
            type: 'list',
            attrs: { ordered },
            content
        }
    }

    /**
     * 创建列表项节点
     */
    static createListItemNode(content: ASTNode[] = []): ASTNode {
        return {
            type: 'listItem',
            content
        }
    }

    /**
     * 创建引用节点
     */
    static createBlockquoteNode(content: ASTNode[] = []): ASTNode {
        return {
            type: 'blockquote',
            content
        }
    }

    /**
     * 创建表格节点
     */
    static createTableNode(rows: number, cols: number): ASTNode {
        const tableRows: ASTNode[] = []
        
        for (let i = 0; i < rows; i++) {
            const cells: ASTNode[] = []
            for (let j = 0; j < cols; j++) {
                cells.push({
                    type: 'tableCell',
                    content: [this.createParagraphNode()]
                })
            }
            tableRows.push({
                type: 'tableRow',
                content: cells
            })
        }

        return {
            type: 'table',
            content: tableRows
        }
    }

    /**
     * 创建图谱节点
     */
    static createGraphNode(id: string, label: string, x: number, y: number): ASTNode {
        return {
            type: 'graphNode',
            attrs: { id, label, x, y }
        }
    }

    /**
     * 创建图谱边
     */
    static createGraphEdge(from: string, to: string, label?: string): ASTNode {
        return {
            type: 'graphEdge',
            attrs: { from, to, label }
        }
    }

    /**
     * 创建AI块节点
     */
    static createAIBlockNode(content: string, type: string = 'text'): ASTNode {
        return {
            type: 'aiBlock',
            attrs: { aiType: type },
            content: [this.createTextNode(content)]
        }
    }

    /**
     * 获取节点文本内容
     */
    static getNodeText(node: ASTNode): string {
        if (node.text) {
            return node.text
        }
        
        if (node.content) {
            return node.content.map(child => this.getNodeText(child)).join('')
        }
        
        return ''
    }

    /**
     * 查找节点
     */
    static findNode(ast: DocumentAST, predicate: (node: ASTNode) => boolean): ASTNode | null {
        const search = (nodes: ASTNode[]): ASTNode | null => {
            for (const node of nodes) {
                if (predicate(node)) {
                    return node
                }
                if (node.content) {
                    const found = search(node.content)
                    if (found) return found
                }
            }
            return null
        }
        
        return search(ast.content)
    }

    /**
     * 遍历节点
     */
    static traverse(ast: DocumentAST, visitor: (node: ASTNode, path: number[]) => void): void {
        const traverse = (nodes: ASTNode[], path: number[] = []) => {
            nodes.forEach((node, index) => {
                visitor(node, [...path, index])
                if (node.content) {
                    traverse(node.content, [...path, index])
                }
            })
        }
        
        traverse(ast.content)
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
        if (!ast || ast.type !== 'doc') {
            return false
        }
        
        if (!Array.isArray(ast.content)) {
            return false
        }
        
        return true
    }
} 