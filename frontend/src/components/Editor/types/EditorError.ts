/**
 * 编辑器错误相关
 */

/**
 * 错误类型枚举
 */
export enum EditorErrorType {
    INITIALIZATION = 'initialization',
    RENDERING = 'rendering',
    USER_INTERACTION = 'user_interaction',
    NETWORK = 'network',
    MEMORY = 'memory',
    UNKNOWN = 'unknown'
}

/**
 * 错误严重程度枚举
 */
export enum EditorErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

/**
 * 错误信息结构
 */
export interface EditorErrorInfo {
    id: string
    type: EditorErrorType
    severity: EditorErrorSeverity
    message: string
    context: string
    timestamp: number
    recoverable: boolean
    retryCount: number
}