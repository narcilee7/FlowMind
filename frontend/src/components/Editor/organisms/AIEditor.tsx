import React, { useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Highlight } from '@tiptap/extension-highlight'
import { CodeBlock } from '@tiptap/extension-code-block'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Typography } from '@tiptap/extension-typography'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { Strike } from '@tiptap/extension-strike'
import { Superscript } from '@tiptap/extension-superscript'
import { Subscript } from '@tiptap/extension-subscript'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { FloatingMenu } from '@tiptap/extension-floating-menu'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Image as ImageIcon,
  Table as TableIcon,
  Sparkles,
  Bot,
  Lightbulb,
  Wand2,
  Highlighter
} from 'lucide-react'
import './AIEditor.scss'

interface AIEditorProps {
  initialContent?: string
  placeholder?: string
  onContentChange?: (content: string) => void
  className?: string
}

export const AIEditor: React.FC<AIEditorProps> = (props) => {
  const {
    initialContent = '',
    placeholder = '开始编写，AI助手随时为您提供帮助...',
    onContentChange,
    className = ''
  } = props

  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  // 气泡菜单和浮动菜单的引用
  const bubbleMenuRef = useRef<HTMLDivElement>(null)
  const floatingMenuRef = useRef<HTMLDivElement>(null)

  // 使用useEditor创建编辑器实例
  const editor = useEditor({
          // 扩展配置
      extensions: [
        StarterKit.configure({
          // 禁用StarterKit中的一些扩展，因为我们有自定义版本
          codeBlock: false,
          link: false,
          underline: false,
          strike: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
        Highlight.configure({
          multicolor: true,
        }),
        CodeBlock.configure({
          HTMLAttributes: {
            class: 'bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono text-sm',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 hover:text-blue-800 underline',
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'max-w-full h-auto rounded',
          },
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'border-collapse border border-gray-300 dark:border-gray-600',
          },
        }),
        TableRow,
        TableCell.configure({
          HTMLAttributes: {
            class: 'border border-gray-300 dark:border-gray-600 px-3 py-2',
          },
        }),
        TableHeader.configure({
          HTMLAttributes: {
            class: 'border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-bold',
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
          HTMLAttributes: {
            class: 'flex items-start gap-2',
          },
        }),
        Typography,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        Strike,
        Superscript,
        Subscript,
        Color,
        TextStyle,
        BubbleMenu.configure({
          element: null,
        }),
        FloatingMenu.configure({
          element: null,
        }),
      ],
    // 初始内容
    content: initialContent,
    // 编辑器属性配置
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
    // 内容更新回调函数
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.getHTML())
    },
  })

  // AI功能
  const generateAIContent = async (prompt: string) => {
    if (!editor) return
    
    setIsGenerating(true)
    try {
      // 模拟AI生成内容
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const aiContent = `这是AI为您生成的内容：${prompt}\n\nAI助手可以帮助您：\n- 完善文章结构\n- 优化表达方式\n- 提供写作建议\n- 生成相关内容`
      
      // 插入AI生成的内容，带有特殊样式
      editor.commands.insertContent(`
        <div class="ai-generated bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg my-4">
          <div class="flex items-center gap-2 mb-2">
            <Bot class="w-4 h-4 text-green-600" />
            <span class="text-sm font-medium text-green-800 dark:text-green-200">AI助手</span>
          </div>
          <div class="text-green-700 dark:text-green-300">
            ${aiContent}
          </div>
        </div>
      `)
    } catch (error) {
      console.error('AI内容生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const insertAISuggestion = async (suggestion: string) => {
    if (!editor) return
    
    editor.commands.insertContent(`
      <div class="ai-suggestion bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 my-2">
        <div class="flex items-center gap-2 mb-1">
          <Lightbulb class="w-4 h-4 text-blue-600" />
          <span class="text-sm font-medium text-blue-800 dark:text-blue-200">AI建议</span>
        </div>
        <p class="text-blue-700 dark:text-blue-300">${suggestion}</p>
      </div>
    `)
  }

  const enhanceCurrentText = async () => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    if (from === to) return
    
    const selectedText = editor.state.doc.textBetween(from, to)
    setIsGenerating(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const enhancedText = `优化后的文本：${selectedText}（已由AI优化）`
      
      editor.commands.insertContentAt(from, enhancedText)
      editor.commands.setTextSelection({ from, to: from + enhancedText.length })
      editor.commands.toggleHighlight({ color: '#fbbf24' })
    } catch (error) {
      console.error('文本优化失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAITable = async () => {
    if (!editor) return
    
    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 插入AI生成的表格
      editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      
      // 填充表格内容
      const table = editor.state.doc.lastChild
      if (table && table.type.name === 'table') {
        // 这里可以进一步填充表格内容
      }
    } catch (error) {
      console.error('表格生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAICode = async () => {
    if (!editor) return
    
    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const codeExample = `// AI生成的代码示例
function aiGeneratedFunction() {
  console.log('这是AI为您生成的代码');
  return 'Hello from AI!';
}

// 使用示例
const result = aiGeneratedFunction();
console.log(result);`
      
      editor.commands.insertContent(`
        <pre><code class="language-javascript">${codeExample}</code></pre>
      `)
    } catch (error) {
      console.error('代码生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!editor) {
    return <div className="flex items-center justify-center h-64">加载编辑器中...</div>
  }

  return (
    <div className={`ai-editor ${className}`}>
      {/* 工具栏 */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-1 flex-wrap">
          {/* 基础格式工具 */}
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* 标题工具 */}
          <Button
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* 列表工具 */}
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* 插入工具 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('请输入图片URL')
              if (url) {
                editor.chain().focus().setImage({ src: url }).run()
              }
            }}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <TableIcon className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* AI工具 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={enhanceCurrentText}
            disabled={isGenerating || editor.state.selection.empty}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
          >
            <Wand2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI助手面板 */}
      {isAIAssistantOpen && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-purple-800 dark:text-purple-200">AI助手</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateAIContent('请帮我完善这篇文章')}
              disabled={isGenerating}
              className="text-left"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              完善文章
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={generateAITable}
              disabled={isGenerating}
              className="text-left"
            >
              <TableIcon className="w-4 h-4 mr-2" />
              生成表格
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={generateAICode}
              disabled={isGenerating}
              className="text-left"
            >
              <Code className="w-4 h-4 mr-2" />
              生成代码
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertAISuggestion('建议添加更多细节来丰富内容')}
              disabled={isGenerating}
              className="text-left"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              写作建议
            </Button>
          </div>
          
          {isGenerating && (
            <div className="flex items-center gap-2 mt-3 text-purple-600 dark:text-purple-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm">AI正在思考中...</span>
            </div>
          )}
        </div>
      )}

      {/* 编辑器内容 */}
      <div className="relative">
        <EditorContent editor={editor} />
        
        {/* 浮动菜单 */}
        <div ref={floatingMenuRef} className="floating-menu">
          {editor && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                  H1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  H2
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                  • 列表
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                  " 引用
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* 气泡菜单 */}
        <div ref={bubbleMenuRef} className="bubble-menu">
          {editor && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1">
              <div className="flex items-center gap-1">
                <Button
                  variant={editor.isActive('bold') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant={editor.isActive('italic') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant={editor.isActive('underline') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={editor.isActive('highlight') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                >
                  <Highlighter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 