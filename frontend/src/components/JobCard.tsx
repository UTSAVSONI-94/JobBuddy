import { MapPin, ExternalLink, Check } from 'lucide-react'
import type { MatchedJob } from '../types'

interface JobCardProps {
  job: MatchedJob
  onApply: (jobId: string) => void
  isApplied?: boolean
  index?: number
}

export default function JobCard({ job, onApply, isApplied = false, index }: JobCardProps) {
  const isRemote = job.location.toLowerCase().includes('remote')

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {index !== undefined && (
              <span className="w-4 h-4 rounded bg-slate-100 text-slate-500 text-[10px] font-mono flex items-center justify-center shrink-0">
                {index}
              </span>
            )}
            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{job.title}</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
            {Math.round(job.matchScore)}% match
          </span>
        </div>

        <div className="text-xs text-slate-600 mb-2 flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-800">{job.company}</span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin className="w-3 h-3 text-slate-400" />
            {job.location}
          </span>
          {isRemote && (
            <span className="text-[10px] text-slate-600 bg-slate-100 px-1 rounded border border-slate-200">
              Remote
            </span>
          )}
        </div>

        {job.matchReason && (
          <div className="text-xs bg-slate-50 border border-slate-200 text-slate-600 p-2 rounded mb-2.5 leading-relaxed">
            <span className="font-medium text-slate-700">Reason: </span>
            {job.matchReason}
          </div>
        )}

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {job.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        {job.sourceLink ? (
          <a
            href={job.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
          >
            Job post <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-400 font-mono">ID: {job.id}</span>
        )}

        <button
          onClick={() => onApply(job.id)}
          disabled={isApplied}
          className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 ${
            isApplied
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {isApplied ? (
            <>
              <Check className="w-3 h-3" />
              Applied
            </>
          ) : (
            'Apply'
          )}
        </button>
      </div>
    </div>
  )
}
