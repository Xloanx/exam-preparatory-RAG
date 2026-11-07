const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEY = "itf_exam_prep_access_token";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(`API ${status}: ${message}`);
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...rest } = options ?? {};
  const finalHeaders: Record<string, string> = {
    ...((headers as Record<string, string>) ?? {}),
  };
  const isFormData = rest.body instanceof FormData;
  if (!isFormData && finalHeaders["Content-Type"] === undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });
  const text = await res.text();
  if (res.status === 401) {
    clearAccessToken();
    throw new ApiError(401, text || "Unauthorized");
  }
  if (!res.ok) {
    throw new ApiError(res.status, text || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export interface AuthUser {
  email: string;
  full_name?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  description: string | null;
}

export interface MeUser {
  id: number;
  email: string;
  full_name: string | null;
  current_category_id: number | null;
  roles: string;
  current_category: Category | null;
}

export type UsersMeResponse = { user: MeUser };

export interface ExamQuestion {
  id: number;
  source: string;
  document_id: number | null;
  chunk_id: number | null;
  category_id: number | null;
  stem: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  source_doc: string | null;
  section: string | null;
  page: number | null;
}

export interface ExamPreferences {
  scopes: string[];
  question_count: number;
  time_limit_minutes: number | null;
  reshuffle: boolean;
}

export interface ExamSession {
  attempt_id: number;
  exam_config: ExamPreferences;
  questions: ExamQuestion[];
}

export interface AnswerItem {
  question_id: number;
  selected_option_index: number;
}

export interface AnswerSubmitResponse {
  attempt_id: number;
  score: number;
  correct: number;
  total: number;
}

export interface AnswerDetail extends AnswerItem {
  selected_option: string | null;
  correct: boolean;
  correct_answer: string;
  explanation: string | null;
  source_doc: string | null;
  section: string | null;
  page: number | null;
}

export interface ExamAnswersResponse {
  attempt_id: number;
  score: number | null;
  answers: AnswerDetail[];
}

export interface ExpertQuestion {
  id: number;
  source: string;
  document_id: number | null;
  chunk_id: number | null;
  category_id: number | null;
  stem: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

export interface GeneratedQuestionsResponse {
  questions: ExpertQuestion[];
}

export interface DocumentOut {
  id: number;
  filename: string;
  s3_key: string | null;
  classification: string;
  category_id: number | null;
  status: string;
}

export const api = {
  health: (): Promise<{ status: string }> =>
    apiFetch<{ status: string }>("/health"),

  auth: {
    register: (input: {
      email: string;
      password: string;
      full_name?: string | null;
    }): Promise<AuthResponse> =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    login: (input: { email: string; password: string }): Promise<AuthResponse> =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    me: (): Promise<{ user: AuthUser }> => apiFetch<{ user: AuthUser }>("/auth/me"),
  },

  users: {
    me: (): Promise<UsersMeResponse> => apiFetch<UsersMeResponse>("/users/me"),
    changeCategory: (categoryId: number): Promise<UsersMeResponse> =>
      apiFetch<UsersMeResponse>("/users/me/category", {
        method: "PUT",
        body: JSON.stringify({ category_id: categoryId }),
      }),
  },

  categories: {
    list: (): Promise<{ categories: Category[] }> =>
      apiFetch<{ categories: Category[] }>("/admin/categories"),
    listForUser: (): Promise<{ categories: Category[] }> =>
      apiFetch<{ categories: Category[] }>("/categories"),
    create: (input: {
      name: string;
      parent_id?: number | null;
      description?: string | null;
    }): Promise<{ category: Category; id: number }> =>
      apiFetch<{ category: Category; id: number }>("/admin/categories", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (
      categoryId: number,
      input: { name?: string; description?: string | null }
    ): Promise<{ category: Category }> =>
      apiFetch<{ category: Category }>(`/admin/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (categoryId: number): Promise<void> =>
      apiFetch<void>(`/admin/categories/${categoryId}`, { method: "DELETE" }),
  },

  documents: {
    upload: async (file: File, categoryId?: number | null): Promise<DocumentOut> => {
      const formData = new FormData();
      formData.append("file", file);
      if (categoryId != null) {
        formData.append("category_id", String(categoryId));
      }
      return apiFetch<DocumentOut>("/admin/documents/upload", {
        method: "POST",
        body: formData,
      });
    },
    classify: (
      documentId: number,
      classification: "GENERAL" | "CATEGORY",
      categoryId?: number | null
    ): Promise<DocumentOut> =>
      apiFetch<DocumentOut>(`/admin/documents/${documentId}/classify`, {
        method: "POST",
        body: JSON.stringify({ classification, category_id: categoryId ?? null }),
      }),
    ingest: (documentId: number): Promise<DocumentOut> =>
      apiFetch<DocumentOut>(`/admin/documents/${documentId}/ingest`, {
        method: "POST",
      }),
  },

  questions: {
    add: (input: {
      stem: string;
      options: string[];
      correct_answer: string;
      explanation?: string | null;
      category_id?: number | null;
      document_id?: number | null;
    }): Promise<ExpertQuestion> =>
      apiFetch<ExpertQuestion>("/admin/questions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    generate: (input: {
      document_ids?: number[];
      category_id?: number | null;
    }): Promise<GeneratedQuestionsResponse> =>
      apiFetch<GeneratedQuestionsResponse>("/admin/questions/generate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  exams: {
    start: (preferences: ExamPreferences): Promise<ExamSession> =>
      apiFetch<ExamSession>("/exams/sessions", {
        method: "POST",
        body: JSON.stringify(preferences),
      }),
    get: (sessionId: number): Promise<ExamSession> =>
      apiFetch<ExamSession>(`/exams/sessions/${sessionId}`),
    submit: (
      sessionId: number,
      answers: AnswerItem[]
    ): Promise<AnswerSubmitResponse> =>
      apiFetch<AnswerSubmitResponse>(`/exams/sessions/${sessionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    answers: (sessionId: number): Promise<ExamAnswersResponse> =>
      apiFetch<ExamAnswersResponse>(`/exams/sessions/${sessionId}/answers`),
  },

  eval: {
    run: (): Promise<{ status: string; message: string; attempts_sampled: number }> =>
      apiFetch("/eval/run", { method: "POST" }),
  },
};

export default api;
