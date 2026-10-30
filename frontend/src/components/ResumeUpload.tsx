import React, { useRef, useState } from 'react'
import { Upload, Check } from 'lucide-react'
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
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />

      {parsedResume ? (
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-800 text-xs truncate">
                {parsedResume.name || 'Candidate Resume'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {parsedResume.designation || 'Software Engineer'} • {parsedResume.skills?.length || 0} skills detected
              </div>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded transition-colors shrink-0 ml-3"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded p-3 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50/40'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-slate-500" />
            )}
            <span className="font-medium text-slate-700">
              {isLoading ? 'Parsing resume...' : 'Upload resume (PDF or DOCX)'}
            </span>
            <span className="text-slate-400">· Max 5MB</span>
          </div>
        </div>
      )}
    </div>
  )
}
