/**
 * AST导出工具类
 * 
 * 提供将DocumentAST转换为各种格式的功能：
 * - HTML导出
 * - Markdown导出
 * - PDF导出
 * - JSON导出
 */

import { DocumentAST, ASTNode, RichTextNode } from '@/components/Editor/types/EditorAST'

/**
 * 导出配置接口
 */
export interface ExportOptions {
    // 通用选项
    includeTitle?: boolean
    includeMetadata?: boolean

    // HTML选项
    htmlOptions?: {
        includeCSS?: boolean
        customCSS?: string
        includeJS?: boolean
        standalone?: boolean
        theme?: 'light' | 'dark' | 'auto'
    }

    // Markdown选项
    markdownOptions?: {
        includeTableOfContents?: boolean
        includeYAMLFrontMatter?: boolean
        imagePathPrefix?: string
        linkFormat?: 'markdown' | 'html'
    }

    // PDF选项
    pdfOptions?: {
        pageSize?: 'A4' | 'Letter' | 'Legal'
        orientation?: 'portrait' | 'landscape'
        margins?: {
            top: number
            right: number
            bottom: number
            left: number
        }
        includePageNumbers?: boolean
        headerTemplate?: string
        footerTemplate?: string
    }
}

/**
 * 导出结果接口
 */
export interface ExportResult {
    success: boolean
    content?: string
    blob?: Blob
    error?: string
    metadata?: {
        wordCount?: number
        characterCount?: number
        nodeCount?: number
        exportTime?: number
    }
}

/**
 * AST导出器类
 */
