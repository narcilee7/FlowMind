// 编辑器状态接口
export interface EditorState {
  content: string
  language: string
  theme: string
  isReadOnly: boolean
  isDirty: boolean
  cursorPosition: PositionSection
  selection: SelectionSection | null
  scrollPosition: { scrollTop: number; scrollLeft: number }
  viewport: { width: number; height: number }
}

// 位置接口
export interface PositionSection {
  line: number
  column: number
}

// 选择范围接口
export interface SelectionSection {
  start: PositionSection
  end: PositionSection
}

// 编辑器动作类型
export enum EditorActionType {
  SET_CONTENT = 'SET_CONTENT',
  SET_LANGUAGE = 'SET_LANGUAGE',
  SET_THEME = 'SET_THEME',
  SET_READ_ONLY = 'SET_READ_ONLY',
  SET_DIRTY = 'SET_DIRTY',
  SET_CURSOR_POSITION = 'SET_CURSOR_POSITION',
  SET_SELECTION = 'SET_SELECTION',
  SET_SCROLL_POSITION = 'SET_SCROLL_POSITION',
  SET_VIEWPORT = 'SET_VIEWPORT',
  RESET_STATE = 'RESET_STATE'
}

// 编辑器动作
export type EditorAction =
  | { type: EditorActionType.SET_CONTENT; payload: string }
  | { type: EditorActionType.SET_LANGUAGE; payload: string }
  | { type: EditorActionType.SET_THEME; payload: string }
  | { type: EditorActionType.SET_READ_ONLY; payload: boolean }
  | { type: EditorActionType.SET_DIRTY; payload: boolean }
  | { type: EditorActionType.SET_CURSOR_POSITION; payload: PositionSection }
  | { type: EditorActionType.SET_SELECTION; payload: SelectionSection | null }
  | { type: EditorActionType.SET_SCROLL_POSITION; payload: { scrollTop: number; scrollLeft: number } }
  | { type: EditorActionType.SET_VIEWPORT; payload: { width: number; height: number } }
  | { type: EditorActionType.RESET_STATE }

// 插件接口
export interface EditorPlugin {
  id: string
  name: string
  version: string
  activate: (context: EditorContextValue) => void
  deactivate: () => void
  commands?: Record<string, () => void>
  keybindings?: Array<{ key: string; command: string; when?: string }>
}

// 编辑器上下文接口
export interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  // 编辑器操作方法
  setContent: (content: string) => void
  getContent: () => string
  insertText: (text: string, position?: PositionSection) => void
  replaceSelection: (text: string) => void
  getSelection: () => string
  setSelection: (start: PositionSection, end: PositionSection) => void
  // 插件系统
  registerPlugin: (plugin: EditorPlugin) => void
  unregisterPlugin: (pluginId: string) => void
  getPlugin: (pluginId: string) => EditorPlugin | undefined
  // 事件系统
  subscribe: (event: string, callback: Function) => () => void
  emit: (event: string, data?: any) => void
}

// Provider组件属性
export interface EditorProviderProps {
  children: React.ReactNode
  initialContent?: string
  initialLanguage?: string
  initialTheme?: string
} 