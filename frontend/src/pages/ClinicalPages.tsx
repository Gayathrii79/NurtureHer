import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  HeartPulse,
  Info,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, CyclePrediction, PCOSModelInfo, PCOSPrediction, PPDAssessment, downloadHealthReportPdf } from "@/lib/api";
import { CalendarGrid } from "@/components/common/CalendarGrid";
import { FormField, TextAreaField } from "@/components/common/FormField";
import { IconNote, StatTile } from "@/components/common/InfoBlocks";
import { DataTable, Gauge, SectionHeader } from "@/components/common/Premium";
import { Page } from "@/components/common/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/useLanguage";
import { TranslationSchema } from "@/i18n";

const createPCOSSchema = (ui: TranslationSchema["ui"]) => z.object({
  age: z.number().min(10, ui.ageMinError).max(60, ui.ageMaxError),
  bmi: z.number().positive(ui.bmiMinError).max(80, ui.bmiMaxError),
  cycleLength: z.number().min(15, ui.cycleMinError).max(90, ui.cycleMaxError),
  follicleCount: z.number().min(0, ui.follicleMinError).max(100, ui.follicleMaxError),
  cycleIrregularity: z.boolean().default(false),
  hairGrowth: z.boolean().default(false),
  skinDarkening: z.boolean().default(false),
  weightGain: z.boolean().default(false),
});
type PCOSForm = z.infer<ReturnType<typeof createPCOSSchema>>;

