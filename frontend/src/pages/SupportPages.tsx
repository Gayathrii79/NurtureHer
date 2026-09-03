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
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/useLanguage";

export function InsightsPage() {
  const { t } = useLanguage();
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
    <Page title={t.insights.title} subtitle={t.insights.subtitle}>
      <Card>
        <SectionHeader title={t.insights.sectionTitle} subtitle={t.insights.sectionSubtitle} />
        {items === null ? (
          <LoadingSkeleton />
        ) : error ? (
          <IconNote icon={Activity} title={t.insights.errorTitle} text={error} />
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
          <EmptyState title={t.insights.emptyTitle} text={t.insights.emptyText} />
        )}
      </Card>
    </Page>
  );
}

export function JournalPage() {
  const { t } = useLanguage();
  const [mood, setMood] = useState<"happy" | "sad" | "anxious" | "tired" | "angry">("happy");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<{ id: string; title: string; detail: string; time: string }[]>([]);
  const [moodHistory, setMoodHistory] = useState<{ id: string; mood: string; note: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const MOOD_EMOJI: Record<string, string> = { happy: "😊", sad: "😢", anxious: "😰", tired: "😴", angry: "😠" };

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [items, moods] = await Promise.all([api.journals(), api.moods()]);
      setEntries(
        items.map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.content,
          time: new Date(item.created_at).toLocaleDateString(),
        })),
      );
      setMoodHistory(moods.slice(0, 10));
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Unable to load saved journal entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  async function save() {
    const content = note.trim();
    if (!content || saving) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const [item] = await Promise.all([
        api.createJournal(`Mood: ${mood}`, content),
        api.createMood(mood, content.slice(0, 200)),
      ]);
      setEntries((items) => [
        { id: item.id, title: item.title, detail: item.content, time: t.common.today },
        ...items.filter((entry) => entry.id !== item.id),
      ]);
      setNote("");
      setSaved(true);
      await loadEntries();
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Journal save failed");
    } finally {
      setSaving(false);
    }
  }

  const moodList: Array<"happy" | "sad" | "anxious" | "tired" | "angry"> = ["happy", "sad", "anxious", "tired", "angry"];

  return (
    <Page title={t.journal.title} subtitle={t.journal.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <SectionHeader title={t.journal.moodPrompt} subtitle={t.journal.moodSubtitle} />
          <div className="grid grid-cols-5 gap-2 xl:grid-cols-5">
            {moodList.map((value) => (
              <button
                key={value}
                id={`mood-btn-${value}`}
                type="button"
                onClick={() => {
                  setMood(value);
                  setSaved(false);
                }}
                className={`flex flex-col items-center gap-1 rounded-[20px] p-3 text-xs font-black capitalize transition-all ${
                  mood === value
                    ? "scale-105 bg-primary text-white shadow-md"
                    : "bg-pink-50 text-muted hover:bg-pink-100 dark:bg-white/10"
                }`}
              >
                <span className="text-2xl">{MOOD_EMOJI[value]}</span>
                {t.journal.moods[value]}
              </button>
            ))}
          </div>
          <textarea
            id="journal-note-input"
            className="mt-5 min-h-40 w-full rounded-[24px] border border-pink-100 bg-white/80 p-4 text-sm outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(false);
            }}
            placeholder={t.journal.notePlaceholder}
          />
          {saveError ? <p className="mt-3 text-sm font-bold text-danger">{saveError}</p> : null}
          {saved ? <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">✅ {t.journal.saveSuccess}</p> : null}
          <Button id="save-journal-btn" className="mt-4 w-full" disabled={!note.trim() || saving} onClick={() => void save()}>
            <CheckCircle2 className="h-4 w-4" />
            {saving ? t.common.saving : t.journal.saveBtn}
          </Button>
        </Card>
        <div className="space-y-6">
          <Card>
            <SectionHeader
              title={t.journal.timelineTitle}
              subtitle={t.journal.timelineSubtitle}
              action={
                <Button variant="secondary" disabled={loading} onClick={() => void loadEntries()}>
                  {t.common.refresh}
                </Button>
              }
            />
            {loading && !entries.length ? (
              <LoadingSkeleton />
            ) : loadError ? (
              <div className="space-y-4">
                <IconNote icon={Activity} title="Could not load journal history" text={loadError} />
                <Button variant="secondary" onClick={() => void loadEntries()}>
                  {t.common.tryAgain}
                </Button>
              </div>
            ) : entries.length ? (
              <Timeline items={entries} />
            ) : (
              <EmptyState title={t.journal.noEntries} text={t.journal.noEntriesDesc} />
            )}
          </Card>
          {moodHistory.length > 0 && (
            <Card>
              <SectionHeader title={t.journal.recentMoodLog} subtitle={t.journal.recentMoodLogSubtitle} />
              <div className="mt-4 flex flex-wrap gap-2">
                {moodHistory.map((entry) => {
                  const mKey = entry.mood.toLowerCase() as keyof typeof t.journal.moods;
                  const label = t.journal.moods[mKey] ?? entry.mood.toLowerCase();
                  return (
                    <div key={entry.id} className="flex items-center gap-2 rounded-2xl bg-pink-50 px-4 py-2 dark:bg-white/10">
                      <span className="text-xl">{MOOD_EMOJI[entry.mood.toLowerCase()] ?? "🌸"}</span>
                      <div>
                        <p className="text-xs font-black capitalize text-ink dark:text-white">{label}</p>
                        <p className="text-xs text-muted dark:text-white/50">{new Date(entry.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}

export function NutritionPage() {
  const { t } = useLanguage();
  return (
    <Page title={t.nutrition.title} subtitle={t.nutrition.subtitle}>
      <Card>
        <IconNote icon={FileText} title={t.nutrition.guideUnavailable} text={t.nutrition.guideUnavailableDesc} />
      </Card>
    </Page>
  );
}

export function CaregiverPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CaregiverContent[]>([]);
  useEffect(() => {
    Promise.all([api.caregiver("videos"), api.caregiver("tips"), api.caregiver("articles")])
      .then((groups) => setItems(groups.flat()))
      .catch(() => undefined);
  }, []);
  return (
    <Page title={t.caregiver.title} subtitle={t.caregiver.subtitle}>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.length ? (
          items.map((item) => (
            <Card key={item.id}>
              <Badge>{item.category}</Badge>
              <h2 className="mt-3 text-lg font-black text-ink dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted dark:text-white/60">{item.description}</p>
            </Card>
          ))
        ) : (
          <EmptyState title={t.caregiver.emptyTitle} text={t.caregiver.emptyText} />
        )}
      </div>
    </Page>
  );
}

export function ASHAPage() {
  const { t } = useLanguage();
  const [cases, setCases] = useState<HighRiskCase[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    api.ashaCases().then(setCases).catch(() => undefined);
    api.ashaStatistics().then(setStats).catch(() => undefined);
    api.ashaAlerts().then(setAlerts).catch(() => undefined);
  }, []);

  return (
    <Page title={t.asha.title} subtitle={t.asha.subtitle}>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label={t.asha.highRiskCases} value={String(stats?.high_risk_cases ?? cases.length)} icon={ShieldCheck} note="From ASHA statistics" tone="from-primary to-accent" />
        <MetricCard label={t.asha.alerts} value={String(alerts.length)} icon={Bell} note="Stored alert records" tone="from-sky to-mint" />
        <MetricCard label={t.asha.openCases} value={String(cases.filter((item) => item.status.toLowerCase() === "open").length)} icon={Activity} note="Current queue" tone="from-rose-400 to-primary" />
      </div>
      <div className="mt-6">
        <DataTable
          title={t.asha.queueTitle}
          rows={cases.map((item) => ({
            [t.asha.columns.case]: item.id,
            [t.asha.columns.user]: item.user_id,
            [t.asha.columns.risk]: item.risk_level,
            [t.asha.columns.source]: item.risk_type,
            [t.asha.columns.status]: item.status,
          }))}
          columns={[t.asha.columns.case, t.asha.columns.user, t.asha.columns.risk, t.asha.columns.source, t.asha.columns.status]}
        />
      </div>
    </Page>
  );
}

export function ReportsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    api.analytics().then(setData).catch(() => undefined);
  }, []);
  return (
    <Page title={t.reports.title} subtitle={t.reports.subtitle}>
      <Card>
        <SectionHeader title={t.reports.analyticsTitle} subtitle={t.reports.analyticsSubtitle} />
        {data ? (
          <pre className="overflow-auto rounded-2xl bg-pink-50 p-4 text-xs text-ink dark:bg-white/10 dark:text-white">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <LoadingSkeleton />
        )}
      </Card>
    </Page>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  return (
    <Page title={t.profile.title} subtitle={t.profile.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <UserRound className="h-12 w-12" />
          </div>
          <h2 className="mt-4 text-xl font-black text-ink dark:text-white">{user?.name}</h2>
          <p className="text-sm font-semibold text-muted dark:text-white/60">
            {user?.role} · {currentLanguage.nativeName}
          </p>
          <Badge className="mt-4">{t.profile.authenticated}</Badge>
        </Card>
        <Card>
          <SectionHeader title={t.profile.accountDetails} subtitle={t.profile.readFromApi} />
          <div className="grid gap-4 md:grid-cols-2">
            <StatTile label={t.profile.email} value={user?.email ?? ""} />
            <StatTile label={t.profile.phone} value={user?.phone ?? t.profile.notProvided} />
            <StatTile label={t.profile.role} value={user?.role ?? ""} />
            <StatTile label={t.profile.language} value={`${currentLanguage.nativeName} (${currentLanguage.name})`} />
          </div>
          <IconNote className="mt-5" icon={Lock} title={t.profile.editingUnavailable} text={t.profile.editingUnavailableDesc} />
        </Card>
      </div>
    </Page>
  );
}

export function SettingsPage() {
  const { t } = useLanguage();
  return (
    <Page title={t.settings.title} subtitle={t.settings.subtitle}>
      <div className="space-y-6">
        <Card>
          <SectionHeader title={t.settings.languagePreference} subtitle="Change the active interface language" />
          <div className="mt-4 flex items-center gap-4">
            <LanguageSelector />
          </div>
        </Card>
        <Card>
          <IconNote icon={SettingsIcon} title={t.settings.controlsTitle} text={t.settings.unavailableDesc} />
        </Card>
      </div>
    </Page>
  );
}

export function ChatHistoryPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ChatMessage[]>([]);
  useEffect(() => {
    api.chatHistory().then(setItems).catch(() => undefined);
  }, []);
  return (
    <Page title={t.chatHistory.title} subtitle={t.chatHistory.subtitle}>
      <div className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <Card key={item.id}>
              <h2 className="font-black text-ink dark:text-white">{item.message}</h2>
              <p className="mt-2 text-sm leading-6 text-muted dark:text-white/60">{item.response}</p>
            </Card>
          ))
        ) : (
          <EmptyState title={t.chatHistory.emptyTitle} />
        )}
      </div>
    </Page>
  );
}

export function LogoutPage() {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  return (
    <Page title={t.logout.title}>
      <Card className="flex min-h-64 flex-col items-center justify-center text-center">
        <IconNote icon={CheckCircle2} title={t.logout.endSession} text={t.logout.revokeToken} />
        <Button className="mt-5" onClick={() => void signOut()}>
          {t.logout.signOut}
        </Button>
      </Card>
    </Page>
  );
}

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <Page title={t.notFound.title}>
      <EmptyState title={t.notFound.heading} text={t.notFound.text} />
    </Page>
  );
}
