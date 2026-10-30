import React from 'react'
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
          <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 ml-1">
            <span className="text-slate-400 font-bold">•</span>
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
    <div className={`flex gap-2.5 my-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
          JB
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
          isAssistant
            ? 'bg-slate-100 text-slate-800'
            : 'bg-slate-900 text-white'
        }`}
      >
        <div>
          {renderContent(message.content)}
        </div>
        <div
          className={`text-[10px] mt-1 ${
            isAssistant ? 'text-slate-400 text-left' : 'text-slate-300 text-right'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
