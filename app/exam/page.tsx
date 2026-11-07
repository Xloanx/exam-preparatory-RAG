"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  api,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  type AnswerDetail,
  type AnswerItem,
  type AnswerSubmitResponse,
  type ExamAnswersResponse,
  type ExamPreferences,
  type ExamQuestion,
  type ExamSession,
  type Category,
} from "../../lib/api";

export default function ExamPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [scopes, setScopes] = useState("GENERAL");
  const [questionCount, setQuestionCount] = useState("50");
  const [timeLimit, setTimeLimit] = useState("30");
  const [reshuffle, setReshuffle] = useState(false);

  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitResult, setSubmitResult] = useState<AnswerSubmitResponse | null>(null);
  const [answersDetail, setAnswersDetail] = useState<ExamAnswersResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const loadUserContext = async () => {
    try {
      const me = await api.users.me();
      const myCatId = me.user.current_category_id;
      setSelectedCategoryId(myCatId != null ? String(myCatId) : "");
      const cats = await api.categories.listForUser();
      setCategories(cats.categories);
    } catch {
      // User context is best-effort; exam start will surface real errors.
    }
  };

  useEffect(() => {
    const existing = getAccessToken();
    if (existing) {
      setToken(existing);
      void loadUserContext();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.auth.login({ email, password });
      setAccessToken(res.access_token);
      setToken(res.access_token);
      setEmail("");
      setPassword("");
      await loadUserContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    setToken(null);
    setSession(null);
    setAnswers({});
    setSubmitResult(null);
    setAnswersDetail(null);
  };

  const startExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const resolvedScopes = selectedCategoryId
        ? [`CAT_${selectedCategoryId}`]
        : scopes.trim()
          ? scopes.split(",").map((s) => s.trim()).filter(Boolean)
          : ["GENERAL"];
      const res = await api.exams.start({
        scopes: resolvedScopes,
        question_count: Math.max(1, Math.min(200, Number(questionCount) || 50)),
        time_limit_minutes: timeLimit ? Number(timeLimit) : null,
        reshuffle,
      });
      setSession(res);
      setAnswers({});
      setSubmitResult(null);
      setAnswersDetail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start exam");
    } finally {
      setBusy(false);
    }
  };

  const selectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitExam = async () => {
    if (!token || !session) return;
    const items: AnswerItem[] = Object.entries(answers)
      .map(([qid, idx]) => ({ question_id: Number(qid), selected_option_index: Number(idx) }))
      .filter((a) => Number.isInteger(a.question_id));
    setBusy(true);
    setError(null);
    try {
      const res = await api.exams.submit(session.attempt_id, items);
      setSubmitResult(res);
      setNotice(`Submitted: ${res.correct}/${res.total} correct`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answers");
    } finally {
      setBusy(false);
    }
  };

  const viewAnswers = async () => {
    if (!token || !session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.exams.answers(session.attempt_id);
      setAnswersDetail(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load answers");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <h1 className="text-3xl font-bold text-white">ITF Exam Prep RAG — Exam</h1>
        <p className="mt-4 text-slate-400">Sign in to start an exam</p>
        <form onSubmit={handleLogin} className="mt-6 max-w-md rounded-lg border border-slate-700 bg-slate-900 p-4">
          <div className="space-y-3">
            <label className="block text-sm text-slate-300">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
              />
            </label>
          </div>
          {error && <p className="mt-3 text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4">
          <Link href="/" className="text-slate-400 underline">
            ← Back to home
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">ITF Exam Prep RAG — Exam</h1>
        <button
          onClick={handleLogout}
          className="rounded bg-slate-800 px-4 py-2 text-sm text-slate-200"
        >
          Sign out
        </button>
      </div>

      {error && <p className="mt-4 text-red-400">{error}</p>}
      {notice && <p className="mt-4 text-emerald-400">{notice}</p>}

      {!session ? (
        <section className="mt-8 max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-xl font-semibold text-white">Start exam</h2>
          <form onSubmit={startExam} className="mt-4 space-y-3">
            <label className="block text-sm text-slate-300">
              Scopes (comma separated; e.g. GENERAL or CAT_1)
              <input
                type="text"
                required
                value={scopes}
                onChange={(e) => setScopes(e.target.value)}
                className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Category (your eligible scope)
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedCategoryId(v);
                  if (v) {
                    api.users.changeCategory(Number(v)).catch(() => {
                      setError("Failed to update category");
                    });
                  }
                }}
                className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
              >
                <option value="">— General only —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Question count (1–200; default 50)
              <input
                type="number"
                min={1}
                max={200}
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Time limit minutes (optional)
              <input
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={reshuffle}
                onChange={(e) => setReshuffle(e.target.checked)}
              />
              Reshuffle questions
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Starting..." : "Start exam"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="mt-8 max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-xl font-semibold text-white">Questions</h2>
            {session.questions.length === 0 && (
              <p className="mt-2 text-slate-400">No questions available for the selected scope.</p>
            )}
            <div className="mt-4 space-y-6">
              {session.questions.map((q: ExamQuestion) => (
                <div key={q.id} className="rounded bg-slate-800 p-3">
                  <p className="text-sm font-medium text-white">{q.stem}</p>
                  <div className="mt-2 space-y-2">
                    {q.options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-slate-200">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={answers[q.id] === i}
                          onChange={() => selectOption(q.id, i)}
                        />
                        {String.fromCharCode(65 + i)}. {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={submitExam}
                disabled={busy || Object.keys(answers).length === 0}
                className="rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Submitting..." : "Submit answers"}
              </button>
              {submitResult && (
                <span className="self-center text-sm text-slate-300">
                  Score: {submitResult.score}% ({submitResult.correct}/{submitResult.total} correct)
                </span>
              )}
              {submitResult && (
                <button
                  onClick={viewAnswers}
                  disabled={busy}
                  className="rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  View answers
                </button>
              )}
            </div>
          </section>

          {answersDetail && (
            <section className="mt-8 max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4">
              <h2 className="text-xl font-semibold text-white">Answer review</h2>
              <div className="mt-4 space-y-4">
                {answersDetail.answers.map((a: AnswerDetail, idx: number) => {
                  const q = session.questions.find((x) => x.id === a.question_id) as ExamQuestion | undefined;
                  return (
                    <div key={idx} className="rounded bg-slate-800 p-3">
                      <p className="text-sm font-medium text-white">{q ? q.stem : `Question #${a.question_id}`}</p>
                      <p className="mt-2 text-sm text-slate-200">
                        Your answer: {a.selected_option ?? "—"} —{" "}
                        {a.correct ? "Correct" : "Incorrect"}
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        Correct answer: {a.correct_answer}
                      </p>
                      {a.explanation && (
                        <p className="mt-1 text-sm text-slate-300">Explanation: {a.explanation}</p>
                      )}
                      <p className="mt-1 text-sm text-slate-300">
                        Source: {a.source_doc ?? "—"} {a.section ? `(section: ${a.section})` : ""}{" "}
                        {a.page != null ? `(page: ${a.page})` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <p className="mt-8">
        <Link href="/" className="text-slate-400 underline">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
