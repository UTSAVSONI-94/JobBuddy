import { useEffect, useState } from 'react'
import { Bot, Sparkles, Briefcase, CheckCircle2 } from 'lucide-react'
import ChatWindow from './components/ChatWindow'
import ResumeUpload from './components/ResumeUpload'
import JobCard from './components/JobCard'
import { useChat } from './hooks/useChat'
import { getApplications } from './api/client'

export default function App() {
  const { messages, resume, jobs, isLoading, handleUpload, handleSend } = useChat()
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'chat' | 'jobs'>('chat')

  const refreshApplications = async () => {
    try {
      const data = await getApplications()
      if (data && data.applications) {
        const ids = new Set<string>(data.applications.map((a: any) => a.job_id))
        setAppliedJobIds(ids)
      }
    } catch {
    }
  }

  useEffect(() => {
    refreshApplications()
  }, [messages])

  const handleApplyFromCard = (jobId: string) => {
    handleSend(`apply to ${jobId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">JobBuddy</h1>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  AI Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500">Resume parsing, matching, and 1-click apply</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {appliedJobIds.size > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {appliedJobIds.size} Applied
              </div>
            )}
            <div className="flex sm:hidden bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'chat' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all relative ${
                  activeTab === 'jobs' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600'
                }`}
              >
                Jobs ({jobs.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div
          className={`lg:col-span-7 flex flex-col gap-4 h-[calc(100vh-7rem)] ${
            activeTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <ResumeUpload
            onUpload={handleUpload}
            isLoading={isLoading}
            parsedResume={resume}
          />
          <div className="flex-1 min-h-0">
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSend}
              hasResume={Boolean(resume)}
            />
          </div>
        </div>

        <div
          className={`lg:col-span-5 flex flex-col gap-4 h-[calc(100vh-7rem)] ${
            activeTab === 'jobs' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Recommended Jobs</h2>
                <p className="text-xs text-slate-500">
                  {jobs.length > 0 ? `${jobs.length} tailored matches found` : 'Awaiting resume or search'}
                </p>
              </div>
            </div>
            {jobs.length > 0 && (
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                Ranked by AI
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {jobs.length > 0 ? (
              jobs.map((job, idx) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={idx + 1}
                  onApply={handleApplyFromCard}
                  isApplied={appliedJobIds.has(job.id)}
                />
              ))
            ) : (
              <div className="h-full bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">No Jobs Displayed Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">
                  Upload your resume or ask JobBuddy in chat to recommend matching roles!
                </p>
                <button
                  onClick={() => handleSend('Recommend matching jobs')}
                  disabled={isLoading}
                  className="text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl transition-all border border-indigo-100"
                >
                  Find Roles Now
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
