/**
 * 编辑器主题配置系统
 * 支持亮暗模式、细粒度样式控制和可扩展配置
 */

/**
 * 基础主题类型
 */
export type EditorTheme = 'light' | 'dark' | 'auto'

/**
 * 颜色配置
 */
export interface ColorConfig {
    // 基础颜色
    primary: string
    secondary: string
    accent: string
    success: string
    warning: string
    error: string
    info: string
    
    // 背景颜色
    background: {
        primary: string
        secondary: string
        tertiary: string
        overlay: string
        modal: string
    }
    
    // 文本颜色
    text: {
        primary: string
        secondary: string
        tertiary: string
        disabled: string
        inverse: string
        link: string
        code: string
    }
    
    // 边框颜色
    border: {
        primary: string
        secondary: string
        focus: string
        disabled: string
    }
    
    // 状态颜色
    state: {
        hover: string
        active: string
        selected: string
        disabled: string
        loading: string
    }
}

/**
 * 字体配置
 */
export interface FontConfig {
    // 字体族
    family: {
        primary: string
        secondary: string
        monospace: string
        code: string
    }
    
    // 字体大小
    size: {
        xs: string
        sm: string
        base: string
        lg: string
        xl: string
        '2xl': string
        '3xl': string
        '4xl': string
    }
    
    // 字体权重
    weight: {
        light: number
        normal: number
        medium: number
        semibold: number
        bold: number
        extrabold: number
    }
    
    // 行高
    lineHeight: {
        tight: number
        normal: number
        relaxed: number
        loose: number
    }
}

/**
 * 间距配置
 */
export interface SpacingConfig {
    // 基础间距
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    
    // 组件间距
    component: {
        padding: string
        margin: string
        gap: string
    }
    
    // 布局间距
    layout: {
        container: string
        section: string
        group: string
    }
}

/**
 * 圆角配置
 */
export interface RadiusConfig {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    full: string
}

/**
 * 阴影配置
 */
export interface ShadowConfig {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    inner: string
}

/**
 * 动画配置
 */
export interface AnimationConfig {
    // 持续时间
    duration: {
        fast: string
        normal: string
        slow: string
    }
    
    // 缓动函数
    easing: {
        linear: string
        ease: string
        easeIn: string
        easeOut: string
        easeInOut: string
    }
    
    // 动画类型
    type: {
        fade: string
        slide: string
        scale: string
        rotate: string
    }
}

/**
 * 组件特定样式配置
 */
export interface ComponentStyles {
    // 按钮样式
    button: {
        primary: ButtonStyle
        secondary: ButtonStyle
        ghost: ButtonStyle
        outline: ButtonStyle
    }
    
    // 输入框样式
    input: {
        default: InputStyle
        focused: InputStyle
        error: InputStyle
        disabled: InputStyle
    }
    
    // 面板样式
    panel: {
        default: PanelStyle
        header: PanelStyle
        content: PanelStyle
        footer: PanelStyle
    }
    
    // 工具栏样式
    toolbar: {
        default: ToolbarStyle
        item: ToolbarItemStyle
        separator: ToolbarSeparatorStyle
    }
    
    // 菜单样式
    menu: {
        default: MenuStyle
        item: MenuItemStyle
        submenu: SubmenuStyle
    }
}

/**
 * 按钮样式
 */
export interface ButtonStyle {
    backgroundColor: string
    color: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    fontSize: string
    fontWeight: number
    transition: string
    hover: Partial<ButtonStyle>
    active: Partial<ButtonStyle>
    disabled: Partial<ButtonStyle>
}

/**
 * 输入框样式
 */
export interface InputStyle {
    backgroundColor: string
    color: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    fontSize: string
    outline: string
    placeholder: {
        color: string
    }
}

/**
 * 面板样式
 */
export interface PanelStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
}

/**
 * 工具栏样式
 */
export interface ToolbarStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    padding: string
    gap: string
    shadow: string
}

/**
 * 工具栏项样式
 */
export interface ToolbarItemStyle {
    backgroundColor: string
    color: string
    borderColor: string
    borderRadius: string
    padding: string
    hover: Partial<ToolbarItemStyle>
    active: Partial<ToolbarItemStyle>
}

/**
 * 工具栏分隔符样式
 */
export interface ToolbarSeparatorStyle {
    backgroundColor: string
    width: string
    height: string
    margin: string
}

/**
 * 菜单样式
 */
export interface MenuStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
    minWidth: string
}

/**
 * 菜单项样式
 */
export interface MenuItemStyle {
    backgroundColor: string
    color: string
    padding: string
    hover: Partial<MenuItemStyle>
    active: Partial<MenuItemStyle>
    disabled: Partial<MenuItemStyle>
}

/**
 * 子菜单样式
 */
export interface SubmenuStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
    offset: string
}

/**
 * 编辑器特定样式配置
 */
export interface EditorStyles {
    // 富文本编辑器样式
    richText: {
        container: RichTextContainerStyle
        content: RichTextContentStyle
        toolbar: RichTextToolbarStyle
        menu: RichTextMenuStyle
    }
    
