import os
import json
import re
import utils.env_loader
from utils.gemini_client import call_gemini

SKILLS_DICTIONARY = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", ".NET", "PHP",
    "Ruby", "Go", "Golang", "Rust", "Kotlin", "Swift", "Dart", "HTML", "HTML5",
    "CSS", "CSS3", "Sass", "SCSS", "Tailwind CSS", "Bootstrap", "Material UI",
    "React", "React.js", "React Native", "Next.js", "Vue", "Vue.js", "Angular",
    "Svelte", "Redux", "Zustand", "Node.js", "Node", "Express", "Express.js",
    "FastAPI", "Flask", "Django", "Spring Boot", "NestJS", "GraphQL", "REST API",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Firebase",
    "Supabase", "Prisma", "Git", "GitHub", "GitLab", "Docker", "Kubernetes",
    "AWS", "GCP", "Azure", "Terraform", "CI/CD", "Linux", "Bash", "Machine Learning",
    "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "Scikit-learn", "Figma", "Postman", "Jira", "Jest", "Microservices"
]

RESUME_EXTRACTION_PROMPT = """
You are an expert resume parsing engine.
Analyze the provided resume text and extract the candidate's structured details strictly in JSON format.

JSON Schema required:
{
  "name": "Candidate's full name",
  "email": "Candidate's email or empty string",
  "phone": "Candidate's phone number or empty string",
  "designation": "Current or targeted professional title (e.g. Frontend Developer, Data Scientist, Student)",
  "skills": ["Array of skills explicitly listed or evidenced in the resume"],
  "experience": "Total experience summary (e.g. '2 years', 'Fresher', 'Intern')",
  "education": ["Array of degrees, universities, or graduation details"],
  "projects": ["Array of project titles or key highlights"]
}

Strict Rules:
1. Extract ALL technical skills, programming languages, frameworks, libraries, tools, and databases mentioned anywhere in the resume.
2. Return ONLY valid JSON matching the schema.

Resume Text:
"""

def extract_all_skills(text: str) -> list[str]:
    found = []
    text_lower = text.lower()

    for skill in SKILLS_DICTIONARY:
        escaped = re.escape(skill.lower())
        pattern = r'(?<![a-zA-Z0-9])' + escaped + r'(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            found.append(skill)

    section_regex = r'(?:skills|technical skills|technologies|tech stack|key competencies|tools|languages|frameworks)[\s:]*\n?(.*?)(?:\n\s*\n|\b(?:experience|work experience|employment|education|projects|certifications|achievements|academic)\b|$)'
    matches = re.findall(section_regex, text, re.IGNORECASE | re.DOTALL)
    for section_text in matches:
        tokens = re.split(r'[,|•·\n\r/;]+', section_text)
        for token in tokens:
            if ":" in token:
                token = token.split(":", 1)[1]
            cleaned = re.sub(r'^[•\-\*\s:\(\)\[\]]+|[•\-\*\s:\(\)\[\]]+$', '', token).strip()
            if 1 < len(cleaned) < 30 and not any(w in cleaned.lower() for w in [
                "proficient", "familiar", "basic", "knowledge", "skills", "experience",
                "tools", "frameworks", "libraries", "intermediate", "expert", "level"
            ]):
                if not any(f.lower() == cleaned.lower() for f in found):
                    found.append(cleaned)

    cleaned_skills = []
    seen = set()
    for s in found:
        k = s.lower().replace(".js", "").replace(" ", "")
        if k not in seen:
            seen.add(k)
            cleaned_skills.append(s)

    return cleaned_skills[:25]

def fallback_parse(text: str) -> dict:
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    candidate_name = "Candidate"
    for line in lines[:5]:
        if not any(w in line.lower() for w in ["curriculum", "resume", "cv", "email", "@", "phone", "http", "www."]):
            if len(line) < 40 and not any(char in line for char in ["|", "/", ":", ";"]):
                candidate_name = line
                break

    extracted_skills = extract_all_skills(text)

    desig = "Software Developer"
    for line in lines[:10]:
        line_l = line.lower()
        if any(role in line_l for role in [
            "developer", "engineer", "architect", "intern", "scientist",
            "analyst", "lead", "student", "full stack", "frontend", "backend"
        ]):
            desig = line
            break

    exp = "Fresher / Not specified"
    exp_match = re.search(r'(\d+[\+]?\s*(?:years|year|yrs|yr)\s*(?:of)?\s*(?:experience)?)', text, re.IGNORECASE)
    if exp_match:
        exp = exp_match.group(1)
    elif "intern" in text.lower():
        exp = "Intern / Fresher"

    education = [l for l in lines if any(w in l.lower() for w in ["bachelor", "master", "b.tech", "degree", "university", "college", "school"])][:3]
    projects = [l for l in lines if any(w in l.lower() for w in ["project", "app", "system", "portfolio", "platform"])][:3]

    return {
        "name": candidate_name[:50],
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "designation": desig[:50],
        "skills": extracted_skills,
        "experience": exp,
        "education": education,
        "projects": projects
    }

def parse_resume(raw_text: str) -> dict:
    if not raw_text.strip():
        raise ValueError("Resume text is empty or unreadable.")

    current_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not current_api_key or current_api_key == "your_gemini_api_key_here":
        return fallback_parse(raw_text)

    try:
        response_text = call_gemini(
            prompt=RESUME_EXTRACTION_PROMPT + "\n" + raw_text,
            json_mode=True
        )

        if response_text:
            result = json.loads(response_text)
            required_keys = ["name", "email", "phone", "designation", "skills", "experience", "education", "projects"]
            for key in required_keys:
                if key not in result:
                    result[key] = [] if key in ["skills", "education", "projects"] else ""

            if not result.get("skills") or len(result.get("skills", [])) < 2:
                result["skills"] = extract_all_skills(raw_text)

            return result
    except Exception as e:
        print(f"Gemini parsing error: {e}")

    return fallback_parse(raw_text)
