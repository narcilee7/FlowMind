/**
 * 时间线视图适配器
 * 基于vis-timeline实现，提供完整的时间线编辑功能
 * 支持时间线项管理、里程碑、分组、过滤等功能
 */

import { ViewAdapterOptions, TimelineViewAdapter as ITimelineViewAdapter, TimelineGroupBy } from '@/components/Editor/types/ViewAdapter'
import { EditorType } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, TimelineNode } from '@/components/Editor/types/EditorAST'
import { BaseViewAdapter } from './BaseViewAdapter'

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
export class TimelineViewAdapter extends BaseViewAdapter implements ITimelineViewAdapter {
    public readonly type: EditorType.TIMELINE = EditorType.TIMELINE
    
    private timeline: any = null // vis-timeline实例
    private items: TimelineItem[] = []
    private groups: TimelineGroup[] = []
    // TODO: 丰富功能，承接这几个变量
    private currentSelection: Selection = { nodeIds: [], type: 'node' }
    private currentGroupBy: TimelineGroupBy = 'day'
    private timeRange: { start: Date; end: Date } | null = null

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
                
                // 交互配置
                editable: {
                    add: true,
                    updateTime: true,
                    updateGroup: true,
                    remove: true
                },
                
                // 样式配置
                template: (item: any) => {
                    return `<div class="timeline-item">
                        <div class="timeline-content">${item.content}</div>
                        ${item.title ? `<div class="timeline-title">${item.title}</div>` : ''}
                    </div>`
                }
            }

            // 创建时间线实例
            this.timeline = new Timeline(element, itemsDataset, groupsDataset, timelineOptions)

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
        if (this.timeline) {
            this.timeline.destroy()
            this.timeline = null
        }
        this.items = []
        this.groups = []
    }

    /**
     * 渲染AST
     */
    render(ast: DocumentAST): void {
        if (!this.validateInitialized() || !this.timeline) return

        const timelineData = this.safeSync(() => this.parseASTToTimelineData(ast), 'render')
        if (timelineData) {
            this.items = timelineData.items
            this.groups = timelineData.groups

            this.timeline.setItems(this.items)
            this.timeline.setGroups(this.groups)
        }
    }

    /**
     * 更新节点
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.validateInitialized() || !this.timeline) return

        if (node.type === 'timelineItem' || node.type === 'milestone') {
            const timelineItem = this.safeSync(() => this.astNodeToTimelineItem(node), 'updateNode')
            if (timelineItem) {
                this.timeline.itemsData.update(timelineItem)
            }
        }
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.timeline) return

        this.timeline.itemsData.remove(nodeId)
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.validateInitialized() || !this.timeline) return

        if (node.type === 'timelineItem' || node.type === 'milestone') {
            const timelineItem = this.safeSync(() => this.astNodeToTimelineItem(node), 'addNode')
            if (timelineItem) {
                this.timeline.itemsData.add(timelineItem)
            }
        }
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.validateInitialized() || !this.timeline) return

        this.currentSelection = selection

        if (selection.type === 'node' && selection.nodeIds.length > 0) {
            this.timeline.setSelection(selection.nodeIds)
        }
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.validateInitialized() || !this.timeline) {
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
        if (this.validateInitialized() && this.timeline) {
            this.timeline.focus()
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        if (this.validateInitialized() && this.timeline) {
            this.timeline.blur()
        }
    }

    /**
     * 是否获得焦点
     */
    isFocused(): boolean {
        if (!this.validateInitialized() || !this.timeline) {
            return false
        }
        return this.timeline.isFocused?.() || false
    }

    /**
     * 添加时间线项
     */
    addItem(item: ASTNode): void {
        if (!this.validateInitialized() || !this.timeline) return

        const timelineItem = this.safeSync(() => this.astNodeToTimelineItem(item), 'addItem')
        if (timelineItem) {
            this.timeline.itemsData.add(timelineItem)
        }
    }

    /**
     * 添加里程碑
     */
    addMilestone(milestone: ASTNode): void {
        if (!this.validateInitialized() || !this.timeline) return

        const milestoneItem = this.safeSync(() => this.astNodeToTimelineItem(milestone), 'addMilestone')
        if (milestoneItem) {
            milestoneItem.type = 'point'
            this.timeline.itemsData.add(milestoneItem)
        }
    }

    /**
     * 更新项目日期
     */
    updateItemDate(itemId: string, date: string): void {
        if (!this.validateInitialized() || !this.timeline) return

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
        if (!this.validateInitialized() || !this.timeline) return

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
        if (!this.validateInitialized() || !this.timeline) return

        this.timeRange = { start: new Date(start), end: new Date(end) }
        this.timeline.setWindow(this.timeRange.start, this.timeRange.end)
    }

    /**
     * 按条件分组
     */
    groupBy(groupBy: TimelineGroupBy): void {
        if (!this.validateInitialized() || !this.timeline) return

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
            case 'year':
                this.timeline.setOptions({
                    moment: (date: any) => {
                        const moment = require('moment')
                        return moment(date).startOf('year')
                    }
                })
                break
            case 'status':
                this.groupByStatus()
                break
            case 'assignee':
                this.groupByAssignee()
                break
        }

        this.triggerEvent('viewChange', { type: 'groupByChange', groupBy })
    }

    /**
     * 按状态过滤
     */
    filterByStatus(status: string[]): void {
        if (!this.validateInitialized() || !this.timeline) return

        const items = this.timeline.itemsData.get()
        const filteredItems = items.filter((item: any) => 
            status.includes(item.metadata?.status || 'unknown')
        )
        this.timeline.setItems(filteredItems)
    }

    /**
     * 滚动到节点
     */
    scrollToNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.timeline) return

        const item = this.timeline.itemsData.get(nodeId)
        if (item) {
            this.timeline.moveTo(item.start, {
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            })
        }
    }

    /**
     * 放大视图
     */
    zoomIn(): void {
        if (!this.validateInitialized() || !this.timeline) return

        const currentWindow = this.timeline.getWindow()
        const duration = (currentWindow.end.getTime() - currentWindow.start.getTime()) / 2
        const center = new Date(currentWindow.start.getTime() + duration)

        this.timeline.moveTo(center, {
            scale: 2,
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    /**
     * 缩小视图
     */
    zoomOut(): void {
        if (!this.validateInitialized() || !this.timeline) return

        const currentWindow = this.timeline.getWindow()
        const duration = (currentWindow.end.getTime() - currentWindow.start.getTime()) * 2
        const center = new Date(currentWindow.start.getTime() + duration / 2)

        this.timeline.moveTo(center, {
            scale: 0.5,
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        if (!this.validateInitialized() || !this.timeline) return

        this.timeline.fit({
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
        if (!this.validateInitialized() || !this.timeline) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const window = this.timeline.getWindow()
        const canvas = this.timeline.canvas

        return {
            start: window.start,
            end: window.end,
            width: canvas.width,
            height: canvas.height,
            zoom: 1 // vis-timeline没有直接的zoom概念
        }
    }

    /**
     * 设置视口
     */
    setViewport(viewport: any): void {
        if (!this.validateInitialized() || !this.timeline) return

        this.timeline.setWindow(viewport.start, viewport.end, {
            animation: {
                duration: 300,
                easingFunction: 'easeInOutQuad'
            }
        })
    }

    // 时间线特有事件方法
    /**
     * 项目点击事件
     */
    onItemClick(callback: (itemId: string, event: MouseEvent) => void): void {
        // 使用自定义事件处理，不继承BaseViewAdapter的事件系统
        const customEventCallbacks = (this as any).customEventCallbacks || new Map()
        if (!customEventCallbacks.has('itemClick')) {
            customEventCallbacks.set('itemClick', [])
        }
        customEventCallbacks.get('itemClick').push(callback)
        ;(this as any).customEventCallbacks = customEventCallbacks
    }

    /**
     * 日期变化事件
     */
    onDateChange(callback: (itemId: string, date: string) => void): void {
        // 使用自定义事件处理，不继承BaseViewAdapter的事件系统
        const customEventCallbacks = (this as any).customEventCallbacks || new Map()
        if (!customEventCallbacks.has('dateChange')) {
            customEventCallbacks.set('dateChange', [])
        }
        customEventCallbacks.get('dateChange').push(callback)
        ;(this as any).customEventCallbacks = customEventCallbacks
    }

    // 私有方法
    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        if (!this.timeline) return

        this.timeline.on('click', (properties: any) => {
            if (properties.item) {
                const customEventCallbacks = (this as any).customEventCallbacks
                if (customEventCallbacks && customEventCallbacks.has('itemClick')) {
                    customEventCallbacks.get('itemClick').forEach((callback: Function) => {
                        callback(properties.item, properties.event)
                    })
                }
            }
        })

        this.timeline.on('select', (properties: any) => {
            const selection: Selection = {
                nodeIds: properties.items,
                type: 'node'
            }
            this.triggerEvent('selectionChange', selection)
        })

        this.timeline.on('itemover', (properties: any) => {
            this.triggerEvent('viewChange', { type: 'itemOver', itemId: properties.item })
        })

        this.timeline.on('itemout', (properties: any) => {
            this.triggerEvent('viewChange', { type: 'itemOut', itemId: properties.item })
        })

        this.timeline.on('itemadd', (item: any, callback: Function) => {
            this.handleItemAdd(item, callback)
        })

        this.timeline.on('itemupdate', (item: any, callback: Function) => {
            this.handleItemUpdate(item, callback)
        })

        this.timeline.on('itemremove', (item: any, callback: Function) => {
            this.handleItemRemove(item, callback)
        })
    }

    /**
     * 处理项目添加
     */
    private handleItemAdd(item: any, callback: Function): void {
        try {
            // 这里可以添加自定义逻辑
            callback(item)
            this.triggerEvent('viewChange', { type: 'itemAdded', item })
        } catch (error) {
            this.handleError(error as Error, 'handleItemAdd')
            callback(null)
        }
    }

    /**
     * 处理项目更新
     */
    private handleItemUpdate(item: any, callback: Function): void {
        try {
            // 这里可以添加自定义逻辑
            callback(item)
            this.triggerEvent('viewChange', { type: 'itemUpdated', item })
        } catch (error) {
            this.handleError(error as Error, 'handleItemUpdate')
            callback(null)
        }
    }

    /**
     * 处理项目删除
     */
    private handleItemRemove(item: any, callback: Function): void {
        try {
            // 这里可以添加自定义逻辑
            callback(item)
            this.triggerEvent('viewChange', { type: 'itemRemoved', item })
        } catch (error) {
            this.handleError(error as Error, 'handleItemRemove')
            callback(null)
        }
    }

    /**
     * 初始化时间线数据
     */
    private initializeTimelineData(): void {
        this.items = []
        this.groups = []

        // 创建默认组
        this.groups = [
            { id: 'default', content: '默认组' },
            { id: 'completed', content: '已完成' },
            { id: 'in-progress', content: '进行中' },
            { id: 'pending', content: '待处理' }
        ]
    }

    /**
     * 解析AST为时间线数据
     */
    private parseASTToTimelineData(ast: DocumentAST): { items: TimelineItem[], groups: TimelineGroup[] } {
        const items: TimelineItem[] = []
        const groups: TimelineGroup[] = []

        // 递归遍历AST节点
        const traverse = (node: ASTNode) => {
            if (node.type === 'timelineItem' || node.type === 'milestone') {
                items.push(this.astNodeToTimelineItem(node))
            }

            if (node.children) {
                node.children.forEach(traverse)
            }
        }

        traverse(ast.root)

        return { items, groups: this.groups }
    }

    /**
     * 将AST节点转换为时间线项
     */
    private astNodeToTimelineItem(node: ASTNode): TimelineItem {
        const timelineNode = node as TimelineNode
        const timelineData = timelineNode.timelineData || {}
        
        return {
            id: node.id,
            content: timelineData.status || node.id,
            start: new Date(timelineData.date || Date.now()),
            end: timelineData.duration && timelineData.date ? 
                new Date(new Date(timelineData.date).getTime() + timelineData.duration) : undefined,
            group: timelineData.assignee || 'default',
            type: node.type === 'milestone' ? 'point' : 'box',
            title: node.metadata?.description,
            metadata: {
                status: timelineData.status || 'pending',
                priority: timelineData.priority || 'medium',
                assignee: timelineData.assignee,
                description: node.metadata?.description
            }
        }
    }

    /**
     * 按状态分组
     */
    private groupByStatus(): void {
        if (!this.timeline) return

        const items = this.timeline.itemsData.get()
        const groups = [
            { id: 'completed', content: '已完成' },
            { id: 'in-progress', content: '进行中' },
            { id: 'pending', content: '待处理' },
            { id: 'cancelled', content: '已取消' }
        ]

        this.timeline.setGroups(groups)

        // 重新分配项目到对应组
        items.forEach((item: any) => {
            const status = item.metadata?.status || 'pending'
            item.group = status
            this.timeline.itemsData.update(item)
        })
    }

    /**
     * 按负责人分组
     */
    private groupByAssignee(): void {
        if (!this.timeline) return

        const items = this.timeline.itemsData.get()
        const assignees = new Set<string>()

        // 收集所有负责人
        items.forEach((item: any) => {
            const assignee = item.metadata?.assignee || '未分配'
            assignees.add(assignee)
        })

        // 创建组
        const groups = Array.from(assignees).map(assignee => ({
            id: assignee,
            content: assignee
        }))

        this.timeline.setGroups(groups)

        // 重新分配项目到对应组
        items.forEach((item: any) => {
            const assignee = item.metadata?.assignee || '未分配'
            item.group = assignee
            this.timeline.itemsData.update(item)
        })
    }
}
