import re
from db.db_helpers import read_jobs

GENERIC_TAGS = {"dev", "engineer", "developer", "technology", "tech", "it", "software", "development"}

SYNONYMS = {
    "react.js": "react", "reactjs": "react", "react native": "react native",
    "node.js": "node", "nodejs": "node", "express.js": "express", "expressjs": "express",
    "next.js": "next", "nextjs": "next", "vue.js": "vue", "vuejs": "vue",
    "angular.js": "angular", "angularjs": "angular", "ts": "typescript", "js": "javascript",
    "py": "python", "golang": "go", "c++": "c++", "cpp": "c++", "c#": "c#", "csharp": "c#",
    ".net": ".net", "dotnet": ".net", "postgres": "postgresql", "mongo": "mongodb",
    "k8s": "kubernetes", "aws": "aws", "gcp": "gcp", "azure": "azure", "ci/cd": "ci/cd",
    "ml": "machine learning", "ai": "ai", "deep learning": "deep learning"
}

def normalize_skill(skill: str) -> str:
    cleaned = skill.lower().strip()
    return SYNONYMS.get(cleaned, cleaned)

def match_jobs(
    candidate_profile: dict,
    query_filter: str = "",
    remote_only: bool = False,
    skill_filter: str = "",
    limit: int | None = None
) -> list[dict]:
    try:
        all_jobs = read_jobs()
    except Exception:
        all_jobs = []

    if not all_jobs:
        return []

    c_skills = candidate_profile.get("skills") or []
    c_title = candidate_profile.get("designation") or "Software Engineer"
    c_exp = candidate_profile.get("experience") or "Fresher"

    if not c_skills:
        return []

    cand_normalized = [normalize_skill(s) for s in c_skills if s and s.strip()]
    cand_set = set(cand_normalized)
    num_cand = len(cand_set)
    min_required = 2 if num_cand >= 3 else 1

    q_lower = query_filter.lower().strip() if query_filter else ""
    sf_lower = normalize_skill(skill_filter) if skill_filter else ""

    scored_jobs = []

    for job in all_jobs:
        location = (job.get("location") or "").strip()
        loc_lower = location.lower()
        title = (job.get("title") or "").strip()
        desc = (job.get("description") or "").strip()
        job_skills_raw = job.get("skills") or []
        j_skills_norm = [normalize_skill(s) for s in job_skills_raw if normalize_skill(s) not in GENERIC_TAGS]

        if remote_only and "remote" not in loc_lower and "wfh" not in loc_lower:
            continue

        if sf_lower:
            text_space = f"{title.lower()} {' '.join(j_skills_norm)} {desc.lower()}"
            if sf_lower not in text_space and sf_lower not in j_skills_norm:
                continue

        if q_lower:
            text_space = f"{title.lower()} {loc_lower} {' '.join(j_skills_norm)} {desc.lower()}"
            words = q_lower.split()
            if not all(w in text_space for w in words):
                continue

        title_lower = title.lower()
        text_space = f"{title_lower} {' '.join(j_skills_norm)} {desc.lower()}"

        matched = []
        for s in cand_set:
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(s) + r'(?![a-zA-Z0-9])'
            if s in j_skills_norm or re.search(pattern, text_space):
                matched.append(s)

        if len(matched) < min_required:
            continue

        num_m = len(matched)
        overlap_pct = num_m / num_cand
        spec_ratio = num_m / max(len(j_skills_norm), 1)

        score = (overlap_pct * 50.0) + (spec_ratio * 25.0) + (num_m * 5.0)

        c_exp_l = c_exp.lower()
        j_exp_l = (job.get("experience") or "").lower()
        if ("intern" in c_exp_l and "intern" in j_exp_l) or ("fresher" in c_exp_l and "junior" in j_exp_l):
            score += 10.0

        score = min(round(score, 1), 99.0)

        matched_sample = [s.title() for s in matched[:4]]
        reason = f"Matches {num_m} of your skills: {', '.join(matched_sample)}."
        original_matched = [s for s in c_skills if s and normalize_skill(s) in matched]

        job_result = dict(job)
        job_result["matchScore"] = score
        job_result["matchReason"] = reason
        job_result["matchedSkills"] = original_matched
        scored_jobs.append(job_result)

    if not scored_jobs:
        return []

    scored_jobs.sort(key=lambda x: (x["matchScore"], len(x.get("matchedSkills", []))), reverse=True)

    seen = set()
    results = []
    for j in scored_jobs:
        key = (j["title"].lower().strip(), j["company"].lower().strip())
        if key not in seen:
            seen.add(key)
            results.append(j)
        if limit and len(results) >= limit:
            break

    return results
