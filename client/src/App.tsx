import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { Sidebar } from '@/components/Sidebar'
import { Editor } from '@/components/Editor'
import { Header } from '@/components/Header'

function App() {
  const { isOnline, setIsOnline } = useAppStore()

  React.useEffect(() => {
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
      <div className="h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Editor />} />
              <Route path="/editor" element={<Editor />} />
            </Routes>
          </main>
        </div>
        {!isOnline && (
          <div className="fixed bottom-4 right-4 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-md shadow-lg">
            离线模式 - 部分功能不可用
          </div>
        )}
      </div>
    </Router>
  )
}

export default App 