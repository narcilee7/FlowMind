import { EditorPlugin, EditorContextValue, EditorType } from '../types'

// AI助手插件
export class AIAssistantPlugin implements EditorPlugin {
  id = 'ai-assistant'
  name = 'AI Assistant'
  version = '1.0.0'
  supportedEditorTypes = [EditorType.MARKDOWN, EditorType.RICH_TEXT, EditorType.CANVAS]
  private context: EditorContextValue | null = null
  private unsubscribe: (() => void)[] = []
  private isProcessing = false

  activate(context: EditorContextValue): void {
    this.context = context
    
    // 注册命令
    this.registerCommands()
    
    // 注册事件监听
    this.registerEventListeners()
    
    // 注册快捷键
    this.registerKeybindings()
  }

  deactivate(): void {
    // 清理事件监听
    this.unsubscribe.forEach(unsub => unsub())
    this.unsubscribe = []
    
    this.context = null
  }

  commands = {
    'ai.complete': () => this.completeText(),
    'ai.improve': () => this.improveText(),
    'ai.summarize': () => this.summarizeText(),
    'ai.translate': (targetLanguage: string = 'en') => this.translateText(targetLanguage),
    'ai.format': () => this.formatText(),
    'ai.fixGrammar': () => this.fixGrammar(),
    'ai.expand': () => this.expandText(),
    'ai.rewrite': (style: string = 'professional') => this.rewriteText(style),
    'ai.generateOutline': () => this.generateOutline(),
    'ai.addExamples': () => this.addExamples(),
  }

  keybindings = [
    { key: 'ctrl+shift+space', command: 'ai.complete' },
    { key: 'ctrl+shift+i', command: 'ai.improve' },
    { key: 'ctrl+shift+s', command: 'ai.summarize' },
    { key: 'ctrl+shift+t', command: 'ai.translate' },
    { key: 'ctrl+shift+f', command: 'ai.format' },
    { key: 'ctrl+shift+g', command: 'ai.fixGrammar' },
    { key: 'ctrl+shift+e', command: 'ai.expand' },
    { key: 'ctrl+shift+r', command: 'ai.rewrite' },
    { key: 'ctrl+shift+o', command: 'ai.generateOutline' },
    { key: 'ctrl+shift+x', command: 'ai.addExamples' },
  ]

  private registerCommands(): void {
    if (!this.context) return

    Object.entries(this.commands).forEach(([id, handler]) => {
      this.context!.emit('registerCommand', { id, handler })
    })
  }

  private registerEventListeners(): void {
    if (!this.context) return

    // 监听内容变化，提供智能建议
    const unsub1 = this.context.subscribe('contentChanged', (content: string) => {
      this.provideSuggestions(content)
    })

    // 监听光标位置变化，提供上下文相关的AI建议
    const unsub2 = this.context.subscribe('cursorPositionChanged', (position: any) => {
      this.provideContextualSuggestions(position)
    })

    // 监听选择变化，提供针对选中内容的AI操作
    const unsub3 = this.context.subscribe('selectionChanged', (selection: any) => {
      this.provideSelectionBasedSuggestions(selection)
    })

    this.unsubscribe.push(unsub1, unsub2, unsub3)
  }

  private registerKeybindings(): void {
    if (!this.context) return

    this.keybindings.forEach(binding => {
      this.context!.emit('registerKeybinding', binding)
    })
  }

