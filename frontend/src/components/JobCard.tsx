import { Briefcase, MapPin, ExternalLink, Sparkles, Check, ArrowRight } from 'lucide-react'
import type { MatchedJob } from '../types'

interface JobCardProps {
  job: MatchedJob
  onApply: (jobId: string) => void
  isApplied?: boolean
  index?: number
}

export default function JobCard({ job, onApply, isApplied = false, index }: JobCardProps) {
  const isRemote = job.location.toLowerCase().includes('remote')

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (score >= 60) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {index !== undefined && (
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                {index}
              </span>
            )}
            <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">{job.title}</h3>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${getScoreColor(
              job.matchScore
            )}`}
          >
            <Sparkles className="w-3 h-3" />
            {Math.round(job.matchScore)}%
          </span>
        </div>

        <div className="text-xs text-slate-600 font-medium mb-2.5 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-slate-700 font-semibold">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            {job.company}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {job.location}
            {isRemote && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-blue-50 text-blue-600 font-medium rounded">
                Remote
              </span>
            )}
          </span>
        </div>

        {job.matchReason && (
          <div className="text-xs bg-slate-50 border border-slate-100 text-slate-600 p-2.5 rounded-xl mb-3 leading-relaxed">
            <span className="font-semibold text-slate-700">Why it matches: </span>
            {job.matchReason}
          </div>
        )}

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-indigo-50/60 text-indigo-700 px-2 py-0.5 rounded-md font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2 mt-auto">
        {job.sourceLink ? (
          <a
            href={job.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1"
          >
            Details <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-400">ID: {job.id}</span>
        )}

        <button
          onClick={() => onApply(job.id)}
          disabled={isApplied}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
            isApplied
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'
          }`}
        >
          {isApplied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Applied
            </>
          ) : (
            <>
              Apply
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
