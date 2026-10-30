import React, { useRef, useState } from 'react'
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react'
import type { ParsedResume } from '../types'

interface ResumeUploadProps {
  onUpload: (file: File) => void
  isLoading: boolean
  parsedResume: ParsedResume | null
}

export default function ResumeUpload({ onUpload, isLoading, parsedResume }: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragover' || e.type === 'dragenter') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0])
      e.target.value = ''
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />

      {parsedResume ? (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">{parsedResume.name || 'Candidate Resume'}</div>
              <div className="text-xs text-slate-500">
                {parsedResume.designation || 'Software Engineer'} • {parsedResume.skills?.length || 0} skills identified
              </div>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-xs font-medium text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors"
          >
            Update
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {isLoading ? 'Parsing Resume...' : 'Drop your resume here, or browse'}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            Supports PDF and DOCX (Max 5MB)
          </div>
        </div>
      )}
    </div>
  )
}
