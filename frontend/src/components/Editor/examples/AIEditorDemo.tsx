import React, { useState } from 'react'
import { AIEditorWorkspace } from '../organisms/AIEditorWorkspace'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Sparkles, 
  Bot, 
  Lightbulb,
  Wand2,
  Code,
  Table as TableIcon,
  Image as ImageIcon
} from 'lucide-react'

const sampleContent = `
<h1>欢迎使用AI编辑器</h1>

<p>这是一个基于TipTap的智能富文本编辑器，集成了强大的AI功能。</p>

<h2>主要功能</h2>

<ul>
  <li>🎨 丰富的文本格式化工具</li>
  <li>🤖 AI内容生成和优化</li>
  <li>📊 智能表格生成</li>
  <li>💻 代码块支持</li>
  <li>🖼️ 图片插入和管理</li>
  <li>📝 实时协作编辑</li>
</ul>

<h2>AI助手功能</h2>

<p>点击工具栏中的 <Sparkles className="w-4 h-4 inline" /> 按钮打开AI助手面板，体验以下功能：</p>

<ul>
  <li><strong>完善文章</strong> - AI帮助您完善文章结构和内容</li>
  <li><strong>生成表格</strong> - 智能生成数据表格</li>
  <li><strong>生成代码</strong> - 根据需求生成代码示例</li>
  <li><strong>写作建议</strong> - 提供专业的写作建议</li>
</ul>

<h2>开始使用</h2>

<p>选择下面的示例内容开始体验，或者直接在编辑器中开始创作：</p>
`

const aiGeneratedContent = `
<div class="ai-generated bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg my-4">
  <div class="flex items-center gap-2 mb-2">
    <Bot class="w-4 h-4 text-green-600" />
    <span class="text-sm font-medium text-green-800 dark:text-green-200">AI助手</span>
  </div>
  <div class="text-green-700 dark:text-green-300">
    <p>这是AI为您生成的内容示例：</p>
    <p>AI编辑器可以帮助您：</p>
    <ul>
      <li>完善文章结构</li>
      <li>优化表达方式</li>
      <li>提供写作建议</li>
      <li>生成相关内容</li>
    </ul>
  </div>
</div>
`

const tableContent = `
<table class="border-collapse border border-gray-300 dark:border-gray-600">
  <thead>
    <tr>
      <th class="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-bold">功能</th>
      <th class="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-bold">描述</th>
      <th class="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-bold">状态</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">文本编辑</td>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">基础文本编辑功能</td>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">✅ 已完成</td>
    </tr>
    <tr>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">AI助手</td>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">智能内容生成</td>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">🚧 开发中</td>
    </tr>
    <tr>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">协作编辑</td>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">多人实时协作</td>
      <td class="border border-gray-300 dark:border-gray-600 px-3 py-2">📋 计划中</td>
    </tr>
  </tbody>
</table>
`

const codeContent = `
<pre><code class="language-javascript bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono text-sm">
// AI编辑器示例代码
class AIEditor {
  constructor() {
    this.editor = null;
    this.aiAssistant = null;
  }

  async initialize() {
    // 初始化编辑器
    this.editor = new TipTapEditor();
    
    // 初始化AI助手
    this.aiAssistant = new AIAssistant({
      onGenerate: this.handleAIGeneration.bind(this),
      onOptimize: this.handleAIOptimization.bind(this)
    });
  }

  async generateContent(prompt) {
    const content = await this.aiAssistant.generate(prompt);
    this.editor.insertContent(content);
  }
}

// 使用示例
const editor = new AIEditor();
editor.initialize();
</code></pre>
`

export const AIEditorDemo: React.FC = () => {
  const [currentContent, setCurrentContent] = useState(sampleContent)
  const [showExamples, setShowExamples] = useState(true)

  const loadExample = (content: string, title: string) => {
    setCurrentContent(content)
    setShowExamples(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* 演示头部 */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI编辑器演示
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              体验基于TipTap的智能富文本编辑器
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowExamples(!showExamples)}
          >
            {showExamples ? '隐藏示例' : '显示示例'}
          </Button>
        </div>
      </div>

      {/* 示例选择器 */}
      {showExamples && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            选择示例内容开始体验：
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
              onClick={() => loadExample(sampleContent, '基础介绍')}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">基础介绍</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
              onClick={() => loadExample(aiGeneratedContent, 'AI生成内容')}
            >
              <Bot className="w-5 h-5" />
              <span className="text-xs">AI生成内容</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
              onClick={() => loadExample(tableContent, '智能表格')}
            >
              <TableIcon className="w-5 h-5" />
              <span className="text-xs">智能表格</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
              onClick={() => loadExample(codeContent, '代码示例')}
            >
              <Code className="w-5 h-5" />
              <span className="text-xs">代码示例</span>
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">💡 使用提示：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 点击工具栏中的 <Sparkles className="w-3 h-3 inline" /> 按钮打开AI助手</li>
                  <li>• 选中文本后点击 <Wand2 className="w-3 h-3 inline" /> 按钮进行AI优化</li>
                  <li>• 使用侧边栏的AI功能快速生成内容</li>
                  <li>• 尝试插入图片、表格、代码块等元素</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI编辑器工作区 */}
      <div className="flex-1">
        <AIEditorWorkspace
          initialContent={currentContent}
          onContentChange={setCurrentContent}
          className="h-full"
        />
      </div>
    </div>
  )
} 