import React from 'react'
import { BrowserRouter as Router, Routes } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { ThemeProvider } from '@/theme/ThemeProvider'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import styled from 'styled-components'

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

const OfflineIndicator = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: rgba(234, 179, 8, 0.9);
  backdrop-filter: blur(4px);
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.5);
  font-size: 0.875rem;
  font-weight: 500;
`

const OfflineDot = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  background: #d97706;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
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
              </Routes>
            </MainContent>
          </AppContent>
          
          {/* 离线提示 */}
          {!isOnline && (
            <OfflineIndicator>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <OfflineDot />
                离线模式 - 部分功能不可用
              </div>
            </OfflineIndicator>
          )}
        </AppContainer>
      </Router>
    </ThemeProvider>
  )
}

export default App
