import os
import json
import re
import utils.env_loader
from agents.job_matcher import match_jobs
from agents.job_applier import apply_to_job, get_applications_list
from utils.gemini_client import call_gemini

SYSTEM_INSTRUCTION = """
You are JobBuddy, an intelligent and friendly AI career and job matching assistant.
You assist users by matching jobs to their resumes, answering career queries, refining listings, and applying to jobs.

You have access to the user's parsed resume details and conversation context.
When replying:
- Be warm, professional, encouraging, and concise.
- Never invent job listings; always reference real matched jobs.
- If the user asks to apply, confirm the job title and company clearly.
- If the user asks about applied jobs, summarize their current applications.
"""

FILTER_STOP_WORDS = {
    "recommend", "matching", "jobs", "job", "roles", "role", "for", "my",
    "profile", "please", "show", "find", "search", "openings", "me", "all",
    "available", "positions", "can", "you", "give", "get", "some", "any",
    "with", "only", "in", "at", "near", "roles", "who", "which"
}

KNOWN_SKILLS = [
    "react", "react native", "python", "java", "javascript", "typescript",
    "docker", "kubernetes", "aws", "gcp", "azure", "node", "express",
    "django", "fastapi", "flask", "c++", "c#", "golang", "go", "rust",
    "sql", "postgresql", "mongodb", "redis", "html", "css", "tailwind",
    "spring", "vue", "angular", "next.js", "nextjs", "ci/cd", "machine learning",
    "ai", "nlp", "pandas", "pytorch", "tensorflow"
]

SESSION_RECENT_JOBS = []

def detect_intent_heuristically(message: str) -> dict:
    msg = message.lower().strip()

    apply_match = re.search(r'\bapply\s+(?:to\s+|for\s+)?(?:job\s+)?([#a-zA-Z0-9_ -]+)', msg)
    if apply_match:
        target = apply_match.group(1).lstrip("#").strip()
        if target:
            return {"intent": "apply", "job_identifier": target}

    if any(phrase in msg for phrase in ["my application", "applied job", "application status", "show applied", "list applications", "my applied"]):
        return {"intent": "status"}

    is_job_query = any(w in msg for w in [
        "job", "role", "position", "opening", "match", "recommend", "suggest",
        "find", "search", "remote", "hire", "work", "looking for", "career"
    ])

    if is_job_query:
        remote_only = bool(
            re.search(r'\b(only remote|remote only|strictly remote|remote roles|remote jobs|work from home|wfh)\b', msg) or
            (re.search(r'\bremote\b', msg) and not re.search(r'\b(not remote|no remote|non-remote)\b', msg))
        )

        skill_filter = ""
        for sk in KNOWN_SKILLS:
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(sk) + r'(?![a-zA-Z0-9])'
            if re.search(pattern, msg):
                skill_filter = sk
                break

        if not skill_filter:
            sk_pattern = re.search(r'\b(?:needing|requiring|using|with|for)\s+([a-zA-Z0-9+#.-]+)', msg)
            if sk_pattern:
                cand_sk = sk_pattern.group(1).strip()
                if cand_sk not in FILTER_STOP_WORDS and cand_sk != "remote":
                    skill_filter = cand_sk

        loc_filter = ""
        loc_match = re.search(r'\b(?:in|at|near)\s+([a-zA-Z]+)', msg)
        if loc_match:
            cand_loc = loc_match.group(1).strip()
            if cand_loc not in FILTER_STOP_WORDS and cand_loc not in KNOWN_SKILLS:
                loc_filter = cand_loc

        return {
            "intent": "match",
            "remote_only": remote_only,
            "skill_filter": skill_filter,
            "query_filter": loc_filter
        }

    return {"intent": "general"}

def run_gemini_chat(message: str, history: list[dict], resume_profile: dict | None, context_data: str = "") -> str:
    system_prompt = SYSTEM_INSTRUCTION
    if resume_profile:
        system_prompt += f"\n\nCandidate Resume Profile:\n{json.dumps(resume_profile, indent=2)}"
    if context_data:
        system_prompt += f"\n\nCurrent Data Context:\n{context_data}"

    history_lines = [f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-6:] if h.get('content')]
    history_text = "\n".join(history_lines)
    full_prompt = f"Recent Conversation:\n{history_text}\n\nUser: {message}\nAssistant:" if history_text else message

    try:
        return call_gemini(prompt=full_prompt, system_instruction=system_prompt)
    except Exception:
        return ""