  // 文本补全
  private async completeText(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const content = this.context.getContent()
      const cursorPosition = this.context.state.cursorPosition
      
      // 获取光标前的上下文
      const context = this.getContextBeforeCursor(content, cursorPosition)
      
      // 调用AI服务进行补全
      const completion = await this.callAIService('complete', {
        context,
        maxTokens: 100
      })
      
      if (completion) {
        this.context.insertText(completion)
      }
    } catch (error) {
      console.error('AI completion failed:', error)
      this.showError('文本补全失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 改进文本
  private async improveText(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const selection = this.context.getSelection()
      if (!selection) {
        this.showError('请先选择要改进的文本')
        return
      }
      
      const improved = await this.callAIService('improve', {
        text: selection,
        style: 'professional'
      })
      
      if (improved) {
        this.context.replaceSelection(improved)
      }
    } catch (error) {
      console.error('AI improvement failed:', error)
      this.showError('文本改进失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 总结文本
  private async summarizeText(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const selection = this.context.getSelection()
      const text = selection || this.context.getContent()
      
      const summary = await this.callAIService('summarize', {
        text,
        maxLength: 200
      })
      
      if (summary) {
        // 在文档末尾添加总结
        const currentContent = this.context.getContent()
        const newContent = currentContent + '\n\n## 总结\n\n' + summary
        this.context.setContent(newContent)
      }
    } catch (error) {
      console.error('AI summarization failed:', error)
      this.showError('文本总结失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 翻译文本
  private async translateText(targetLanguage: string): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const selection = this.context.getSelection()
      if (!selection) {
        this.showError('请先选择要翻译的文本')
        return
      }
      
      const translated = await this.callAIService('translate', {
        text: selection,
        targetLanguage
      })
      
      if (translated) {
        this.context.replaceSelection(translated)
      }
    } catch (error) {
      console.error('AI translation failed:', error)
      this.showError('文本翻译失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 格式化文本
  private async formatText(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const content = this.context.getContent()
      
      const formatted = await this.callAIService('format', {
        text: content,
        format: 'markdown'
      })
      
      if (formatted) {
        this.context.setContent(formatted)
      }
    } catch (error) {
      console.error('AI formatting failed:', error)
      this.showError('文本格式化失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 语法检查
  private async fixGrammar(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const selection = this.context.getSelection()
      const text = selection || this.context.getContent()
      
      const corrected = await this.callAIService('fixGrammar', {
        text
      })
      
      if (corrected) {
        if (selection) {
          this.context.replaceSelection(corrected)
        } else {
          this.context.setContent(corrected)
        }
      }
    } catch (error) {
      console.error('AI grammar fix failed:', error)
      this.showError('语法检查失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 扩展文本
  private async expandText(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const selection = this.context.getSelection()
      if (!selection) {
        this.showError('请先选择要扩展的文本')
        return
      }
      
      const expanded = await this.callAIService('expand', {
        text: selection,
        expansionType: 'detailed'
      })
      
      if (expanded) {
        this.context.replaceSelection(expanded)
      }
    } catch (error) {
      console.error('AI expansion failed:', error)
      this.showError('文本扩展失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 重写文本
  private async rewriteText(style: string): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const selection = this.context.getSelection()
      if (!selection) {
        this.showError('请先选择要重写的文本')
        return
      }
      
      const rewritten = await this.callAIService('rewrite', {
        text: selection,
        style
      })
      
      if (rewritten) {
        this.context.replaceSelection(rewritten)
      }
    } catch (error) {
      console.error('AI rewrite failed:', error)
      this.showError('文本重写失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 生成大纲
  private async generateOutline(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const content = this.context.getContent()
      
      const outline = await this.callAIService('generateOutline', {
        text: content
      })
      
      if (outline) {
        // 在文档开头插入大纲
        const currentContent = this.context.getContent()
        const newContent = '# 大纲\n\n' + outline + '\n\n---\n\n' + currentContent
        this.context.setContent(newContent)
      }
    } catch (error) {
      console.error('AI outline generation failed:', error)
      this.showError('大纲生成失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 添加示例
  private async addExamples(): Promise<void> {
    if (!this.context || this.isProcessing) return

    this.isProcessing = true
    try {
      const selection = this.context.getSelection()
      if (!selection) {
        this.showError('请先选择要添加示例的文本')
        return
      }
      
      const examples = await this.callAIService('addExamples', {
        text: selection,
        count: 3
      })
      
      if (examples) {
        const newText = selection + '\n\n### 示例\n\n' + examples
        this.context.replaceSelection(newText)
      }
    } catch (error) {
      console.error('AI example generation failed:', error)
      this.showError('示例生成失败，请重试')
    } finally {
      this.isProcessing = false
    }
  }

  // 提供建议
  private provideSuggestions(content: string): void {
    // 分析内容并提供智能建议
    console.log('Providing AI suggestions for content:', content.length, 'characters')
  }

  // 提供上下文建议
  private provideContextualSuggestions(position: any): void {
    // 根据光标位置提供上下文相关的AI建议
    console.log('Providing contextual AI suggestions at position:', position)
  }

  // 提供基于选择的建议
  private provideSelectionBasedSuggestions(selection: any): void {
    // 根据选中的内容提供相应的AI操作建议
    console.log('Providing selection-based AI suggestions:', selection)
  }

  // 获取光标前的上下文
  private getContextBeforeCursor(content: string, position: { line: number; column: number }): string {
    const lines = content.split('\n')
    const contextLines = lines.slice(0, position.line)
    if (position.line > 0) {
      contextLines[position.line - 1] = contextLines[position.line - 1].substring(0, position.column)
    }
    return contextLines.join('\n')
  }

  // 调用AI服务
  private async callAIService(operation: string, params: any): Promise<string | null> {
    // 这里应该调用实际的AI服务
    // 目前返回模拟数据
    console.log('Calling AI service:', operation, params)
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 返回模拟结果
    const mockResults = {
      complete: '这是AI补全的文本内容。',
      improve: '这是改进后的文本内容，更加专业和清晰。',
      summarize: '这是对原文的简要总结，突出了主要观点。',
      translate: 'This is the translated text content.',
      format: '# 格式化后的文档\n\n内容已经按照Markdown格式进行了优化。',
      fixGrammar: '这是修正语法错误后的文本。',
      expand: '这是扩展后的详细内容，包含了更多信息和解释。',
      rewrite: '这是按照指定风格重写后的文本内容。',
      generateOutline: '1. 引言\n2. 主要观点\n3. 结论',
      addExamples: '**示例1：** 这是第一个示例。\n\n**示例2：** 这是第二个示例。\n\n**示例3：** 这是第三个示例。'
    }
    
    return mockResults[operation as keyof typeof mockResults] || null
  }

  // 显示错误信息
  private showError(message: string): void {
    if (this.context) {
      this.context.emit('showError', message)
    }
  }
} 