import { EditorMode, EditorOptions, EditorType } from "@/components/Editor/types"
import { useEditor } from "@/components/Editor/core/EditorProvider"
import React from "react"
import EditorManager from "@/components/Editor/core/EditorAdapterFactory"

interface EditorViewProps {
    className?: string
    showToolbar?: boolean
    showStatusBar?: boolean
    onContentChange?: (content: string) => void
    onEditorTypeChange?: (type: EditorType) => void
    onEditorModeChange?: (mode: EditorMode) => void
}

const EditorView: React.FC<EditorViewProps> = (props) => {
    const { 
        className,
        showToolbar, 
        showStatusBar, 
        onContentChange, 
        onEditorTypeChange, 
        onEditorModeChange 
    } = props

    const { state, dispatch, switchEditorType, switchEditorMode } = useEditor()
    
    const editorRef = React.useRef<HTMLDivElement>(null) 
    const editorManagerRef = React.useRef<EditorManager>(new EditorManager())

    const [isLoading, setIsLoading] = React.useState(false)

    // 初始化
    React.useEffect(() => {
        if (editorRef.current) {
            // 
        }
    }, [])

    const initializeEditor = async () => {
        if (!editorRef.current) return

        setIsLoading(true)

        try {
            const options: EditorOptions = {
                value: state.content,
                language: state.language,
                theme: state.theme,
                readonly: state.isReadOnly,
                editorType: state.editorType,
                editorMode: state.editorMode,
                markdownOptions: state.markdownState,
                richTextOptions: state.richTextState,
                canvasOptions: state.canvasState
            }

            const adapter = await editorManagerRef.current.createEditor(
                editorRef.current,
                state.editorType,
                options
            )

            // adapter.on('change', (content: string) => {})
            // adapter.on 
        } catch (error) {
            
        }
    }
}

export default React.memo(EditorView) as typeof EditorView