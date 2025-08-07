import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import Header from '@/components/Header'
import EditorCore from './components/Editor/core/EditorCore'

function App() {
  const { setIsOnline, immersive } = useAppStore()

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
          {!immersive && <Header />}
          <main>
            <Routes>
              <Route path="/" element={<EditorCore />} />
            </Routes>
          </main>
        </div>
      </Router>
  )
}

export default App
