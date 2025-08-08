/**
 * 编辑器状态管理器
 * 
 * 提供高效的状态管理，包括：
 * 1. 撤销/重做功能
 * // 2. 协作状态同步 - 暂时移除，专注个人使用
 * 3. 本地持久化
 * 4. 状态快照和恢复
 * 5. 实时状态广播
 */

import { DocumentAST, ASTNode, Selection } from '../types/EditorAST'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { createDocumentAST } from '../utils/ASTUtils'

/**
 * 状态快照
 */
export interface StateSnapshot {
    id: string
    timestamp: number
    ast: DocumentAST
    selection: Selection
    editorType: EditorType
    sceneTemplate: SceneTemplate
    metadata: {
        version: string
        operation: string
        userId?: string
        sessionId: string
    }
}

/**
 * 状态变更事件
 */
export interface StateChangeEvent {
    type: 'content' | 'selection' | 'editor' | 'scene'
    before: StateSnapshot
    after: StateSnapshot
    operation: string
    timestamp: number
}

/**
 * 协作状态 - 暂时注释，专注个人使用
 */
// export interface CollaborationState {
//     users: Array<{
//         id: string
//         name: string
//         cursor?: Selection
//         color: string
//         lastSeen: number
//     }>
//     conflicts: Array<{
//         id: string
//         nodeId: string
//         users: string[]
//         timestamp: number
//     }>
// }

/**
 * 状态管理配置
 */
export interface StateManagerConfig {
    maxHistorySize: number
    autoSaveInterval: number
    enableCollaboration: boolean
    enablePersistence: boolean
    persistenceKey: string
    debounceDelay: number
    compressionEnabled: boolean
}

/**
 * 状态管理器主类
 */
export class EditorStateManager {
    private history: StateSnapshot[] = []
    private currentIndex = -1
    private listeners = new Map<string, Function[]>()
    private autoSaveTimer: NodeJS.Timeout | null = null
    private lastSaveTime = 0
    private sessionId: string
    // 协作相关状态 - 暂时注释
    // private isCollaborating = false
    // private collaborationState: CollaborationState = { users: [], conflicts: [] }

    private config: StateManagerConfig = {
        maxHistorySize: 100,
        autoSaveInterval: 30000, // 30秒
        enableCollaboration: false,
        enablePersistence: true,
        persistenceKey: 'editorState',
        debounceDelay: 500,
        compressionEnabled: true
    }

