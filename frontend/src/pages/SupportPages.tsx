import { Activity, Bell, CheckCircle2, FileText, Lightbulb, Lock, Settings as SettingsIcon, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, Alert, CaregiverContent, ChatMessage, HighRiskCase, WellnessInsight } from "@/lib/api";
import { IconNote, StatTile } from "@/components/common/InfoBlocks";
import { EmptyState, LoadingSkeleton } from "@/components/common/States";
import { Page } from "@/components/common/Page";
import { DataTable, MetricCard, SectionHeader, Timeline } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/useAuth";

export function InsightsPage() {
  const [items, setItems] = useState<WellnessInsight[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.insights()
      .then((response) => setItems(response.insights))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Unable to load health insights");
        setItems([]);
      });
  }, []);

  const severityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
      case "critical":
        return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200";
      case "medium":
      case "moderate":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
      default:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    }
  };

  return (
    <Page title="Health Insights" subtitle="Personal guidance generated from your latest wellness records.">
      <Card>
        <SectionHeader title="Your wellness insights" subtitle="Review these signals and continue tracking changes over time" />
        {items === null ? <LoadingSkeleton /> : error ? (
          <IconNote icon={Activity} title="Insights unavailable" text={error} />
        ) : items.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, index) => (
              <article key={`${item.category}-${item.message}-${index}`} className="rounded-[22px] border border-pink-100 bg-gradient-to-br from-white to-pink-50/80 p-5 shadow-soft dark:border-white/10 dark:from-white/10 dark:to-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Lightbulb className="h-5 w-5" />
                    </span>
                    <h2 className="truncate font-black capitalize text-ink dark:text-white">{item.category.replace(/_/g, " ")}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black capitalize ${severityStyle(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted dark:text-white/65">{item.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No insights yet" text="Add mood, symptom, cycle, or assessment records to generate personal insights." />
        )}
      </Card>
    </Page>
  );
}

export function JournalPage() {
  const [mood, setMood] = useState("happy");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<{ id: string; title: string; detail: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const items = await api.journals();
      setEntries(items.map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.content,
        time: new Date(item.created_at).toLocaleDateString(),
      })));
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Unable to load saved journal entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

  async function save() {
    const content = note.trim();
    if (!content || saving) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const item = await api.createJournal(`Mood: ${mood}`, content);
      setEntries((items) => [{ id: item.id, title: item.title, detail: item.content, time: "Today" }, ...items.filter((entry) => entry.id !== item.id)]);
      setNote("");
      setSaved(true);
      await loadEntries();
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Journal save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page title="Mood Journal" subtitle="Private entries saved to your wellness record.">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <SectionHeader title="How do you feel?" subtitle="Choose a mood and add a note" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-2">
            {["happy", "sad", "anxious", "tired", "angry"].map((value) => (
              <button key={value} type="button" onClick={() => { setMood(value); setSaved(false); }} className={`rounded-[20px] p-4 text-sm font-black capitalize ${mood === value ? "bg-primary text-white" : "bg-pink-50 text-muted dark:bg-white/10"}`}>
                {value}
              </button>
            ))}
          </div>
          <textarea className="mt-5 min-h-40 w-full rounded-[24px] border border-pink-100 bg-white/80 p-4 text-sm outline-none dark:border-white/10 dark:bg-white/10 dark:text-white" value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} placeholder="Write your private note..." />
          {saveError ? <p className="mt-3 text-sm font-bold text-danger">{saveError}</p> : null}
          {saved ? <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">Journal entry saved successfully.</p> : null}
          <Button className="mt-4 w-full" disabled={!note.trim() || saving} onClick={() => void save()}>
            <CheckCircle2 className="h-4 w-4" />{saving ? "Saving..." : "Save Journal"}
          </Button>
        </Card>
        <Card>
          <SectionHeader title="Timeline" subtitle="Recent journal records" action={<Button variant="secondary" disabled={loading} onClick={() => void loadEntries()}>Refresh</Button>} />
          {loading && !entries.length ? <LoadingSkeleton /> : loadError ? (
            <div className="space-y-4">
              <IconNote icon={Activity} title="Could not load journal history" text={loadError} />
              <Button variant="secondary" onClick={() => void loadEntries()}>Try again</Button>
            </div>
          ) : entries.length ? <Timeline items={entries} /> : <EmptyState title="No journal entries yet" text="Write your first private note to begin your timeline." />}
        </Card>
      </div>
    </Page>
  );
}

export function NutritionPage() { return <Page title="Nutrition Guide" subtitle="Nutrition data is not represented by a dedicated backend endpoint yet."><Card><IconNote icon={FileText} title="Guide content unavailable" text="The current API does not expose nutrition plans or nutrition logs." /></Card></Page>; }

