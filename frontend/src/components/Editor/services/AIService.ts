/**
 * AI服务类
 * 
 * 提供与各种AI服务的集成功能：
 * - OpenAI GPT系列
 * - Claude (Anthropic)
 * - 其他LLM服务
 * 
 * 支持功能：
 * - 智能补全
 * - 内容重写
 * - 深度研究（DeepResearch）
 * - 知识提取
 * - 内容分析
 */

/**
 * AI服务提供商枚举
 */
export enum AIProvider {
    OPENAI = 'openai',
    CLAUDE = 'claude',
    CUSTOM = 'custom',
    MOCK = 'mock' // 用于开发和测试
}

/**
 * AI服务配置
 */
export interface AIServiceConfig {
    provider: AIProvider
    apiKey: string
    baseUrl?: string
    model?: string
    temperature?: number
    maxTokens?: number
    timeout?: number
    retryAttempts?: number
}

/**
 * AI请求上下文
 */
export interface AIContext {
    currentText: string
    cursorPosition: number
    selectedText?: string
    documentType?: string
    sceneTemplate?: string
    userIntent?: string
    history?: string[]
    language?: string
}

/**
 * AI补全请求
 */
export interface AICompletionRequest {
    context: AIContext
    maxLength?: number
    style?: string
    format?: 'text' | 'markdown' | 'html'
}

/**
 * AI重写请求
 */
export interface AIRewriteRequest {
    content: string
    style: 'formal' | 'casual' | 'professional' | 'academic' | 'creative' | 'concise' | 'detailed'
    tone?: 'neutral' | 'friendly' | 'serious' | 'humorous'
    targetAudience?: string
    language?: string
}

/**
 * AI研究请求
 */
export interface AIResearchRequest {
    query: string
    sources?: string[]
    depth?: 'basic' | 'intermediate' | 'deep'
    includeReferences?: boolean
    language?: string
}

/**
 * AI知识提取请求
 */
export interface AIKnowledgeRequest {
    content: string
    extractTypes?: ('entities' | 'concepts' | 'relationships' | 'summary' | 'keywords')[]
    domain?: string
    language?: string
}

/**
 * AI响应基础接口
 */
export interface AIResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
        cost?: number
    }
    metadata?: Record<string, any>
}

/**
 * AI补全响应
 */
export interface AICompletionResponse {
    text: string
    confidence: number
    alternatives?: string[]
    reasoning?: string
}

/**
 * AI重写响应
 */
export interface AIRewriteResponse {
    text: string
    improvements: string[]
    originalLength: number
    newLength: number
    readabilityScore?: number
}

/**
 * AI研究响应
 */
export interface AIResearchResponse {
    summary: string
    keyPoints: string[]
    sources: Array<{
        title: string
        url?: string
        excerpt: string
        credibility: number
    }>
    relatedQueries: string[]
    confidence: number
}

/**
 * AI知识提取响应
 */
export interface AIKnowledgeResponse {
    entities: Array<{
        name: string
        type: string
        confidence: number
        description?: string
    }>
    concepts: Array<{
        name: string
        definition: string
        importance: number
    }>
    relationships: Array<{
        source: string
        target: string
        type: string
        confidence: number
    }>
    summary: string
    keywords: string[]
}

/**
 * AI服务类
 */
export class AIService {
    private config: AIServiceConfig
    private requestCount: number = 0
    private errorCount: number = 0
    private lastRequestTime: number = 0

    constructor(config: AIServiceConfig) {
        this.config = {
            temperature: 0.7,
            maxTokens: 2048,
            timeout: 30000,
            retryAttempts: 3,
            ...config
        }
    }

    /**
     * 智能补全
     */
    async completion(request: AICompletionRequest): Promise<AIResponse<AICompletionResponse>> {
        return this.executeRequest('completion', request, async () => {
            switch (this.config.provider) {
                case AIProvider.OPENAI:
                    return this.openaiCompletion(request)
                case AIProvider.CLAUDE:
                    return this.claudeCompletion(request)
                case AIProvider.MOCK:
                    return this.mockCompletion(request)
                default:
                    throw new Error(`Unsupported AI provider: ${this.config.provider}`)
            }
        })
    }

    /**
     * 内容重写
     */
    async rewrite(request: AIRewriteRequest): Promise<AIResponse<AIRewriteResponse>> {
        return this.executeRequest('rewrite', request, async () => {
            switch (this.config.provider) {
                case AIProvider.OPENAI:
                    return this.openaiRewrite(request)
                case AIProvider.CLAUDE:
                    return this.claudeRewrite(request)
                case AIProvider.MOCK:
                    return this.mockRewrite(request)
                default:
                    throw new Error(`Unsupported AI provider: ${this.config.provider}`)
            }
        })
    }

