/**
 * 富文本适配器类型
 */

export interface RichTextAdapter {
  commands: RichTextCommands
  state: RichTextState
  isFocused: boolean
  getHTML: () => string
  getJSON: () => any
  destroy: () => void
  on: (event: string, callback: Function) => void
  off: (event: string, callback: Function) => void
}

/**
 * 富文本命令接口
 */
export interface RichTextCommands {
  // 设置内容
  setContent: (content: string, options?: any) => boolean
  // 聚焦
  focus: () => void
  // 失焦
  blur: () => void
  // 设置文本选择
  setTextSelection: (position: number | Selection) => void
  // 插入内容
  insertContent: (content: any) => void
  // 删除选择
  deleteSelection: () => void
  // 切换粗体
  toggleBold: () => void
  // 切换斜体
  toggleItalic: () => void
  // 切换下划线
  toggleUnderline: () => void
  // 切换删除线
  toggleStrike: () => void
  // 设置颜色
  setColor: (color: string) => void
  // 设置标记
  setMark: (mark: string, attributes: Record<string, any>) => void
  setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void
}

/**
 * 富文本适配器状态
 */
export interface RichTextState {
  selection: Selection
  // 目录
  doc: {
    content: any[]
  }
}

/**
 * Selection
 */
export interface Selection {
  from: number
  to: number
}

/**
 * node节点与HTML节点映射关系
 */
export interface NodePositionMapping {
  nodeId: string
  start: number
  end: number
  path: number[]
  element?: HTMLElement
}