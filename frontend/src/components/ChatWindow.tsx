import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Briefcase, Globe, CheckSquare } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import type { Message } from '../types'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (text: string) => void
  hasResume: boolean
}

const QUICK_ACTIONS = [
  { label: 'Find matching jobs', prompt: 'Recommend matching jobs for my profile', icon: Briefcase },
  { label: 'Remote roles only', prompt: 'Show only remote jobs', icon: Globe },
  { label: 'Jobs needing React', prompt: 'Show jobs needing React', icon: Sparkles },
  { label: 'My applied jobs', prompt: 'Show my applied jobs', icon: CheckSquare },
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
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => onSendMessage(action.prompt)}
              className="text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1.5 transition-all font-medium shadow-2xs"
            >
              <action.icon className="w-3.5 h-3.5 text-indigo-500" />
              {action.label}
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
                ? "Ask me anything (e.g. 'apply to job 1', 'remote roles only')..."
                : "Ask anything, or upload a resume to match jobs..."
            }
            className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center shrink-0 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
