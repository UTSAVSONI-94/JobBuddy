import React from 'react'
import { Bot, User } from 'lucide-react'
import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'

  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g)
      const renderedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-0.5 ml-2">
            <span className="text-indigo-500 font-bold">•</span>
            <span>{renderedLine}</span>
          </div>
        )
      }

      return (
        <React.Fragment key={lineIdx}>
          {renderedLine}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      )
    })
  }

  return (
    <div className={`flex gap-3 my-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isAssistant
            ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            : 'bg-indigo-600 text-white rounded-tr-none'
        }`}
      >
        <div className={isAssistant ? 'text-slate-700' : 'text-indigo-50'}>
          {renderContent(message.content)}
        </div>
        <div
          className={`text-[10px] mt-1.5 ${
            isAssistant ? 'text-slate-400 text-left' : 'text-indigo-200 text-right'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
