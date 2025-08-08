'use client'

/**
 * 编辑器测试页面
 * 用于测试各种适配器的功能
 */

import React, { useState } from 'react'
import { EditorKit } from '@/components/Editor/EditorKit'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'

const editorConfigs = [
  {
    type: EditorType.RICH_TEXT,
    scene: SceneTemplate.WRITING,
    name: '富文本编辑器 - 写作',
    description: '基于TipTap的富文本编辑器'
  },
  {
    type: EditorType.CANVAS,
    scene: SceneTemplate.CREATIVE,
    name: '画布编辑器 - 创意',
    description: '功能完整的画布编辑器，支持绘图工具'
  },
  {
    type: EditorType.CANVAS,
    scene: SceneTemplate.WHITEBOARD,
    name: '画布编辑器 - 白板',
    description: '白板模式的画布编辑器'
  },
  {
    type: EditorType.GRAPH,
    scene: SceneTemplate.RESEARCH,
    name: '知识图谱编辑器 - 研究',
    description: '知识图谱可视化编辑器'
  },
  {
    type: EditorType.TABLE,
    scene: SceneTemplate.RESEARCH,
    name: '表格编辑器 - 研究',
    description: '数据表格编辑器'
  },
  {
    type: EditorType.TIMELINE,
    scene: SceneTemplate.PLANNING,
    name: '时间线编辑器 - 规划',
    description: '项目规划时间线编辑器'
  }
]

export default function EditorTestPage() {
  const [currentConfig, setCurrentConfig] = useState(editorConfigs[0])
  const [key, setKey] = useState(0)

  const switchEditor = (config: typeof editorConfigs[0]) => {
    setCurrentConfig(config)
    setKey(prev => prev + 1) // 强制重新创建编辑器
  }

  return (
    <div className="h-screen flex">
      {/* 侧边栏 */}
      <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-6">编辑器测试</h1>
        
        <div className="space-y-3">
          {editorConfigs.map((config, index) => (
            <button
              key={index}
              onClick={() => switchEditor(config)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                currentConfig === config
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <div className="font-medium text-sm">{config.name}</div>
              <div className="text-xs text-gray-600 mt-1">{config.description}</div>
            </button>
          ))}
        </div>

        <div className="mt-8 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 text-sm mb-2">测试功能</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>• 切换不同的编辑器类型</div>
            <div>• 测试各种场景模板</div>
            <div>• 验证AI功能集成</div>
            <div>• 检查性能监控</div>
            <div>• 测试导出功能</div>
          </div>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 flex flex-col">
        {/* 标题栏 */}
        <div className="border-b p-4 bg-white">
          <h2 className="text-lg font-semibold">{currentConfig.name}</h2>
          <p className="text-sm text-gray-600 mt-1">{currentConfig.description}</p>
          <div className="text-xs text-gray-500 mt-2">
            类型: {currentConfig.type} | 场景: {currentConfig.scene}
          </div>
        </div>

        {/* 编辑器容器 */}
        <div className="flex-1 relative">
          <EditorKit
            key={key}
            initialType={currentConfig.type}
            sceneTemplate={currentConfig.scene}
            className="w-full h-full"
            enableAI={true}
            enablePerformanceMonitoring={true}
            enableErrorHandling={true}
          />
        </div>
      </div>
    </div>
  )
}
