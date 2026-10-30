# JobBuddy — AI Job Chat Assistant

JobBuddy is an intelligent, agent-based career assistant built for the Hidani Tech SDE Intern assessment. It parses candidate resumes (PDF or DOCX), matches them against a real dataset of 1,947 job listings with personalized match explanations, refines listings via natural conversation, and allows one-click job applications with duplicate prevention.

---

## Features

- **Conversational Interface**: Dual-pane responsive chat experience built with React, Vite, and Tailwind CSS.
- **Agent Architecture**: Central Orchestrator Agent routing to dedicated tools:
  - `resume_parser.py`: Extracts structured details (Name, Contact, Designation, Skills, Experience, Education, Projects).
  - `job_matcher.py`: Scores candidate skills against job titles, requirements, and descriptions with match reasons.
  - `job_applier.py`: Submits job applications and records them in a JSON database without duplicates.
- **Dataset**: 1,947 real job listings across Remote, UK, US, and European tech hubs.
- **Natural Refinements**: Conversational filters such as "show only remote roles", "jobs needing React", or "jobs in London".
- **Application Tracking**: View application status and history with "show my applied jobs".

---

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios
- **Backend**: Python 3.11, FastAPI, Uvicorn, PyMuPDF, python-docx
- **Database**: File-based JSON database (`jobs.json`, `applications.json`)

---

## Project Structure

```
JobBuddy/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py
│   │   ├── resume_parser.py
│   │   ├── job_matcher.py
│   │   └── job_applier.py
│   ├── db/
│   │   ├── jobs.json
│   │   ├── applications.json
│   │   └── db_helpers.py
│   ├── routes/
│   │   ├── chat.py
│   │   ├── upload.py
│   │   └── applications.py
│   ├── utils/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
