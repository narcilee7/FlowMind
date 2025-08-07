/**
 * CSS-In-JS 主题系统
 * 统一管理所有样式变量，提供类型安全的主题配置
 */

import React from 'react'
import { createGlobalStyle } from 'styled-components'
import { colors, fonts, spacing, radius, shadows, animations, getColor, getShadow, createCSSVariables } from './tokens'

/**
 * 主题配置接口
 */
export interface Theme {
  // 颜色系统
  colors: {
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
  
  // 字体系统
  fonts: {
    family: {
      primary: string
      secondary: string
      monospace: string
      code: string
    }
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
    weight: {
      light: number
      normal: number
      medium: number
      semibold: number
      bold: number
      extrabold: number
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
      loose: number
    }
  }
  
  // 间距系统
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    component: {
      padding: string
      margin: string
      gap: string
    }
    layout: {
      container: string
      section: string
      group: string
    }
  }
  
  // 圆角系统
  radius: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }
  
  // 阴影系统
  shadows: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    inner: string
  }
  
  // 动画系统
  animations: {
    duration: {
      fast: string
      normal: string
      slow: string
    }
    easing: {
      linear: string
      ease: string
      easeIn: string
      easeOut: string
      easeInOut: string
    }
    type: {
      fade: string
      slide: string
      scale: string
      rotate: string
    }
  }
  
  // 组件样式
  components: {
    button: {
      primary: ButtonStyle
      secondary: ButtonStyle
      ghost: ButtonStyle
      outline: ButtonStyle
    }
    input: {
      default: InputStyle
      focused: InputStyle
      error: InputStyle
      disabled: InputStyle
    }
    panel: {
      default: PanelStyle
      header: PanelStyle
      content: PanelStyle
      footer: PanelStyle
    }
    toolbar: {
      default: ToolbarStyle
      item: ToolbarItemStyle
      separator: ToolbarSeparatorStyle
    }
    menu: {
      default: MenuStyle
      item: MenuItemStyle
      submenu: SubmenuStyle
    }
  }
  
  // 编辑器样式
  editor: {
    richText: {
      container: RichTextContainerStyle
      content: RichTextContentStyle
      toolbar: RichTextToolbarStyle
      menu: RichTextMenuStyle
    }
    graph: {
      container: GraphContainerStyle
      node: GraphNodeStyle
      edge: GraphEdgeStyle
      controls: GraphControlsStyle
    }
    canvas: {
      container: CanvasContainerStyle
      toolbar: CanvasToolbarStyle
      palette: CanvasPaletteStyle
      properties: CanvasPropertiesStyle
    }
    table: {
      container: TableContainerStyle
      header: TableHeaderStyle
      cell: TableCellStyle
      toolbar: TableToolbarStyle
    }
    timeline: {
      container: TimelineContainerStyle
      item: TimelineItemStyle
      milestone: TimelineMilestoneStyle
      controls: TimelineControlsStyle
    }
  }
}

/**
 * 组件样式接口
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

export interface PanelStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  shadow: string
}

export interface ToolbarStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  padding: string
  gap: string
  shadow: string
}

export interface ToolbarItemStyle {
  backgroundColor: string
  color: string
  borderColor: string
  borderRadius: string
  padding: string
  hover: Partial<ToolbarItemStyle>
  active: Partial<ToolbarItemStyle>
}

export interface ToolbarSeparatorStyle {
  backgroundColor: string
  width: string
  height: string
  margin: string
}

export interface MenuStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  shadow: string
  minWidth: string
}

export interface MenuItemStyle {
  backgroundColor: string
  color: string
  padding: string
  hover: Partial<MenuItemStyle>
  active: Partial<MenuItemStyle>
  disabled: Partial<MenuItemStyle>
}

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
 * 编辑器样式接口
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

export interface RichTextToolbarStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  padding: string
  gap: string
  shadow: string
}

export interface RichTextMenuStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  shadow: string
  minWidth: string
}

export interface GraphContainerStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  minHeight: string
}

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

export interface GraphEdgeStyle {
  color: string
  width: string
  style: 'solid' | 'dashed' | 'dotted'
  arrowSize: string
  hover: Partial<GraphEdgeStyle>
  selected: Partial<GraphEdgeStyle>
}

export interface GraphControlsStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  shadow: string
}

export interface CanvasContainerStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  minHeight: string
}

export interface CanvasToolbarStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  padding: string
  gap: string
  shadow: string
}

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

export interface CanvasPropertiesStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  shadow: string
  width: string
}

export interface TableContainerStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  minHeight: string
}

export interface TableHeaderStyle {
  backgroundColor: string
  color: string
  borderColor: string
  borderWidth: string
  padding: string
  fontWeight: number
  fontSize: string
}

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

export interface TableToolbarStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  padding: string
  gap: string
  shadow: string
}

export interface TimelineContainerStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  minHeight: string
}

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

export interface TimelineControlsStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  padding: string
  shadow: string
}

/**
 * 亮色主题
 */
