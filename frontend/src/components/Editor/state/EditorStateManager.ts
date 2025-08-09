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

import { DocumentAST, Selection } from '../types/EditorAST'
import { StateChangeEvent, StateManagerConfig, StateSnapshot } from '../types/EditorState'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { generateRandomId } from '../../../utils/common'

/**
 * 状态管理器主类
 */
export class EditorStateManager {

    // 历史快照
    private stateSnapshotHistory: StateSnapshot[] = []
    // 当前的索引
    private currentIndex = -1
    // 事件监听表
    private eventListeners = new Map<string, Function[]>()
    // 自动保存定时器
    private autoSaveTimer: NodeJS.Timeout | null = null
    // 最后保存时间
    private lastSaveTime = 0
    // 会话ID
    private sessionId: string = ''

    // 配置
    private config: StateManagerConfig = {
        maxHistorySize: 100,
        autoSaveInterval: 30 * 1000, // 30秒
        enablePersistence: true,
        persistenceKey: 'editorState',
        debounceDelay: 500,
        compressionEnabled: true
    }

    constructor(config?: Partial<StateManagerConfig>) {
        this.config = {
            ...this.config,
            ...config
        }

        // 加载本地存储
        // TODO: 持久化应该是DB层面的持久化或者多级缓存
        if (this.config.enablePersistence) {
            this.loadFromStorage()
        }

        // 开启自动保存
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
            selection: this.deepClone(selection) as any,
            editorType,
            sceneTemplate,
            metadata: {
                version: '1.0.0',
                operation,
                sessionId: this.sessionId
            }
        }

        // 如果不是在历史末尾，删除后续历史
        if (this.currentIndex < this.stateSnapshotHistory.length - 1) {
            this.stateSnapshotHistory = this.stateSnapshotHistory.slice(0, this.currentIndex + 1)
        }

        this.stateSnapshotHistory.push(snapshot)
        this.currentIndex = this.stateSnapshotHistory.length - 1

        // 限制历史大小
        if (this.stateSnapshotHistory.length > this.config.maxHistorySize) {
            this.stateSnapshotHistory = this.stateSnapshotHistory.slice(-this.config.maxHistorySize)
            this.currentIndex = this.stateSnapshotHistory.length - 1
        }

        // 触发状态变更事件
        this.emitStateChange('content', snapshot, operation)

        // 压缩历史记录
        if (this.config.compressionEnabled && this.stateSnapshotHistory.length % 10 === 0) {
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
        const snapshot = this.stateSnapshotHistory[this.currentIndex]

        this.emitStateChange('content', snapshot, 'undo')
        return snapshot
    }

    /**
     * 重做操作
     */
    public redo(): StateSnapshot | null {
        if (!this.canRedo()) return null

        this.currentIndex++
        const snapshot = this.stateSnapshotHistory[this.currentIndex]

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
        return this.currentIndex < this.stateSnapshotHistory.length - 1
    }

    /**
     * 获取当前状态快照
     */
    public getCurrentSnapshot(): StateSnapshot | null {
        return this.currentIndex >= 0 ? this.stateSnapshotHistory[this.currentIndex] : null
    }

    /**
     * 获取历史记录
     */
    public getHistory(): StateSnapshot[] {
        return [...this.stateSnapshotHistory]
    }

    /**
     * 清空历史记录
     */
    public clearHistory(): void {
        this.stateSnapshotHistory = []
        this.currentIndex = -1
        this.emit('historyCleared', {})
    }

    /**
     * 跳转到指定快照
     */
    public jumpToSnapshot(snapshotId: string): StateSnapshot | null {
        const index = this.stateSnapshotHistory.findIndex(s => s.id === snapshotId)
        if (index === -1) return null

        this.currentIndex = index
        const snapshot = this.stateSnapshotHistory[index]

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
                history: [...this.stateSnapshotHistory]
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
        this.stateSnapshotHistory = branchData.history
        this.currentIndex = this.stateSnapshotHistory.length - 1

        this.emit('branchSwitched', { branchId, snapshot: this.getCurrentSnapshot() })
        return true
    }

    /**
     * 监听状态变更
     */
    public on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    /**
     * 取消监听
     */
    public off(event: string, callback: Function): void {
        const callbacks = this.eventListeners.get(event)
        if (callbacks) {
            const index = callbacks.indexOf(callback)
            if (index > -1) {
                callbacks.splice(index, 1)
            }
        }
    }

    /**
     * 保存到本地存储
     */
    public saveToStorage(): void {
        if (!this.config.enablePersistence) return

        try {
            const data = {
                history: this.stateSnapshotHistory,
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
            // TODO: localforage
            const stored = localStorage.getItem(this.config.persistenceKey)
            if (!stored) return false

            const data = JSON.parse(stored)
            // 解压
            const decompressed = this.config.compressionEnabled
                ? this.decompressData(data)
                : data

            this.stateSnapshotHistory = decompressed.history || []
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
            history: this.stateSnapshotHistory,
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

            this.stateSnapshotHistory = importData.history
            this.currentIndex = importData.currentIndex ?? -1

            if (!this.validateHistory()) {
                throw new Error('Invalid history data')
            }

            this.emit('stateImported', {
                snapshot: this.getCurrentSnapshot(),
                historySize: this.stateSnapshotHistory.length
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

        this.stateSnapshotHistory.forEach(snapshot => {
            const op = snapshot.metadata.operation
            operationCounts[op] = (operationCounts[op] || 0) + 1
        })

        return {
            historySize: this.stateSnapshotHistory.length,
            currentIndex: this.currentIndex,
            memoryUsage: this.calculateMemoryUsage(),
            lastSaveTime: this.lastSaveTime,
            sessionDuration: Date.now() - (this.stateSnapshotHistory[0]?.timestamp || Date.now()),
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

        // 清理监听器
        this.eventListeners.clear()

        // 移除浏览器事件监听
        if (typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', this.handleBeforeUnload)
        }

        console.log('[StateManager] Destroyed')
    }

    // === 私有方法 ===
    private generateSnapshotId(): string {
        return generateRandomId('snapshot')
    }

    private generateBranchId(): string {
        return generateRandomId('branch')
    }

    private deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj))
    }

    private emit(event: string, data: any): void {
        const callbacks = this.eventListeners.get(event) || []
        callbacks.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                console.error(`[StateManager] Event callback error for ${event}:`, error)
            }
        })
    }

    private emitStateChange(type: string, snapshot: StateSnapshot, operation: string): void {
        const newEvent: StateChangeEvent = {
            type: type as any,
            before: this.stateSnapshotHistory[this.currentIndex - 1] || snapshot,
            after: snapshot,
            operation,
            timestamp: Date.now()
        }

        this.emit('stateChange', newEvent)
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

        for (const snapshot of this.stateSnapshotHistory) {
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

        if (compressed.length < this.stateSnapshotHistory.length) {
            this.stateSnapshotHistory = compressed
            this.currentIndex = Math.min(this.currentIndex, this.stateSnapshotHistory.length - 1)
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
        if (!Array.isArray(this.stateSnapshotHistory)) return false

        return this.stateSnapshotHistory.every(snapshot =>
            snapshot.id &&
            snapshot.timestamp &&
            snapshot.ast &&
            snapshot.selection &&
            snapshot.metadata
        )
    }

    private calculateMemoryUsage(): number {
        return JSON.stringify(this.stateSnapshotHistory).length * 2 // 粗略估算
    }

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
            history: [...this.stateSnapshotHistory]
        }
        this.saveBranch(branchData)
    }
}

export default EditorStateManager