export function PCOSPage() {
  const { t } = useLanguage();
  const pcosSchema = createPCOSSchema(t.ui);
  const [result, setResult] = useState<PCOSPrediction | null>(null);
  const [lastFormValues, setLastFormValues] = useState<PCOSForm | null>(null);
  const [history, setHistory] = useState<PCOSPrediction[]>([]);
  const [modelInfo, setModelInfo] = useState<PCOSModelInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PCOSForm>({
    resolver: zodResolver(pcosSchema),
    defaultValues: { age: 28, bmi: 23, cycleLength: 29, follicleCount: 8 },
  });

  useEffect(() => {
    api.pcosHistory().then(setHistory).catch(() => undefined);
    api.pcosModelInfo().then(setModelInfo).catch(() => setModelInfo(null));
  }, []);

  async function submit(values: PCOSForm) {
    setError("");
    setLastFormValues(values);
    try {
      const prediction = await api.predictPCOS({
        age: values.age,
        bmi: values.bmi,
        cycle_irregularity: values.cycleIrregularity,
        hair_growth: values.hairGrowth,
        skin_darkening: values.skinDarkening,
        weight_gain: values.weightGain,
        follicle_count: values.follicleCount,
      });
      setResult(prediction);
      setHistory((items) => [prediction, ...items]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.common.error);
    }
  }

  const handleDownloadReport = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadHealthReportPdf();
    } catch (reason) {
      setDownloadError(reason instanceof Error ? reason.message : t.common.error);
    } finally {
      setDownloading(false);
    }
  };

  const fields: [string, "age" | "bmi" | "cycleLength" | "follicleCount"][] = [
    [t.pcos.age, "age"],
    [t.pcos.bmi, "bmi"],
    [t.pcos.cycleLength, "cycleLength"],
    [t.pcos.follicleCount, "follicleCount"],
  ];

  const checkboxes: [string, keyof PCOSForm][] = [
    [t.pcos.cycleIrregularity, "cycleIrregularity"],
    [t.pcos.hairGrowth, "hairGrowth"],
    [t.pcos.skinDarkening, "skinDarkening"],
    [t.pcos.weightGain, "weightGain"],
  ];

  return (
    <Page title={t.pcos.title} subtitle={t.pcos.subtitle}>
      {/* Medical Disclaimer Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-lavender-200 bg-lavender-50/70 p-4 text-xs leading-relaxed text-lavender-900 shadow-sm dark:border-lavender-800/40 dark:bg-lavender-950/40 dark:text-lavender-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <span className="font-bold">{t.ui.medicalDisclaimer}</span> {t.ui.pcosDisclaimer}
        </div>
      </div>

      {/* Engine transparency: never imply ML when the trained artifact is absent */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="font-black">
          {modelInfo?.uses_random_forest
            ? `${t.ui.modelLabel} ${t.ui.trainedRandomForest}`
            : modelInfo
              ? `${t.ui.modelLabel} ${t.ui.ruleBasedFallback} (${t.ui.randomForestNotTrained})`
              : t.ui.modelChecking}
        </span>
        {modelInfo?.uses_random_forest && modelInfo.metrics?.roc_auc ? (
          <span className="font-semibold">
            Kaggle PCOS dataset ({modelInfo.samples ?? "?"} rows) · ROC-AUC {modelInfo.metrics.roc_auc} · accuracy{" "}
            {modelInfo.metrics.accuracy}
          </span>
        ) : null}
        {modelInfo && !modelInfo.uses_random_forest ? (
          <span className="font-semibold">{t.ui.heuristicScores}</span>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
        <Card className="p-6">
          <form onSubmit={handleSubmit(submit)}>
            <SectionHeader title={t.pcos.formTitle} subtitle={t.pcos.formSubtitle} />
            <div className="mt-4 space-y-3.5">
              {fields.map(([label, name]) => (
                <FormField
                  key={name}
                  label={label}
                  type="number"
                  step="any"
                  error={errors[name]?.message}
                  {...register(name, { valueAsNumber: true })}
                />
              ))}

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted dark:text-white/60">
                  {t.ui.phenotypicIndicators}
                </p>
                {checkboxes.map(([label, name]) => (
                  <label
                    key={name}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-lavender-100 bg-lavender-50/40 p-3 text-xs font-bold text-ink transition hover:bg-lavender-100/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-primary"
                      {...register(name)}
                    />
                  </label>
                ))}
              </div>

              {error ? <p className="text-xs font-bold text-danger">{error}</p> : null}
              <Button className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? t.pcos.running : t.pcos.runPrediction}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <PCOSResult
            result={result}
            formValues={lastFormValues}
            onDownloadReport={handleDownloadReport}
            downloading={downloading}
            downloadError={downloadError}
          />

          <Card className="p-6">
            <h3 className="mb-4 text-sm font-black text-ink dark:text-white">Historical PCOS Screenings</h3>
            <DataTable
              rows={history.map((item) => ({
                date: new Date(item.created_at).toLocaleDateString(),
                risk: item.risk_level,
                probability: `${Math.round(item.probability * 100)}%`,
              }))}
              columns={["date", "risk", "probability"]}
            />
          </Card>
        </div>
      </div>
    </Page>
  );
}

function PCOSResult({
  result,
  formValues,
  onDownloadReport,
  downloading,
  downloadError,
}: {
  result: PCOSPrediction | null;
  formValues: PCOSForm | null;
  onDownloadReport: () => void;
  downloading: boolean;
  downloadError: string;
}) {
  const { t } = useLanguage();
  if (!result) {
    return (
      <Card className="p-6">
        <SectionHeader title={t.pcos.resultTitle} subtitle={t.pcos.resultSubtitle} />
        <IconNote icon={HeartPulse} title={t.pcos.noPredictionYet} text={t.pcos.disclaimer} />
      </Card>
    );
  }

  const percentage = Math.round(result.probability * 100);

  return (
    <Card className="overflow-hidden p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-5">
          <div className="rounded-3xl border border-lavender-200 bg-lavender-50/70 p-4 text-center dark:border-white/10 dark:bg-white/5">
            <HeartPulse className="mx-auto mb-2 h-8 w-8 text-primary" />
            <Gauge value={percentage} label={`${t.common[result.risk_level.toLowerCase() as "low" | "moderate" | "high" | "critical"] || result.risk_level} ${t.pcos.riskLabel}`} />
          </div>
          <div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
              {result.model_source?.startsWith("random_forest")
                ? t.ui.trainedRandomForest
                : result.model_source === "rule_fallback"
                  ? t.ui.ruleBasedFallback
                  : t.ui.screeningResult}
            </Badge>
            <h3 className="mt-2 text-xl font-black text-ink dark:text-white">{t.pcos.recommendationSummary}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted dark:text-white/60">{result.recommendations}</p>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={onDownloadReport} disabled={downloading} className="shrink-0 gap-1.5 self-start">
          <Download className="h-3.5 w-3.5" /> {downloading ? t.ui.preparing : t.ui.downloadHealthReport}
        </Button>
      </div>

      {downloadError ? <p className="mt-3 text-xs font-bold text-danger">{downloadError}</p> : null}

      {/* Explainable AI Factor Breakdown */}
      {formValues && (
        <div className="mt-6 border-t border-lavender-100 pt-5 dark:border-white/10">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted dark:text-white/60">
            {t.ui.explainableFactors}
          </h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-lavender-100 bg-lavender-50/40 p-3 text-xs dark:border-white/10 dark:bg-white/5">
              <span className="text-muted">{t.ui.bmiStatus}</span>
              <p className="font-bold text-ink dark:text-white">
                {formValues.bmi >= 25 ? t.ui.elevatedRiskFactor : t.ui.normalRange} ({formValues.bmi})
              </p>
            </div>
            <div className="rounded-xl border border-lavender-100 bg-lavender-50/40 p-3 text-xs dark:border-white/10 dark:bg-white/5">
              <span className="text-muted">{t.ui.follicleDensity}</span>
              <p className="font-bold text-ink dark:text-white">
                {formValues.follicleCount > 10 ? t.ui.polycysticMorphology : t.ui.physiologicalRange} ({formValues.follicleCount})
              </p>
            </div>
            <div className="rounded-xl border border-lavender-100 bg-lavender-50/40 p-3 text-xs dark:border-white/10 dark:bg-white/5">
              <span className="text-muted">{t.ui.cycleRegularity}</span>
              <p className="font-bold text-ink dark:text-white">
                {formValues.cycleIrregularity ? t.ui.irregularOligomenorrhea : t.ui.eumenorrheic}
              </p>
            </div>
            <div className="rounded-xl border border-lavender-100 bg-lavender-50/40 p-3 text-xs dark:border-white/10 dark:bg-white/5">
              <span className="text-muted">{t.ui.androgenicSigns}</span>
              <p className="font-bold text-ink dark:text-white">
                {formValues.hairGrowth || formValues.skinDarkening ? t.ui.presentHirsutismAcanthosis : t.ui.noneNoted}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function PPDPage() {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(0));
  const [result, setResult] = useState<PPDAssessment | null>(null);
  const [history, setHistory] = useState<PPDAssessment[]>([]);
  const [journal, setJournal] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.ppdHistory().then(setHistory).catch(() => undefined);
  }, []);

  async function submit() {
    setError("");
    try {
      const assessment = await api.assessPPD(answers, journal || null);
      setResult(assessment);
      setHistory((items) => [assessment, ...items]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.common.error);
    }
  }

  const handleDownloadPPDReport = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadHealthReportPdf();
    } catch (reason) {
      setDownloadError(reason instanceof Error ? reason.message : t.common.error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Page title={t.ppd.title} subtitle={t.ppd.subtitle}>
      {/* Medical Disclaimer Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-lavender-200 bg-lavender-50/70 p-4 text-xs leading-relaxed text-lavender-900 shadow-sm dark:border-lavender-800/40 dark:bg-lavender-950/40 dark:text-lavender-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <span className="font-bold">{t.ui.clinicalCareStandard}</span> {t.ui.ppdDisclaimer}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="p-6">
          <SectionHeader title={t.ppd.formTitle} subtitle={t.ppd.formSubtitle} />
          <div className="mt-6 space-y-4">
            {t.ppd.epdsQuestions.map((question, index) => (
              <div
                key={index}
                className="rounded-2xl border border-lavender-100 bg-lavender-50/40 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-xs font-bold text-ink dark:text-white">
                  {index + 1}. {question}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(index === 0 || index === 1 || index === 3
                    ? t.ppd.epdsAnchorSets.positive
                    : t.ppd.epdsAnchorSets.negative
                  ).map((anchor, value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={answers[index] === value ? "primary" : "secondary"}
                      onClick={() =>
                        setAnswers((items) =>
                          items.map((item, itemIndex) => (itemIndex === index ? value : item)),
                        )
                      }
                      className="justify-start px-3 text-left text-xs font-bold"
                    >
                      <span className="mr-1.5 rounded bg-white/25 px-1.5 font-black">{value}</span>
                      {anchor}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <TextAreaField
              label={t.ppd.optionalJournal}
              value={journal}
              onChange={(event) => setJournal(event.target.value)}
              placeholder={t.ppd.journalPlaceholder}
            />
          </div>

          {error ? <p className="mt-3 text-xs font-bold text-danger">{error}</p> : null}

          <Button className="mt-5 w-full" onClick={() => void submit()}>
            {t.ppd.submitAssessment}
          </Button>
        </Card>

        <div className="space-y-6">
          {result ? (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted dark:text-white/60">
                  Assessment Outcome
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleDownloadPPDReport()}
                  disabled={downloading}
                  className="gap-1 text-xs"
                >
                  <Download className="h-3 w-3" /> {downloading ? "Preparing..." : "Health Report PDF"}
                </Button>
              </div>

              {downloadError ? <p className="mt-2 text-xs font-bold text-danger">{downloadError}</p> : null}

              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/40">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-ink dark:text-white">
                    Score: {result.epds_score}/30
                  </h3>
                  <p className="text-xs font-bold capitalize text-primary">Risk Tier: {result.risk_level}</p>
                </div>
              </div>

              <Progress value={Math.min(100, (result.epds_score * 100) / 30)} className="mt-4" />

              {/* Hybrid dual-signal breakdown: EPDS + NLP sentiment */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-lavender-100 bg-lavender-50/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted">EPDS (70% weight)</p>
                  <p className="mt-0.5 font-black text-ink dark:text-white">
                    {result.epds_score}/30
                  </p>
                </div>
                <div className="rounded-xl border border-lavender-100 bg-lavender-50/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted">NLP sentiment (30% weight)</p>
                  <p className="mt-0.5 font-black capitalize text-ink dark:text-white">
                    {result.sentiment}
                    {typeof result.sentiment_score === "number" ? ` · ${(result.sentiment_score * 100).toFixed(0)}%` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-lavender-100 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted">Combined hybrid risk score</p>
                <p className="mt-0.5 font-black text-ink dark:text-white">
                  {typeof result.combined_risk_score === "number" ? result.combined_risk_score.toFixed(2) : "-"} / 1.00
                </p>
                <p className="mt-2 leading-5 text-muted dark:text-white/60">
                  {result.recommendations ||
                    "Discuss this screening with your healthcare provider or ASHA worker."}
                </p>
              </div>

              {result.risk_level.toLowerCase() === "high" ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs dark:border-rose-500/30 dark:bg-rose-500/10">
                  <p className="font-black text-rose-700 dark:text-rose-300">Immediate next steps (this is a screening, not a diagnosis)</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 leading-5 text-rose-900/90 dark:text-rose-200/90">
                    <li>Tell your doctor, ASHA worker or a trusted family member about this result today.</li>
                    <li>Arrange a clinical assessment within the next few days - ask your caregiver to go with you.</li>
                    <li>If you have thoughts of harming yourself or your baby, stop and call 112 (or 104) right now; stay with another person.</li>
                  </ul>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card className="p-6">
              <SectionHeader title={t.ppd.currentResult} />
              <IconNote icon={ShieldAlert} title={t.ppd.noAssessmentYet} text={t.ppd.noAssessmentDesc} />
            </Card>
          )}

          <Card className="p-6">
            <h3 className="mb-4 text-sm font-black text-ink dark:text-white">Assessment History</h3>
            <DataTable
              rows={history.map((item) => ({
                date: new Date(item.created_at).toLocaleDateString(),
                score: `${item.epds_score}/30`,
                sentiment: item.sentiment,
                combined: typeof item.combined_risk_score === "number" ? item.combined_risk_score.toFixed(2) : "-",
                risk: item.risk_level,
              }))}
              columns={["date", "score", "sentiment", "combined", "risk"]}
            />
          </Card>
        </div>
      </div>
    </Page>
  );
}

export function CyclePage() {
  const { t } = useLanguage();
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [length, setLength] = useState(28);

  useEffect(() => {
    api.cyclePrediction().then(setPrediction).catch(() => undefined);
  }, []);

  async function submit() {
    setError("");
    try {
      await api.createCycle(date, length);
      setPrediction(await api.cyclePrediction());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cycle entry failed");
    }
  }

  return (
    <Page title={t.cycle.title} subtitle={t.cycle.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="p-6">
          <SectionHeader title={t.cycle.formTitle} subtitle={t.cycle.formSubtitle} />
          <div className="mt-4 space-y-4">
            <FormField
              label={t.cycle.lastPeriodDate}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <FormField
              label={t.cycle.cycleLength}
              type="number"
              min={15}
              max={60}
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
            />
            {error ? <p className="text-xs font-bold text-danger">{error}</p> : null}
            <Button className="w-full" disabled={!date} onClick={() => void submit()}>
              {t.cycle.saveCycle}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <CalendarDays className="mb-3 h-8 w-8 text-primary" />
            {prediction ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [t.cycle.nextPeriod, prediction.next_period_prediction],
                  [t.cycle.ovulation, prediction.ovulation_prediction],
                  [t.cycle.fertilityWindow, `${prediction.fertility_window_start} - ${prediction.fertility_window_end}`],
                  [t.cycle.cycleLengthResult, `${prediction.cycle_length} ${t.common.days}`],
                ].map(([label, value]) => (
                  <StatTile key={label} label={label} value={value} />
                ))}
              </div>
            ) : (
              <IconNote icon={CalendarDays} title={t.cycle.noPrediction} text={t.cycle.noPredictionDesc} />
            )}
          </Card>

          {prediction ? (
            <Card className="p-6">
              <SectionHeader title={t.cycle.calendarTitle} subtitle={t.cycle.calendarSubtitle} />
              <div className="mt-4">
                <CalendarGrid activeFrom={1} activeTo={prediction.cycle_length} monthDays={prediction.cycle_length} />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </Page>
  );
}

export function EmergencyPage() {
  const { t } = useLanguage();
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatchDetails, setDispatchDetails] = useState<string[]>([]);
  const [dispatchError, setDispatchError] = useState("");
  const [dispatching, setDispatching] = useState(false);

  const triggerDispatch = async () => {
    setDispatchError("");
    setDispatching(true);
    try {
      // Real backend call: creates alert records for the user and the assigned ASHA worker,
      // and reports the actual SMS dispatch state (never claims delivery that did not happen).
      const response = await api.emergencySos();
      setDispatchStatus(response.message);
      setDispatchDetails(response.alerts.map((alert) => `${alert.recipient}: ${alert.sent_status}`));
    } catch (reason) {
      setDispatchStatus(null);
      setDispatchDetails([]);
      setDispatchError(reason instanceof Error ? reason.message : "SOS could not be recorded. Please call 112 directly.");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <Page title={t.emergency.title} subtitle={t.emergency.subtitle}>
      {/* Urgent Warning Header */}
      <Card className="overflow-hidden border-rose-200 bg-gradient-to-br from-rose-600 via-rose-700 to-purple-800 p-8 text-white shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-white/75">Maternal Rapid Response</span>
            <h2 className="text-2xl font-black md:text-4xl">{t.emergency.mainHeading}</h2>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/90">
          {t.emergency.mainText}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            className="bg-white text-rose-700 hover:bg-white/90 font-black gap-2"
            onClick={() => window.open("tel:112")}
          >
            <PhoneCall className="h-4 w-4" /> Dial National Emergency 112
          </Button>
          <Button
            variant="secondary"
            className="bg-white/20 text-white hover:bg-white/30 font-bold border border-white/30 gap-2"
            onClick={() => void triggerDispatch()}
            disabled={dispatching}
          >
            <Sparkles className="h-4 w-4" /> {dispatching ? "Recording SOS..." : "Dispatch CareCircle & ASHA SOS"}
          </Button>
        </div>

        {dispatchStatus && (
          <div className="mt-4 rounded-xl bg-white/20 p-3 text-xs font-medium text-white backdrop-blur-sm">
            <p className="font-black">{t.emergency.sosStatusTitle}</p>
            <p className="mt-1">{dispatchStatus}</p>
            {dispatchDetails.length ? (
              <p className="mt-1 font-mono text-[11px] opacity-90">{dispatchDetails.join(" · ")}</p>
            ) : null}
          </div>
        )}

        {dispatchError ? (
          <div className="mt-4 rounded-xl bg-white/30 p-3 text-xs font-bold text-white backdrop-blur-sm">
            {dispatchError}
          </div>
        ) : null}
      </Card>

      {/* Helplines Directory */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-lavender-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-ink dark:text-white">National Emergency</h3>
            <Badge className="bg-rose-100 text-rose-700">24/7 Police & Fire</Badge>
          </div>
          <div className="mt-3 text-2xl font-black text-primary">112</div>
          <p className="mt-1 text-xs text-muted dark:text-white/50">All-India unified emergency service</p>
          <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => window.open("tel:112")}>
            Call 112
          </Button>
        </Card>

        <Card className="border-lavender-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-ink dark:text-white">Ambulance Service</h3>
            <Badge className="bg-amber-100 text-amber-700">Medical Transit</Badge>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">108 / 102</div>
          <p className="mt-1 text-xs text-muted dark:text-white/50">Free maternal & infant ambulance</p>
          <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => window.open("tel:108")}>
            Call 108
          </Button>
        </Card>

        <Card className="border-lavender-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-ink dark:text-white">Maternal Health Helpline</h3>
            <Badge className="bg-emerald-100 text-emerald-700">Tele-triage</Badge>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">104</div>
          <p className="mt-1 text-xs text-muted dark:text-white/50">State health information & clinical advice</p>
          <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => window.open("tel:104")}>
            Call 104
          </Button>
        </Card>
      </div>
    </Page>
  );
}
