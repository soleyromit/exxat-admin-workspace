"use client"

import * as React from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Textarea } from "../ui/textarea"
import { cn } from "../ui/utils"
import { 
  Paperclip,
  ArrowUp,
  User,
} from "lucide-react"
import { useChatContext } from "../features/chat-context"
import Leo from "../../imports/Leo-68-134"

const suggestions = [
  "Show schedule analytics",
  "Generate report", 
  "Check upcoming schedules",
  "Analyze site capacity"
]

// Mock AI responses for different types of queries
const getAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase()
  
  if (message.includes('schedule') && message.includes('analytics')) {
    return "I can help you analyze schedule patterns! Here's what I found:\n\n📊 **Current Analytics:**\n• 450 students scheduled this month\n• 92% placement success rate\n• Top locations: Mayo Clinic (15%), Johns Hopkins (12%)\n• Peak scheduling: September-November\n\nWould you like me to generate a detailed analytics report or focus on a specific time period?"
  }
  
  if (message.includes('generate') && message.includes('report')) {
    return "I can generate various reports for you! 📋\n\n**Available Reports:**\n• Monthly placement summary\n• Site capacity analysis\n• Student progress tracking\n• Compliance status overview\n• Performance metrics\n\nWhich type of report would you like me to create? I can customize it by date range, location, or program."
  }
  
  if (message.includes('upcoming') && message.includes('schedule')) {
    return "Here are your upcoming schedules: 📅\n\n**Next 7 Days:**\n• **Tomorrow:** 15 students starting rotations at Cleveland Clinic\n• **Wednesday:** Site visit to Stanford Medical Center\n• **Friday:** 8 students completing pediatrics rotations\n\n**Next Week:**\n• 23 new placements beginning\n• 12 mid-rotation evaluations due\n• 5 final presentations scheduled\n\nWould you like details on any specific schedule or location?"
  }
  
  if (message.includes('site') && message.includes('capacity')) {
    return "Here's the current site capacity analysis: 🏥\n\n**High Capacity Sites:**\n• Mayo Clinic: 45/50 slots filled (90%)\n• Johns Hopkins: 38/45 slots filled (84%)\n• Cleveland Clinic: 32/40 slots filled (80%)\n\n**Available Opportunities:**\n• Stanford Medical: 8 open slots\n• UCLA Medical: 12 open slots\n• Mount Sinai: 6 open slots\n\nWould you like me to help match students to available positions or analyze capacity trends?"
  }
  
  if (message.includes('help') || message.includes('what can you do')) {
    return "I'm Leo, your AI assistant for Exxat One! I can help you with: 🤖\n\n**Schedule Management:**\n• View and analyze placement schedules\n• Track student progress and rotations\n• Manage site capacity and availability\n\n**Reporting & Analytics:**\n• Generate placement reports\n• Analyze performance metrics\n• Track compliance status\n\n**Administrative Tasks:**\n• Find available placements\n• Coordinate with healthcare sites\n• Monitor student evaluations\n\nWhat would you like to work on today?"
  }
  
  // Default response for general queries
  return `I understand you're asking about "${userMessage}". As your Exxat One assistant, I can help with:\n\n• **Schedule Management** - View, create, and modify student placements\n• **Analytics & Reports** - Generate insights and performance reports\n• **Site Coordination** - Manage relationships with healthcare facilities\n• **Student Tracking** - Monitor progress and compliance\n\nCould you provide more specific details about what you'd like to accomplish?`
}

export function LeoAIPage() {
  const [message, setMessage] = React.useState("")
  const { chatHistory, isLoading, setIsLoading, addMessage, clearChat } = useChatContext()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date()
    }

    addMessage(userMessage)
    setMessage("")
    setIsLoading(true)

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: getAIResponse(userMessage.content),
        timestamp: new Date()
      }
      
      addMessage(aiResponse)
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  // Auto-scroll to bottom when new messages are added
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  return (
    <div className="flex flex-col h-full">
      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 lg:px-6 h-full">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {chatHistory.length > 0 ? (
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto py-6 space-y-6"
              >
                {chatHistory.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={cn("flex gap-4", isUser ? "justify-end" : "justify-start")}>
                      {!isUser && (
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-foreground">
                          <Leo />
                        </div>
                      )}
                      <div className={cn("max-w-[70%]", isUser && "order-first")}>
                        <div className={cn(
                          "p-4 rounded-lg",
                          isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground"
                        )}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                        <div className={cn(
                          "text-sm text-muted-foreground mt-2",
                          isUser ? "text-right" : "text-left"
                        )}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      {isUser && (
                        <div className="flex-shrink-0 w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-secondary-foreground" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-foreground">
                      <Leo />
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 text-foreground">
                    <Leo />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Welcome to Leo AI</h2>
                  <p className="text-muted-foreground mb-2">Ask, build or find anything</p>
                  <p className="text-muted-foreground mb-6">
                    I'm here to help you manage schedules, generate reports, and analyze placement data. What would you like to work on today?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        asChild
                        className="cursor-pointer hover:bg-accent transition-colors"
                      >
                        <button
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-sm"
                          disabled={isLoading}
                        >
                          {suggestion}
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex-none px-4 lg:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card relative rounded-2xl border border-border shadow-sm">
            <div className="flex flex-col justify-between p-4 min-h-[80px]">
              {/* Text Input Area */}
              <div className="flex-1 mb-3">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Leo anything about schedules, reports, or analytics..."
                  aria-label="Message Leo AI"
                  className="min-h-[40px] max-h-[120px] resize-none border-0 p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  disabled={isLoading}
                />
              </div>
              
              {/* Bottom section with suggestions and action buttons */}
              <div className="flex flex-row gap-3 items-center justify-end w-full">
                {/* Suggestion chips */}
                <div className="flex flex-row grow items-center gap-2 flex-wrap">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      asChild
                      className="h-6 px-2 py-0.5 rounded-full cursor-pointer hover:bg-accent transition-colors"
                    >
                      <button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                        disabled={isLoading}
                      >
                        {suggestion}
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-row items-center justify-start">
                  {/* Attachment button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-foreground hover:bg-accent"
                    disabled={isLoading}
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  
                  {/* Send button */}
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                    disabled={!message.trim() || isLoading}
                    onClick={handleSendMessage}
                    aria-label="Send message"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}