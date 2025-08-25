import '@/styles/global.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/utils/cn'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Native Workspace',
  description: '沉浸式、多模态、AI 原生内容创作平台',
  // TODO: SEO深度优化 & 国际化
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={cn(inter.className, 'bg-background text-foreground')}>
        {children}
      </body>
    </html>
  )
}
