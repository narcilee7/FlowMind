import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import EditorCore from './components/Editor/core/EditorCore'
import OnlineBar from './components/OnlineBar'

function App() {
  const { isOnline, setIsOnline } = useAppStore()

  React.useEffect(() => {
    // 监听网络状态
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline])

  return (
      <Router>
        <div className="flex flex-col h-screen bg-background text-foreground">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden bg-background">
              <Routes>
                {/* <Route path="/" element={<EditorCore />} /> */}
              </Routes>
            </main>
          </div>
          
          {/* 离线提示 */}
          <OnlineBar isOnline={isOnline} />
        </div>
      </Router>
  )
}

export default App
