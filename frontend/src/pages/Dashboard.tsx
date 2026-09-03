import { Activity, CalendarHeart, HeartPulse, LifeBuoy, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, DashboardStats } from "@/lib/api";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/States";
import { MetricCard, SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/useLanguage";

export function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.dashboard().then(setData).catch(() => setError(true));
  }, []);

  if (!data && !error) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  const stats = data as DashboardStats;
  const moodKey = stats.today_mood?.mood?.toLowerCase() as "happy" | "sad" | "anxious" | "tired" | "angry" | undefined;
  const moodDisplay = moodKey && t.journal.moods[moodKey] ? t.journal.moods[moodKey] : (stats.today_mood?.mood ?? t.common.noEntry);
  const symptomCount = stats.symptoms ? Object.values(stats.symptoms).filter((value) => value === true).length : 0;
  
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
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">
              {t.dashboard.moodLabel}: {moodDisplay}
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">
              {t.dashboard.symptomsLabel}: {symptomCount}
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">
              {t.dashboard.cycleLabel}: {stats.cycle_prediction ?? t.common.notTracked}
            </div>
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