'use client'

import { motion } from 'framer-motion'
import {
  Brain,
  ListTree,
  Layers,
  Sparkles,
  PenTool,
  Save,
  Files,
  BarChart3,
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI 深度助手',
    description: '全局上下文理解，实时反馈你的创作内容。',
  },
  {
    icon: ListTree,
    title: '结构导航',
    description: '自动生成目录，支持层级跳转与内容折叠。',
  },
  {
    icon: Layers,
    title: 'Block 编辑器',
    description: '模块化内容单位，便于组合与重构。',
  },
  {
    icon: Sparkles,
    title: '灵感触发器',
    description: '一键唤起 AI，提供继续写作或拆解建议。',
  },
  {
    icon: PenTool,
    title: '沉浸式界面',
    description: '极简键盘驱动体验，打造纯净创作空间。',
  },
  {
    icon: Save,
    title: '自动保存',
    description: '写作过程实时保存，放心深度创作。',
  },
  {
    icon: Files,
    title: '多文档支持',
    description: '支持多个项目同时管理与切换。',
  },
  {
    icon: BarChart3,
    title: '结构统计',
    description: '字数、块数、层级等实时可见。',
  },
]

export function Features() {
  return (
    <section className="w-full py-16 px-4 max-w-6xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-10">核心功能一览</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            className="bg-card border border-border p-5 rounded-xl hover:shadow-md transition"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <feature.icon className="w-6 h-6 text-primary mb-3 mx-auto" />
            <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
