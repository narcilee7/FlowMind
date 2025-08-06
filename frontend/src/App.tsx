import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { ThemePreview } from '@/components/ThemePreview'
import { MultiEditorDemo } from '@/components/Editor'
import { AIEditorDemo } from '@/components/Editor/examples/AIEditorDemo'

function App() {
  const { isOnline, setIsOnline, initializeTheme } = useAppStore()

  React.useEffect(() => {
    // 初始化主题
    initializeTheme()
    
    // 监听网络状态
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline, initializeTheme])

  return (
    <Router>
      <div className="h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              {/* <Route path="/" element={<EditorLayout />} /> */}
              {/* <Route path="/editor" element={<EditorLayout />} /> */}
              <Route path="/" element={<AIEditorDemo />} />
              <Route path="/editor" element={<MultiEditorDemo />} />
              <Route path="/theme" element={<ThemePreview />} />
            </Routes>
          </main>
        </div>
        
        {/* 离线提示 */}
        {!isOnline && (
          <div className="fixed bottom-4 right-4 bg-yellow-500/90 backdrop-blur-sm text-yellow-900 px-4 py-2 rounded-lg shadow-lg border border-yellow-400/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
              离线模式 - 部分功能不可用
            </div>
          </div>
        )}
      </div>
    </Router>
  )
}

export default App 