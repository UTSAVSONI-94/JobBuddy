# JobBuddy — AI Job Chat Assistant

JobBuddy is an agentic, AI-powered conversational career assistant built for the Hidani Tech Software Development Engineer (SDE) Intern assessment. It parses candidate resumes in PDF or DOCX format, extracts structured credentials, matches them against a real dataset of 1,947 job listings with personalized match explanations, refines job search criteria through natural conversation, and executes one-click job applications with strict duplicate prevention.

---

## 1. Agent Architecture

JobBuddy follows a modular, agent-based design centered around an **Orchestrator Agent** that directs incoming requests to dedicated tool sub-agents based on conversation context and heuristics:

```
                      ┌───────────────────────────┐
                      │   Conversational Client   │
                      │   (React + Vite + Tailwind)│
                      └─────────────┬─────────────┘
                                    │ HTTP / JSON
                                    ▼
                      ┌───────────────────────────┐
                      │    FastAPI Application    │
                      │        (main.py)          │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
               ┌─────────────────────────────────────────┐
               │         Orchestrator Agent              │
               │      (agents/orchestrator.py)           │
               └────┬───────────────┬────────────────┬───┘
                    │               │                │
       Upload / Parse               │ Match          │ Apply / Status
                    ▼               ▼                ▼
         ┌──────────────────┐ ┌───────────┐ ┌────────────────┐
         │  Resume Parser   │ │Job Matcher│ │  Job Applier   │
         │(resume_parser.py)│ │(matcher.py│ │(job_applier.py)│
         └────────┬─────────┘ └─────┬─────┘ └───────┬────────┘
                  │                 │               │
                  ▼                 ▼               ▼
           PyMuPDF / DOCX      jobs.json    applications.json
          & Gemini Client    (1,947 jobs)       (DB store)
```

### Agent Roles:
1. **Orchestrator Agent (`backend/agents/orchestrator.py`)**:
   - Acts as the central reasoning hub.
   - Detects user intent: job matching, search refinement, job application, or application status inquiry.
   - Preserves multi-turn session state (`SESSION_RECENT_JOBS`) to resolve contextual references such as *"apply to job 2"*.
   - Integrates Google Gemini Flash with fallback responses for uninterrupted uptime.

2. **Resume Parser Tool (`backend/agents/resume_parser.py`)**:
   - Parses raw document streams using PyMuPDF (PDF), python-docx (DOCX), or low-level native zlib decompression.
   - Extracts 7 distinct candidate fields: **Name**, **Contact** (Email, Phone), **Designation**, **Skills**, **Experience**, **Education**, and **Projects**.
   - Applies domain skill tokenization and canonical normalization.

3. **Job Matcher Tool (`backend/agents/job_matcher.py`)**:
   - Compares candidate profile parameters against the 1,947 job database.
   - Employs skill token matching across job titles, tagged skills, and full descriptions.
   - Calculates a weighted score incorporating skill overlap percentage, specificity ratio, and seniority level.
   - Generates an individualized `matchReason` for every match.

4. **Job Applier Tool (`backend/agents/job_applier.py`)**:
   - Resolves target jobs by ordinal index (e.g. `1`, `job 3`), Job ID (`job_0001`), or company name.
   - Validates existence and checks `backend/db/applications.json` to prevent duplicate submissions.
   - Generates persistent application records with unique UUIDs, ISO timestamps, and `Applied` status.

---

## 2. End-to-End Dataflow

### Flow A: Resume Upload & Auto-Matching
1. User drops a `.pdf` or `.docx` file into the chat interface.
2. `POST /api/upload` transfers file bytes to `file_parser.py`, which extracts raw text.
3. `resume_parser.py` extracts structured fields and returns JSON to the frontend.
4. Extracted profile details are displayed in chat.
5. The frontend triggers `POST /api/chat` with an auto-match request containing the parsed resume.
6. `orchestrator.py` invokes `job_matcher.py` to score and rank positions.
7. Matching positions are loaded into the right-hand job deck with individual scores and match reasons.

### Flow B: Natural Chat Refinement
1. User enters natural queries such as *"show only remote roles"*, *"jobs needing React"*, or *"jobs in London"*.
2. `orchestrator.py` parses the message:
   - Detects remote constraints (`remote_only=True`).
   - Extracts skill requirements (`skill_filter="react"`).
   - Extracts location criteria (`query_filter="london"`).
3. `job_matcher.py` filters and re-ranks the active candidate profile against the database.
4. Filtered results update both the assistant conversation bubble and the interactive job cards.

### Flow C: Job Application & Verification
1. User enters *"apply to job 1"* or clicks the **Apply** button on a job card.
2. `job_applier.py` maps the identifier to the job listing.
3. System checks `backend/db/applications.json`:
   - If already applied: Returns friendly notice with application timestamp.
   - If new: Generates a record with `application_id`, `job_id`, `company`, `applied_at`, and `status: Applied`.
4. User queries *"show my applied jobs"* to review recorded applications.

---

## 3. APIs Used

### Internal Backend Endpoints (FastAPI)

| Method | Endpoint | Description | Request Body / Payload |
|---|---|---|---|
| `GET` | `/` | API Health Check | None |
| `POST` | `/api/upload` | Parse Resume Document | `multipart/form-data` with `file: File` (.pdf or .docx) |
| `POST` | `/api/chat` | Conversational Agent Core | `{"message": str, "history": list, "resume": dict}` |
| `GET` | `/api/applications` | List Submitted Applications | None |
| `POST` | `/api/applications/apply` | Direct Job Application | `{"job_identifier": str}` |

### External APIs & Data Sources

1. **Google Gemini API (REST Endpoint via `utils/gemini_client.py`)**:
   - Used for natural language reasoning, structured schema extraction, and conversational responses.
   - Fully resilient with automatic fallback parsing to ensure uninterrupted operation if an API key is unconfigured or rate-limited.
2. **Scraped Job Data Source (RemoteOK & Arbeitnow APIs via `scripts/scrape_jobs.py`)**:
   - Used during initial dataset compilation to source 1,947 real, structured tech listings with full job descriptions, experience tags, and application links.

---

## 4. Setup Steps

### Prerequisites
- **Python**: 3.10, 3.11, or 3.12
- **Node.js**: v18+ and npm
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/UTSAVSONI-94/JobBuddy.git
cd JobBuddy
```

---

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate       # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: The system includes standard-library heuristic extractors and works even without an external API key).*

5. Start the FastAPI backend server:
   ```bash
   python3 -m uvicorn main:app --reload --port 8000
   ```
   Backend will be running at: `http://localhost:8000`  
   Interactive API docs (Swagger): `http://localhost:8000/docs`

---

### Step 3: Frontend Setup

1. In a new terminal tab, navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at: `http://localhost:5173`

---

### Step 4: Verification
1. Open `http://localhost:5173` in your browser.
2. Upload any PDF or Word resume.
3. Watch the assistant parse candidate details and display tailored matching jobs.
4. Try natural refinements: *"show only remote roles"* or *"jobs needing React"*.
5. Apply with: *"apply to job 1"*.
6. Check application status: *"show my applied jobs"*.