def process_chat(message: str, history: list[dict], resume_profile: dict | None = None) -> dict:
    global SESSION_RECENT_JOBS
    intent_data = detect_intent_heuristically(message)
    intent = intent_data.get("intent")

    if intent == "apply":
        target = intent_data.get("job_identifier", "")
        app_result = apply_to_job(target, recent_jobs=SESSION_RECENT_JOBS)

        gemini_reply = run_gemini_chat(
            message,
            history,
            resume_profile,
            context_data=f"Application Action Result: {json.dumps(app_result)}"
        )
        reply = gemini_reply if gemini_reply else app_result.get("message", "Application processed.")

        current_apps = get_applications_list()
        return {
            "reply": reply,
            "applications": current_apps,
            "jobs": None
        }

    if intent == "status":
        apps = get_applications_list()
        if not apps:
            reply = "You haven't submitted any job applications yet! Upload your resume or ask me to match jobs to get started."
        else:
            gemini_reply = run_gemini_chat(
                message,
                history,
                resume_profile,
                context_data=f"User's Applied Jobs: {json.dumps(apps)}"
            )
            if gemini_reply:
                reply = gemini_reply
            else:
                summary = [f"• **{a['job_title']}** at {a['company']} (Status: {a['status']}, Applied: {a['applied_at'][:10]})" for a in apps]
                reply = f"Here are your current applications ({len(apps)} total):\n\n" + "\n".join(summary)

        return {
            "reply": reply,
            "applications": apps,
            "jobs": None
        }

    if intent == "match" or (resume_profile and any(w in message.lower() for w in ["job", "role", "work", "apply", "position", "career", "hire"])):
        if not resume_profile:
            reply = "Please upload your resume (PDF or DOCX) above first, so I can extract your exact skills and recommend jobs tailored specifically for you!"
            return {"reply": reply, "jobs": [], "applications": None}

        candidate = resume_profile
        remote_only = intent_data.get("remote_only", False)
        skill_filter = intent_data.get("skill_filter", "")
        query_filter = intent_data.get("query_filter", "")

        limit = None
        num_match = re.search(r'\b(\d{1,3})\s*jobs?\b', message.lower())
        if num_match:
            limit = int(num_match.group(1))

        matched = match_jobs(
            candidate_profile=candidate,
            query_filter=query_filter,
            remote_only=remote_only,
            skill_filter=skill_filter,
            limit=limit
        )

        SESSION_RECENT_JOBS = matched

        if not matched:
            filter_details = []
            if remote_only:
                filter_details.append("remote roles")
            if skill_filter:
                filter_details.append(f"skills in {skill_filter.title()}")
            if query_filter:
                filter_details.append(f"location '{query_filter.title()}'")
            filter_desc = " with " + " and ".join(filter_details) if filter_details else ""
            reply = f"I couldn't find open roles{filter_desc} matching your profile right now. Try expanding your search or removing some filters to see more opportunities!"
            return {"reply": reply, "jobs": [], "applications": None}

        matched_summary = [
            {"id": j["id"], "title": j["title"], "company": j["company"], "location": j["location"], "score": j["matchScore"], "reason": j["matchReason"]}
            for j in matched
        ]

        gemini_reply = run_gemini_chat(
            message,
            history,
            candidate,
            context_data=f"Top Matched Jobs:\n{json.dumps(matched_summary, indent=2)}"
        )

        if gemini_reply:
            reply = gemini_reply
        else:
            loc_label = " (Remote only)" if remote_only else ""
            summary_bullets = "\n".join([
                f"• **{j['title']}** at {j['company']} ({j['location']}) — *{j['matchReason']}*"
                for j in matched[:3]
            ])
            reply = (
                f"I found **{len(matched)} tailored positions**{loc_label} matching your background!\n\n"
                f"**Top Recommendations:**\n{summary_bullets}\n\n"
                f"You can refine these (e.g. *\"show only remote roles\"* or *\"jobs needing React\"*), or say *\"apply to job 1\"*."
            )

        return {
            "reply": reply,
            "jobs": matched,
            "applications": None
        }

    gemini_reply = run_gemini_chat(message, history, resume_profile)
    if gemini_reply:
        reply = gemini_reply
    else:
        if resume_profile:
            skills_str = ", ".join(resume_profile.get('skills', [])[:4])
            reply = f"Hi {resume_profile.get('name', 'there')}! I have your profile ready with skills in {skills_str}. Ask me to recommend jobs, filter by remote roles, or apply to any position."
        else:
            reply = "Hello! I am JobBuddy, your AI job assistant. Upload your resume (PDF or DOCX) to get personalized job recommendations, or ask me any job-related questions!"

    return {
        "reply": reply,
        "jobs": None,
        "applications": None
    }