export const lightTheme: Theme = {
  colors: {
    primary: getColor('primary', 'light'),
    secondary: getColor('secondary', 'light'),
    accent: getColor('accent', 'light'),
    success: getColor('success', 'light'),
    warning: getColor('warning', 'light'),
    error: getColor('error', 'light'),
    info: getColor('info', 'light'),
    background: {
      primary: getColor('background.primary', 'light'),
      secondary: getColor('background.secondary', 'light'),
      tertiary: getColor('background.tertiary', 'light'),
      overlay: getColor('background.overlay', 'light'),
      modal: getColor('background.modal', 'light')
    },
    text: {
      primary: getColor('text.primary', 'light'),
      secondary: getColor('text.secondary', 'light'),
      tertiary: getColor('text.tertiary', 'light'),
      disabled: getColor('text.disabled', 'light'),
      inverse: getColor('text.inverse', 'light'),
      link: getColor('text.link', 'light'),
      code: getColor('text.code', 'light')
    },
    border: {
      primary: getColor('border.primary', 'light'),
      secondary: getColor('border.secondary', 'light'),
      focus: getColor('border.focus', 'light'),
      disabled: getColor('border.disabled', 'light')
    },
    state: {
      hover: getColor('state.hover', 'light'),
      active: getColor('state.active', 'light'),
      selected: getColor('state.selected', 'light'),
      disabled: getColor('state.disabled', 'light'),
      loading: getColor('state.loading', 'light')
    }
  },
  fonts,
  spacing,
  radius,
  shadows: {
    none: 'none',
    sm: getShadow('sm', 'light'),
    md: getShadow('md', 'light'),
    lg: getShadow('lg', 'light'),
    xl: getShadow('xl', 'light'),
    '2xl': getShadow('2xl', 'light'),
    inner: getShadow('inner', 'light')
  },
  animations,
  components: {
    button: {
      primary: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#2563eb' },
        active: { backgroundColor: '#1d4ed8' },
        disabled: { backgroundColor: '#cbd5e1', color: '#64748b' }
      },
      secondary: {
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#f1f5f9' },
        active: { backgroundColor: '#e2e8f0' },
        disabled: { backgroundColor: '#f1f5f9', color: '#94a3b8' }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#1e293b',
        borderColor: 'transparent',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#f1f5f9' },
        active: { backgroundColor: '#e2e8f0' },
        disabled: { backgroundColor: 'transparent', color: '#94a3b8' }
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#3b82f6', color: '#ffffff' },
        active: { backgroundColor: '#2563eb' },
        disabled: { backgroundColor: 'transparent', color: '#94a3b8', borderColor: '#cbd5e1' }
      }
    },
    input: {
      default: {
        backgroundColor: '#ffffff',
        color: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#94a3b8' }
      },
      focused: {
        backgroundColor: '#ffffff',
        color: '#1e293b',
        borderColor: '#3b82f6',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#94a3b8' }
      },
      error: {
        backgroundColor: '#ffffff',
        color: '#1e293b',
        borderColor: '#ef4444',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#94a3b8' }
      },
      disabled: {
        backgroundColor: '#f8fafc',
        color: '#94a3b8',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#cbd5e1' }
      }
    },
    panel: {
      default: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      },
      header: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: '0 0 1px 0',
        borderRadius: '0.5rem 0.5rem 0 0',
        padding: '0.75rem 1rem',
        shadow: 'none'
      },
      content: {
        backgroundColor: '#ffffff',
        borderColor: 'transparent',
        borderWidth: '0',
        borderRadius: '0',
        padding: '1rem',
        shadow: 'none'
      },
      footer: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: '1px 0 0 0',
        borderRadius: '0 0 0.5rem 0.5rem',
        padding: '0.75rem 1rem',
        shadow: 'none'
      }
    },
    toolbar: {
      default: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      },
      item: {
        backgroundColor: 'transparent',
        color: '#1e293b',
        borderColor: 'transparent',
        borderRadius: '0.25rem',
        padding: '0.5rem',
        hover: { backgroundColor: '#f1f5f9' },
        active: { backgroundColor: '#e2e8f0' }
      },
      separator: {
        backgroundColor: '#e2e8f0',
        width: '1px',
        height: '1.5rem',
        margin: '0 0.25rem'
      }
    },
    menu: {
      default: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        minWidth: '8rem'
      },
      item: {
        backgroundColor: 'transparent',
        color: '#1e293b',
        padding: '0.5rem 1rem',
        hover: { backgroundColor: '#f1f5f9' },
        active: { backgroundColor: '#e2e8f0' },
        disabled: { backgroundColor: 'transparent', color: '#94a3b8' }
      },
      submenu: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        offset: '0.25rem'
      }
    }
  },
  editor: {
    richText: {
      container: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '300px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '1rem',
        lineHeight: 1.6
      },
      content: {
        color: '#1e293b',
        selection: { backgroundColor: '#dbeafe' },
        focus: { outline: '2px solid #3b82f6' },
        placeholder: { color: '#94a3b8' }
      },
      toolbar: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: '0 0 1px 0',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: 'none'
      },
      menu: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        minWidth: '8rem'
      }
    },
    graph: {
      container: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '400px'
      },
      node: {
        backgroundColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: '2px',
        borderRadius: '0.5rem',
        color: '#1e293b',
        fontSize: '0.875rem',
        padding: '0.5rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        hover: { backgroundColor: '#f8fafc', shadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
        selected: { backgroundColor: '#dbeafe', borderColor: '#2563eb' }
      },
      edge: {
        color: '#64748b',
        width: '2px',
        style: 'solid' as const,
        arrowSize: '8px',
        hover: { color: '#3b82f6', width: '3px' },
        selected: { color: '#2563eb', width: '3px' }
      },
      controls: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }
    },
    canvas: {
      container: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '400px'
      },
      toolbar: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: '0 0 1px 0',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: 'none'
      },
      palette: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        grid: {
          gap: '0.5rem',
          columns: 4
        }
      },
      properties: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: '300px'
      }
    },
    table: {
      container: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '300px'
      },
      header: {
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        padding: '0.75rem',
        fontWeight: 600,
        fontSize: '0.875rem'
      },
      cell: {
        backgroundColor: '#ffffff',
        color: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        padding: '0.75rem',
        fontSize: '0.875rem',
        hover: { backgroundColor: '#f8fafc' },
        selected: { backgroundColor: '#dbeafe' }
      },
      toolbar: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: '0 0 1px 0',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: 'none'
      }
    },
    timeline: {
      container: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '300px'
      },
      item: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.75rem',
        color: '#1e293b',
        fontSize: '0.875rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        hover: { backgroundColor: '#f8fafc' },
        selected: { backgroundColor: '#dbeafe' }
      },
      milestone: {
        backgroundColor: '#3b82f6',
        borderColor: '#ffffff',
        borderWidth: '2px',
        borderRadius: '50%',
        color: '#ffffff',
        fontSize: '0.75rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        size: '1rem'
      },
      controls: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }
    }
  }
}

