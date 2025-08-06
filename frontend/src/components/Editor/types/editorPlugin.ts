/**
 * 编辑器插件接口
 */

import { EditorContextValue } from "./editorContext"
import { EditorType } from "./editorType"

export interface EditorPlugin {
    id: string
    name: string
    version: string
    supportedEditorTypes: EditorType[]
    activate: (context: EditorContextValue) => void
    deactivate: () => void
    commands?: Record<string, () => void>
    keybindings?: Array<{ key: string; command: string; when?: string }>
}
