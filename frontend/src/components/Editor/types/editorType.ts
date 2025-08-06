/**
 * 编辑器类型
 */

export enum EditorType {
    // 多形态编辑模式
    RICH_TEXT = 'rich-text',        // 富文本 / Block Editor（TipTap）
    GRAPH = 'graph',                // 知识图谱编辑器
    CANVAS = 'canvas',              // Canvas / 白板
    TABLE = 'table',                // 表格 / 数据库视图
    TIMELINE = 'timeline',          // 卡片视图 / 时间线视图
}

/**
 * 场景模板类型
 */
export enum SceneTemplate {
    RESEARCH = 'research',          // AI Research 模板
    WRITING = 'writing',            // AI Writing 模板
    LEARNING = 'learning',          // AI Learning 模板
    PLANNING = 'planning',          // AI Planning 模板
    CREATIVE = 'creative',          // AI Creative 模板
}

/**
 * AI能力类型
 */
export enum AICapability {
    CONTENT_GENERATION = 'content-generation',    // 内容生成与改写
    DEEP_RESEARCH = 'deep-research',              // DeepResearch
    KNOWLEDGE_EXTRACTION = 'knowledge-extraction', // 知识抽取与图谱构建
    MULTIMODAL = 'multimodal',                    // 多模态生成
    VISUALIZATION = 'visualization',              // 可视化生成
}