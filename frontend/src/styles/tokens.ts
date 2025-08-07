/**
 * 设计令牌系统
 * 统一管理所有设计变量，提供类型安全的主题配置
 */

/**
 * 颜色令牌
 */
export const colors = {
  // 基础颜色
  primary: {
    light: '#3b82f6',
    dark: '#60a5fa'
  },
  secondary: {
    light: '#64748b',
    dark: '#94a3b8'
  },
  accent: {
    light: '#f59e0b',
    dark: '#fbbf24'
  },
  success: {
    light: '#10b981',
    dark: '#34d399'
  },
  warning: {
    light: '#f59e0b',
    dark: '#fbbf24'
  },
  error: {
    light: '#ef4444',
    dark: '#f87171'
  },
  info: {
    light: '#06b6d4',
    dark: '#22d3ee'
  },

  // 背景颜色
  background: {
    primary: {
      light: '#ffffff',
      dark: '#0f172a'
    },
    secondary: {
      light: '#f8fafc',
      dark: '#1e293b'
    },
    tertiary: {
      light: '#f1f5f9',
      dark: '#334155'
    },
    overlay: {
      light: 'rgba(0, 0, 0, 0.5)',
      dark: 'rgba(0, 0, 0, 0.7)'
    },
    modal: {
      light: '#ffffff',
      dark: '#1e293b'
    }
  },

  // 文本颜色
  text: {
    primary: {
      light: '#1e293b',
      dark: '#f8fafc'
    },
    secondary: {
      light: '#64748b',
      dark: '#cbd5e1'
    },
    tertiary: {
      light: '#94a3b8',
      dark: '#94a3b8'
    },
    disabled: {
      light: '#cbd5e1',
      dark: '#475569'
    },
    inverse: {
      light: '#ffffff',
      dark: '#0f172a'
    },
    link: {
      light: '#3b82f6',
      dark: '#60a5fa'
    },
    code: {
      light: '#dc2626',
      dark: '#fca5a5'
    }
  },

  // 边框颜色
  border: {
    primary: {
      light: '#e2e8f0',
      dark: '#334155'
    },
    secondary: {
      light: '#cbd5e1',
      dark: '#475569'
    },
    focus: {
      light: '#3b82f6',
      dark: '#60a5fa'
    },
    disabled: {
      light: '#e2e8f0',
      dark: '#334155'
    }
  },

  // 状态颜色
  state: {
    hover: {
      light: '#f1f5f9',
      dark: '#1e293b'
    },
    active: {
      light: '#e2e8f0',
      dark: '#334155'
    },
    selected: {
      light: '#dbeafe',
      dark: '#1e3a8a'
    },
    disabled: {
      light: '#f1f5f9',
      dark: '#1e293b'
    },
    loading: {
      light: '#f1f5f9',
      dark: '#1e293b'
    }
  }
}

/**
 * 字体令牌
 */
export const fonts = {
  family: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monospace: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
    code: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
  },
  size: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  }
}

/**
 * 间距令牌
 */
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  component: {
    padding: '0.75rem',
    margin: '0.5rem',
    gap: '0.5rem'
  },
  layout: {
    container: '1rem',
    section: '2rem',
    group: '1rem'
  }
}

/**
 * 圆角令牌
 */
export const radius = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px'
}

/**
 * 阴影令牌
 */
export const shadows = {
  none: 'none',
  sm: {
    light: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    dark: '0 1px 2px 0 rgba(0, 0, 0, 0.3)'
  },
  md: {
    light: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    dark: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
  },
  lg: {
    light: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    dark: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
  },
  xl: {
    light: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    dark: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
  },
  '2xl': {
    light: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    dark: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  inner: {
    light: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    dark: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
  }
}

/**
 * 动画令牌
 */
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  },
  type: {
    fade: 'fade 0.3s ease-in-out',
    slide: 'slide 0.3s ease-in-out',
    scale: 'scale 0.3s ease-in-out',
    rotate: 'rotate 0.3s ease-in-out'
  }
}

/**
 * 断点令牌
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

/**
 * Z-index令牌
 */
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070
}

/**
 * 工具函数：根据主题获取颜色
 */
export const getColor = (colorPath: string, theme: 'light' | 'dark') => {
  const path = colorPath.split('.')
  let current: any = colors
  
  for (const key of path) {
    if (current[key] && typeof current[key] === 'object' && 'light' in current[key]) {
      return current[key][theme]
    }
    current = current[key]
  }
  
  return current
}

/**
 * 工具函数：根据主题获取阴影
 */
export const getShadow = (shadowKey: keyof typeof shadows, theme: 'light' | 'dark') => {
  const shadow = shadows[shadowKey]
  if (typeof shadow === 'string') {
    return shadow
  }
  return shadow[theme]
}

/**
 * 工具函数：创建CSS变量
 */
export const createCSSVariables = (theme: 'light' | 'dark') => {
  const variables: Record<string, string> = {}
  
  // 基础颜色
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object' && 'light' in values) {
      variables[`--color-${category}`] = values[theme]
    } else if (typeof values === 'object') {
      Object.entries(values).forEach(([subCategory, subValues]) => {
        if (typeof subValues === 'object' && 'light' in subValues) {
          variables[`--color-${category}-${subCategory}`] = subValues[theme]
        }
      })
    }
  })
  
  // 兼容现有CSS变量
  variables['--primary'] = getColor('primary', theme)
  variables['--primary-foreground'] = getColor('text.inverse', theme)
  variables['--secondary'] = getColor('secondary', theme)
  variables['--secondary-foreground'] = getColor('text.primary', theme)
  variables['--accent'] = getColor('accent', theme)
  variables['--accent-foreground'] = getColor('text.primary', theme)
  variables['--destructive'] = getColor('error', theme)
  variables['--destructive-foreground'] = getColor('text.inverse', theme)
  variables['--muted'] = getColor('state.disabled', theme)
  variables['--muted-foreground'] = getColor('text.tertiary', theme)
  variables['--background'] = getColor('background.primary', theme)
  variables['--foreground'] = getColor('text.primary', theme)
  variables['--card'] = getColor('background.secondary', theme)
  variables['--card-foreground'] = getColor('text.primary', theme)
  variables['--popover'] = getColor('background.modal', theme)
  variables['--popover-foreground'] = getColor('text.primary', theme)
  variables['--border'] = getColor('border.primary', theme)
  variables['--input'] = getColor('border.primary', theme)
  variables['--ring'] = getColor('border.focus', theme)
  variables['--radius'] = radius.md
  
  return variables
} 