/**
 * 暗色主题
 */
export const darkTheme: Theme = {
  colors: {
    primary: getColor('primary', 'dark'),
    secondary: getColor('secondary', 'dark'),
    accent: getColor('accent', 'dark'),
    success: getColor('success', 'dark'),
    warning: getColor('warning', 'dark'),
    error: getColor('error', 'dark'),
    info: getColor('info', 'dark'),
    background: {
      primary: getColor('background.primary', 'dark'),
      secondary: getColor('background.secondary', 'dark'),
      tertiary: getColor('background.tertiary', 'dark'),
      overlay: getColor('background.overlay', 'dark'),
      modal: getColor('background.modal', 'dark')
    },
    text: {
      primary: getColor('text.primary', 'dark'),
      secondary: getColor('text.secondary', 'dark'),
      tertiary: getColor('text.tertiary', 'dark'),
      disabled: getColor('text.disabled', 'dark'),
      inverse: getColor('text.inverse', 'dark'),
      link: getColor('text.link', 'dark'),
      code: getColor('text.code', 'dark')
    },
    border: {
      primary: getColor('border.primary', 'dark'),
      secondary: getColor('border.secondary', 'dark'),
      focus: getColor('border.focus', 'dark'),
      disabled: getColor('border.disabled', 'dark')
    },
    state: {
      hover: getColor('state.hover', 'dark'),
      active: getColor('state.active', 'dark'),
      selected: getColor('state.selected', 'dark'),
      disabled: getColor('state.disabled', 'dark'),
      loading: getColor('state.loading', 'dark')
    }
  },
  fonts,
  spacing,
  radius,
  shadows: {
    none: 'none',
    sm: getShadow('sm', 'dark'),
    md: getShadow('md', 'dark'),
    lg: getShadow('lg', 'dark'),
    xl: getShadow('xl', 'dark'),
    '2xl': getShadow('2xl', 'dark'),
    inner: getShadow('inner', 'dark')
  },
  animations,
  components: {
    button: {
      primary: {
        backgroundColor: '#60a5fa',
        color: '#0f172a',
        borderColor: '#60a5fa',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#3b82f6' },
        active: { backgroundColor: '#2563eb' },
        disabled: { backgroundColor: '#475569', color: '#64748b' }
      },
      secondary: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#334155' },
        active: { backgroundColor: '#475569' },
        disabled: { backgroundColor: '#1e293b', color: '#64748b' }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#f8fafc',
        borderColor: 'transparent',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#1e293b' },
        active: { backgroundColor: '#334155' },
        disabled: { backgroundColor: 'transparent', color: '#64748b' }
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#60a5fa',
        borderColor: '#60a5fa',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        hover: { backgroundColor: '#60a5fa', color: '#0f172a' },
        active: { backgroundColor: '#3b82f6' },
        disabled: { backgroundColor: 'transparent', color: '#64748b', borderColor: '#475569' }
      }
    },
    input: {
      default: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#64748b' }
      },
      focused: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderColor: '#60a5fa',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#64748b' }
      },
      error: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderColor: '#f87171',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#64748b' }
      },
      disabled: {
        backgroundColor: '#0f172a',
        color: '#64748b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        outline: 'none',
        placeholder: { color: '#475569' }
      }
    },
    panel: {
      default: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
      },
      header: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: '0 0 1px 0',
        borderRadius: '0.5rem 0.5rem 0 0',
        padding: '0.75rem 1rem',
        shadow: 'none'
      },
      content: {
        backgroundColor: '#1e293b',
        borderColor: 'transparent',
        borderWidth: '0',
        borderRadius: '0',
        padding: '1rem',
        shadow: 'none'
      },
      footer: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: '1px 0 0 0',
        borderRadius: '0 0 0.5rem 0.5rem',
        padding: '0.75rem 1rem',
        shadow: 'none'
      }
    },
    toolbar: {
      default: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
      },
      item: {
        backgroundColor: 'transparent',
        color: '#f8fafc',
        borderColor: 'transparent',
        borderRadius: '0.25rem',
        padding: '0.5rem',
        hover: { backgroundColor: '#334155' },
        active: { backgroundColor: '#475569' }
      },
      separator: {
        backgroundColor: '#334155',
        width: '1px',
        height: '1.5rem',
        margin: '0 0.25rem'
      }
    },
    menu: {
      default: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        minWidth: '8rem'
      },
      item: {
        backgroundColor: 'transparent',
        color: '#f8fafc',
        padding: '0.5rem 1rem',
        hover: { backgroundColor: '#334155' },
        active: { backgroundColor: '#475569' },
        disabled: { backgroundColor: 'transparent', color: '#64748b' }
      },
      submenu: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        offset: '0.25rem'
      }
    }
  },
  editor: {
    richText: {
      container: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '300px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '1rem',
        lineHeight: 1.6
      },
      content: {
        color: '#f8fafc',
        selection: { backgroundColor: '#1e3a8a' },
        focus: { outline: '2px solid #60a5fa' },
        placeholder: { color: '#64748b' }
      },
      toolbar: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: '0 0 1px 0',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: 'none'
      },
      menu: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem 0',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        minWidth: '8rem'
      }
    },
    graph: {
      container: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '400px'
      },
      node: {
        backgroundColor: '#1e293b',
        borderColor: '#60a5fa',
        borderWidth: '2px',
        borderRadius: '0.5rem',
        color: '#f8fafc',
        fontSize: '0.875rem',
        padding: '0.5rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        hover: { backgroundColor: '#334155', shadow: '0 4px 8px rgba(0, 0, 0, 0.4)' },
        selected: { backgroundColor: '#1e3a8a', borderColor: '#3b82f6' }
      },
      edge: {
        color: '#94a3b8',
        width: '2px',
        style: 'solid' as const,
        arrowSize: '8px',
        hover: { color: '#60a5fa', width: '3px' },
        selected: { color: '#3b82f6', width: '3px' }
      },
      controls: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }
    },
    canvas: {
      container: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '400px'
      },
      toolbar: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: '0 0 1px 0',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: 'none'
      },
      palette: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        grid: {
          gap: '0.5rem',
          columns: 4
        }
      },
      properties: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        width: '300px'
      }
    },
    table: {
      container: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '300px'
      },
      header: {
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderColor: '#334155',
        borderWidth: '1px',
        padding: '0.75rem',
        fontWeight: 600,
        fontSize: '0.875rem'
      },
      cell: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderColor: '#334155',
        borderWidth: '1px',
        padding: '0.75rem',
        fontSize: '0.875rem',
        hover: { backgroundColor: '#334155' },
        selected: { backgroundColor: '#1e3a8a' }
      },
      toolbar: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: '0 0 1px 0',
        padding: '0.5rem',
        gap: '0.25rem',
        shadow: 'none'
      }
    },
    timeline: {
      container: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '300px'
      },
      item: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.75rem',
        color: '#f8fafc',
        fontSize: '0.875rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        hover: { backgroundColor: '#334155' },
        selected: { backgroundColor: '#1e3a8a' }
      },
      milestone: {
        backgroundColor: '#60a5fa',
        borderColor: '#1e293b',
        borderWidth: '2px',
        borderRadius: '50%',
        color: '#0f172a',
        fontSize: '0.75rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        size: '1rem'
      },
      controls: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderRadius: '0.375rem',
        padding: '0.5rem',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }
    }
  }
}

