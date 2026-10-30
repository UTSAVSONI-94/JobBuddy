import { useEffect, useState } from 'react'
import { Briefcase, CheckCircle2 } from 'lucide-react'
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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              JB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm tracking-tight">JobBuddy</span>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs text-slate-500 font-normal">Job Assistant</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {appliedJobIds.size > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">{appliedJobIds.size}</span> applied
              </div>
            )}
            <div className="flex sm:hidden border border-slate-200 rounded p-0.5 bg-slate-100">
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'chat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'jobs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Jobs ({jobs.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div
          className={`lg:col-span-7 flex flex-col gap-3.5 h-[calc(100vh-6.5rem)] ${
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
          className={`lg:col-span-5 flex flex-col gap-3 h-[calc(100vh-6.5rem)] ${
            activeTab === 'jobs' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Matched Jobs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {jobs.length > 0 ? `${jobs.length} roles found for your profile` : 'Upload a resume to see matching jobs'}
              </p>
            </div>
            {jobs.length > 0 && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                {jobs.length} results
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
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
              <div className="h-full bg-white border border-slate-200 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded bg-slate-100 text-slate-500 flex items-center justify-center mb-2.5">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-slate-800 text-sm mb-1">No Jobs Listed</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-3.5 leading-relaxed">
                  Upload your resume or ask JobBuddy in the chat to see relevant positions.
                </p>
                <button
                  onClick={() => handleSend('Recommend matching jobs')}
                  disabled={isLoading}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded transition-colors"
                >
                  Find Jobs
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
