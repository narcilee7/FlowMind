import { EditorState, EditorAction, EditorActionType, EditorType, EditorMode } from '../types'

// 初始状态
export const initialState: EditorState = {
  content: '',
  language: 'markdown',
  theme: 'flowmind-dark',
  editorType: EditorType.MARKDOWN,
  editorMode: EditorMode.EDIT,
  isReadOnly: false,
  isDirty: false,
  cursorPosition: { line: 1, column: 1 },
  selection: null,
  scrollPosition: { scrollTop: 0, scrollLeft: 0 },
  viewport: { width: 0, height: 0 },
  markdownState: {
    showLineNumbers: false,
    showGutter: false,
    wordWrap: true,
    autoSave: true,
    previewTheme: 'default',
    mathRendering: true,
    mermaidRendering: true
  },
  richTextState: {
    showToolbar: true,
    showFormatBar: true,
    blockTypes: ['paragraph', 'heading', 'list', 'code'],
    customBlocks: {},
    collaborationEnabled: false
  },
  canvasState: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedNodes: [],
    selectedEdges: [],
    gridEnabled: true,
    snapToGrid: true
  }
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
    case EditorActionType.SET_EDITOR_TYPE:
      return { ...state, editorType: action.payload }
    case EditorActionType.SET_EDITOR_MODE:
      return { ...state, editorMode: action.payload }
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
    case EditorActionType.SET_MARKDOWN_STATE:
      return { 
        ...state, 
        markdownState: { 
          ...state.markdownState!, 
          ...action.payload 
        }
      }
    case EditorActionType.SET_RICH_TEXT_STATE:
      return { 
        ...state, 
        richTextState: { 
          ...state.richTextState!, 
          ...action.payload 
        }
      }
    case EditorActionType.SET_CANVAS_STATE:
      return { 
        ...state, 
        canvasState: { 
          ...state.canvasState!, 
          ...action.payload 
        }
      }
    case EditorActionType.RESET_STATE:
      return initialState
    default:
      return state
  }
}

export default editorReducer 