// app/page.tsx
import type { Metadata } from 'next'

import Hero from '@/components/Home/Hero'
import FeatureWithPhilosophies from '@/components/Home/FeatureWithPhilosophies'
import Footer from '@/components/Home/Footers'

export const metadata: Metadata = {
  title: 'FlowMind – AI Native Workspace',
  description: '一个云端、AI 原生的沉浸式内容创作平台，集写作、研究、学习、规划于一体。重新定义未来的写作。',
  keywords: ['AI Editor', 'AI写作', '研究助手', '学习工具', '内容创作', 'AI 原生'],
  openGraph: {
    title: 'FlowMind – AI Native Workspace',
    description: '一个 AI 原生的沉浸式内容创作平台，重构你的写作、研究、学习方式。',
    // TODO: 添加 url
    // url: 'https://flowmind.app',
    siteName: 'FlowMind',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     // TODO: 添加 og-image.jpg
    //     url: 'https://flowmind.app/og-image.jpg',
    //     width: 1200,
    //     height: 630,
    //     alt: 'FlowMind - AI Native Workspace',
    //   },
    // ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowMind – AI Native Workspace',
    description: '一个 AI 原生的沉浸式内容创作平台。',
    images: ['https://flowmind.app/og-image.jpg'],
  },
  // TODO: 添加 metadataBase
  // metadataBase: new URL('https://flowmind.app'),
}

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <Hero />
      <FeatureWithPhilosophies />
      <Footer />
    </main>
  )
}
