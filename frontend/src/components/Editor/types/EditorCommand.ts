import { EditorType, SceneTemplate } from './editorType'
import { Selection, DocumentAST } from './EditorAST'
import { ViewAdapter } from './ViewAdapter'

export type EditorCommandId =
    | 'insertParagraph'
    | 'insertHeading'
    | 'insertQuote'
    | 'insertTable'
    | 'insertLink'
    // 预留通用命令
    | string

export interface CommandContext {
    editorType: EditorType
    sceneTemplate: SceneTemplate
    selection: Selection
    adapter: ViewAdapter | null
    getAST: () => DocumentAST
}

export interface EditorCommand<Payload = any> {
    id: EditorCommandId
    title?: string
    description?: string
    // 命令是否在当前上下文可用
    isSupported: (ctx: CommandContext) => boolean
    // 执行逻辑
    run: (ctx: CommandContext, payload?: Payload) => Promise<void> | void
    // 可选：为不同 EditorType/Scene 定义权重（用于多实现时的选择）
    priority?: (ctx: CommandContext) => number
}