    constructor(config?: Partial<StateManagerConfig>) {
        this.config = { ...this.config, ...config }
        this.sessionId = this.generateSessionId()

        if (this.config.enablePersistence) {
            this.loadFromStorage()
        }

        if (this.config.autoSaveInterval > 0) {
            this.startAutoSave()
        }

        // 监听页面关闭事件进行最后保存
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
        }
    }

    /**
     * 添加状态快照
     */
    public addSnapshot(
        ast: DocumentAST,
        selection: Selection,
        editorType: EditorType,
        sceneTemplate: SceneTemplate,
        operation: string
    ): StateSnapshot {
        const snapshot: StateSnapshot = {
            id: this.generateSnapshotId(),
            timestamp: Date.now(),
            ast: this.deepClone(ast),
            selection: this.deepClone(selection),
            editorType,
            sceneTemplate,
            metadata: {
                version: '1.0.0',
                operation,
                sessionId: this.sessionId
            }
        }

        // 如果不是在历史末尾，删除后续历史
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1)
        }

        this.history.push(snapshot)
        this.currentIndex = this.history.length - 1

        // 限制历史大小
        if (this.history.length > this.config.maxHistorySize) {
            this.history = this.history.slice(-this.config.maxHistorySize)
            this.currentIndex = this.history.length - 1
        }

        // 触发状态变更事件
        this.emitStateChange('content', snapshot, operation)

        // 压缩历史记录
        if (this.config.compressionEnabled && this.history.length % 10 === 0) {
            this.compressHistory()
        }

        return snapshot
    }

    /**
     * 撤销操作
     */
    public undo(): StateSnapshot | null {
        if (!this.canUndo()) return null

        this.currentIndex--
        const snapshot = this.history[this.currentIndex]

        this.emitStateChange('content', snapshot, 'undo')
        return snapshot
    }

    /**
     * 重做操作
     */
    public redo(): StateSnapshot | null {
        if (!this.canRedo()) return null

        this.currentIndex++
        const snapshot = this.history[this.currentIndex]

        this.emitStateChange('content', snapshot, 'redo')
        return snapshot
    }

    /**
     * 检查是否可以撤销
     */
    public canUndo(): boolean {
        return this.currentIndex > 0
    }

    /**
     * 检查是否可以重做
     */
    public canRedo(): boolean {
        return this.currentIndex < this.history.length - 1
    }

    /**
     * 获取当前状态快照
     */
    public getCurrentSnapshot(): StateSnapshot | null {
        return this.currentIndex >= 0 ? this.history[this.currentIndex] : null
    }

    /**
     * 获取历史记录
     */
    public getHistory(): StateSnapshot[] {
        return [...this.history]
    }

    /**
     * 清空历史记录
     */
    public clearHistory(): void {
        this.history = []
        this.currentIndex = -1
        this.emit('historyCleared', {})
    }

    /**
     * 跳转到指定快照
     */
    public jumpToSnapshot(snapshotId: string): StateSnapshot | null {
        const index = this.history.findIndex(s => s.id === snapshotId)
        if (index === -1) return null

        this.currentIndex = index
        const snapshot = this.history[index]

        this.emitStateChange('content', snapshot, 'jump')
        return snapshot
    }

    /**
     * 创建分支
     */
    public createBranch(name: string): string {
        const branchId = this.generateBranchId()
        const currentSnapshot = this.getCurrentSnapshot()

        if (currentSnapshot) {
            const branchData = {
                id: branchId,
                name,
                baseSnapshot: currentSnapshot.id,
                createdAt: Date.now(),
                history: [...this.history]
            }

            this.saveBranch(branchData)
            this.emit('branchCreated', { branchId, name, snapshot: currentSnapshot })
        }

        return branchId
    }

    /**
     * 切换分支
     */
    public switchBranch(branchId: string): boolean {
        const branchData = this.loadBranch(branchId)
        if (!branchData) return false

        // 保存当前分支
        this.saveCurrentBranch()

        // 加载分支历史
        this.history = branchData.history
        this.currentIndex = this.history.length - 1

        this.emit('branchSwitched', { branchId, snapshot: this.getCurrentSnapshot() })
        return true
    }

    /**
     * 监听状态变更
     */
    public on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event)!.push(callback)
    }

    /**
     * 取消监听
     */
    public off(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event)
        if (callbacks) {
            const index = callbacks.indexOf(callback)
            if (index > -1) {
                callbacks.splice(index, 1)
            }
        }
    }

    // 协作相关方法 - 暂时注释，专注个人使用
    // /**
    //  * 启动协作模式
    //  */
    // public startCollaboration(config: {
    //     userId: string
    //     userName: string
    //     websocketUrl?: string
    // }): void {
    //     if (this.isCollaborating) return

    //     this.isCollaborating = true
    //     this.config.enableCollaboration = true

    //     // TODO: 实现WebSocket连接和协作逻辑
    //     console.log('[StateManager] Collaboration mode started', config)

    //     this.emit('collaborationStarted', config)
    // }

    // /**
    //  * 停止协作模式
    //  */
    // public stopCollaboration(): void {
    //     if (!this.isCollaborating) return

    //     this.isCollaborating = false
    //     this.config.enableCollaboration = false
    //     this.collaborationState = { users: [], conflicts: [] }

    //     this.emit('collaborationStopped', {})
    // }

    // /**
    //  * 获取协作状态
    //  */
    // public getCollaborationState(): CollaborationState {
    //     return { ...this.collaborationState }
    // }

    // /**
    //  * 处理协作事件
    //  */
    // public handleCollaborationEvent(event: {
    //     type: 'userJoin' | 'userLeave' | 'cursorMove' | 'contentChange' | 'conflict'
    //     data: any
    // }): void {
    //     switch (event.type) {
    //         case 'userJoin':
    //             this.addCollaborationUser(event.data)
    //             break
    //         case 'userLeave':
    //             this.removeCollaborationUser(event.data.userId)
    //             break
    //         case 'cursorMove':
    //             this.updateUserCursor(event.data.userId, event.data.selection)
    //             break
    //         case 'contentChange':
    //             this.handleRemoteContentChange(event.data)
    //             break
    //         case 'conflict':
    //             this.handleConflict(event.data)
    //             break
    //     }

    //     this.emit('collaborationEvent', event)
    // }

    /**
     * 保存到本地存储
     */
    public saveToStorage(): void {
        if (!this.config.enablePersistence) return

        try {
            const data = {
                history: this.history,
                currentIndex: this.currentIndex,
                sessionId: this.sessionId,
                timestamp: Date.now()
            }

            const compressed = this.config.compressionEnabled
                ? this.compressData(data)
                : data

            localStorage.setItem(this.config.persistenceKey, JSON.stringify(compressed))
            this.lastSaveTime = Date.now()

            console.log('[StateManager] State saved to storage')

        } catch (error) {
            console.error('[StateManager] Failed to save to storage:', error)
        }
    }

    /**
     * 从本地存储加载
     */
    public loadFromStorage(): boolean {
        if (!this.config.enablePersistence) return false

        try {
            const stored = localStorage.getItem(this.config.persistenceKey)
            if (!stored) return false

            const data = JSON.parse(stored)
            const decompressed = this.config.compressionEnabled
                ? this.decompressData(data)
                : data

            this.history = decompressed.history || []
            this.currentIndex = decompressed.currentIndex ?? -1

            // 验证历史记录
            if (!this.validateHistory()) {
                console.warn('[StateManager] Invalid history in storage, resetting')
                this.clearHistory()
                return false
            }

            console.log('[StateManager] State loaded from storage')
            return true

        } catch (error) {
            console.error('[StateManager] Failed to load from storage:', error)
            return false
        }
    }

    /**
     * 导出状态
     */
    public exportState(): string {
        const exportData = {
            version: '1.0.0',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            history: this.history,
            currentIndex: this.currentIndex,
            config: this.config
        }

        return JSON.stringify(exportData, null, 2)
    }

    /**
     * 导入状态
     */
    public importState(data: string): boolean {
        try {
            const importData = JSON.parse(data)

            // 验证数据格式
            if (!importData.version || !importData.history) {
                throw new Error('Invalid import data format')
            }

            this.history = importData.history
            this.currentIndex = importData.currentIndex ?? -1

            if (!this.validateHistory()) {
                throw new Error('Invalid history data')
            }

            this.emit('stateImported', {
                snapshot: this.getCurrentSnapshot(),
                historySize: this.history.length
            })

            return true

        } catch (error) {
            console.error('[StateManager] Failed to import state:', error)
            return false
        }
    }

    /**
     * 获取统计信息
     */
    public getStats(): {
        historySize: number
        currentIndex: number
        memoryUsage: number
        lastSaveTime: number
        sessionDuration: number
        operationCounts: Record<string, number>
    } {
        const operationCounts: Record<string, number> = {}

        this.history.forEach(snapshot => {
            const op = snapshot.metadata.operation
            operationCounts[op] = (operationCounts[op] || 0) + 1
        })

        return {
            historySize: this.history.length,
            currentIndex: this.currentIndex,
            memoryUsage: this.calculateMemoryUsage(),
            lastSaveTime: this.lastSaveTime,
            sessionDuration: Date.now() - (this.history[0]?.timestamp || Date.now()),
            operationCounts
        }
    }

    /**
     * 销毁状态管理器
     */
    public destroy(): void {
        // 保存最后状态
        if (this.config.enablePersistence) {
            this.saveToStorage()
        }

        // 清理定时器
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer)
            this.autoSaveTimer = null
        }

        // 停止协作 - 暂时注释
        // if (this.isCollaborating) {
        //     this.stopCollaboration()
        // }

        // 清理监听器
        this.listeners.clear()

        // 移除浏览器事件监听
        if (typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', this.handleBeforeUnload)
        }

        console.log('[StateManager] Destroyed')
    }

    // === 私有方法 ===

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private generateSnapshotId(): string {
        return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private generateBranchId(): string {
        return `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj))
    }

    private emit(event: string, data: any): void {
        const callbacks = this.listeners.get(event) || []
        callbacks.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                console.error(`[StateManager] Event callback error for ${event}:`, error)
            }
        })
    }

    private emitStateChange(type: string, snapshot: StateSnapshot, operation: string): void {
        const event: StateChangeEvent = {
            type: type as any,
            before: this.history[this.currentIndex - 1] || snapshot,
            after: snapshot,
            operation,
            timestamp: Date.now()
        }

        this.emit('stateChange', event)
    }

    private startAutoSave(): void {
        this.autoSaveTimer = setInterval(() => {
            if (this.shouldAutoSave()) {
                this.saveToStorage()
            }
        }, this.config.autoSaveInterval)
    }

    private shouldAutoSave(): boolean {
        return Date.now() - this.lastSaveTime > this.config.autoSaveInterval
    }

    private handleBeforeUnload(): void {
        this.saveToStorage()
    }

    private compressHistory(): void {
        // 简化的历史压缩：合并相似的连续操作
        const compressed: StateSnapshot[] = []
        let lastOperation = ''
        let operationCount = 0

        for (const snapshot of this.history) {
            const operation = snapshot.metadata.operation

            if (operation === lastOperation && operationCount < 5) {
                // 跳过重复操作，但保留最后一个
                operationCount++
                continue
            }

            compressed.push(snapshot)
            lastOperation = operation
            operationCount = 1
        }

        if (compressed.length < this.history.length) {
            this.history = compressed
            this.currentIndex = Math.min(this.currentIndex, this.history.length - 1)
            console.log('[StateManager] History compressed')
        }
    }

    private compressData(data: any): any {
        // 简化的数据压缩实现
        // TODO: 实现数据压缩
        return data
    }

    private decompressData(data: any): any {
        // 简化的数据解压实现
        // TODO: 实现数据解压
        return data
    }

    private validateHistory(): boolean {
        if (!Array.isArray(this.history)) return false

        return this.history.every(snapshot =>
            snapshot.id &&
            snapshot.timestamp &&
            snapshot.ast &&
            snapshot.selection &&
            snapshot.metadata
        )
    }

    private calculateMemoryUsage(): number {
        return JSON.stringify(this.history).length * 2 // 粗略估算
    }

    // 协作辅助方法 - 暂时注释
    // private addCollaborationUser(user: any): void {
    //     const existingIndex = this.collaborationState.users.findIndex(u => u.id === user.id)
    //     if (existingIndex >= 0) {
    //         this.collaborationState.users[existingIndex] = { ...user, lastSeen: Date.now() }
    //     } else {
    //         this.collaborationState.users.push({ ...user, lastSeen: Date.now() })
    //     }
    // }

    // private removeCollaborationUser(userId: string): void {
    //     this.collaborationState.users = this.collaborationState.users.filter(u => u.id !== userId)
    // }

    // private updateUserCursor(userId: string, selection: Selection): void {
    //     const user = this.collaborationState.users.find(u => u.id === userId)
    //     if (user) {
    //         user.cursor = selection
    //         user.lastSeen = Date.now()
    //     }
    // }

    // private handleRemoteContentChange(data: any): void {
    //     // TODO: 实现远程内容变更处理
    //     console.log('[StateManager] Remote content change:', data)
    // }

    // private handleConflict(data: any): void {
    //     // TODO: 实现冲突处理
    //     console.log('[StateManager] Conflict detected:', data)
    // }

    private saveBranch(branchData: any): void {
        const key = `${this.config.persistenceKey}_branch_${branchData.id}`
        localStorage.setItem(key, JSON.stringify(branchData))
    }

    private loadBranch(branchId: string): any {
        const key = `${this.config.persistenceKey}_branch_${branchId}`
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : null
    }

    private saveCurrentBranch(): void {
        const branchData = {
            id: 'main',
            name: 'Main Branch',
            baseSnapshot: null,
            createdAt: Date.now(),
            history: [...this.history]
        }
        this.saveBranch(branchData)
    }
}

export default EditorStateManager
