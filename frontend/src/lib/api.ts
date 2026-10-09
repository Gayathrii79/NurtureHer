const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export type UserRole = "mother" | "caregiver" | "asha_worker" | "doctor" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
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
export type PCOSModelSource = "random_forest_pickle" | "random_forest_json" | "rule_fallback";
export type PCOSPrediction = {
  id: string;
  risk_level: string;
  probability: number;
  recommendations: string;
  created_at: string;
  model_source?: PCOSModelSource | null;
};
export type PCOSModelInfo = {
  model_source: PCOSModelSource;
  uses_random_forest: boolean;
  metrics: Record<string, number> | null;
  dataset: string | null;
  dataset_citation: string | null;
  trained_at: string | null;
  samples: number | null;
};
export type PPDAssessment = {
  id: string;
  epds_score: number;
  sentiment: string;
  sentiment_score?: number;
  combined_risk_score?: number;
  risk_level: string;
  recommendations?: string | null;
  created_at: string;
};
export type ChatMessage = { id: string; message: string; response: string; language: string; created_at: string };
export type CaregiverContent = { id: string; title: string; description: string; video_url: string | null; category: string; created_at: string };
export type HighRiskCase = {
  id: string;
  user_id: string;
  risk_type: string;
  risk_level: string;
  assigned_worker_id: string | null;
  status: string;
  created_at: string;
  mother_name?: string | null;
  mother_phone?: string | null;
  district?: string | null;
  village?: string | null;
};
export type Alert = { id: string; user_id: string; message: string; sent_status: string; sent_at: string | null };
export type DashboardStats = { today_mood: Mood | null; symptoms: Symptom | null; cycle_prediction: string | null; pcos_risk: string | null; ppd_status: string | null };
export type WellnessInsight = { category: string; severity: string; message: string };

export type Profile = {
  id: string;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string;
  preferred_language?: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  blood_group: string | null;
  pregnancy_status: string | null;
  delivery_date: string | null;
  emergency_contact: string | null;
  district: string | null;
  village: string | null;
  created_at?: string;
};

export type ReportItem = {
  id: string;
  type: string;
  title: string;
  date: string;
  iso_date: string;
  risk_level: string;
  score: string;
  recommendations?: string;
  sentiment?: string;
  status: string;
};

export type WellnessAnalytics = {
  mood_trends: Record<string, number>;
  symptom_trends: Record<string, number>;
  cycle_insights: {
    last_period_date: string | null;
    next_period_prediction: string | null;
    cycle_length: number | null;
    cycle_entries: number;
    average_cycle_length: number | null;
    regularity_range_days: number | null;
    regularity: string | null;
  };
  pcos_history: Record<string, number>;
  pcos_latest: { risk_level: string | null; probability: number | null; recommendations: string | null };
  ppd_history: Record<string, number>;
  ppd_latest: { risk_level: string | null; epds_score: number | null; sentiment: string | null };
};

export type EmergencySosResponse = {
  alerts: { recipient: string; alerted: boolean; sent_status: string }[];
  emergency_numbers: string[];
  message: string;
};

export type NutritionPlanItem = {
  category: string;
  phase: string;
  meal_type: string;
  title: string;
  description: string;
  local_foods: string;
  key_nutrients: string;
  is_affordable_local: boolean;
};

export type HealthMythItem = {
  id: string;
  category: string;
  myth: string;
  fact: string;
  verification_source: string;
};

export type CareCircleRequestItem = {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  relationship_label: string;
  status: string;
  share_emergency: boolean;
  share_risk_category: boolean;
  share_wellness_summary: boolean;
  requested_at: string;
  responded_at: string | null;
  revoked_at: string | null;
};

export type DoctorPatientItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_language: string;
  age: number | null;
  pregnancy_status: string | null;
  delivery_date: string | null;
  blood_group: string | null;
  emergency_contact: string | null;
  latest_pcos_risk: string;
  latest_ppd_risk: string;
  created_at: string | null;
};