    // 图谱编辑器样式
    graph: {
        container: GraphContainerStyle
        node: GraphNodeStyle
        edge: GraphEdgeStyle
        controls: GraphControlsStyle
    }
    
    // Canvas编辑器样式
    canvas: {
        container: CanvasContainerStyle
        toolbar: CanvasToolbarStyle
        palette: CanvasPaletteStyle
        properties: CanvasPropertiesStyle
    }
    
    // 表格编辑器样式
    table: {
        container: TableContainerStyle
        header: TableHeaderStyle
        cell: TableCellStyle
        toolbar: TableToolbarStyle
    }
    
    // 时间线编辑器样式
    timeline: {
        container: TimelineContainerStyle
        item: TimelineItemStyle
        milestone: TimelineMilestoneStyle
        controls: TimelineControlsStyle
    }
}

/**
 * 富文本容器样式
 */
export interface RichTextContainerStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    minHeight: string
    fontFamily: string
    fontSize: string
    lineHeight: number
}

/**
 * 富文本内容样式
 */
export interface RichTextContentStyle {
    color: string
    selection: {
        backgroundColor: string
    }
    focus: {
        outline: string
    }
    placeholder: {
        color: string
    }
}

/**
 * 富文本工具栏样式
 */
export interface RichTextToolbarStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    padding: string
    gap: string
    shadow: string
}

/**
 * 富文本菜单样式
 */
export interface RichTextMenuStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
    minWidth: string
}

/**
 * 图谱容器样式
 */
export interface GraphContainerStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    minHeight: string
}

/**
 * 图谱节点样式
 */
export interface GraphNodeStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    color: string
    fontSize: string
    padding: string
    shadow: string
    hover: Partial<GraphNodeStyle>
    selected: Partial<GraphNodeStyle>
}

/**
 * 图谱边样式
 */
export interface GraphEdgeStyle {
    color: string
    width: string
    style: 'solid' | 'dashed' | 'dotted'
    arrowSize: string
    hover: Partial<GraphEdgeStyle>
    selected: Partial<GraphEdgeStyle>
}

/**
 * 图谱控制样式
 */
export interface GraphControlsStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
}

/**
 * Canvas容器样式
 */
export interface CanvasContainerStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    minHeight: string
}

/**
 * Canvas工具栏样式
 */
export interface CanvasToolbarStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    padding: string
    gap: string
    shadow: string
}

/**
 * Canvas调色板样式
 */
export interface CanvasPaletteStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
    grid: {
        gap: string
        columns: number
    }
}

/**
 * Canvas属性面板样式
 */
export interface CanvasPropertiesStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
    width: string
}

/**
 * 表格容器样式
 */
export interface TableContainerStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    minHeight: string
}

/**
 * 表格头部样式
 */
export interface TableHeaderStyle {
    backgroundColor: string
    color: string
    borderColor: string
    borderWidth: string
    padding: string
    fontWeight: number
    fontSize: string
}

/**
 * 表格单元格样式
 */
export interface TableCellStyle {
    backgroundColor: string
    color: string
    borderColor: string
    borderWidth: string
    padding: string
    fontSize: string
    hover: Partial<TableCellStyle>
    selected: Partial<TableCellStyle>
}

/**
 * 表格工具栏样式
 */
export interface TableToolbarStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    padding: string
    gap: string
    shadow: string
}

/**
 * 时间线容器样式
 */
export interface TimelineContainerStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    minHeight: string
}

/**
 * 时间线项样式
 */
export interface TimelineItemStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    color: string
    fontSize: string
    shadow: string
    hover: Partial<TimelineItemStyle>
    selected: Partial<TimelineItemStyle>
}

/**
 * 时间线里程碑样式
 */
export interface TimelineMilestoneStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    color: string
    fontSize: string
    shadow: string
    size: string
}

/**
 * 时间线控制样式
 */
export interface TimelineControlsStyle {
    backgroundColor: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    padding: string
    shadow: string
}

/**
 * 完整主题配置
 */
export interface ThemeConfig {
    name: string
    type: EditorTheme
    colors: ColorConfig
    fonts: FontConfig
    spacing: SpacingConfig
    radius: RadiusConfig
    shadows: ShadowConfig
    animations: AnimationConfig
    components: ComponentStyles
    editor: EditorStyles
    custom?: Record<string, any>
}

/**
 * 主题变体
 */
export interface ThemeVariant {
    name: string
    base: string
    overrides: Partial<ThemeConfig>
}

/**
 * 主题管理器接口
 */
export interface ThemeManager {
    getCurrentTheme(): ThemeConfig
    setTheme(theme: EditorTheme | ThemeConfig): void
    getTheme(name: string): ThemeConfig | null
    registerTheme(theme: ThemeConfig): void
    createVariant(baseTheme: string, variant: ThemeVariant): ThemeConfig
    exportTheme(theme: ThemeConfig): string
    importTheme(data: string): ThemeConfig
}