/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark' | 'system'

/**
 * 主题管理器
 */
export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: Theme = lightTheme
  private themeType: ThemeType = 'system'
  private listeners: Set<(theme: Theme) => void> = new Set()

  private constructor() {
    this.initializeTheme()
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme {
    return this.currentTheme
  }

  /**
   * 获取主题类型
   */
  getThemeType(): ThemeType {
    return this.themeType
  }

  /**
   * 设置主题
   */
  setTheme(type: ThemeType): void {
    this.themeType = type
    this.updateTheme()
  }

  /**
   * 切换主题
   */
  toggleTheme(): void {
    const newType = this.themeType === 'light' ? 'dark' : 'light'
    this.setTheme(newType)
  }

  /**
   * 监听主题变化
   */
  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * 初始化主题
   */
  private initializeTheme(): void {
    // 从localStorage获取保存的主题
    const savedTheme = localStorage.getItem('theme-type') as ThemeType
    if (savedTheme) {
      this.themeType = savedTheme
    } else {
      // 检查系统主题偏好
      this.themeType = 'system'
    }

    this.updateTheme()

    // 监听系统主题变化
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (this.themeType === 'system') {
          this.updateTheme()
        }
      })
    }
  }

  /**
   * 更新主题
   */
  private updateTheme(): void {
    let newTheme: Theme

    if (this.themeType === 'system') {
      const isDark = typeof window !== 'undefined' && 
        window.matchMedia('(prefers-color-scheme: dark)').matches
      newTheme = isDark ? darkTheme : lightTheme
    } else {
      newTheme = this.themeType === 'dark' ? darkTheme : lightTheme
    }

    if (newTheme !== this.currentTheme) {
      this.currentTheme = newTheme
      this.applyTheme(newTheme)
      this.notifyListeners(newTheme)
      
      // 保存到localStorage
      localStorage.setItem('theme-type', this.themeType)
    }
  }

  /**
   * 应用主题到DOM
   */
  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    
    // 设置主题类名
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add(`theme-${theme === darkTheme ? 'dark' : 'light'}`)
    
    // 设置CSS变量
    this.setCSSVariables(theme)
  }

  /**
   * 设置CSS变量
   */
  private setCSSVariables(theme: Theme): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const themeType = this.themeType === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : this.themeType
    const variables = createCSSVariables(themeType)
    
    // 应用所有CSS变量
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  /**
   * 通知监听器
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        console.error('Theme change callback error:', error)
      }
    })
  }
}

/**
 * 全局样式
 */
