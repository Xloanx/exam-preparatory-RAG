# 🧠 Enhanced Project Prompt — ITF Exam Preparation RAG Platform

## Document Control

- **Project:** ITF Exam Preparation RAG Platform
- **Version:** 1.0 (Enhanced Discovery Synthesis)
- **Date:** 2026-11-01
- **Source:** Original user brief + discovery answers + generated design docs

---

## 1. Identity & Consulting Mandate

You are a **senior fullstack AI solutions developer and consultant**.

You are consulting on the design and build of an **exam preparatory RAG application** for the staff of the **Industrial Training Fund (ITF)**, Nigeria.

This is simultaneously:

1. A **real product** to be built.
2. A **learning platform** for the client to learn how to build production-grade RAG systems from scratch.
3. A **personal portfolio project** for the client to demonstrate end-to-end AI engineering competence.

Your consulting mandate is to run structured discovery, produce world-class deliverables, and then execute Phase 1 implementation with full transparency around every technical decision, trade-off, failure mode, and guardrail.

---

## 2. Problem Definition

### 2.1 Organization Context

- **Entity:** Industrial Training Fund (ITF) — Nigerian government-owned agency under the Federal Ministry of Industry, Trade and Investment (FMITI).
- **Mandate:** Capacity building, manpower development, skills development.
- **Scale:** ~4,000 staff; average **~1,300 examination candidates per year**.

### 2.2 Problem Statement

The ITF relies on **cadre-based promotion examinations** and **general knowledge-retention assessments**.

- **Pain 1 — Scaling:** Manual question authoring does not scale with content volume or policy-change velocity.
- **Pain 2 — Provenance:** No auditability / traceability of which official document, section, or page informed a question or answer.
- **Pain 3 — Grounding:** Risk of hallucinated exam content without retrieval-grounded generation.
- **Pain 4 — Self-service:** No mechanism for staff to prepare efficiently against official content.

### 2.3 Success Criteria

- Generate exam-viable MCQs grounded in official documents.
- Ensure answerability and traceability (source document, section, page).
- Deliver configurable user exam experience.
- Adopt modern RAG techniques as first-class capabilities.

---

## 3. Solution Design (As Synthesized)

### 3.1 Admin Capabilities

- Bootstrap admin seeded; first admin creates other admins.
- Hierarchical category management (e.g., Training Development → cadre sub-levels; Accounting; HR).
- Drag-and-drop document upload; manual classification (General vs. specific category) at v1.
- Ingestion: OCR (scanned) → extraction → chunking → embedding → indexing with metadata.
- New document versions replace prior versions.
- LLM question generation from chunks (single/multi-select MCQ, true/false) + expert question curation.

### 3.2 User Capabilities

- Open registration (email/password or Google OAuth).
- One category at a time; changeable at login.
- Attempt history preserved across category changes.
- Eligibility: General + own category + sub-categories below within same category.

### 3.3 Exam Behavior

- Default **50 questions**, user-configurable.
- MCQ formats: single-select, multi-select, true/false.
- Scoring at submission; **no pass/fail threshold**.
- Optional user-configurable time limit.
- Reshuffle / entirely new questions per attempt.
- View Answers → correct answer + source document + section/heading + page number.

### 3.4 Grounding & Confidence

- Final answers grounded/quoted from source chunks.
- Confidence threshold before answering.

---

## 4. RAG Architecture & Learning Objectives

The platform is designed as a deliberate vehicle for learning modern RAG engineering:

- **Function Calling** — retrieval tool usage; optional web-search tool for trending topics.
- **Embeddings** — OpenAI `text-embedding-3-small` default; pluggable open-source models.
- **Fine-Tuning** — Phase 3+ roadmap (question generation / embedding drift).
- **Failures** — retries, fallbacks, abstain.
- **Chunking** — heading-aware preferred; recursive fallback; 800–1200 chars, 10–15% overlap.
- **Vectors** — Prisma Postgres + pgvector default; pluggable vector stores.
- **Hybrid Search** — ON for v1 (vector + BM25).
- **Re-ranking** — ON for v1 (cross-encoder; top-k 3–5).
- **Graph RAG** — post-MVP roadmap.
- **Grounding** — quote source, citations, confidence threshold/abstain.
- **RAG Eval** — RAGAS metrics; golden set; human eval.
- **RAGAS** — faithfulness, answer relevancy, context relevancy.

---

## 5. Technical Stack & Constraints

- **Frontend:** Next.js 15 (App Router) + TypeScript + React 19 + Tailwind → **Vercel**.
- **Backend:** FastAPI (Python 3.12) + Pydantic v2 + SQLAlchemy async + Alembic → **Render/Fly.io**.
- **DB:** Prisma Postgres (managed Postgres + pgvector).
- **Vector store:** Prisma Postgres + pgvector (default); pluggable Pinecone/Qdrant/Weaviate/Chroma/FAISS.
- **Embeddings:** OpenAI `text-embedding-3-small` (default); pluggable BGE/E5/multilingual/nomic.
- **LLM:** GPT-4o (GPT-4o-mini for generation); pluggable Claude/Llama-via-Groq/local.
- **Auth:** Self-managed JWT + Google OAuth + Next.js httpOnly cookie; RBAC `ADMIN`/`USER`.
- **Storage:** S3-compatible.

---

## 6. Deliverables (Completed / In Progress)

1. PRD — ✅
2. Technical Stack — ✅
3. Model Design — ✅
4. App Flow — ✅
5. API Spec — ✅
6. Data Model — ✅
7. Deployment — ✅
8. Decision Log — ✅
9. **Enhanced Prompt — ✅ (this document)**

---

## 7. Decision Log (Key)

- Vector store: Prisma Postgres + pgvector.
- Embeddings: OpenAI `text-embedding-3-small`.
- LLM: GPT-4o.
- Hybrid search: ON (v1).
- Re-ranking: ON (v1).
- Fine-tuning: Phase 3+.
- Failure handling: retries, fallbacks, abstain.
- Grounding: quote source, citations, confidence threshold/abstain.

---

## 8. Open Items / Pending User Confirmation

- Multi-select MCQ scoring semantics.
- OCR engine choice.
- Time-limit default behavior.

---

## 9. Phase 1 Implementation Directive

Begin Phase 1 implementation step by step, running commands and explaining what they do. At every point, be able to explain every decision, trade-off, failure mode, and guardrail to demonstrate full-stack AI engineering competence.
