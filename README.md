# ITF Exam Prep RAG

Exam preparatory RAG platform for Industrial Training Fund (ITF), Nigeria staff.

## Phase 1 Status

- Backend: FastAPI + Next.js scaffold complete, health checks passing.
- Frontend: Next.js App Router scaffold complete.

## Getting Started

### Backend

```bash
cd exam-prep-rag-backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
npm install
npm run dev
```
