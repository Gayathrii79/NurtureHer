import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Activity, CalendarHeart, Check, HeartPulse, LifeBuoy, Plus, ShieldCheck, Stethoscope, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, DashboardStats } from "@/lib/api";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/States";
import { MetricCard, SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/useLanguage";

const SYMPTOM_OPTIONS = [
  { key: "fatigue", label: "Fatigue", emoji: "😴", description: "Feeling unusually tired or low on energy" },
  { key: "headache", label: "Headache", emoji: "🤕", description: "Pain or pressure in head or temples" },
  { key: "sleep_issue", label: "Sleep Issues", emoji: "🌙", description: "Difficulty falling asleep or staying asleep" },
  { key: "anxiety", label: "Anxiety", emoji: "😰", description: "Feeling nervous, restless, or on edge" },
  { key: "cramps", label: "Cramps", emoji: "⚡", description: "Abdominal or pelvic muscle cramping" },
] as const;

export function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>({
    fatigue: false,
    headache: false,
    sleep_issue: false,
    anxiety: false,
    cramps: false,
  });
  const [savingSymptoms, setSavingSymptoms] = useState(false);
  const [symptomStatus, setSymptomStatus] = useState<"success" | "error" | null>(null);
  const [symptomError, setSymptomError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const stats = await api.dashboard();
      setData(stats);
      if (stats.symptoms) {
        setSelectedSymptoms({
          fatigue: Boolean(stats.symptoms.fatigue),
          headache: Boolean(stats.symptoms.headache),
          sleep_issue: Boolean(stats.symptoms.sleep_issue),
          anxiety: Boolean(stats.symptoms.anxiety),
          cramps: Boolean(stats.symptoms.cramps),
        });
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleSaveSymptoms() {
    setSavingSymptoms(true);
    setSymptomStatus(null);
    setSymptomError("");
    try {
      await api.createSymptoms({
        fatigue: Boolean(selectedSymptoms.fatigue),
        headache: Boolean(selectedSymptoms.headache),
        sleep_issue: Boolean(selectedSymptoms.sleep_issue),
        anxiety: Boolean(selectedSymptoms.anxiety),
        cramps: Boolean(selectedSymptoms.cramps),
      });
      setSymptomStatus("success");
      await loadDashboard();
      setTimeout(() => {
        setShowSymptomModal(false);
        setSymptomStatus(null);
      }, 900);
    } catch (reason) {
      setSymptomStatus("error");
      setSymptomError(reason instanceof Error ? reason.message : "Failed to save symptoms");
    } finally {
      setSavingSymptoms(false);
    }
  }

  if (!data && !error) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  const stats = data as DashboardStats;
  const moodKey = stats.today_mood?.mood?.toLowerCase() as "happy" | "sad" | "anxious" | "tired" | "angry" | undefined;
  const moodDisplay = moodKey && t.journal.moods[moodKey] ? t.journal.moods[moodKey] : (stats.today_mood?.mood ?? t.common.noEntry);
  const symptomCount = stats.symptoms
    ? [stats.symptoms.fatigue, stats.symptoms.headache, stats.symptoms.sleep_issue, stats.symptoms.anxiety, stats.symptoms.cramps].filter(Boolean).length
    : 0;
  
  const translateRisk = (risk: string | null) => {
    if (!risk) return t.common.notAssessed;
    const lower = risk.toLowerCase();
    if (lower === "low") return t.common.low;
    if (lower === "moderate") return t.common.moderate;
    if (lower === "high") return t.common.high;
    if (lower === "critical") return t.common.critical;
    return risk;
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="soft-grid noise surface-shine overflow-hidden p-6 md:p-8">
          <Badge>{t.dashboard.badge}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-ink dark:text-white md:text-6xl">
            {t.dashboard.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted dark:text-white/65">
            {t.dashboard.subheading}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">
              {t.dashboard.moodLabel}: {moodDisplay}
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">
              {t.dashboard.symptomsLabel}: {symptomCount}
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">
              {t.dashboard.cycleLabel}: {stats.cycle_prediction ?? t.common.notTracked}
            </div>
            <Button
              id="open-symptoms-modal-btn"
              className="rounded-2xl shadow-soft"
              onClick={() => {
                setSymptomStatus(null);
                setShowSymptomModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Log Symptoms
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionHeader title={t.dashboard.latestSignalsTitle} subtitle={t.dashboard.latestSignalsSubtitle} />
            <div className="space-y-3 text-sm font-bold text-muted dark:text-white/65">
              <p>
                <CalendarHeart className="mr-2 inline h-4 w-4 text-primary" />
                {t.dashboard.nextCycleEstimate}: {stats.cycle_prediction ?? t.common.notAvailable}
              </p>
              <p>
                <Activity className="mr-2 inline h-4 w-4 text-primary" />
                {t.dashboard.moodLabel}: {moodDisplay}
              </p>
            </div>
          </Card>

          <Card className="border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-500/15 dark:via-white/10 dark:to-primary/10">
            <div className="flex items-start gap-3">
              <LifeBuoy className="h-7 w-7 text-rose-600" />
              <div>
                <p className="text-sm font-black text-rose-600">{t.dashboard.emergencyTitle}</p>
                <p className="mt-1 text-sm leading-6 text-muted dark:text-white/60">
                  {t.dashboard.emergencyDesc}
                </p>
              </div>
            </div>
            <Button variant="danger" className="mt-5 w-full" onClick={() => navigate("/emergency")}>
              {t.dashboard.openEmergencyBtn}
            </Button>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label={t.dashboard.pcosRiskCard}
          value={translateRisk(stats.pcos_risk)}
          icon={HeartPulse}
          progress={riskProgress(stats.pcos_risk)}
          note={t.dashboard.pcosRiskNote}
          tone="from-primary to-secondary"
        />
        <MetricCard
          label={t.dashboard.ppdStatusCard}
          value={translateRisk(stats.ppd_status)}
          icon={Stethoscope}
          progress={riskProgress(stats.ppd_status)}
          note={t.dashboard.ppdStatusNote}
          tone="from-sky to-accent"
        />
        <MetricCard
          label={t.dashboard.latestMoodCard}
          value={moodDisplay}
          icon={ShieldCheck}
          note={t.dashboard.latestMoodNote}
          tone="from-emerald-400 to-mint"
        />
        <MetricCard
          label={t.dashboard.activeSymptomsCard}
          value={String(symptomCount)}
          icon={Activity}
          note={t.dashboard.activeSymptomsNote}
          tone="from-rose-400 to-primary"
        />
      </section>

      <Insights />

      {/* Symptom Logging Modal */}
      <DialogPrimitive.Root open={showSymptomModal} onOpenChange={setShowSymptomModal}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm transition-opacity" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-pink-100 bg-white/95 p-6 shadow-glow backdrop-blur-xl outline-none dark:border-white/10 dark:bg-[#241827]/95">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogPrimitive.Title className="text-xl font-black text-ink dark:text-white">
                  Log Today's Symptoms
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted dark:text-white/60">
                  Select any symptoms you are experiencing today
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" className="h-10 w-10 shrink-0 px-0" aria-label="Close dialog">
                  <X className="h-5 w-5" />
                </Button>
              </DialogPrimitive.Close>
            </div>

            <div className="mt-5 space-y-2.5">
              {SYMPTOM_OPTIONS.map((opt) => {
                const isSelected = Boolean(selectedSymptoms[opt.key]);
                return (
                  <button
                    key={opt.key}
                    id={`symptom-toggle-${opt.key}`}
                    type="button"
                    onClick={() => {
                      setSelectedSymptoms((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }));
                      setSymptomStatus(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-sm dark:bg-primary/20"
                        : "border-pink-50 bg-pink-50/50 text-ink hover:bg-pink-100/60 dark:border-white/5 dark:bg-white/5 dark:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="text-sm font-black">{opt.label}</p>
                        <p className="text-xs text-muted dark:text-white/50">{opt.description}</p>
                      </div>
                    </div>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-xl border transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-muted/30 bg-white/80 dark:border-white/20 dark:bg-white/10"
                      }`}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {symptomStatus === "error" ? (
              <p className="mt-3 text-sm font-bold text-danger">{symptomError || "Failed to save symptoms."}</p>
            ) : null}

            {symptomStatus === "success" ? (
              <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">✅ Symptoms logged successfully!</p>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              <Button
                id="submit-symptoms-btn"
                className="flex-1"
                disabled={savingSymptoms}
                onClick={() => void handleSaveSymptoms()}
              >
                {savingSymptoms ? t.common.saving : "Save Symptoms"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSymptomModal(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

function riskProgress(value: string | null) {
  return value?.toLowerCase() === "high" ? 90 : value?.toLowerCase() === "moderate" ? 55 : value ? 20 : 0;
}

function Insights() {
  const { t } = useLanguage();
  const [items, setItems] = useState<{ category: string; severity: string; message: string }[]>([]);

  useEffect(() => {
    api.insights().then((response) => setItems(response.insights)).catch(() => undefined);
  }, []);

  return (
    <Card>
      <SectionHeader title={t.dashboard.insightsTitle} subtitle={t.dashboard.insightsSubtitle} />
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.category}-${item.message}`} className="rounded-[18px] bg-pink-50/80 p-4 dark:bg-white/10">
              <div className="flex items-center justify-between">
                <p className="font-black capitalize text-ink dark:text-white">{item.category.replace(/_/g, " ")}</p>
                <span className="text-xs font-black uppercase text-primary">{item.severity}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted dark:text-white/60">{item.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t.dashboard.noInsights} text={t.dashboard.noInsightsDesc} />
      )}
    </Card>
  );
}