    /**
     * 深度研究
     */
    async research(request: AIResearchRequest): Promise<AIResponse<AIResearchResponse>> {
        return this.executeRequest('research', request, async () => {
            switch (this.config.provider) {
                case AIProvider.OPENAI:
                    return this.openaiResearch(request)
                case AIProvider.CLAUDE:
                    return this.claudeResearch(request)
                case AIProvider.MOCK:
                    return this.mockResearch(request)
                default:
                    throw new Error(`Unsupported AI provider: ${this.config.provider}`)
            }
        })
    }

    /**
     * 知识提取
     */
    async extractKnowledge(request: AIKnowledgeRequest): Promise<AIResponse<AIKnowledgeResponse>> {
        return this.executeRequest('knowledge', request, async () => {
            switch (this.config.provider) {
                case AIProvider.OPENAI:
                    return this.openaiKnowledge(request)
                case AIProvider.CLAUDE:
                    return this.claudeKnowledge(request)
                case AIProvider.MOCK:
                    return this.mockKnowledge(request)
                default:
                    throw new Error(`Unsupported AI provider: ${this.config.provider}`)
            }
        })
    }

    /**
     * 获取服务统计
     */
    getStats(): {
        requestCount: number
        errorCount: number
        successRate: number
        lastRequestTime: number
        provider: AIProvider
    } {
        return {
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            successRate: this.requestCount > 0 ? (this.requestCount - this.errorCount) / this.requestCount : 1,
            lastRequestTime: this.lastRequestTime,
            provider: this.config.provider
        }
    }

    /**
     * 更新配置
     */
    updateConfig(config: Partial<AIServiceConfig>): void {
        this.config = { ...this.config, ...config }
    }

    // === 私有方法 ===

