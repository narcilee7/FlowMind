/**
 * 时间线视图适配器
 * 基于vis-timeline实现，提供完整的时间线编辑功能
 * 支持时间线项管理、里程碑、分组、过滤等功能
 */

import { ViewAdapterOptions, TimelineViewAdapter as ITimelineViewAdapter, TimelineGroupBy } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, TimelineNode } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'

/**
 * 时间线项
 */
interface TimelineItem {
    id: string
    content: string
    start: Date
    end?: Date
    group?: string
    type?: 'box' | 'point' | 'range'
    className?: string
    style?: string
    title?: string
    metadata?: Record<string, any>
}

/**
 * 时间线组
 */
interface TimelineGroup {
    id: string
    content: string
    className?: string
    style?: string
    metadata?: Record<string, any>
}

/**
 * 时间线视图适配器实现
 */
export class TimelineViewAdapter implements ITimelineViewAdapter {
    public type: EditorType.TIMELINE = EditorType.TIMELINE
    public sceneTemplate: SceneTemplate
    
    private element: HTMLElement | null = null
    private options: ViewAdapterOptions | null = null
    private timeline: any = null // vis-timeline实例
    private items: TimelineItem[] = []
    private groups: TimelineGroup[] = []
    private eventCallbacks: Map<string, Function[]> = new Map()
    private isDestroyed = false
    private currentSelection: Selection = { nodeIds: [], type: 'node' }
    private currentGroupBy: TimelineGroupBy = 'day'
    private timeRange: { start: Date; end: Date } | null = null

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

            // 动态导入vis-timeline
            const { Timeline } = await import('vis-timeline')
            const { DataSet } = await import('vis-data')
            // 动态加载CSS
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = '/node_modules/vis-timeline/dist/vis-timeline-graph2d.css'
            document.head.appendChild(link)

            // 初始化时间线数据
            this.initializeTimelineData()

            // 创建数据集
            const itemsDataset = new DataSet(this.items)
            const groupsDataset = new DataSet(this.groups)

            // 配置时间线选项
            const timelineOptions = {
                // 基础配置
                width: '100%',
                height: '100%',
                stack: false,
                showMajorLabels: true,
                showMinorLabels: true,
                
                // 时间配置
                moment: (date: any) => {
                    const moment = require('moment')
                    return moment(date)
                },
                
                // 样式配置
                editable: {
                    add: true,
                    updateTime: true,
                    updateGroup: true,
                    remove: true
                },
                
                // 交互配置
                selectable: true,
                multiselect: true,
                showCurrentTime: true,
                showTooltips: true,
                
                // 分组配置
                groupHeightMode: 'fixed',
                groupHeight: 50,
                
                // 事件监听
                onAdd: (item: any, callback: Function) => {
                    this.handleItemAdd(item, callback)
                },
                onUpdate: (item: any, callback: Function) => {
                    this.handleItemUpdate(item, callback)
                },
                onRemove: (item: any, callback: Function) => {
                    this.handleItemRemove(item, callback)
                },
                onSelect: (properties: any) => {
                    this.handleItemSelect(properties)
                },
                onItemOver: (properties: any) => {
                    this.handleItemOver(properties)
                },
                onItemOut: (properties: any) => {
                    this.handleItemOut(properties)
                },
                onDropObjectOnItem: (objectData: any, item: any, callback: Function) => {
                    this.handleDropOnItem(objectData, item, callback)
                }
            }

            // 创建时间线实例
            this.timeline = new Timeline(element, itemsDataset, groupsDataset, timelineOptions as any)