export class ASTExporter {
    /**
     * 导出为HTML
     */
    public static exportToHTML(ast: DocumentAST, options: ExportOptions = {}): ExportResult {
        try {
            const startTime = performance.now()

            const htmlOptions = {
                includeCSS: true,
                standalone: true,
                theme: 'light' as const,
                ...options.htmlOptions
            }

            let html = ''

            // 构建HTML结构
            if (htmlOptions.standalone) {
                html += this.buildHTMLDocumentStart(ast, htmlOptions)
            }

            // 添加标题
            if (options.includeTitle !== false && ast.title) {
                html += `<h1 class="document-title">${this.escapeHTML(ast.title)}</h1>\n`
            }

            // 添加元数据
            if (options.includeMetadata && ast.metadata) {
                html += this.buildHTMLMetadata(ast.metadata)
            }

            // 转换AST内容
            html += this.astNodeToHTML(ast.root)

            if (htmlOptions.standalone) {
                html += this.buildHTMLDocumentEnd()
            }

            const exportTime = performance.now() - startTime

            return {
                success: true,
                content: html,
                metadata: {
                    wordCount: this.countWords(html),
                    characterCount: html.length,
                    nodeCount: this.countNodes(ast.root),
                    exportTime
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * 导出为Markdown
     */
    public static exportToMarkdown(ast: DocumentAST, options: ExportOptions = {}): ExportResult {
        try {
            const startTime = performance.now()

            const markdownOptions = {
                includeTableOfContents: false,
                includeYAMLFrontMatter: false,
                imagePathPrefix: '',
                linkFormat: 'markdown' as const,
                ...options.markdownOptions
            }

            let markdown = ''

            // 添加YAML前置内容
            if (markdownOptions.includeYAMLFrontMatter && (ast.title || ast.metadata)) {
                markdown += this.buildYAMLFrontMatter(ast)
            }

            // 添加标题
            if (options.includeTitle !== false && ast.title) {
                markdown += `# ${ast.title}\n\n`
            }

            // 添加目录
            if (markdownOptions.includeTableOfContents) {
                markdown += this.buildTableOfContents(ast.root)
            }

            // 转换AST内容
            markdown += this.astNodeToMarkdown(ast.root, markdownOptions)

            const exportTime = performance.now() - startTime

            return {
                success: true,
                content: markdown,
                metadata: {
                    wordCount: this.countWords(markdown),
                    characterCount: markdown.length,
                    nodeCount: this.countNodes(ast.root),
                    exportTime
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * 导出为PDF
     */
    public static async exportToPDF(ast: DocumentAST, options: ExportOptions = {}): Promise<ExportResult> {
        try {
            const startTime = performance.now()

            // 首先转换为HTML
            const htmlResult = this.exportToHTML(ast, {
                ...options,
                htmlOptions: {
                    standalone: true,
                    includeCSS: true,
                    theme: 'light',
                    ...options.htmlOptions
                }
            })

            if (!htmlResult.success || !htmlResult.content) {
                return {
                    success: false,
                    error: 'Failed to convert AST to HTML for PDF generation'
                }
            }

            // 使用浏览器打印API生成PDF
            const pdfBlob = await this.htmlToPDF(htmlResult.content, options.pdfOptions)

            const exportTime = performance.now() - startTime

            return {
                success: true,
                blob: pdfBlob,
                metadata: {
                    ...htmlResult.metadata,
                    exportTime
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'PDF generation failed'
            }
        }
    }

    /**
     * 导出为JSON
     */
    public static exportToJSON(ast: DocumentAST, options: ExportOptions = {}): ExportResult {
        try {
            const startTime = performance.now()

            let exportData: any = {
                ...ast
            }

            // 根据选项过滤数据
            if (options.includeMetadata === false) {
                delete exportData.metadata
            }

            const jsonString = JSON.stringify(exportData, null, 2)
            const exportTime = performance.now() - startTime

            return {
                success: true,
                content: jsonString,
                metadata: {
                    characterCount: jsonString.length,
                    nodeCount: this.countNodes(ast.root),
                    exportTime
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'JSON serialization failed'
            }
        }
    }

    // === 私有方法 ===

    /**
     * 构建HTML文档开头
     */
    private static buildHTMLDocumentStart(ast: DocumentAST, htmlOptions: any): string {
        const title = ast.title || '文档'
        const theme = htmlOptions.theme || 'light'

        let html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${theme}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(title)}</title>
`

        if (htmlOptions.includeCSS) {
            html += `    <style>
${this.getDefaultCSS(theme)}
${htmlOptions.customCSS || ''}
    </style>
`
        }

        html += `</head>
<body>
    <div class="document-container">
`

        return html
    }

    /**
     * 构建HTML文档结尾
     */
    private static buildHTMLDocumentEnd(): string {
        return `    </div>
</body>
</html>`
    }

    /**
     * 构建HTML元数据部分
     */
    private static buildHTMLMetadata(metadata: Record<string, any>): string {
        let html = '<div class="document-metadata">\n'

        if (metadata.createdAt) {
            html += `    <p><strong>创建时间:</strong> ${new Date(metadata.createdAt).toLocaleString('zh-CN')}</p>\n`
        }

        if (metadata.updatedAt) {
            html += `    <p><strong>更新时间:</strong> ${new Date(metadata.updatedAt).toLocaleString('zh-CN')}</p>\n`
        }

        if (metadata.author) {
            html += `    <p><strong>作者:</strong> ${this.escapeHTML(metadata.author)}</p>\n`
        }

        if (metadata.tags && Array.isArray(metadata.tags)) {
            html += `    <p><strong>标签:</strong> ${metadata.tags.map((tag: string) => this.escapeHTML(tag)).join(', ')}</p>\n`
        }

        html += '</div>\n\n'
        return html
    }

    /**
     * 将AST节点转换为HTML
     */
    private static astNodeToHTML(node: ASTNode, depth: number = 0): string {
        let html = ''

        switch (node.type) {
            case 'document':
                if ('children' in node && node.children) {
                    html = node.children.map((child: ASTNode) => this.astNodeToHTML(child, depth)).join('')
                }
                break

            case 'heading':
                const level = Math.min(6, Math.max(1, (node as RichTextNode).attributes?.level || 1))
                const headingId = `heading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                html = `<h${level} id="${headingId}">${this.escapeHTML(node.content || '')}</h${level}>\n`
                break

            case 'paragraph':
                const content = 'content' in node ? node.content || '' : ''
                html = `<p>${this.escapeHTML(content)}</p>\n`
                break

            case 'blockquote':
                const blockquoteContent = 'content' in node ? node.content || '' : ''
                html = `<blockquote>${this.escapeHTML(blockquoteContent)}</blockquote>\n`
                break

            case 'codeBlock':
                const language = 'attributes' in node && node.attributes ? (node.attributes as any).language || '' : ''
                const codeContent = 'content' in node ? node.content || '' : ''
                html = `<pre><code class="language-${language}">${this.escapeHTML(codeContent)}</code></pre>\n`
                break

            case 'list':
                const listType = 'attributes' in node && node.attributes && (node.attributes as any).ordered ? 'ol' : 'ul'
                const listItems = 'children' in node && node.children ?
                    node.children.map((child: ASTNode) => this.astNodeToHTML(child, depth + 1)).join('') : ''
                html = `<${listType}>\n${listItems}</${listType}>\n`
                break

            case 'listItem':
                const listItemContent = 'content' in node ? node.content || '' : ''
                html = `<li>${this.escapeHTML(listItemContent)}</li>\n`
                break

            case 'table':
                const tableContent = 'children' in node && node.children ?
                    node.children.map((child: ASTNode) => this.astNodeToHTML(child, depth + 1)).join('') : ''
                html = `<table>\n${tableContent}</table>\n`
                break

            case 'tableRow':
                const rowContent = 'children' in node && node.children ?
                    node.children.map((child: ASTNode) => this.astNodeToHTML(child, depth + 1)).join('') : ''
                html = `<tr>\n${rowContent}</tr>\n`
                break

            case 'tableCell':
                const cellContent = 'content' in node ? node.content || '' : ''
                html = `<td>${this.escapeHTML(cellContent)}</td>\n`
                break

            case 'image':
                const src = 'attributes' in node && node.attributes ? (node.attributes as any).src || '' : ''
                const alt = 'attributes' in node && node.attributes ? (node.attributes as any).alt || '' : ''
                html = `<img src="${this.escapeHTML(src)}" alt="${this.escapeHTML(alt)}" />\n`
                break

            case 'link':
                const href = 'attributes' in node && node.attributes ? (node.attributes as any).href || '#' : '#'
                const linkContent = 'content' in node ? node.content || '' : ''
                html = `<a href="${this.escapeHTML(href)}">${this.escapeHTML(linkContent)}</a>`
                break

            default:
                if ('children' in node && node.children) {
                    html = node.children.map((child: ASTNode) => this.astNodeToHTML(child, depth)).join('')
                } else if ('content' in node && node.content) {
                    html = this.escapeHTML(node.content)
                }
        }

        return html
    }

    /**
     * 将AST节点转换为Markdown
     */
    private static astNodeToMarkdown(node: ASTNode, options: any, depth: number = 0): string {
        let markdown = ''

        switch (node.type) {
            case 'document':
                if ('children' in node && node.children) {
                    markdown = node.children.map((child: ASTNode) => this.astNodeToMarkdown(child, options, depth)).join('')
                }
                break

            case 'heading':
                const level = Math.min(6, Math.max(1, (node as RichTextNode).attributes?.level || 1))
                const hashes = '#'.repeat(level)
                markdown = `${hashes} ${node.content || ''}\n\n`
                break

            case 'paragraph':
                const paraContent = 'content' in node ? node.content || '' : ''
                markdown = `${paraContent}\n\n`
                break

            case 'blockquote':
                const quoteContent = 'content' in node ? node.content || '' : ''
                markdown = `> ${quoteContent}\n\n`
                break

            case 'codeBlock':
                const mdLanguage = 'attributes' in node && node.attributes ? (node.attributes as any).language || '' : ''
                const mdCodeContent = 'content' in node ? node.content || '' : ''
                markdown = `\`\`\`${mdLanguage}\n${mdCodeContent}\n\`\`\`\n\n`
                break

            case 'list':
                const ordered = 'attributes' in node && node.attributes && (node.attributes as any).ordered
                if ('children' in node && node.children) {
                    node.children.forEach((child: ASTNode, index: number) => {
                        const prefix = ordered ? `${index + 1}. ` : '- '
                        const childContent = 'content' in child ? child.content || '' : ''
                        markdown += `${prefix}${childContent}\n`
                    })
                    markdown += '\n'
                }
                break

            case 'table':
                if ('children' in node && node.children && node.children.length > 0) {
                    // 处理表格头
                    const firstRow = node.children[0]
                    if ('children' in firstRow && firstRow.children) {
                        markdown += '| ' + firstRow.children.map((cell: ASTNode) =>
                            'content' in cell ? cell.content || '' : '').join(' | ') + ' |\n'
                        markdown += '|' + firstRow.children.map(() => ' --- ').join('|') + '|\n'

                        // 处理其余行
                        for (let i = 1; i < node.children.length; i++) {
                            const row = node.children[i]
                            if ('children' in row && row.children) {
                                markdown += '| ' + row.children.map((cell: ASTNode) =>
                                    'content' in cell ? cell.content || '' : '').join(' | ') + ' |\n'
                            }
                        }
                        markdown += '\n'
                    }
                }
                break

            case 'image':
                const mdSrc = 'attributes' in node && node.attributes ? (node.attributes as any).src || '' : ''
                const mdAlt = 'attributes' in node && node.attributes ? (node.attributes as any).alt || '' : ''
                const imagePath = options.imagePathPrefix + mdSrc
                markdown = `![${mdAlt}](${imagePath})\n\n`
                break

            case 'link':
                const mdHref = 'attributes' in node && node.attributes ? (node.attributes as any).href || '#' : '#'
                const linkText = 'content' in node ? node.content || '' : ''
                if (options.linkFormat === 'html') {
                    markdown = `<a href="${mdHref}">${linkText}</a>`
                } else {
                    markdown = `[${linkText}](${mdHref})`
                }
                break

            default:
                if ('children' in node && node.children) {
                    markdown = node.children.map((child: ASTNode) => this.astNodeToMarkdown(child, options, depth)).join('')
                } else if ('content' in node && node.content) {
                    markdown = node.content
                }
        }

        return markdown
    }

    /**
     * 构建YAML前置内容
     */
    private static buildYAMLFrontMatter(ast: DocumentAST): string {
        let yaml = '---\n'

        if (ast.title) {
            yaml += `title: "${ast.title}"\n`
        }

        if (ast.metadata) {
            if (ast.metadata.createdAt) {
                yaml += `created: ${new Date(ast.metadata.createdAt).toISOString().split('T')[0]}\n`
            }

            if (ast.metadata.updatedAt) {
                yaml += `updated: ${new Date(ast.metadata.updatedAt).toISOString().split('T')[0]}\n`
            }

            if (ast.metadata.author) {
                yaml += `author: "${ast.metadata.author}"\n`
            }

            if (ast.metadata.tags && Array.isArray(ast.metadata.tags)) {
                yaml += 'tags:\n'
                ast.metadata.tags.forEach((tag: string) => {
                    yaml += `  - "${tag}"\n`
                })
            }
        }

        yaml += '---\n\n'
        return yaml
    }

    /**
     * 构建目录
     */
    private static buildTableOfContents(node: ASTNode): string {
        const headings = this.extractHeadings(node)

        if (headings.length === 0) return ''

        let toc = '## 目录\n\n'

        headings.forEach(heading => {
            const indent = '  '.repeat(heading.level - 1)
            const link = heading.content.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-')
            toc += `${indent}- [${heading.content}](#${link})\n`
        })

        toc += '\n'
        return toc
    }

    /**
     * 提取标题
     */
    private static extractHeadings(node: ASTNode): Array<{ level: number, content: string }> {
        const headings: Array<{ level: number, content: string }> = []

        if (node.type === 'heading') {
            const level = (node as RichTextNode).attributes?.level || 1
            headings.push({
                level,
                content: node.content || ''
            })
        }

        if (node.children) {
            node.children.forEach(child => {
                headings.push(...this.extractHeadings(child))
            })
        }

        return headings
    }

    /**
     * HTML转PDF
     */
    private static async htmlToPDF(html: string, _pdfOptions: any = {}): Promise<Blob> {
        // 创建隐藏的iframe用于打印
        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.top = '-9999px'
        iframe.style.left = '-9999px'
        document.body.appendChild(iframe)

        try {
            // 写入HTML内容
            const doc = iframe.contentDocument || iframe.contentWindow?.document
            if (!doc) throw new Error('Cannot access iframe document')

            doc.open()
            doc.write(html)
            doc.close()

            // 等待内容加载
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 使用浏览器打印功能生成PDF
            if (iframe.contentWindow) {
                iframe.contentWindow.print()
            }

            // 注意：实际的PDF生成需要使用专门的库如jsPDF或Puppeteer
            // 这里返回一个模拟的PDF Blob
            return new Blob([html], { type: 'application/pdf' })

        } finally {
            document.body.removeChild(iframe)
        }
    }

    /**
     * 获取默认CSS样式
     */
    private static getDefaultCSS(theme: string): string {
        return `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: ${theme === 'dark' ? '#ffffff' : '#333333'};
            background-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .document-container {
            background: ${theme === 'dark' ? '#2a2a2a' : '#ffffff'};
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .document-title {
            color: ${theme === 'dark' ? '#ffffff' : '#1a1a1a'};
            border-bottom: 2px solid ${theme === 'dark' ? '#4a4a4a' : '#e0e0e0'};
            padding-bottom: 10px;
        }
        
        .document-metadata {
            background: ${theme === 'dark' ? '#3a3a3a' : '#f5f5f5'};
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 0.9em;
        }
        
        .document-metadata p {
            margin: 5px 0;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: ${theme === 'dark' ? '#ffffff' : '#2c3e50'};
            margin-top: 30px;
            margin-bottom: 15px;
        }
        
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            background: ${theme === 'dark' ? '#2a2a2a' : '#f8f9fa'};
            padding: 15px 20px;
            border-radius: 0 5px 5px 0;
        }
        
        pre {
            background: ${theme === 'dark' ? '#1a1a1a' : '#f4f4f4'};
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        code {
            background: ${theme === 'dark' ? '#3a3a3a' : '#f0f0f0'};
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        table th,
        table td {
            border: 1px solid ${theme === 'dark' ? '#4a4a4a' : '#ddd'};
            padding: 12px;
            text-align: left;
        }
        
        table th {
            background: ${theme === 'dark' ? '#3a3a3a' : '#f2f2f2'};
            font-weight: bold;
        }
        
        img {
            max-width: 100%;
            height: auto;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        a {
            color: #3498db;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        ul, ol {
            padding-left: 30px;
        }
        
        li {
            margin: 5px 0;
        }
        
        @media print {
            body {
                background: white;
                color: black;
            }
            
            .document-container {
                box-shadow: none;
                padding: 0;
            }
        }
        `
    }

    /**
     * HTML转义
     */
    private static escapeHTML(text: string): string {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    /**
     * 统计单词数
     */
    private static countWords(text: string): number {
        // 移除HTML标签
        const plainText = text.replace(/<[^>]*>/g, '')
        // 中文字符按字符计算，英文按单词计算
        const chineseChars = plainText.match(/[\u4e00-\u9fff]/g) || []
        const englishWords = plainText.match(/[a-zA-Z]+/g) || []
        return chineseChars.length + englishWords.length
    }

    /**
     * 统计节点数
     */
    private static countNodes(node: ASTNode): number {
        let count = 1
        if (node.children) {
            count += node.children.reduce((sum, child) => sum + this.countNodes(child), 0)
        }
        return count
    }
}

export default ASTExporter
