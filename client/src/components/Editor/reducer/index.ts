import { EditorState, EditorAction, EditorActionType } from '../types'

// 初始状态
export const initialState: EditorState = {
  content: '',
  language: 'markdown',
  theme: 'flowmind-dark',
  isReadOnly: false,
  isDirty: false,
  cursorPosition: { line: 1, column: 1 },
  selection: null,
  scrollPosition: { scrollTop: 0, scrollLeft: 0 },
  viewport: { width: 0, height: 0 }
}

// 状态reducer
const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case EditorActionType.SET_CONTENT:
      return { ...state, content: action.payload, isDirty: true }
    case EditorActionType.SET_LANGUAGE:
      return { ...state, language: action.payload }
    case EditorActionType.SET_THEME:
      return { ...state, theme: action.payload }
    case EditorActionType.SET_READ_ONLY:
      return { ...state, isReadOnly: action.payload }
    case EditorActionType.SET_DIRTY:
      return { ...state, isDirty: action.payload }
    case EditorActionType.SET_CURSOR_POSITION:
      return { ...state, cursorPosition: action.payload }
    case EditorActionType.SET_SELECTION:
      return { ...state, selection: action.payload }
    case EditorActionType.SET_SCROLL_POSITION:
      return { ...state, scrollPosition: action.payload }
    case EditorActionType.SET_VIEWPORT:
      return { ...state, viewport: action.payload }
    case EditorActionType.RESET_STATE:
      return initialState
    default:
      return state
  }
}

export default editorReducer 