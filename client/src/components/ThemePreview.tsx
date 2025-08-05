import React from 'react'
import { useAppStore } from '@/stores/app-store'

export const ThemePreview: React.FC = () => {
  const { theme } = useAppStore()

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          FlowMind 配色方案
        </h2>
        <p className="text-muted-foreground">
          当前主题: {theme === 'light' ? '明亮主题' : theme === 'dark' ? '暗色主题' : '跟随系统'}
        </p>
      </div>

      {/* 主色调展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">主色调</h3>
          <div className="space-y-2">
            <div className="h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-medium">Primary</span>
            </div>
            <div className="h-8 bg-primary/80 rounded-lg"></div>
            <div className="h-8 bg-primary/60 rounded-lg"></div>
            <div className="h-8 bg-primary/40 rounded-lg"></div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">背景色</h3>
          <div className="space-y-2">
            <div className="h-12 bg-background border border-border rounded-lg flex items-center justify-center">
              <span className="text-foreground font-medium">Background</span>
            </div>
            <div className="h-8 bg-card border border-border rounded-lg"></div>
            <div className="h-8 bg-muted rounded-lg"></div>
            <div className="h-8 bg-accent rounded-lg"></div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">文字色</h3>
          <div className="space-y-2">
            <div className="h-12 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-background font-medium">Foreground</span>
            </div>
            <div className="h-8 bg-muted-foreground rounded-lg"></div>
            <div className="h-8 bg-muted-foreground/60 rounded-lg"></div>
            <div className="h-8 bg-muted-foreground/30 rounded-lg"></div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">功能色</h3>
          <div className="space-y-2">
            <div className="h-12 bg-destructive rounded-lg flex items-center justify-center">
              <span className="text-destructive-foreground font-medium">Destructive</span>
            </div>
            <div className="h-8 bg-secondary rounded-lg"></div>
            <div className="h-8 bg-popover border border-border rounded-lg"></div>
            <div className="h-8 bg-input border border-border rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* 文本示例 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">文本样式</h3>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">标题 1</h1>
          <h2 className="text-2xl font-semibold text-foreground">标题 2</h2>
          <h3 className="text-xl font-medium text-foreground">标题 3</h3>
          <p className="text-base text-foreground">
            这是正文文本，用于展示主要的文字内容。它应该具有良好的可读性和对比度。
          </p>
          <p className="text-sm text-muted-foreground">
            这是次要文本，用于展示辅助信息或说明文字。
          </p>
          <code className="inline-block bg-muted text-foreground px-2 py-1 rounded text-sm">
            代码文本
          </code>
        </div>
      </div>

      {/* 组件示例 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">组件样式</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            主要按钮
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            次要按钮
          </button>
          <button className="px-4 py-2 border border-border bg-background text-foreground rounded-lg hover:bg-accent transition-colors">
            边框按钮
          </button>
          <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
            危险按钮
          </button>
        </div>
      </div>

      {/* 卡片示例 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">卡片样式</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <h4 className="font-semibold text-card-foreground mb-2">卡片标题</h4>
            <p className="text-muted-foreground text-sm">
              这是一个卡片组件的示例，展示了卡片背景、边框和文字的样式。
            </p>
          </div>
          <div className="p-4 bg-popover border border-border rounded-lg">
            <h4 className="font-semibold text-popover-foreground mb-2">弹出框标题</h4>
            <p className="text-muted-foreground text-sm">
              这是一个弹出框组件的示例，用于展示弹出框的样式。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 