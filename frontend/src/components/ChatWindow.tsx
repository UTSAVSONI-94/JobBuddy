import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import type { Message } from '../types'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (text: string) => void
  hasResume: boolean
}

const SUGGESTIONS = [
  'Recommend matching jobs',
  'Show only remote roles',
  'Jobs needing React',
  'Show my applied jobs'
]

export default function ChatWindow({ messages, isLoading, onSendMessage, hasResume }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {SUGGESTIONS.map((text, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => onSendMessage(text)}
              className="text-xs bg-white border border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-slate-700 px-2.5 py-1 rounded shrink-0 transition-colors"
            >
              {text}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              hasResume
                ? "Type a query (e.g. 'apply to job 1', 'show only remote')..."
                : "Type a message or upload your resume to begin..."
            }
            className="flex-1 bg-white border border-slate-300 focus:border-slate-500 focus:outline-none rounded px-3 py-2 text-sm text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded text-sm font-medium transition-colors flex items-center justify-center shrink-0"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
