'use client'

import { motion } from 'framer-motion'

const philosophies = [
  {
    title: 'AI First',
    description: '不是简单调用 AI，而是让 AI 成为你的长期创作伙伴。',
  },
  {
    title: 'Block Thinking',
    description: '写作不再是线性过程，而是结构化知识拼图与重组。',
  },
  {
    title: 'Deep & Clean',
    description: '极简但强大，沉浸式体验助力深度思考与表达。',
  },
]

export function Philosophies() {
  return (
    <section className="w-full py-16 px-4 max-w-5xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-10">理念驱动设计</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {philosophies.map((item, i) => (
          <motion.div
            key={item.title}
            className="bg-muted p-6 rounded-xl shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