export function CaregiverPage() { const [items, setItems] = useState<CaregiverContent[]>([]); useEffect(() => { Promise.all([api.caregiver("videos"), api.caregiver("tips"), api.caregiver("articles")]).then((groups) => setItems(groups.flat())).catch(() => undefined); }, []); return <Page title="Caregiver Zone" subtitle="Educational content returned by the caregiver API."><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{items.length ? items.map((item) => <Card key={item.id}><Badge>{item.category}</Badge><h2 className="mt-3 text-lg font-black text-ink dark:text-white">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted dark:text-white/60">{item.description}</p></Card>) : <EmptyState title="No caregiver content" text="No content is available for this account." />}</div></Page>; }

export function ASHAPage() { const [cases, setCases] = useState<HighRiskCase[]>([]); const [stats, setStats] = useState<Record<string, unknown> | null>(null); const [alerts, setAlerts] = useState<Alert[]>([]); useEffect(() => { api.ashaCases().then(setCases).catch(() => undefined); api.ashaStatistics().then(setStats).catch(() => undefined); api.ashaAlerts().then(setAlerts).catch(() => undefined); }, []); return <Page title="ASHA Dashboard" subtitle="Live high-risk cases and alert records."><div className="grid gap-4 md:grid-cols-3"><MetricCard label="High-risk cases" value={String(stats?.high_risk_cases ?? cases.length)} icon={ShieldCheck} note="From ASHA statistics" tone="from-primary to-accent" /><MetricCard label="Alerts" value={String(alerts.length)} icon={Bell} note="Stored alert records" tone="from-sky to-mint" /><MetricCard label="Open cases" value={String(cases.filter((item) => item.status.toLowerCase() === "open").length)} icon={Activity} note="Current queue" tone="from-rose-400 to-primary" /></div><div className="mt-6"><DataTable title="High-Risk Queue" rows={cases.map((item) => ({ case: item.id, user: item.user_id, risk: item.risk_level, source: item.risk_type, status: item.status }))} columns={["case", "user", "risk", "source", "status"]} /></div></Page>; }

export function ReportsPage() { const [data, setData] = useState<Record<string, unknown> | null>(null); useEffect(() => { api.analytics().then(setData).catch(() => undefined); }, []); return <Page title="Reports" subtitle="Available analytics from the wellness API."><Card><SectionHeader title="Wellness analytics" subtitle="No report-download endpoint exists in the current backend." />{data ? <pre className="overflow-auto rounded-2xl bg-pink-50 p-4 text-xs text-ink dark:bg-white/10 dark:text-white">{JSON.stringify(data, null, 2)}</pre> : <LoadingSkeleton />}</Card></Page>; }

export function ProfilePage() { const { user } = useAuth(); return <Page title="Profile" subtitle="Current account details from authentication."><div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"><Card className="text-center"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-accent text-white shadow-glow"><UserRound className="h-12 w-12" /></div><h2 className="mt-4 text-xl font-black text-ink dark:text-white">{user?.name}</h2><p className="text-sm font-semibold text-muted dark:text-white/60">{user?.role} · {user?.preferred_language}</p><Badge className="mt-4">Authenticated</Badge></Card><Card><SectionHeader title="Account details" subtitle="Read from /auth/me" /><div className="grid gap-4 md:grid-cols-2"><StatTile label="Email" value={user?.email ?? ""} /><StatTile label="Phone" value={user?.phone ?? "Not provided"} /><StatTile label="Role" value={user?.role ?? ""} /><StatTile label="Language" value={user?.preferred_language ?? ""} /></div><IconNote className="mt-5" icon={Lock} title="Profile editing unavailable" text="The current backend has no profile update endpoint." /></Card></div></Page>; }

export function SettingsPage() { return <Page title="Settings" subtitle="Account controls available through the existing API."><Card><IconNote icon={SettingsIcon} title="Settings endpoint unavailable" text="Notification and privacy preferences are not exposed by the current backend contract." /></Card></Page>; }
export function ChatHistoryPage() { const [items, setItems] = useState<ChatMessage[]>([]); useEffect(() => { api.chatHistory().then(setItems).catch(() => undefined); }, []); return <Page title="Chat History" subtitle="Previous AI coach conversations from the backend."><div className="space-y-4">{items.length ? items.map((item) => <Card key={item.id}><h2 className="font-black text-ink dark:text-white">{item.message}</h2><p className="mt-2 text-sm leading-6 text-muted dark:text-white/60">{item.response}</p></Card>) : <EmptyState title="No conversations yet" />}</div></Page>; }
export function LogoutPage() { const { signOut } = useAuth(); return <Page title="Logout"><Card className="flex min-h-64 flex-col items-center justify-center text-center"><IconNote icon={CheckCircle2} title="End this session" text="Revoke the current refresh token." /><Button className="mt-5" onClick={() => void signOut()}>Sign out</Button></Card></Page>; }
export function NotFoundPage() { return <Page title="Page not found"><EmptyState title="Nothing here" text="Return to the dashboard to continue." /></Page>; }
