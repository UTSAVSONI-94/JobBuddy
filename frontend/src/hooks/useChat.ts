import { useState, useCallback, useEffect } from 'react'
import type { Message, ParsedResume, MatchedJob } from '../types'
import { sendMessage, uploadResume } from '../api/client'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hi! I'm **JobBuddy**, your AI job assistant.\n\nUpload your resume (PDF or DOCX) to get started, and I'll match the best open opportunities for you!",
      timestamp: new Date()
    }
  ])

  const [resume, setResume] = useState<ParsedResume | null>(() => {
    try {
      const saved = localStorage.getItem('jobbuddy_resume')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [jobs, setJobs] = useState<MatchedJob[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return

    const lowerName = file.name.toLowerCase()
    if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.docx')) {
      addMessage('assistant', '⚠️ Unsupported file format. Please upload a standard PDF (.pdf) or Word document (.docx).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      addMessage('assistant', `⚠️ The file **${file.name}** exceeds the 5MB size limit. Please upload a smaller file.`)
      return
    }

    addMessage('user', `📎 Uploaded: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`)
    setIsLoading(true)

    try {
      const parsed = await uploadResume(file)
      setResume(parsed)
      try {
        localStorage.setItem('jobbuddy_resume', JSON.stringify(parsed))
      } catch {}

      const skillsDisplay = parsed.skills && parsed.skills.length > 0 ? parsed.skills.join(', ') : 'General Engineering'
      const contactInfo = [parsed.email, parsed.phone].filter(Boolean).join(' • ') || 'Not specified'
      const eduDisplay = parsed.education && parsed.education.length > 0 ? parsed.education.join(', ') : 'Not specified'
      const projDisplay = parsed.projects && parsed.projects.length > 0 ? parsed.projects.join(', ') : 'Not specified'

      addMessage(
        'assistant',
        `✅ **Resume parsed successfully!**\n\n` +
        `• **Name:** ${parsed.name || 'Candidate'}\n` +
        `• **Contact:** ${contactInfo}\n` +
        `• **Designation:** ${parsed.designation || 'Software Engineer'}\n` +
        `• **Skills (${parsed.skills?.length || 0}):** ${skillsDisplay}\n` +
        `• **Experience:** ${parsed.experience || 'Fresher / Not specified'}\n` +
        `• **Education:** ${eduDisplay}\n` +
        `• **Projects:** ${projDisplay}\n\n` +
        `🔍 Matching tailored opportunities from our database now...`
      )

      const autoMatch = await sendMessage({
        message: 'Recommend matching jobs for my profile',
        history: [],
        resume: parsed
      })

      if (autoMatch.reply) {
        addMessage('assistant', autoMatch.reply)
      }
      if (autoMatch.jobs && autoMatch.jobs.length > 0) {
        setJobs(autoMatch.jobs)
      }
    } catch (err: any) {
      addMessage('assistant', `❌ ${err.message || 'Unable to parse resume. Please ensure the document is not password-protected.'}`)
    } finally {
      setIsLoading(false)
    }
  }, [addMessage])

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return
    addMessage('user', text)
    setIsLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const response = await sendMessage({ message: text, history, resume })
      addMessage('assistant', response.reply)
      if (response.jobs) setJobs(response.jobs)
    } catch (err: any) {
      addMessage('assistant', `⚠️ ${err.message || 'Connection lost. Please make sure the backend server is running on port 8000.'}`)
    } finally {
      setIsLoading(false)
    }
  }, [messages, resume, addMessage])

  useEffect(() => {
    if (resume && jobs.length === 0) {
      sendMessage({
        message: 'Recommend matching jobs for my profile',
        history: [],
        resume
      }).then(res => {
        if (res.jobs) setJobs(res.jobs)
      }).catch(() => {})
    }
  }, [])

  return { messages, resume, jobs, isLoading, handleUpload, handleSend }
}
