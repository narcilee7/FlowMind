/**
 * 表格视图适配器
 * 基于Handsontable实现，提供完整的表格编辑功能
 * 支持数据编辑、排序、过滤、导出等功能
 */

import { ViewAdapterOptions, TableViewAdapter as ITableViewAdapter } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, TableNode } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'

/**
 * 表格数据行
 */
interface TableRow {
    id: string
    data: any[]
    metadata?: Record<string, any>
}

/**
 * 表格列定义
 */
interface TableColumn {
    id: string
    title: string
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'custom'
    width?: number
    sortable?: boolean
    filterable?: boolean
    required?: boolean
    options?: any[]
    format?: string
}

/**
 * 表格视图适配器实现
 */
export class TableViewAdapter implements ITableViewAdapter {
    public type: EditorType.TABLE = EditorType.TABLE
    public sceneTemplate: SceneTemplate
    
    private element: HTMLElement | null = null
    private options: ViewAdapterOptions | null = null
    private hot: any = null // Handsontable实例
    private columns: TableColumn[] = []
    private data: TableRow[] = []
    private eventCallbacks: Map<string, Function[]> = new Map()
    private isDestroyed = false
    private currentSelection: Selection = { nodeIds: [], type: 'node' }

    /**
     * 构造函数
     */
    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
    }

    /**
     * 创建适配器
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        try {
            this.element = element
            this.options = options

            // 动态导入Handsontable
            const { default: Handsontable } = await import('handsontable')
            // 动态加载CSS
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = '/node_modules/handsontable/dist/handsontable.full.css'
            document.head.appendChild(link)

            // 初始化表格数据
            this.initializeTableData()

            // 创建Handsontable实例
            this.hot = new Handsontable(element, {
                data: this.getTableData(),
                colHeaders: this.getColumnHeaders(),
                columns: this.getColumnDefinitions(),
                licenseKey: 'non-commercial-and-evaluation',
                width: '100%',
                height: '100%',
                rowHeaders: true,
                stretchH: 'all',
                readOnly: false,
                allowInsertRow: true,
                allowInsertColumn: true,
                allowRemoveRow: true,
                allowRemoveColumn: true,
                selectionMode: 'multiple',
                columnSorting: { sortEmptyCells: false, indicator: true },
                filters: true,
                dropdownMenu: true,
                afterChange: (changes: any, source: string) => {
                this.handleDataChange(changes, source)
            },
            afterSelection: (r: number, c: number, r2: number, c2: number) => {
                this.handleSelectionChange(r, c, r2, c2)
            },
            afterOnCellMouseDown: (event: MouseEvent, coords: any) => {
                this.handleCellClick(coords)
            }
            })

            // 设置主题样式
            this.applyTheme(options.theme || 'auto')
        } catch (error) {
            console.error('Failed to create TableViewAdapter:', error)
            throw new Error(`Failed to create TableViewAdapter: ${error}`)
        }
    }

    /**
     * 销毁适配器
     */
    destroy(): void {
        if (this.isDestroyed) return

        if (this.hot) {
            this.hot.destroy()
            this.hot = null
        }

        this.element = null
        this.options = null
        this.columns = []
        this.data = []
        this.eventCallbacks.clear()
        this.isDestroyed = true
    }

    /**
     * 渲染AST
     */
    render(ast: DocumentAST): void {
        if (!this.hot || this.isDestroyed) return

        const tableData = this.parseASTToTableData(ast)
        this.columns = tableData.columns
        this.data = tableData.data

        this.hot.loadData(this.getTableData())
        this.hot.updateSettings({
            colHeaders: this.getColumnHeaders(),
            columns: this.getColumnDefinitions()
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
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.hot || this.isDestroyed) return

        if (node.type === 'table') {
            const tableData = this.parseASTToTableData({ root: node } as DocumentAST)
            this.columns = tableData.columns
            this.data = tableData.data
            this.hot.loadData(this.getTableData())
        } else if (node.type === 'tableRow') {
            const rowIndex = this.findRowIndexById(nodeId)
            if (rowIndex !== -1) {
                const rowData = this.astNodeToTableRow(node)
                this.data[rowIndex] = rowData
                this.hot.setDataAtRow(rowIndex, rowData.data)
            }
        }
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        if (!this.hot || this.isDestroyed) return

        const rowIndex = this.findRowIndexById(nodeId)
        if (rowIndex !== -1) {
            this.hot.alter('remove_row', rowIndex, 1)
        }
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.hot || this.isDestroyed) return

        if (node.type === 'tableRow') {
            const rowData = this.astNodeToTableRow(node)
            const insertIndex = index !== undefined ? index : this.data.length
            this.hot.alter('insert_row', insertIndex, 1)
            this.hot.setDataAtRow(insertIndex, rowData.data)
        }
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.hot || this.isDestroyed) return

        this.currentSelection = selection

        if (selection.type === 'node' && selection.nodeIds.length > 0) {
            const rowIndices = selection.nodeIds
                .map(id => this.findRowIndexById(id))
                .filter(index => index !== -1)
            
            if (rowIndices.length > 0) {
                this.hot.selectRows(rowIndices)
            }
        }
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.hot || this.isDestroyed) {
            return { nodeIds: [], type: 'node' }
        }

        const selected = this.hot.getSelected()
        if (selected && selected.length > 0) {
            const [startRow, startCol, endRow, endCol] = selected[0]
            const nodeIds: string[] = []
            
            for (let row = startRow; row <= endRow; row++) {
                if (this.data[row]) {
                    nodeIds.push(this.data[row].id)
                }
            }
            
            return { nodeIds, type: 'node' }
        }
        
        return { nodeIds: [], type: 'node' }
    }

    /**
     * 设置焦点
     */
    focus(): void {
        if (this.hot && !this.isDestroyed) {
            this.hot.selectCell(0, 0)
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        if (this.hot && !this.isDestroyed) {
            this.hot.deselectCell()
        }
    }

    /**
     * 是否获得焦点
     */
    isFocused(): boolean {
        return this.hot ? this.hot.isListening() : false
    }

    // 表格特有方法
    /**
     * 添加行
     */
    addRow(index?: number): void {
        if (!this.hot || this.isDestroyed) return

        const insertIndex = index !== undefined ? index : this.data.length
        this.hot.alter('insert_row', insertIndex, 1)
        
        const newRow: TableRow = {
            id: this.generateRowId(),
            data: new Array(this.columns.length).fill(''),
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }
        
        this.data.splice(insertIndex, 0, newRow)
        this.hot.setDataAtRow(insertIndex, newRow.data)
    }

    /**
     * 添加列
     */
    addColumn(index?: number): void {
        if (!this.hot || this.isDestroyed) return

        const insertIndex = index !== undefined ? index : this.columns.length
        this.hot.alter('insert_col', insertIndex, 1)
        
        const newColumn: TableColumn = {
            id: this.generateColumnId(),
            title: `Column ${this.columns.length + 1}`,
            type: 'text',
            sortable: true,
            filterable: true
        }
        
        this.columns.splice(insertIndex, 0, newColumn)
        
        this.data.forEach(row => {
            row.data.splice(insertIndex, 0, '')
        })
        
        this.hot.updateSettings({
            colHeaders: this.getColumnHeaders(),
            columns: this.getColumnDefinitions()
        })
    }

    /**
     * 删除行
     */
    removeRow(index: number): void {
        if (!this.hot || this.isDestroyed) return

        if (index >= 0 && index < this.data.length) {
            this.hot.alter('remove_row', index, 1)
            this.data.splice(index, 1)
        }
    }

    /**
     * 删除列
     */
    removeColumn(index: number): void {
        if (!this.hot || this.isDestroyed) return

        if (index >= 0 && index < this.columns.length) {
            this.hot.alter('remove_col', index, 1)
            this.columns.splice(index, 1)
            
            this.data.forEach(row => {
                row.data.splice(index, 1)
            })
            
            this.hot.updateSettings({
                colHeaders: this.getColumnHeaders(),
                columns: this.getColumnDefinitions()
            })
        }
    }

    /**
     * 更新单元格
     */
    updateCell(row: number, col: number, value: string): void {
        if (!this.hot || this.isDestroyed) return

        if (row >= 0 && row < this.data.length && col >= 0 && col < this.columns.length) {
            this.hot.setDataAtCell(row, col, value)
            
            if (this.data[row]) {
                this.data[row].data[col] = value
                this.data[row].metadata = {
                    ...this.data[row].metadata,
                    updatedAt: new Date().toISOString()
                }
            }
        }
    }

    /**
     * 按列排序
     */
    sortByColumn(column: number, direction: 'asc' | 'desc'): void {
        if (!this.hot || this.isDestroyed) return

        if (column >= 0 && column < this.columns.length) {
            this.hot.getPlugin('columnSorting').sort(column, direction)
        }
    }

    /**
     * 过滤行
     */
    filterRows(filter: (row: any[]) => boolean): void {
        if (!this.hot || this.isDestroyed) return

        const filteredData = this.data.filter(row => filter(row.data))
        this.hot.loadData(filteredData.map(row => row.data))
    }

    /**
     * 导出数据
     */
    exportData(format: 'csv' | 'json' | 'excel'): string {
        if (!this.hot || this.isDestroyed) return ''

        switch (format) {
            case 'csv':
                return this.hot.getDataAsCsv()
            case 'json':
                return JSON.stringify(this.data, null, 2)
            case 'excel':
                return this.hot.getDataAsCsv() // 临时使用CSV格式
            default:
                return ''
        }
    }

    // 视图控制方法
    scrollToNode(nodeId: string): void {
        if (!this.hot || this.isDestroyed) return

        const rowIndex = this.findRowIndexById(nodeId)
        if (rowIndex !== -1) {
            this.hot.scrollTo(rowIndex, 0)
        }
    }

    zoomIn(): void {
        console.log('Zoom in table view')
    }

    zoomOut(): void {
        console.log('Zoom out table view')
    }

    resetZoom(): void {
        console.log('Reset zoom table view')
    }

    fitToView(): void {
        if (!this.hot || this.isDestroyed) return
        this.hot.render()
    }

    getViewport(): any {
        if (!this.hot || this.isDestroyed) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const container = this.hot.rootElement
        return {
            x: 0,
            y: 0,
            width: container.clientWidth,
            height: container.clientHeight,
            zoom: 1
        }
    }

    setViewport(viewport: any): void {
        console.log('Set viewport:', viewport)
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

    onCellEdit(callback: (row: number, col: number, value: string) => void): void {
        this.addEventListener('cellEdit', callback)
    }

    onRowSelect(callback: (rowIndex: number) => void): void {
        this.addEventListener('rowSelect', callback)
    }

    // 私有方法
    private addEventListener(event: string, callback: Function): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, [])
        }
        this.eventCallbacks.get(event)!.push(callback)
    }

    private triggerEvent(event: string, data?: any): void {
        const callbacks = this.eventCallbacks.get(event)
        if (callbacks) {
            callbacks.forEach(callback => callback(data))
        }
    }

    private initializeTableData(): void {
        this.columns = [
            { id: 'col1', title: 'Column 1', type: 'text', sortable: true, filterable: true },
            { id: 'col2', title: 'Column 2', type: 'text', sortable: true, filterable: true },
            { id: 'col3', title: 'Column 3', type: 'text', sortable: true, filterable: true }
        ]

        this.data = [
            { id: 'row1', data: ['Data 1-1', 'Data 1-2', 'Data 1-3'], metadata: { createdAt: new Date().toISOString() } },
            { id: 'row2', data: ['Data 2-1', 'Data 2-2', 'Data 2-3'], metadata: { createdAt: new Date().toISOString() } },
            { id: 'row3', data: ['Data 3-1', 'Data 3-2', 'Data 3-3'], metadata: { createdAt: new Date().toISOString() } }
        ]
    }

    private getTableData(): any[][] {
        return this.data.map(row => row.data)
    }

    private getColumnHeaders(): string[] {
        return this.columns.map(col => col.title)
    }

    private getColumnDefinitions(): any[] {
        return this.columns.map(col => ({
            data: col.id,
            title: col.title,
            type: col.type,
            width: col.width,
            readOnly: false,
            allowInvalid: false
        }))
    }

    private handleDataChange(changes: any[], source: string): void {
        if (!changes) return

        changes.forEach(([row, prop, oldValue, newValue]) => {
            const colIndex = this.getColumnIndexById(prop)
            if (colIndex !== -1 && row < this.data.length) {
                this.data[row].data[colIndex] = newValue
                this.data[row].metadata = {
                    ...this.data[row].metadata,
                    updatedAt: new Date().toISOString()
                }
                
                this.triggerEvent('cellEdit', { row, col: colIndex, value: newValue })
            }
        })

        this.triggerEvent('viewChange', { type: 'dataChange', changes })
    }

    private handleSelectionChange(startRow: number, startCol: number, endRow: number, endCol: number): void {
        const nodeIds: string[] = []
        for (let row = startRow; row <= endRow; row++) {
            if (this.data[row]) {
                nodeIds.push(this.data[row].id)
            }
        }

        this.currentSelection = { nodeIds, type: 'node' }
        this.triggerEvent('selectionChange', this.currentSelection)
        this.triggerEvent('rowSelect', startRow)
    }

    private handleCellClick(coords: any): void {
        const { row } = coords
        if (row >= 0 && row < this.data.length) {
            const nodeId = this.data[row].id
            this.triggerEvent('nodeClick', nodeId)
        }
    }

    private handleCellDoubleClick(coords: any): void {
        const { row } = coords
        if (row >= 0 && row < this.data.length) {
            const nodeId = this.data[row].id
            this.triggerEvent('nodeDoubleClick', nodeId)
        }
    }

    private applyTheme(theme: EditorTheme): void {
        if (!this.element) return

        const themeClass = theme === 'auto' ? 'theme-auto' : `theme-${theme}`
        this.element.classList.add(themeClass)
    }

    private parseASTToTableData(ast: DocumentAST): { columns: TableColumn[], data: TableRow[] } {
        const columns: TableColumn[] = []
        const data: TableRow[] = []

        if (ast.root.type === 'table') {
            const tableNode = ast.root as TableNode
            const tableData = tableNode.tableData

            if (tableData) {
                if (tableData.headers) {
                    tableData.headers.forEach((header, index) => {
                        columns.push({
                            id: `col${index}`,
                            title: header,
                            type: 'text',
                            sortable: true,
                            filterable: true
                        })
                    })
                }

                if (tableData.data) {
                    tableData.data.forEach((rowData, index) => {
                        data.push({
                            id: `row${index}`,
                            data: rowData,
                            metadata: {
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            }
                        })
                    })
                }
            }
        }

        return { columns, data }
    }

    private astNodeToTableRow(node: ASTNode): TableRow {
        if (node.type === 'tableRow') {
            const tableNode = node as TableNode
            return {
                id: node.id,
                data: tableNode.tableData?.data?.[0] || [],
                metadata: node.metadata
            }
        }
        return { id: node.id, data: [], metadata: node.metadata }
    }

    private findRowIndexById(nodeId: string): number {
        return this.data.findIndex(row => row.id === nodeId)
    }

    private getColumnIndexById(columnId: string): number {
        return this.columns.findIndex(col => col.id === columnId)
    }

    private generateRowId(): string {
        return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private generateColumnId(): string {
        return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}
