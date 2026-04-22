"use client"

import * as React from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  User,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { cn } from "../ui/utils"

interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  duration: string
  totalSlots: number
  availableSlots: number
  requestedSlots: number
  isUnlimited: boolean
  discipline: string
  location: string
  status: 'active' | 'pending' | 'full'
}

// Generate mock calendar events
const generateCalendarEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = []
  const today = new Date()
  
  for (let i = 0; i < 25; i++) {
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + Math.floor(Math.random() * 90) - 30)
    
    const duration = Math.floor(Math.random() * 12) + 4
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + (duration * 7))
    
    const totalSlots = Math.floor(Math.random() * 20) + 5
    const requestedSlots = Math.floor(Math.random() * totalSlots)
    const availableSlots = totalSlots - requestedSlots
    
    const disciplines = ['Internal Medicine', 'Pediatrics', 'Surgery', 'Emergency Medicine', 'Radiology']
    const locations = ['Mayo Clinic', 'Johns Hopkins', 'Cleveland Clinic', 'Stanford Medical', 'Mass General']
    
    events.push({
      id: `event-${i}`,
      title: `${disciplines[Math.floor(Math.random() * disciplines.length)]} Rotation`,
      startDate,
      endDate,
      duration: `${duration} weeks`,
      totalSlots,
      availableSlots,
      requestedSlots,
      isUnlimited: Math.random() < 0.2,
      discipline: disciplines[Math.floor(Math.random() * disciplines.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      status: availableSlots > 0 ? 'active' : requestedSlots > totalSlots ? 'pending' : 'full'
    })
  }
  
  return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

interface CalendarViewProps {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarView({ events = generateCalendarEvents(), onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [viewMode, setViewMode] = React.useState<'month' | 'week'>('month')

  const today = new Date()
  
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startCalendar = new Date(firstDayOfMonth)
    startCalendar.setDate(startCalendar.getDate() - firstDayOfMonth.getDay())
    
    const days = []
    const current = new Date(startCalendar)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate())
      const eventEnd = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate())
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      return checkDate >= eventStart && checkDate <= eventEnd
    })
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-chart-3/10 border-chip-3/40 text-chip-3'
      case 'pending': return 'bg-chart-4/10 border-chip-4/40 text-chip-4'
      case 'full': return 'bg-muted/50 border-border text-muted-foreground'
      default: return 'bg-muted/50 border-border text-muted-foreground'
    }
  }

  const calendarDays = getCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousMonth}
              className="p-1 h-8 w-8 rounded-md hover:bg-accent"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToNextMonth}
              className="p-1 h-8 w-8 rounded-md hover:bg-accent"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">{formatMonth(currentDate)}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToToday}
            className="text-chart-1 hover:text-chart-1/80 hover:bg-chart-1/10 px-3 py-1.5 rounded-md font-medium"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === 'month' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === 'week' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {viewMode === 'month' && (
          <div className="grid grid-cols-7">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "px-4 py-3 text-center text-sm font-medium text-muted-foreground bg-muted/30",
                  index < 6 && "border-r border-border"
                )}
              >
                {day}
              </div>
            ))}
            
            {calendarDays.map((date, index) => {
              const dayEvents = getEventsForDate(date)
              const isCurrentMonthDay = isCurrentMonth(date)
              const isTodayDate = isToday(date)
              const row = Math.floor(index / 7)
              const col = index % 7
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] p-3 hover:bg-accent/20 transition-colors relative",
                    row < 5 && "border-b border-border",
                    col < 6 && "border-r border-border",
                    !isCurrentMonthDay && "bg-muted/30 text-muted-foreground",
                    isTodayDate && "bg-chart-1/5 border-chart-1/20"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 text-sm font-medium mb-2",
                    isTodayDate ? (
                      "bg-chart-1 text-primary-foreground rounded-full"
                    ) : (
                      "text-foreground"
                    ),
                    !isCurrentMonthDay && "text-muted-foreground"
                  )}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs px-2 py-1 rounded-md cursor-pointer hover:shadow-sm transition-all duration-200 border-l-2",
                          event.status === 'active' && "bg-chart-3/10 border-l-chip-3 text-chip-3 hover:bg-chart-3/20",
                          event.status === 'pending' && "bg-chart-4/10 border-l-chip-4 text-chip-4 hover:bg-chart-4/20",
                          event.status === 'full' && "bg-muted/50 border-l-border text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="font-medium truncate leading-tight">{event.title}</div>
                        <div className="flex items-center gap-1 mt-1 opacity-75">
                          {event.isUnlimited ? (
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" />
                              <span className="text-xs">Unlimited</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Users className="h-2.5 w-2.5" />
                              <span className="text-xs">{event.availableSlots}/{event.totalSlots}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-2 py-1 hover:text-foreground cursor-pointer">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Events Legend */}
      <div className="flex items-center gap-6 px-1">
        <span className="text-sm font-medium text-foreground">Status:</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-chart-3/10 border-l-2 border-l-chip-3"></div>
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-chart-4/10 border-l-2 border-l-chip-4"></div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted/50 border-l-2 border-l-border"></div>
            <span className="text-sm text-muted-foreground">Full</span>
          </div>
        </div>
      </div>
    </div>
  )
}
