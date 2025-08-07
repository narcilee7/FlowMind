import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { ThemeProvider } from '@/theme/ThemeProvider'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import styled from 'styled-components'
import EditorCore from './components/Editor/core/EditorCore'
import OnlineBar from './components/OnlineBar'

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background);
  color: var(--foreground);
`

const AppContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

const MainContent = styled.main`
  flex: 1;
  overflow: hidden;
  background: var(--background);
`

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
    <ThemeProvider>
      <Router>
        <AppContainer>
          <Header />
          <AppContent>
            <Sidebar />
            <MainContent>
              <Routes>
                <Route path="/" element={<EditorCore />} />
              </Routes>
            </MainContent>
          </AppContent>
          
          {/* 离线提示 */}
          <OnlineBar isOnline={isOnline} />
        </AppContainer>
      </Router>
    </ThemeProvider>
  )
}

export default App
