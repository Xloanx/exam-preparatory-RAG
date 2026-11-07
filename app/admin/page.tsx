"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  api,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  type Category,
} from "../../lib/api";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [classification, setClassification] = useState<"GENERAL" | "CATEGORY">("CATEGORY");
  const [categoryId, setCategoryId] = useState("");
  const [docId, setDocId] = useState<number | null>(null);
  const [docStatus, setDocStatus] = useState<string | null>(null);
  const [stem, setStem] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [questionCategoryId, setQuestionCategoryId] = useState("");
  const [generateCategoryId, setGenerateCategoryId] = useState("");

  const loadCategories = async () => {
    try {
      const res = await api.categories.list();
      setCategories(res.categories);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    }
  };

  useEffect(() => {
    const existing = getAccessToken();
    if (existing) {
      setToken(existing);
      void loadCategories();
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
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.categories.create({
        name: name.trim(),
        parent_id: parentId ? Number(parentId) : null,
        description: description.trim() || null,
      });
      setNotice("Category created");
      setName("");
      setParentId("");
      setDescription("");
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    setToken(null);
    setCategories([]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const doc = await api.documents.upload(file, categoryId ? Number(categoryId) : null);
      setDocId(doc.id);
      setDocStatus(doc.status);
      setNotice(`Document uploaded: ${doc.filename}`);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleClassify = async () => {
    if (!token || docId == null) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await api.documents.classify(docId, classification, categoryId ? Number(categoryId) : null);
      setDocId(doc.id);
      setDocStatus(doc.status);
      setNotice(`Document classified as ${doc.classification}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classify failed");
    } finally {
      setBusy(false);
    }
  };

  const handleIngest = async () => {
    if (!token || docId == null) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await api.documents.ingest(docId);
      setDocId(doc.id);
      setDocStatus(doc.status);
      setNotice(`Document ingested: ${doc.filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const options = optionsText.split("\n").map((o) => o.trim()).filter(Boolean);
    if (!stem.trim() || options.length < 2 || !correctAnswer) {
      setError("Provide a stem, at least two options, and a correct answer.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const q = await api.questions.add({
        stem: stem.trim(),
        options,
        correct_answer: correctAnswer,
        explanation: explanation.trim() || null,
        category_id: questionCategoryId ? Number(questionCategoryId) : null,
      });
      setNotice(`Question added (#${q.id})`);
      setStem("");
      setOptionsText("");
      setCorrectAnswer("");
      setExplanation("");
      setQuestionCategoryId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add question");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate = async () => {
    if (!token) return;
    const categoryIdNum = generateCategoryId ? Number(generateCategoryId) : null;
    if (!categoryIdNum) {
      setError("Select a category to generate questions for.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.questions.generate({ category_id: categoryIdNum });
      setNotice(`Generated ${res.questions.length} question(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Question generation failed");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <h1 className="text-3xl font-bold text-white">ITF Exam Prep RAG — Admin</h1>
        <p className="mt-4 text-slate-400">Admin sign in</p>
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
        <h1 className="text-3xl font-bold text-white">ITF Exam Prep RAG — Admin</h1>
        <button
          onClick={handleLogout}
          className="rounded bg-slate-800 px-4 py-2 text-sm text-slate-200"
        >
          Sign out
        </button>
      </div>

      {error && <p className="mt-4 text-red-400">{error}</p>}
      {notice && <p className="mt-4 text-emerald-400">{notice}</p>}

      <section className="mt-8 max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-xl font-semibold text-white">Create category</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <label className="block text-sm text-slate-300">
            Name
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Parent category (optional)
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            >
              <option value="">— None (top level) —</option>
              {categories
                .filter((c) => c.parent_id === null)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Description (optional)
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create category"}
          </button>
        </form>
      </section>

      <section className="mt-8 max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-xl font-semibold text-white">Categories</h2>
        {categories.length === 0 ? (
          <p className="mt-2 text-slate-400">No categories yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="rounded bg-slate-800 p-2 text-sm text-slate-200">
                <span className="font-semibold">{c.name}</span>
                {c.parent_id != null && <span className="text-slate-400"> (child)</span>}
                {c.description && <span className="ml-2 text-slate-400">{c.description}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-xl font-semibold text-white">Documents</h2>
        <form onSubmit={handleUpload} className="mt-4 space-y-3">
          <label className="block text-sm text-slate-300">
            File
            <input
              type="file"
              required
              accept=".txt,.md,.pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Classification
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as "GENERAL" | "CATEGORY")}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            >
              <option value="GENERAL">GENERAL</option>
              <option value="CATEGORY">CATEGORY</option>
            </select>
          </label>
          {classification === "CATEGORY" && (
            <label className="block text-sm text-slate-300">
              Category
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
              >
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="submit"
            disabled={busy || !file}
            className="rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Working..." : "Upload document"}
          </button>
        </form>

        {docId != null && (
          <div className="mt-4 rounded bg-slate-800 p-3">
            <p className="text-sm text-slate-200">
              Last document: #{docId} — status: {docStatus}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleClassify}
                disabled={busy}
                className="rounded bg-slate-700 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                Classify
              </button>
              <button
                onClick={handleIngest}
                disabled={busy}
                className="rounded bg-slate-700 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                Ingest
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-xl font-semibold text-white">Add expert question</h2>
        <form onSubmit={handleAddQuestion} className="mt-4 space-y-3">
          <label className="block text-sm text-slate-300">
            Stem
            <input
              type="text"
              required
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Options (one per line)
            <textarea
              required
              rows={4}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Correct answer
            <input
              type="text"
              required
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Explanation (optional)
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Category (optional)
            <select
              value={questionCategoryId}
              onChange={(e) => setQuestionCategoryId(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Adding..." : "Add question"}
          </button>
        </form>
      </section>

      <section className="mt-8 max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-xl font-semibold text-white">Generate questions (OpenAI)</h2>
        <div className="mt-4">
          <label className="block text-sm text-slate-300">
            Category
            <select
              value={generateCategoryId}
              onChange={(e) => setGenerateCategoryId(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 p-2 text-white"
            >
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="mt-3 rounded bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Generating..." : "Generate questions"}
          </button>
        </div>
      </section>

      <p className="mt-8">
        <Link href="/" className="text-slate-400 underline">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
