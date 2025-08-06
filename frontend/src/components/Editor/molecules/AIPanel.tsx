/**
 * AIPanel组件 - 使用styled-components实现
 */

import React, { useState } from 'react'
import styled from 'styled-components'
import { Button } from '@/components/ui/button'
import { Send, Bot, Sparkles } from 'lucide-react'

export interface AIPanelProps {
  className?: string
}

const AIPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background);
  border-left: 1px solid var(--border);
`

const AIPanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--background);
`

const AIPanelTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
`

const AIPanelContent = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`

const AIPanelFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--border);
  background: var(--background);
`

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Input = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--foreground);
  font-size: 0.875rem;
  
  &:focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
`

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Message = styled.div<{ isUser: boolean }>`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  
  ${props => props.isUser && `
    flex-direction: row-reverse;
  `}
`

const MessageAvatar = styled.div<{ isUser: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.isUser ? 'var(--primary)' : 'var(--accent)'};
  color: ${props => props.isUser ? 'var(--primary-foreground)' : 'var(--accent-foreground)'};
  font-size: 0.75rem;
`

const MessageContent = styled.div<{ isUser: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border-radius: var(--radius);
  background: ${props => props.isUser ? 'var(--primary)' : 'var(--muted)'};
  color: ${props => props.isUser ? 'var(--primary-foreground)' : 'var(--foreground)'};
  font-size: 0.875rem;
  max-width: 80%;
`

const AIPanel: React.FC<AIPanelProps> = ({ className }) => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, text: '你好！我是AI助手，有什么可以帮助你的吗？', isUser: false }
  ])

  const handleSend = () => {
    if (!input.trim()) return
    
    const newMessage = { id: Date.now(), text: input, isUser: true }
    setMessages(prev => [...prev, newMessage])
    setInput('')
    
    // 模拟AI回复
    setTimeout(() => {
      const aiReply = { id: Date.now() + 1, text: '我收到了你的消息，正在处理中...', isUser: false }
      setMessages(prev => [...prev, aiReply])
    }, 1000)
  }

  return (
    <AIPanelContainer className={className}>
      <AIPanelHeader>
        <Bot size={20} />
        <AIPanelTitle>AI助手</AIPanelTitle>
        <Sparkles size={16} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />
      </AIPanelHeader>
      
      <AIPanelContent>
        <MessageContainer>
          {messages.map(message => (
            <Message key={message.id} isUser={message.isUser}>
              <MessageAvatar isUser={message.isUser}>
                {message.isUser ? 'U' : 'AI'}
              </MessageAvatar>
              <MessageContent isUser={message.isUser}>
                {message.text}
              </MessageContent>
            </Message>
          ))}
        </MessageContainer>
      </AIPanelContent>
      
      <AIPanelFooter>
        <InputContainer>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send size={16} />
          </Button>
        </InputContainer>
      </AIPanelFooter>
    </AIPanelContainer>
  )
}

export default AIPanel 