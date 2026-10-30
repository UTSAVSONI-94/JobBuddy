export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ParsedResume {
  name: string
  email: string
  phone: string
  designation: string
  skills: string[]
  experience: string
  education: string[]
  projects: string[]
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  experience: string
  skills: string[]
  description: string
  sourceLink: string
  postedAt: string
}

export interface MatchedJob extends Job {
  matchScore: number
  matchReason: string
}

export interface Application {
  application_id: string
  job_id: string
  job_title: string
  company: string
  applied_at: string
  status: string
}

export interface ChatRequest {
  message: string
  history: { role: string; content: string }[]
  resume?: ParsedResume | null
}

export interface ChatResponse {
  reply: string
  jobs?: MatchedJob[]
  applications?: Application[]
}