export type DoctorVisitSummary = {
  generated_at: string;
  patient_name: string;
  age: number | null;
  pregnancy_stage: string;
  emergency_contact: string;
  summary: {
    pcos_screening: { risk_level: string; probability: number | null; notes: string };
    ppd_screening: { risk_level: string; epds_score: number | null; sentiment: string | null };
    symptom_frequency_last_7_days: Record<string, number>;
    recent_mood_trend: string[];
    cycle_status: { last_period_date: string; cycle_length: number | null; next_predicted_date: string | null };
  };
  questions_to_ask_doctor: string[];
  suggested_records_to_bring: string[];
  disclaimer: string;
};

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

  // Wellness & Health Profile
  dashboard: () => request<DashboardStats>("/wellness/dashboard"),
  analytics: () => request<WellnessAnalytics>("/wellness/analytics"),
  insights: () => request<{ insights: WellnessInsight[] }>("/wellness/insights"),
  profile: () => request<Profile>("/wellness/profile"),
  updateProfile: (payload: Partial<Profile>) => request<Profile>("/wellness/profile", { method: "PUT", body: JSON.stringify(payload) }),
  doctorVisitSummary: () => request<DoctorVisitSummary>("/wellness/doctor-visit-summary", { method: "POST" }),
  reports: () => request<{ count: number; reports: ReportItem[]; disclaimer: string }>("/wellness/reports"),
  emergencySos: () => request<EmergencySosResponse>("/wellness/emergency-sos", { method: "POST" }),

  // Moods & Symptoms & Journal
  moods: () => request<Mood[]>("/wellness/mood"),
  createMood: (mood: Mood["mood"], note: string | null) => request<Mood>("/wellness/mood", { method: "POST", body: JSON.stringify({ mood, note }) }),
  symptoms: () => request<Symptom[]>("/wellness/symptoms"),
  createSymptoms: (payload: Omit<Symptom, "id" | "created_at">) => request<Symptom>("/wellness/symptoms", { method: "POST", body: JSON.stringify(payload) }),
  journals: () => request<Journal[]>("/wellness/journal"),
  createJournal: (title: string, content: string) => request<Journal>("/wellness/journal", { method: "POST", body: JSON.stringify({ title, content }) }),

  // Cycles
  cycles: () => request<Cycle[]>("/cycle"),
  cyclePrediction: () => request<CyclePrediction | null>("/cycle/prediction"),
  createCycle: (last_period_date: string, cycle_length: number) => request<Cycle>("/cycle", { method: "POST", body: JSON.stringify({ last_period_date, cycle_length }) }),

  // Screenings
  pcosModelInfo: () => request<PCOSModelInfo>("/pcos/model-info"),
  pcosHistory: () => request<PCOSPrediction[]>("/pcos/history"),
  predictPCOS: (payload: Record<string, unknown>) => request<PCOSPrediction>("/pcos/predict", { method: "POST", body: JSON.stringify(payload) }),
  ppdHistory: () => request<PPDAssessment[]>("/ppd/history"),
  assessPPD: (answers: number[], journal_text: string | null) => request<PPDAssessment>("/ppd/assessment", { method: "POST", body: JSON.stringify({ answers, journal_text }) }),

  // Chat & AI Coach
  chatHistory: () => request<ChatMessage[]>("/chat/history"),
  sendChat: (message: string, language: string) => request<ChatMessage>("/chat/message", { method: "POST", body: JSON.stringify({ message, language }) }),

  // Nutrition Guide & Hydration & Myths
  nutritionPlans: (category?: string) => request<{ count: number; plans: NutritionPlanItem[]; disclaimer: string }>(category ? `/nutrition/plans?category=${encodeURIComponent(category)}` : "/nutrition/plans"),
  hydration: () => request<{ cups: number; target_cups: number; percent: number; date: string }>("/nutrition/hydration"),
  updateHydration: (cups: number, target_cups = 8) => request<{ cups: number; target_cups: number; percent: number }>("/nutrition/hydration", { method: "POST", body: JSON.stringify({ cups, target_cups }) }),
  healthMyths: () => request<HealthMythItem[]>("/nutrition/myths"),

  // Caregiver Companion
  caregiver: (category: "videos" | "tips" | "articles") => request<CaregiverContent[]>(`/caregiver/${category}`),

  // CareCircle QR TrustVault
  getCareCircleQR: () => request<{ token: string; qr_payload: string; expires_at: string }>("/carecircle/qr"),
  generateCareCircleQR: () => request<{ token: string; qr_payload: string; expires_at: string; message: string }>("/carecircle/qr/generate", { method: "POST" }),
  requestCareCircleAccess: (token: string, relationship_label = "Caregiver") => request<{ id: string; status: string; message: string }>("/carecircle/request-access", { method: "POST", body: JSON.stringify({ token, relationship_label }) }),
  careCircleRequests: () => request<CareCircleRequestItem[]>("/carecircle/requests"),
  respondCareCircleRequest: (requestId: string, action: "approve" | "reject", scopes?: { share_emergency?: boolean; share_risk_category?: boolean; share_wellness_summary?: boolean }) => request<{ id: string; status: string; message: string }>(`/carecircle/requests/${requestId}/respond`, { method: "POST", body: JSON.stringify({ action, ...(scopes || {}) }) }),
  revokeCareCircleAccess: (requestId: string) => request<{ id: string; status: string; message: string }>(`/carecircle/requests/${requestId}/revoke`, { method: "POST" }),
  careCircleConnections: () => request<{ access_id: string; mother_id: string; mother_name: string; relationship_label: string; permissions: Record<string, boolean> }[]>("/carecircle/connections"),
  careCircleSharedSummary: (accessId: string) => request<Record<string, unknown>>(`/carecircle/shared-summary/${accessId}`),

  // Doctor Portal
  doctorPatients: () => request<DoctorPatientItem[]>("/doctor/patients"),
  doctorPatientTimeline: (patientId: string) => request<Record<string, unknown>>(`/doctor/patients/${patientId}/timeline`),
  doctorAddNote: (patientId: string, payload: { clinical_observations: string; follow_up_recommendation?: string; prescribed_advice?: string }) => request<Record<string, unknown>>(`/doctor/patients/${patientId}/notes`, { method: "POST", body: JSON.stringify(payload) }),

  // ASHA Worker
  ashaCases: (query = "") => request<HighRiskCase[]>(`/asha/high-risk${query}`),
  ashaStatistics: () => request<Record<string, unknown>>("/asha/statistics"),
  ashaAlerts: () => request<Alert[]>("/asha/alerts"),
  ashaUpdateCase: (caseId: string, payload: { status?: string; assigned_worker_id?: string | null }) =>
    request<HighRiskCase>(`/asha/high-risk/${caseId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  ashaSendAlert: (userId: string, message: string) =>
    request<Alert>("/asha/send-alert", { method: "POST", body: JSON.stringify({ user_id: userId, message }) }),

  // Admin
  adminUsers: () => request<User[]>("/admin/users"),
  adminAuditLogs: () => request<Record<string, unknown>[]>("/admin/audit-logs"),
  adminDashboard: () => request<Record<string, unknown>>("/admin/dashboard"),

  // Notifications
  notifications: () => request<Alert[]>("/notifications"),

  // Account settings
  updateMe: (payload: { name?: string; phone?: string; preferred_language?: string }) =>
    request<User>("/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),
};

/** Download the server-generated PDF health report as a real file (no fake success message). */
export async function downloadHealthReportPdf(): Promise<string> {
  const response = await fetch(`${API_BASE}/wellness/report/pdf`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(detail.detail ?? "Report generation failed");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const filename = match?.[1] ?? "nurtureher-health-report.pdf";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}

export async function uploadVoice(file: File, language: string) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/chat/voice?language=${encodeURIComponent(language)}`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: form,
  });
  if (!response.ok) throw new Error("Voice message failed");
  return response.json() as Promise<ChatMessage>;
}
