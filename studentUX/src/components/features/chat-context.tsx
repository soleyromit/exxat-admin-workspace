"use client"

import * as React from "react"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatContextType {
  chatHistory: ChatMessage[]
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  addMessage: (message: ChatMessage) => void
  clearChat: () => void
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const addMessage = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message])
  }

  const clearChat = () => {
    setChatHistory([])
  }

  return (
    <ChatContext.Provider value={{
      chatHistory,
      setChatHistory,
      isLoading,
      setIsLoading,
      addMessage,
      clearChat
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = React.useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