    /**
     * 执行AI请求的通用包装器
     */
    private async executeRequest<T>(
        operation: string,
        request: any,
        executor: () => Promise<T>
    ): Promise<AIResponse<T>> {
        const startTime = Date.now()
        this.requestCount++
        this.lastRequestTime = startTime

        try {
            // 速率限制检查
            await this.checkRateLimit()

            // 执行请求
            const data = await this.withRetry(executor)

            return {
                success: true,
                data,
                metadata: {
                    operation,
                    duration: Date.now() - startTime,
                    provider: this.config.provider
                }
            }
        } catch (error) {
            this.errorCount++
            console.error(`[AIService] ${operation} failed:`, error)

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    operation,
                    duration: Date.now() - startTime,
                    provider: this.config.provider
                }
            }
        }
    }

    /**
     * 重试机制
     */
    private async withRetry<T>(executor: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null

        for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
            try {
                return await Promise.race([
                    executor(),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
                    )
                ])
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error')

                if (attempt < this.config.retryAttempts!) {
                    // 指数退避
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
                    await new Promise(resolve => setTimeout(resolve, delay))
                }
            }
        }

        throw lastError
    }

    /**
     * 速率限制检查
     */
    private async checkRateLimit(): Promise<void> {
        const now = Date.now()
        const timeSinceLastRequest = now - this.lastRequestTime
        const minInterval = 100 // 最小间隔100ms

        if (timeSinceLastRequest < minInterval) {
            await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest))
        }
    }

    // === OpenAI API实现 ===

    private async openaiCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
        const prompt = this.buildCompletionPrompt(request)

        const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '你是一个专业的写作助手，帮助用户完成文本内容。' },
                    { role: 'user', content: prompt }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: false
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const completion = data.choices[0]?.message?.content || ''

        return {
            text: completion,
            confidence: 0.8,
            reasoning: 'Generated by OpenAI GPT'
        }
    }

    private async openaiRewrite(request: AIRewriteRequest): Promise<AIRewriteResponse> {
        const prompt = this.buildRewritePrompt(request)

        const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '你是一个专业的文本编辑和重写专家。' },
                    { role: 'user', content: prompt }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        })

        const data = await response.json()
        const rewritten = data.choices[0]?.message?.content || ''

        return {
            text: rewritten,
            improvements: ['风格优化', '语言流畅性提升'],
            originalLength: request.content.length,
            newLength: rewritten.length
        }
    }

    private async openaiResearch(request: AIResearchRequest): Promise<AIResearchResponse> {
        const prompt = `请对以下查询进行深度研究分析：${request.query}`

        // 实际实现应该结合搜索API获取实时信息
        const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '你是一个专业的研究分析师，能够提供深度的研究分析。' },
                    { role: 'user', content: prompt }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        })

        const data = await response.json()
        const result = data.choices[0]?.message?.content || ''

        return {
            summary: result,
            keyPoints: this.extractKeyPoints(result),
            sources: [],
            relatedQueries: this.generateRelatedQueries(request.query),
            confidence: 0.75
        }
    }

    private async openaiKnowledge(request: AIKnowledgeRequest): Promise<AIKnowledgeResponse> {
        const prompt = this.buildKnowledgePrompt(request)

        const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '你是一个专业的知识提取专家，能够从文本中提取结构化信息。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3, // 较低温度以获得更一致的结果
                max_tokens: this.config.maxTokens
            })
        })

        const data = await response.json()
        const result = data.choices[0]?.message?.content || ''

        return this.parseKnowledgeResult(result)
    }

    // === Claude API实现 ===

    private async claudeCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
        // Claude API实现
        // 注意：需要根据Anthropic的实际API规范实现
        throw new Error('Claude integration not yet implemented')
    }

    private async claudeRewrite(request: AIRewriteRequest): Promise<AIRewriteResponse> {
        throw new Error('Claude integration not yet implemented')
    }

    private async claudeResearch(request: AIResearchRequest): Promise<AIResearchResponse> {
        throw new Error('Claude integration not yet implemented')
    }

    private async claudeKnowledge(request: AIKnowledgeRequest): Promise<AIKnowledgeResponse> {
        throw new Error('Claude integration not yet implemented')
    }

    // === Mock实现（用于开发测试）===

    private async mockCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

        const context = request.context.currentText
        const lastWords = context.split(' ').slice(-3).join(' ')

        let completion = ''
        if (lastWords.includes('AI') || lastWords.includes('人工智能')) {
            completion = '技术正在快速发展，为各个行业带来了革命性的变化。'
        } else if (lastWords.includes('研究') || lastWords.includes('学习')) {
            completion = '是一个持续的过程，需要不断地探索和实践。'
        } else if (lastWords.includes('写作') || lastWords.includes('创作')) {
            completion = '需要灵感、技巧和坚持。好的作品往往来自于深度的思考和反复的打磨。'
        } else {
            completion = '这是一个很有趣的话题，值得我们深入探讨。'
        }

        return {
            text: completion,
            confidence: 0.8 + Math.random() * 0.2,
            alternatives: [
                completion,
                completion.replace('很有趣', '很重要'),
                completion.replace('深入探讨', '仔细分析')
            ],
            reasoning: 'Mock AI completion based on context analysis'
        }
    }

    private async mockRewrite(request: AIRewriteRequest): Promise<AIRewriteResponse> {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))

        let rewritten = request.content
        const improvements: string[] = []

        // 简单的风格转换模拟
        switch (request.style) {
            case 'formal':
                rewritten = request.content.replace(/很/g, '非常').replace(/好/g, '优秀')
                improvements.push('使用更正式的词汇')
                break
            case 'casual':
                rewritten = request.content.replace(/非常/g, '很').replace(/优秀/g, '不错')
                improvements.push('使用更口语化的表达')
                break
            case 'professional':
                rewritten = `根据分析，${request.content}这一观点具有重要的实践意义。`
                improvements.push('增加专业性表述', '添加分析框架')
                break
        }

        return {
            text: rewritten,
            improvements,
            originalLength: request.content.length,
            newLength: rewritten.length,
            readabilityScore: 75 + Math.random() * 20
        }
    }

    private async mockResearch(request: AIResearchRequest): Promise<AIResearchResponse> {
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000))

        return {
            summary: `关于"${request.query}"的研究表明，这是一个多维度的复杂话题。当前的研究主要集中在理论框架、实践应用和未来发展趋势等方面。`,
            keyPoints: [
                `${request.query}的核心概念和定义`,
                '当前发展现状和趋势',
                '主要挑战和机遇',
                '未来发展方向'
            ],
            sources: [
                {
                    title: `${request.query}研究综述`,
                    url: 'https://example.com/research1',
                    excerpt: '这是一篇关于该主题的综合性研究文章...',
                    credibility: 0.9
                },
                {
                    title: `${request.query}的实践应用`,
                    url: 'https://example.com/research2',
                    excerpt: '本文探讨了该主题在实际应用中的案例...',
                    credibility: 0.8
                }
            ],
            relatedQueries: [
                `${request.query}的历史发展`,
                `${request.query}的应用场景`,
                `${request.query}的未来趋势`
            ],
            confidence: 0.75 + Math.random() * 0.2
        }
    }

    private async mockKnowledge(request: AIKnowledgeRequest): Promise<AIKnowledgeResponse> {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))

        // 简单的实体提取模拟
        const entities = this.extractMockEntities(request.content)
        const concepts = this.extractMockConcepts(request.content)
        const keywords = this.extractMockKeywords(request.content)

        return {
            entities,
            concepts,
            relationships: [
                {
                    source: entities[0]?.name || '主题A',
                    target: entities[1]?.name || '主题B',
                    type: 'related_to',
                    confidence: 0.8
                }
            ],
            summary: `从提供的内容中提取出${entities.length}个实体、${concepts.length}个概念和${keywords.length}个关键词。`,
            keywords
        }
    }

    // === 辅助方法 ===

    private buildCompletionPrompt(request: AICompletionRequest): string {
        return `请根据以下上下文继续写作：

当前文本：${request.context.currentText}
光标位置：${request.context.cursorPosition}
${request.context.selectedText ? `选中文本：${request.context.selectedText}` : ''}
${request.context.userIntent ? `用户意图：${request.context.userIntent}` : ''}

请提供自然、流畅的续写内容，长度适中。`
    }

    private buildRewritePrompt(request: AIRewriteRequest): string {
        return `请将以下内容重写为${request.style}风格：

原文：${request.content}

要求：
- 风格：${request.style}
${request.tone ? `- 语调：${request.tone}` : ''}
${request.targetAudience ? `- 目标读者：${request.targetAudience}` : ''}
- 保持原意不变
- 确保语言流畅自然`
    }

    private buildKnowledgePrompt(request: AIKnowledgeRequest): string {
        const extractTypes = request.extractTypes || ['entities', 'concepts', 'relationships', 'summary', 'keywords']

        return `请从以下文本中提取结构化信息：

文本：${request.content}

请提取：
${extractTypes.includes('entities') ? '- 实体（人名、地名、组织等）' : ''}
${extractTypes.includes('concepts') ? '- 关键概念及其定义' : ''}
${extractTypes.includes('relationships') ? '- 实体和概念之间的关系' : ''}
${extractTypes.includes('summary') ? '- 内容摘要' : ''}
${extractTypes.includes('keywords') ? '- 关键词' : ''}

请以结构化的JSON格式返回结果。`
    }

    private extractKeyPoints(text: string): string[] {
        // 简单的关键点提取
        const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0)
        return sentences.slice(0, 5).map(s => s.trim())
    }

    private generateRelatedQueries(query: string): string[] {
        return [
            `${query}的发展历史`,
            `${query}的应用领域`,
            `${query}的技术原理`,
            `${query}的未来趋势`,
            `${query}的案例分析`
        ]
    }

    private parseKnowledgeResult(result: string): AIKnowledgeResponse {
        // 尝试解析JSON格式的结果，如果失败则返回默认结构
        try {
            return JSON.parse(result)
        } catch {
            return {
                entities: [],
                concepts: [],
                relationships: [],
                summary: result,
                keywords: []
            }
        }
    }

    private extractMockEntities(content: string): Array<{ name: string, type: string, confidence: number, description?: string }> {
        const entities: Array<{ name: string, type: string, confidence: number, description?: string }> = []

        // 简单的实体识别模拟
        const words = content.split(/\s+/)
        words.forEach(word => {
            if (word.length > 2 && Math.random() > 0.8) {
                entities.push({
                    name: word,
                    type: 'concept',
                    confidence: 0.7 + Math.random() * 0.3
                })
            }
        })

        return entities.slice(0, 5)
    }

    private extractMockConcepts(content: string): Array<{ name: string, definition: string, importance: number }> {
        const concepts: Array<{ name: string, definition: string, importance: number }> = []

        // 简单的概念提取模拟
        const sentences = content.split(/[。！？]/)
        sentences.forEach((sentence, index) => {
            if (sentence.length > 10 && index < 3) {
                concepts.push({
                    name: `概念${index + 1}`,
                    definition: sentence.trim(),
                    importance: 0.6 + Math.random() * 0.4
                })
            }
        })

        return concepts
    }

    private extractMockKeywords(content: string): string[] {
        // 简单的关键词提取模拟
        const words = content.replace(/[，。！？；：]/g, ' ').split(/\s+/)
        const uniqueWords = [...new Set(words)]
        return uniqueWords.filter(word => word.length > 1).slice(0, 10)
    }
}

/**
 * AI服务单例
 */
export class AIServiceManager {
    private static instance: AIService | null = null

    public static initialize(config: AIServiceConfig): void {
        this.instance = new AIService(config)
    }

    public static getInstance(): AIService {
        if (!this.instance) {
            // 使用默认的Mock配置
            this.instance = new AIService({
                provider: AIProvider.MOCK,
                apiKey: 'mock-key'
            })
        }
        return this.instance
    }

    public static updateConfig(config: Partial<AIServiceConfig>): void {
        if (this.instance) {
            this.instance.updateConfig(config)
        }
    }
}

export default AIService
