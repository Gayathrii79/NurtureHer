const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "mother" | "caregiver" | "asha_worker" | "admin";
  preferred_language: string;
  is_verified: boolean;
  is_active: boolean;
};

export type TokenPair = { access_token: string; refresh_token: string; token_type: string };
export type Mood = { id: string; mood: "happy" | "sad" | "anxious" | "tired" | "angry"; note: string | null; created_at: string };
export type Symptom = { id: string; fatigue: boolean; headache: boolean; sleep_issue: boolean; anxiety: boolean; cramps: boolean; created_at: string };
export type Journal = { id: string; title: string; content: string; created_at: string };
export type Cycle = { id: string; last_period_date: string; cycle_length: number; next_period_prediction: string; created_at: string };
export type CyclePrediction = Cycle & { ovulation_prediction: string; fertility_window_start: string; fertility_window_end: string };
export type PCOSPrediction = { id: string; risk_level: string; probability: number; recommendations: string; created_at: string };
export type PPDAssessment = { id: string; epds_score: number; sentiment: string; risk_level: string; created_at: string };
export type ChatMessage = { id: string; message: string; response: string; language: string; created_at: string };
export type CaregiverContent = { id: string; title: string; description: string; video_url: string | null; category: string; created_at: string };
export type HighRiskCase = { id: string; user_id: string; risk_type: string; risk_level: string; assigned_worker_id: string | null; status: string; created_at: string };
export type Alert = { id: string; user_id: string; message: string; sent_status: string; sent_at: string | null };
export type DashboardStats = { today_mood: Mood | null; symptoms: Symptom | null; cycle_prediction: string | null; pcos_risk: string | null; ppd_status: string | null };
export type WellnessInsight = { category: string; severity: string; message: string };
export type Profile = { id: string; age: number | null; weight: number | null; height: number | null; blood_group: string | null; pregnancy_status: string | null; delivery_date: string | null; emergency_contact: string | null; district: string | null; village: string | null; created_at: string };

let accessToken = sessionStorage.getItem("nurtureher_access_token");
let refreshToken = sessionStorage.getItem("nurtureher_refresh_token");

export function setTokens(tokens: TokenPair | null) {
  accessToken = tokens?.access_token ?? null;
  refreshToken = tokens?.refresh_token ?? null;
  if (tokens) {
    sessionStorage.setItem("nurtureher_access_token", tokens.access_token);
    sessionStorage.setItem("nurtureher_refresh_token", tokens.refresh_token);
  } else {
    sessionStorage.removeItem("nurtureher_access_token");
    sessionStorage.removeItem("nurtureher_refresh_token");
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401 && retry && refreshToken) {
    try {
      const tokens = await request<TokenPair>("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }, false);
      setTokens(tokens);
      return request<T>(path, init, false);
    } catch {
      setTokens(null);
    }
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(detail.detail ?? "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) => request<TokenPair>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload: { email: string; name: string; password: string; phone?: string; role?: string; preferred_language?: string }) => request<User>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<User>("/auth/me"),
  logout: () => request<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }),
  dashboard: () => request<DashboardStats>("/wellness/dashboard"),
  analytics: () => request<Record<string, unknown>>("/wellness/analytics"),
  insights: () => request<{ insights: WellnessInsight[] }>("/wellness/insights"),
  moods: () => request<Mood[]>("/wellness/mood"),
  createMood: (mood: Mood["mood"], note: string | null) => request<Mood>("/wellness/mood", { method: "POST", body: JSON.stringify({ mood, note }) }),
  symptoms: () => request<Symptom[]>("/wellness/symptoms"),
  createSymptoms: (payload: Omit<Symptom, "id" | "created_at">) => request<Symptom>("/wellness/symptoms", { method: "POST", body: JSON.stringify(payload) }),
  journals: () => request<Journal[]>("/wellness/journal"),
  createJournal: (title: string, content: string) => request<Journal>("/wellness/journal", { method: "POST", body: JSON.stringify({ title, content }) }),
  cycles: () => request<Cycle[]>("/cycle"),
  cyclePrediction: () => request<CyclePrediction | null>("/cycle/prediction"),
  createCycle: (last_period_date: string, cycle_length: number) => request<Cycle>("/cycle", { method: "POST", body: JSON.stringify({ last_period_date, cycle_length }) }),
  pcosHistory: () => request<PCOSPrediction[]>("/pcos/history"),
  predictPCOS: (payload: Record<string, unknown>) => request<PCOSPrediction>("/pcos/predict", { method: "POST", body: JSON.stringify(payload) }),
  ppdHistory: () => request<PPDAssessment[]>("/ppd/history"),
  assessPPD: (answers: number[], journal_text: string | null) => request<PPDAssessment>("/ppd/assessment", { method: "POST", body: JSON.stringify({ answers, journal_text }) }),
  chatHistory: () => request<ChatMessage[]>("/chat/history"),
  sendChat: (message: string, language: string) => request<ChatMessage>("/chat/message", { method: "POST", body: JSON.stringify({ message, language }) }),
  caregiver: (category: "videos" | "tips" | "articles") => request<CaregiverContent[]>(`/caregiver/${category}`),
  ashaCases: (query = "") => request<HighRiskCase[]>(`/asha/high-risk${query}`),
  ashaStatistics: () => request<Record<string, unknown>>("/asha/statistics"),
  ashaAlerts: () => request<Alert[]>("/asha/alerts"),
  notifications: () => request<Alert[]>("/notifications"),
};

export async function uploadVoice(file: File, language: string) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/chat/voice?language=${encodeURIComponent(language)}`, { method: "POST", headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined, body: form });
  if (!response.ok) throw new Error("Voice message failed");
  return response.json() as Promise<ChatMessage>;
}