export const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  :root {
    /* 基础颜色 */
    --primary: ${(props: { theme: Theme }) => props.theme.colors.primary};
    --primary-foreground: ${(props: { theme: Theme }) => props.theme.colors.text.inverse};
    --secondary: ${(props: { theme: Theme }) => props.theme.colors.secondary};
    --secondary-foreground: ${(props: { theme: Theme }) => props.theme.colors.text.primary};
    --accent: ${(props: { theme: Theme }) => props.theme.colors.accent};
    --accent-foreground: ${(props: { theme: Theme }) => props.theme.colors.text.primary};
    --destructive: ${(props: { theme: Theme }) => props.theme.colors.error};
    --destructive-foreground: ${(props: { theme: Theme }) => props.theme.colors.text.inverse};
    --muted: ${(props: { theme: Theme }) => props.theme.colors.state.disabled};
    --muted-foreground: ${(props: { theme: Theme }) => props.theme.colors.text.tertiary};
    
    /* 背景和前景 */
    --background: ${(props: { theme: Theme }) => props.theme.colors.background.primary};
    --foreground: ${(props: { theme: Theme }) => props.theme.colors.text.primary};
    --card: ${(props: { theme: Theme }) => props.theme.colors.background.secondary};
    --card-foreground: ${(props: { theme: Theme }) => props.theme.colors.text.primary};
    --popover: ${(props: { theme: Theme }) => props.theme.colors.background.modal};
    --popover-foreground: ${(props: { theme: Theme }) => props.theme.colors.text.primary};
    
    /* 边框和输入 */
    --border: ${(props: { theme: Theme }) => props.theme.colors.border.primary};
    --input: ${(props: { theme: Theme }) => props.theme.colors.border.primary};
    --ring: ${(props: { theme: Theme }) => props.theme.colors.border.focus};
    --radius: ${(props: { theme: Theme }) => props.theme.radius.md};
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: ${(props: { theme: Theme }) => props.theme.fonts.family.primary};
    font-size: ${(props: { theme: Theme }) => props.theme.fonts.size.base};
    line-height: ${(props: { theme: Theme }) => props.theme.fonts.lineHeight.normal};
    color: ${(props: { theme: Theme }) => props.theme.colors.text.primary};
    background-color: ${(props: { theme: Theme }) => props.theme.colors.background.primary};
    transition: color 0.3s ease, background-color 0.3s ease;
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${(props: { theme: Theme }) => props.theme.colors.background.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${(props: { theme: Theme }) => props.theme.colors.border.secondary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${(props: { theme: Theme }) => props.theme.colors.border.primary};
  }
`

/**
 * 主题Hook
 */
export const useTheme = () => {
  const themeManager = ThemeManager.getInstance()
  const [theme, setTheme] = React.useState(themeManager.getCurrentTheme())
  const [themeType, setThemeType] = React.useState(themeManager.getThemeType())

  React.useEffect(() => {
    const unsubscribe = themeManager.onThemeChange((newTheme) => {
      setTheme(newTheme)
      setThemeType(themeManager.getThemeType())
    })

    return unsubscribe
  }, [themeManager])

  return {
    theme,
    themeType,
    setTheme: (type: ThemeType) => themeManager.setTheme(type),
    toggleTheme: () => themeManager.toggleTheme(),
    isDark: theme === darkTheme,
    isLight: theme === lightTheme
  }
}

// 导出默认主题
export default lightTheme