            // 设置主题样式
            this.applyTheme(options.theme || 'auto')
        } catch (error) {
            console.error('Failed to create TimelineViewAdapter:', error)
            throw new Error(`Failed to create TimelineViewAdapter: ${error}`)
        }
    }

    /**
     * 销毁适配器
     */
    destroy(): void {
        if (this.isDestroyed) return

        if (this.timeline) {
            this.timeline.destroy()
            this.timeline = null
        }

        this.element = null
        this.options = null
        this.items = []
        this.groups = []
        this.eventCallbacks.clear()
        this.isDestroyed = true
    }

    /**
     * 渲染AST
     */
    render(ast: DocumentAST): void {
        if (!this.timeline || this.isDestroyed) return

        const timelineData = this.parseASTToTimelineData(ast)
        this.items = timelineData.items
        this.groups = timelineData.groups

        this.timeline.setItems(this.items)
        this.timeline.setGroups(this.groups)
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
        if (!this.timeline || this.isDestroyed) return

        if (node.type === 'timelineItem') {
            const timelineItem = this.astNodeToTimelineItem(node)
            this.timeline.itemsData.update(timelineItem)
        } else if (node.type === 'milestone') {
            const milestoneItem = this.astNodeToTimelineItem(node)
            this.timeline.itemsData.update(milestoneItem)
        }
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        if (!this.timeline || this.isDestroyed) return

        this.timeline.itemsData.remove(nodeId)
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.timeline || this.isDestroyed) return

        if (node.type === 'timelineItem' || node.type === 'milestone') {
            const timelineItem = this.astNodeToTimelineItem(node)
            this.timeline.itemsData.add(timelineItem)
        }
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.timeline || this.isDestroyed) return

        this.currentSelection = selection

        if (selection.type === 'node' && selection.nodeIds.length > 0) {
            this.timeline.setSelection(selection.nodeIds)
        }
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.timeline || this.isDestroyed) {
            return { nodeIds: [], type: 'node' }
        }

        const selectedItems = this.timeline.getSelection()
        return {
            nodeIds: selectedItems,
            type: 'node'
        }
    }

    /**
     * 设置焦点
     */
    focus(): void {
        if (this.timeline && !this.isDestroyed) {
            this.timeline.focus()
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        if (this.timeline && !this.isDestroyed) {
            this.timeline.blur()
        }
    }

    /**
     * 是否获得焦点
     */
    isFocused(): boolean {
        return this.timeline ? this.timeline.isListening() : false
    }

    // 时间线特有方法
    /**
     * 添加时间线项
     */
    addItem(item: ASTNode): void {
        if (!this.timeline || this.isDestroyed) return

        const timelineItem = this.astNodeToTimelineItem(item)
        this.timeline.itemsData.add(timelineItem)
    }

    /**
     * 添加里程碑
     */
    addMilestone(milestone: ASTNode): void {
        if (!this.timeline || this.isDestroyed) return

        const milestoneItem = this.astNodeToTimelineItem(milestone)
        milestoneItem.type = 'point'
        this.timeline.itemsData.add(milestoneItem)
    }

    /**
     * 更新项目日期
     */
    updateItemDate(itemId: string, date: string): void {
        if (!this.timeline || this.isDestroyed) return

        const item = this.timeline.itemsData.get(itemId)
        if (item) {
            item.start = new Date(date)
            this.timeline.itemsData.update(item)
        }
    }

    /**
     * 更新项目状态
     */
    updateItemStatus(itemId: string, status: string): void {
        if (!this.timeline || this.isDestroyed) return

        const item = this.timeline.itemsData.get(itemId)
        if (item) {
            item.metadata = { ...item.metadata, status }
            this.timeline.itemsData.update(item)
        }
    }

    /**
     * 设置时间范围
     */
    setTimeRange(start: string, end: string): void {
        if (!this.timeline || this.isDestroyed) return

        this.timeRange = { start: new Date(start), end: new Date(end) }
        this.timeline.setWindow(this.timeRange.start, this.timeRange.end)
    }

    /**
     * 按条件分组
     */
    groupBy(groupBy: TimelineGroupBy): void {
        if (!this.timeline || this.isDestroyed) return

        this.currentGroupBy = groupBy

        switch (groupBy) {
            case 'day':
                this.timeline.setOptions({
                    moment: (date: any) => {
                        const moment = require('moment')
                        return moment(date).startOf('day')
                    }
                })
                break
            case 'week':
                this.timeline.setOptions({
                    moment: (date: any) => {
                        const moment = require('moment')
                        return moment(date).startOf('week')
                    }
                })
                break
            case 'month':
                this.timeline.setOptions({
                    moment: (date: any) => {
                        const moment = require('moment')
                        return moment(date).startOf('month')
                    }
                })
                break
            case 'status':
                // 按状态分组需要重新组织数据
                this.groupByStatus()
                break
            case 'assignee':
                // 按负责人分组需要重新组织数据
                this.groupByAssignee()
                break
        }
    }

    /**
     * 按状态过滤
     */
    filterByStatus(status: string[]): void {
        if (!this.timeline || this.isDestroyed) return

        const filteredItems = this.items.filter(item => 
            status.includes(item.metadata?.status || '')
        )
        this.timeline.setItems(filteredItems)
    }

    // 视图控制方法
    /**
     * 滚动到节点
     */
    scrollToNode(nodeId: string): void {
        if (!this.timeline || this.isDestroyed) return

        const item = this.timeline.itemsData.get(nodeId)
        if (item) {
            this.timeline.moveTo(item.start)
        }
    }

    /**
     * 放大视图
     */
    zoomIn(): void {
        if (!this.timeline || this.isDestroyed) return

        const window = this.timeline.getWindow()
        const duration = window.end.getTime() - window.start.getTime()
        const newDuration = duration * 0.8
        const center = new Date(window.start.getTime() + duration / 2)
        
        this.timeline.setWindow(
            new Date(center.getTime() - newDuration / 2),
            new Date(center.getTime() + newDuration / 2)
        )
    }

    /**
     * 缩小视图
     */
    zoomOut(): void {
        if (!this.timeline || this.isDestroyed) return

        const window = this.timeline.getWindow()
        const duration = window.end.getTime() - window.start.getTime()
        const newDuration = duration * 1.2
        const center = new Date(window.start.getTime() + duration / 2)
        
        this.timeline.setWindow(
            new Date(center.getTime() - newDuration / 2),
            new Date(center.getTime() + newDuration / 2)
        )
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        if (!this.timeline || this.isDestroyed) return

        this.timeline.fit()
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
        if (!this.timeline || this.isDestroyed) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const window = this.timeline.getWindow()
        const container = this.timeline.dom.center
        const scale = this.timeline.getScale()

        return {
            x: window.start.getTime(),
            y: 0,
            width: container.clientWidth,
            height: container.clientHeight,
            zoom: scale
        }
    }

    /**
     * 设置视口
     */
    setViewport(viewport: any): void {
        if (!this.timeline || this.isDestroyed) return

        this.timeline.setWindow(
            new Date(viewport.x),
            new Date(viewport.x + viewport.width)
        )
    }

    // 事件监听方法
    /**
     * 节点点击事件
     */
    onNodeClick(callback: (nodeId: string, event: MouseEvent) => void): void {
        this.addEventListener('nodeClick', callback)
    }

    /**
     * 节点双击事件
     */
    onNodeDoubleClick(callback: (nodeId: string, event: MouseEvent) => void): void {
        this.addEventListener('nodeDoubleClick', callback)
    }

    /**
     * 选择状态变化事件
     */
    onSelectionChange(callback: (selection: Selection) => void): void {
        this.addEventListener('selectionChange', callback)
    }

    /**
     * 视图变化事件
     */
    onViewChange(callback: (viewData: any) => void): void {
        this.addEventListener('viewChange', callback)
    }

    /**
     * 获得焦点事件
     */
    onFocus(callback: () => void): void {
        this.addEventListener('focus', callback)
    }

    /**
     * 失去焦点事件
     */
    onBlur(callback: () => void): void {
        this.addEventListener('blur', callback)
    }

    /**
     * 项目点击事件
     */
    onItemClick(callback: (itemId: string, event: MouseEvent) => void): void {
        this.addEventListener('itemClick', callback)
    }

    /**
     * 日期变化事件
     */
    onDateChange(callback: (itemId: string, date: string) => void): void {
        this.addEventListener('dateChange', callback)
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

    private initializeTimelineData(): void {
        // 初始化组
        this.groups = [
            { id: 'group1', content: 'Group 1' },
            { id: 'group2', content: 'Group 2' },
            { id: 'group3', content: 'Group 3' }
        ]

        // 初始化项目
        this.items = [
            {
                id: 'item1',
                content: 'Task 1',
                start: new Date('2024-01-01'),
                end: new Date('2024-01-05'),
                group: 'group1',
                metadata: { status: 'in-progress', assignee: 'user1' }
            },
            {
                id: 'item2',
                content: 'Task 2',
                start: new Date('2024-01-03'),
                end: new Date('2024-01-08'),
                group: 'group2',
                metadata: { status: 'pending', assignee: 'user2' }
            },
            {
                id: 'milestone1',
                content: 'Milestone 1',
                start: new Date('2024-01-10'),
                type: 'point',
                group: 'group1',
                metadata: { status: 'completed', assignee: 'user1' }
            }
        ]
    }

    private handleItemAdd(item: any, callback: Function): void {
        const newItem: TimelineItem = {
            id: item.id,
            content: item.content,
            start: item.start,
            end: item.end,
            group: item.group,
            type: item.type,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        this.items.push(newItem)
        callback(newItem)
        this.triggerEvent('viewChange', { type: 'itemAdd', item: newItem })
    }

    private handleItemUpdate(item: any, callback: Function): void {
        const index = this.items.findIndex(i => i.id === item.id)
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...item }
            this.items[index].metadata = {
                ...this.items[index].metadata,
                updatedAt: new Date().toISOString()
            }
        }

        callback(item)
        this.triggerEvent('viewChange', { type: 'itemUpdate', item })
    }

    private handleItemRemove(item: any, callback: Function): void {
        const index = this.items.findIndex(i => i.id === item.id)
        if (index !== -1) {
            this.items.splice(index, 1)
        }

        callback(item)
        this.triggerEvent('viewChange', { type: 'itemRemove', item })
    }

    private handleItemSelect(properties: any): void {
        const selection: Selection = {
            nodeIds: properties.items,
            type: 'node'
        }

        this.currentSelection = selection
        this.triggerEvent('selectionChange', selection)
        this.triggerEvent('itemClick', properties.items[0])
    }

    private handleItemOver(properties: any): void {
        this.triggerEvent('viewChange', { type: 'itemOver', itemId: properties.item })
    }

    private handleItemOut(properties: any): void {
        this.triggerEvent('viewChange', { type: 'itemOut', itemId: properties.item })
    }

    private handleDropOnItem(objectData: any, item: any, callback: Function): void {
        this.triggerEvent('viewChange', { type: 'dropOnItem', objectData, item })
        callback()
    }

    private applyTheme(theme: EditorTheme): void {
        if (!this.element) return

        const themeClass = theme === 'auto' ? 'theme-auto' : `theme-${theme}`
        this.element.classList.add(themeClass)
    }

    private parseASTToTimelineData(ast: DocumentAST): { items: TimelineItem[], groups: TimelineGroup[] } {
        const items: TimelineItem[] = []
        const groups: TimelineGroup[] = []

        if (ast.root.type === 'timeline') {
            const timelineNode = ast.root as TimelineNode
            const timelineData = timelineNode.timelineData

            if (timelineData) {
                // 解析时间线数据
                // 这里需要根据实际的AST结构来实现
                // 暂时使用默认数据
            }
        }

        return { items, groups }
    }

    private astNodeToTimelineItem(node: ASTNode): TimelineItem {
        if (node.type === 'timelineItem' || node.type === 'milestone') {
            const timelineNode = node as TimelineNode
            const timelineData = timelineNode.timelineData

            return {
                id: node.id,
                content: timelineData?.status || node.id,
                start: timelineData?.date ? new Date(timelineData.date) : new Date(),
                end: timelineData?.duration && timelineData?.date ? new Date(new Date(timelineData.date).getTime() + timelineData.duration) : undefined,
                group: timelineData?.assignee || 'default',
                type: node.type === 'milestone' ? 'point' : 'box',
                metadata: {
                    ...node.metadata,
                    status: timelineData?.status,
                    assignee: timelineData?.assignee,
                    priority: timelineData?.priority
                }
            }
        }

        return {
            id: node.id,
            content: node.id,
            start: new Date(),
            metadata: node.metadata
        }
    }

    private groupByStatus(): void {
        const statusGroups = new Map<string, TimelineGroup>()
        
        this.items.forEach(item => {
            const status = item.metadata?.status || 'unknown'
            if (!statusGroups.has(status)) {
                statusGroups.set(status, {
                    id: `status_${status}`,
                    content: status.charAt(0).toUpperCase() + status.slice(1)
                })
            }
        })

        this.groups = Array.from(statusGroups.values())
        this.timeline.setGroups(this.groups)
    }

    private groupByAssignee(): void {
        const assigneeGroups = new Map<string, TimelineGroup>()
        
        this.items.forEach(item => {
            const assignee = item.metadata?.assignee || 'unassigned'
            if (!assigneeGroups.has(assignee)) {
                assigneeGroups.set(assignee, {
                    id: `assignee_${assignee}`,
                    content: assignee
                })
            }
        })

        this.groups = Array.from(assigneeGroups.values())
        this.timeline.setGroups(this.groups)
    }
}
