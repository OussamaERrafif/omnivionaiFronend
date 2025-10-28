"use client"

import { X, Clock, Search, Trash2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

interface SearchHistoryItem {
  id: string
  query: string
  timestamp: Date
  results: any[]
}

interface SearchHistoryProps {
  isOpen: boolean
  history: SearchHistoryItem[]
  onSelect: (item: SearchHistoryItem) => void
  onClose: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function SearchHistory({ isOpen, history, onSelect, onClose, onDelete, onClearAll }: SearchHistoryProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <aside
      id="search-history-sidebar"
      className={`fixed right-0 top-0 h-full w-full sm:w-80 bg-background border-l border-border transition-transform duration-300 z-50 shadow-2xl ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      role="complementary"
      aria-label="Search history"
      aria-hidden={!isOpen}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center" aria-hidden="true">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-base sm:text-lg">History</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-foreground hover:text-foreground hover:bg-accent rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close search history"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {history.length > 0 && (
          <div className="p-3 sm:p-4 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent border-destructive/30 hover:border-destructive/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-xs sm:text-sm"
              aria-label="Clear all search history"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              Clear All History
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 sm:py-16 px-4" role="status">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-center mb-3 sm:mb-4" aria-hidden="true">
                    <Search className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">No search history</p>
                  <p className="text-xs text-muted-foreground/70">Your searches will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3" role="list" aria-label="Search history items">
                  {history.map((item) => (
                    <Card
                      key={item.id}
                      className="p-3 sm:p-4 bg-card hover:bg-accent border-border transition-all duration-200 group relative rounded-lg sm:rounded-xl focus-within:ring-2 focus-within:ring-ring"
                      role="listitem"
                    >
                      <button
                        className="w-full text-left cursor-pointer focus-visible:outline-none"
                        onClick={() => {
                          onSelect(item)
                          onClose()
                        }}
                        aria-label={`View search: ${item.query}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3 pr-8">
                          <p className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                            {item.query}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                          <time dateTime={item.timestamp.toISOString()}>{formatTime(item.timestamp)}</time>
                          <span aria-hidden="true">•</span>
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs">
                            {item.results.length} sources
                          </span>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(item.id)
                        }}
                        className="absolute top-2 sm:top-3 right-2 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label={`Delete search: ${item.query}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </aside>
  )
}
