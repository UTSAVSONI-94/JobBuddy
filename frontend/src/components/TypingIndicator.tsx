export default function TypingIndicator() {
  return (
    <div className="flex gap-2.5 my-2 justify-start items-center">
      <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">
        JB
      </div>
      <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
      </div>
    </div>
  )
}
