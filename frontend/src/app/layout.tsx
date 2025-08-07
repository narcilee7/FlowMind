import '@/styles/global.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/utils/cn'
import Header from '@/components/Header'
import FloatingAgent from '@/components/FloatingAgent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Native Editor',
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
        <div className="relative min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">{children}</main>
          <FloatingAgent />
        </div>
      </body>
    </html>
  )
}
