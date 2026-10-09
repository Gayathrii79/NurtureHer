import { Activity, CheckCircle2, Download, FileSpreadsheet, FileText, Filter, Search, ShieldAlert, Sparkles, Stethoscope, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, ReportItem, WellnessAnalytics, downloadHealthReportPdf } from "@/lib/api";
import { useLanguage } from "@/context/useLanguage";
import { Page } from "@/components/common/Page";
import { MetricCard, SectionHeader } from "@/components/common/Premium";
import { EmptyState, LoadingSkeleton } from "@/components/common/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { exportReportsToCsv } from "@/lib/reportPdf";

export function ReportsZone() {
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [analytics, setAnalytics] = useState<WellnessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReportModal, setActiveReportModal] = useState<ReportItem | null>(null);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await api.reports();
        setReports(res.reports);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    void loadReports();
    api.analytics().then(setAnalytics).catch(() => setAnalytics(null));
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesType =
        selectedType === "all" ||
        (selectedType === "pcos" && report.type.toLowerCase().includes("pcos")) ||
        (selectedType === "ppd" && report.type.toLowerCase().includes("ppd"));
      const matchesSearch =
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.risk_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.score.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [reports, selectedType, searchQuery]);

  async function handleDownloadReport() {
    // The server renders a PDF from this authenticated user's own records and returns the file.
    setDownloadError("");
    setDownloadSuccess("");
    setDownloading(true);
    try {
      await downloadHealthReportPdf();
      setDownloadSuccess(t.common.saved);
    } catch {
      setDownloadError(t.common.error);
    } finally {
      setDownloading(false);
    }
  }

  function getRiskBadge(risk: string) {
    const r = risk.toLowerCase();
    const riskLabel = r === "high" ? t.common.high : r === "moderate" ? t.common.moderate : t.common.low;
    if (r === "high") {
      return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{riskLabel} {t.ui.riskSuffix}</span>;
    }
    if (r === "moderate") {
      return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{riskLabel} {t.ui.riskSuffix}</span>;
    }
    if (r === "low") {
      return <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">{riskLabel} {t.ui.riskSuffix}</span>;
    }
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-white">{risk || t.common.notAssessed}</span>;
  }

  function displayReportType(report: ReportItem) {
    const type = report.type.toLowerCase();
    if (type.includes("pcos")) return "PCOS";
    if (type.includes("ppd") || type.includes("epds")) return "PPD";
    return report.type;
  }

  function displayReportTitle(report: ReportItem) {
    const labels = t.reports.labels;
    const type = report.type.toLowerCase();
    if (type.includes("pcos")) return labels.pcosReport;
    if (type.includes("ppd") || type.includes("epds")) return labels.ppdReport;
    return report.title;
  }

  function displayScore(score: string) {
    const probability = score.match(/^(\d+(?:\.\d+)?)%\s*Probability$/i);
    if (probability) return `${probability[1]}% ${t.reports.labels.probability}`;
    const epds = score.match(/^EPDS Score:\s*(.+)$/i);
    if (epds) return `${t.reports.labels.epdsScore}: ${epds[1]}`;
    return score;
  }

  function displayDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  return (
    <Page
      title={t.reports.title}
      subtitle={t.reports.subtitle}
    >
      {/* Overview Banner */}
      <div className="mb-6 rounded-[24px] border border-lavender-200/80 bg-gradient-to-br from-lavender-100/90 via-white to-lavender-50/70 p-6 shadow-soft dark:border-white/10 dark:from-white/10 dark:to-white/5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black text-ink dark:text-white">{t.reports.labels.bannerTitle}</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted dark:text-white/60">
              {t.reports.labels.bannerDescription}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="shadow-glow"
              disabled={downloading}
              onClick={() => {
                setDownloadError("");
                setDownloadSuccess("");
                setDownloading(true);
                downloadHealthReportPdf()
                  .then(() => setDownloadSuccess(t.common.saved))
                  .catch(() => setDownloadError(t.common.error))
                  .finally(() => setDownloading(false));
              }}
            >
              <Download className="mr-2 h-4 w-4" /> {downloading ? t.reports.labels.generating : t.reports.labels.downloadHealthReport}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportReportsToCsv(filteredReports as unknown as Array<Record<string, unknown>>)}
              disabled={filteredReports.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t.reports.labels.exportCsv}
            </Button>
          </div>
        </div>
        {downloadSuccess ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> {downloadSuccess}
          </p>
        ) : null}
        {downloadError ? <p className="mt-3 text-xs font-bold text-danger">{downloadError}</p> : null}
      </div>

      {/* Real analytics from GET /wellness/analytics */}
      <WellnessAnalyticsSection analytics={analytics} />

      {/* Filter and Search Bar */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center text-xs font-black uppercase tracking-wider text-muted">
              <Filter className="mr-1 h-3.5 w-3.5" /> {t.reports.labels.filterType}
            </span>
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedType === "all"
                  ? "bg-primary text-white shadow-glow"
                  : "bg-lavender-100/70 text-ink hover:bg-lavender-200/60 dark:bg-white/10 dark:text-white"
              }`}
            >
              {t.reports.labels.allReports} ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("pcos")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedType === "pcos"
                  ? "bg-primary text-white shadow-glow"
                  : "bg-lavender-100/70 text-ink hover:bg-lavender-200/60 dark:bg-white/10 dark:text-white"
              }`}
            >
              {t.reports.labels.pcosAssessments}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("ppd")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedType === "ppd"
                  ? "bg-primary text-white shadow-glow"
                  : "bg-lavender-100/70 text-ink hover:bg-lavender-200/60 dark:bg-white/10 dark:text-white"
              }`}
            >
              {t.reports.labels.ppdScreenings}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder={t.reports.labels.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Reports List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          title={t.reports.labels.noReports}
          text={t.reports.labels.noReportsDescription}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredReports.map((report) => (
            <Card key={report.id} className="relative overflow-hidden transition-all hover:shadow-glow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lavender-100 text-primary dark:bg-white/10">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <Badge className="mb-1">{displayReportType(report)}</Badge>
                    <h3 className="font-black text-ink dark:text-white">{displayReportTitle(report)}</h3>
                    <p className="text-xs text-muted dark:text-white/50">{displayDate(report.date)}</p>
                  </div>
                </div>
                {getRiskBadge(report.risk_level)}
              </div>

              <div className="mt-4 rounded-2xl bg-lavender-50/70 p-3.5 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">{t.reports.labels.assessmentResult}</p>
                <p className="mt-0.5 text-base font-black text-ink dark:text-white">{displayScore(report.score)}</p>
                {report.recommendations && (
                  <p className="mt-2 text-xs leading-5 text-muted dark:text-white/65">
                    {report.recommendations}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-lavender-100 pt-4 dark:border-white/10">
                <span className="text-xs font-semibold text-muted">{t.reports.labels.status} {report.status.toLowerCase() === "completed" ? t.reports.labels.completed : report.status.toLowerCase() === "pending" ? t.reports.labels.pending : report.status.toLowerCase() === "in progress" ? t.reports.labels.inProgress : report.status}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    onClick={() => setActiveReportModal(report)}
                  >
                    {t.reports.labels.viewDetails}
                  </Button>
                  <Button
                    className="h-9 px-3 text-xs"
                    disabled={downloading}
                    onClick={() => void handleDownloadReport()}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> {downloading ? t.reports.labels.generating : t.reports.labels.downloadPdf}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-lavender-200 bg-white p-6 shadow-glow dark:border-white/10 dark:bg-[#1A1333]">
            <div className="flex items-start justify-between">
              <div>
                <Badge>{displayReportType(activeReportModal)}</Badge>
                <h2 className="mt-2 text-xl font-black text-ink dark:text-white">{displayReportTitle(activeReportModal)}</h2>
                <p className="text-xs text-muted">{displayDate(activeReportModal.date)}</p>
              </div>
              {getRiskBadge(activeReportModal.risk_level)}
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-lavender-50 p-4 dark:bg-white/5">
                <p className="text-xs font-bold uppercase text-muted">{t.reports.labels.screeningMetric}</p>
                <p className="text-2xl font-black text-ink dark:text-white">{displayScore(activeReportModal.score)}</p>
              </div>

              <div className="rounded-2xl border border-lavender-200/80 p-4 dark:border-white/10">
                <p className="text-xs font-bold uppercase text-muted">{t.reports.labels.clinicalRecommendations}</p>
                <p className="mt-1 text-sm leading-6 text-ink dark:text-white/80">
                  {activeReportModal.recommendations || t.reports.labels.consultDoctor}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="h-4 w-4" />
                  <p className="text-xs font-black">{t.reports.labels.educationalNotice}</p>
                </div>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
                  {t.reports.labels.educationalDisclaimer}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setActiveReportModal(null)}>
                {t.ui.close}
              </Button>
              <Button
                disabled={downloading}
                onClick={() => {
                  void handleDownloadReport();
                  setActiveReportModal(null);
                }}
              >
                <Download className="mr-1.5 h-4 w-4" /> {downloading ? t.reports.labels.generating : t.reports.labels.downloadPdf}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

/** Real analytics from GET /wellness/analytics - no fabricated metrics. */
function WellnessAnalyticsSection({ analytics }: { analytics: WellnessAnalytics | null }) {
  const { t } = useLanguage();
  const labels = t.reports.labels;

  if (!analytics) {
    return (
      <Card className="mb-6 p-6">
        <SectionHeader title={t.reports.analyticsTitle} subtitle={t.reports.analyticsSubtitle} />
        <div className="mt-4">
          <LoadingSkeleton />
        </div>
      </Card>
    );
  }

  const moodEntries = Object.entries(analytics.mood_trends);
  const symptomEntries = Object.entries(analytics.symptom_trends).filter(([, value]) => value > 0);
  const totalMoodEntries = moodEntries.reduce((sum, [, value]) => sum + value, 0);
  const totalSymptomReports = symptomEntries.reduce((sum, [, value]) => sum + value, 0);
  const hasData =
    totalMoodEntries > 0 ||
    totalSymptomReports > 0 ||
    analytics.cycle_insights.cycle_entries > 0 ||
    Boolean(analytics.pcos_latest.risk_level) ||
    Boolean(analytics.ppd_latest.risk_level);

  const moodMax = Math.max(1, ...moodEntries.map(([, value]) => value));
  const symptomMax = Math.max(1, ...symptomEntries.map(([, value]) => value));
  const moodLabels: Record<string, string> = t.journal.moods;
  const symptomLabels: Record<string, { label: string; description: string }> = t.dashboard.symptoms;
  const localizeRiskLevel = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === "high") return t.common.high;
    if (normalized === "moderate") return t.common.moderate;
    if (normalized === "low") return t.common.low;
    return value;
  };
  const localizeMood = (value: string) => moodLabels[value.toLowerCase()] ?? value;
  const localizeSymptom = (value: string) => {
    const key = value.toLowerCase().replace(/[\s-]+/g, "_");
    return symptomLabels[key]?.label ?? value.replace(/_/g, " ");
  };

  return (
    <Card className="mb-6 p-6">
      <SectionHeader title={t.reports.analyticsTitle} subtitle={t.reports.analyticsSubtitle} />

      {!hasData ? (
        <div className="mt-4">
          <EmptyState
            title={labels.noWellnessData}
            text={labels.noWellnessDataDescription}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={labels.moodLogs}
              value={String(totalMoodEntries)}
              icon={Activity}
              note={
                moodEntries.length
                  ? `${labels.mostFrequent} ${localizeMood(moodEntries.sort((a, b) => b[1] - a[1])[0][0])}`
                  : labels.noMoodEntries
              }
            />
            <MetricCard
              label={labels.symptomCheckins}
              value={String(totalSymptomReports)}
              icon={Utensils}
              note={
                symptomEntries.length
                  ? `${labels.mostReported} ${localizeSymptom(symptomEntries.sort((a, b) => b[1] - a[1])[0][0])}`
                  : labels.noSymptomsReported
              }
            />
            <MetricCard
              label={labels.cycle}
              icon={Sparkles}
              value={
                analytics.cycle_insights.cycle_entries > 0
                  ? analytics.cycle_insights.regularity === "regular"
                    ? labels.regular
                    : analytics.cycle_insights.regularity === "irregular"
                      ? labels.irregular
                      : labels.tracking
                  : t.common.notTracked
              }
              note={
                analytics.cycle_insights.next_period_prediction
                  ? `${labels.nextPeriod} ${analytics.cycle_insights.next_period_prediction}`
                  : `${analytics.cycle_insights.cycle_entries} ${labels.entriesRecorded}`
              }
            />
            <MetricCard
              label={labels.latestScreenings}
              icon={Stethoscope}
              value={`PCOS ${localizeRiskLevel(analytics.pcos_latest.risk_level ?? "-")} · EPDS ${analytics.ppd_latest.epds_score ?? "-"}`}
              note={
                analytics.ppd_latest.risk_level
                  ? `${labels.ppdRisk} ${localizeRiskLevel(analytics.ppd_latest.risk_level)}`
                  : labels.noPpdAssessment
              }
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-lavender-100 p-4 dark:border-white/10">
              <p className="text-xs font-black uppercase tracking-wider text-muted">{labels.moodDistribution}</p>
              <div className="mt-3 space-y-2.5">
                {moodEntries.length ? (
                  moodEntries.map(([mood, count]) => (
                    <div key={mood} className="flex items-center gap-3 text-xs">
                      <span className="w-20 capitalize text-ink dark:text-white">{localizeMood(mood)}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-lavender-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.round((count / moodMax) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-bold text-muted">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted">{labels.noMoodEntries}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-lavender-100 p-4 dark:border-white/10">
              <p className="text-xs font-black uppercase tracking-wider text-muted">{labels.symptomFrequency}</p>
              <div className="mt-3 space-y-2.5">
                {symptomEntries.length ? (
                  symptomEntries.map(([symptom, count]) => (
                    <div key={symptom} className="flex items-center gap-3 text-xs">
                      <span className="w-20 capitalize text-ink dark:text-white">{localizeSymptom(symptom)}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-lavender-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${Math.round((count / symptomMax) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-bold text-muted">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted">{labels.noSymptomsReported}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-2xl bg-lavender-50/60 p-4 text-xs dark:bg-white/5 sm:grid-cols-3">
            <div>
              <p className="font-black uppercase tracking-wider text-muted">{labels.pcosHistory}</p>
              <p className="mt-1 font-bold text-ink dark:text-white">
                {Object.entries(analytics.pcos_history).length
                  ? Object.entries(analytics.pcos_history)
                      .map(([level, count]) => `${localizeRiskLevel(level)}: ${count}`)
                      .join(" · ")
                  : labels.noScreenings}
              </p>
            </div>
            <div>
              <p className="font-black uppercase tracking-wider text-muted">{labels.ppdHistory}</p>
              <p className="mt-1 font-bold text-ink dark:text-white">
                {Object.entries(analytics.ppd_history).length
                  ? Object.entries(analytics.ppd_history)
                      .map(([level, count]) => `${localizeRiskLevel(level)}: ${count}`)
                      .join(" · ")
                  : labels.noAssessments}
              </p>
            </div>
            <div>
              <p className="font-black uppercase tracking-wider text-muted">{labels.latestEpds}</p>
              <p className="mt-1 font-bold text-ink dark:text-white">
                {analytics.ppd_latest.epds_score !== null
                  ? `${analytics.ppd_latest.epds_score}/30 · ${analytics.ppd_latest.risk_level ? localizeRiskLevel(analytics.ppd_latest.risk_level) : t.common.notAssessed} · ${analytics.ppd_latest.sentiment ?? "-"}`
                  : t.common.notAssessed}
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
