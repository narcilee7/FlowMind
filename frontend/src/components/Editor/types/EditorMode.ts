/**
 * 编辑器模式（视图形态）
 * - writing: 富文本/Block 编辑
 * - graph: 知识图谱视图
 * - canvas: 白板/可视化画布
 * - table: 数据表/数据库视图
 * - timeline: 时间线视图
 * - card: 卡片视图
 * 
 * 场景（research/learning/planning/creative）可作为模板与初始化参数，不直接作为视图模式。
 */

export type EditorMode =
    | 'writing'
    | 'graph'
    | 'canvas'
    | 'table'
    | 'timeline'
    | 'card'
    // 兼容保留：以下为场景型值，暂时允许作为模式参数传入，内部可做映射
    | 'research'
    | 'learning'
    | 'planning'
    | 'creative'
    | 'other'