import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CalendarDays, HeartPulse, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, CyclePrediction, PCOSPrediction, PPDAssessment } from "@/lib/api";
import { CalendarGrid } from "@/components/common/CalendarGrid";
import { FormField, TextAreaField } from "@/components/common/FormField";
import { IconNote, StatTile } from "@/components/common/InfoBlocks";
import { DataTable, Gauge, MetricCard, SectionHeader } from "@/components/common/Premium";
import { Page } from "@/components/common/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/useLanguage";

const pcosSchema = z.object({
  age: z.number().min(10, "Age must be at least 10.").max(60, "Age must be 60 or below."),
  bmi: z.number().positive("BMI must be greater than 0.").max(80, "BMI must be 80 or below."),
  cycleLength: z.number().min(15, "Cycle length must be at least 15 days.").max(90, "Cycle length must be 90 days or below."),
  follicleCount: z.number().min(0, "Follicle count cannot be negative.").max(100, "Follicle count must be 100 or below."),
  cycleIrregularity: z.boolean().default(false),
  hairGrowth: z.boolean().default(false),
  skinDarkening: z.boolean().default(false),
  weightGain: z.boolean().default(false),
});
type PCOSForm = z.infer<typeof pcosSchema>;

export function PCOSPage() {
  const { t } = useLanguage();
  const [result, setResult] = useState<PCOSPrediction | null>(null);
  const [history, setHistory] = useState<PCOSPrediction[]>([]);
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
  }, []);

  async function submit(values: PCOSForm) {
    setError("");
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
      setError(reason instanceof Error ? reason.message : "Prediction failed");
    }
  }

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
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <form onSubmit={handleSubmit(submit)}>
            <SectionHeader title={t.pcos.formTitle} subtitle={t.pcos.formSubtitle} />
            <div className="space-y-4">
              {fields.map(([label, name]) => (
                <FormField key={name} label={label} type="number" error={errors[name]?.message} {...register(name, { valueAsNumber: true })} />
              ))}
              {checkboxes.map(([label, name]) => (
                <label key={name} className="flex items-center justify-between gap-4 rounded-[20px] border border-white/70 bg-pink-50/80 p-4 text-sm font-black text-ink dark:border-white/10 dark:bg-white/10 dark:text-white">
                  {label}
                  <input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" {...register(name)} />
                </label>
              ))}
              {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}
              <Button className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t.pcos.running : t.pcos.runPrediction}
              </Button>
            </div>
          </form>
        </Card>
        <div className="space-y-6">
          <PCOSResult result={result} />
          <DataTable
            rows={history.map((item) => ({
              date: new Date(item.created_at).toLocaleDateString(),
              risk: item.risk_level,
              probability: `${Math.round(item.probability * 100)}%`,
            }))}
            columns={["date", "risk", "probability"]}
          />
        </div>
      </div>
    </Page>
  );
}

function PCOSResult({ result }: { result: PCOSPrediction | null }) {
  const { t } = useLanguage();
  if (!result) {
    return (
      <Card>
        <SectionHeader title={t.pcos.resultTitle} subtitle={t.pcos.resultSubtitle} />
        <IconNote icon={HeartPulse} title={t.pcos.noPredictionYet} text={t.pcos.disclaimer} />
      </Card>
    );
  }
  const percentage = Math.round(result.probability * 100);
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <div className="rounded-[28px] bg-gradient-to-br from-pink-50 to-purple-50 p-5 dark:from-white/10 dark:to-white/5">
          <HeartPulse className="mx-auto mb-3 h-10 w-10 text-primary" />
          <Gauge value={percentage} label={`${result.risk_level} ${t.pcos.riskLabel}`} />
        </div>
        <div>
          <Badge className="bg-emerald-50 text-emerald-700">{t.pcos.returnedFromApi}</Badge>
          <h3 className="mt-3 text-2xl font-black text-ink dark:text-white">{t.pcos.recommendationSummary}</h3>
          <p className="mt-3 text-sm leading-6 text-muted dark:text-white/60">{result.recommendations}</p>
          <Progress value={percentage} className="mt-5" />
        </div>
      </div>
    </Card>
  );
}

export function PPDPage() {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(0));
  const [result, setResult] = useState<PPDAssessment | null>(null);
  const [history, setHistory] = useState<PPDAssessment[]>([]);
  const [journal, setJournal] = useState("");
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
      setError(reason instanceof Error ? reason.message : "Assessment failed");
    }
  }

  return (
    <Page title={t.ppd.title} subtitle={t.ppd.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <SectionHeader title={t.ppd.formTitle} subtitle={t.ppd.formSubtitle} />
          <Progress value={100} />
          <div className="mt-6 space-y-4">
            {t.ppd.epdsQuestions.map((question, index) => (
              <div key={index} className="rounded-[22px] bg-pink-50/80 p-4 dark:bg-white/10">
                <p className="font-black text-ink dark:text-white">
                  {index + 1}. {question}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {[0, 1, 2, 3].map((value) => (
                    <Button
                      key={value}
                      variant={answers[index] === value ? "primary" : "secondary"}
                      onClick={() =>
                        setAnswers((items) =>
                          items.map((item, itemIndex) => (itemIndex === index ? value : item)),
                        )
                      }
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <TextAreaField
            className="mt-5"
            label={t.ppd.optionalJournal}
            value={journal}
            onChange={(event) => setJournal(event.target.value)}
            placeholder={t.ppd.journalPlaceholder}
          />
          {error ? <p className="mt-3 text-sm font-bold text-danger">{error}</p> : null}
          <Button className="mt-4 w-full" onClick={() => void submit()}>
            {t.ppd.submitAssessment}
          </Button>
        </Card>
        <div className="space-y-6">
          {result ? (
            <MetricCard
              label={t.ppd.currentResult}
              value={result.risk_level}
              icon={ShieldAlert}
              progress={Math.min(100, (result.epds_score * 100) / 30)}
              note={`${t.ppd.score} ${result.epds_score}; ${t.ppd.sentiment} ${result.sentiment}`}
              tone="from-sky to-accent"
            />
          ) : (
            <Card>
              <SectionHeader title={t.ppd.currentResult} />
              <IconNote icon={ShieldAlert} title={t.ppd.noAssessmentYet} text={t.ppd.noAssessmentDesc} />
            </Card>
          )}
          <DataTable
            rows={history.map((item) => ({
              date: new Date(item.created_at).toLocaleDateString(),
              score: item.epds_score,
              risk: item.risk_level,
            }))}
            columns={["date", "score", "risk"]}
          />
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <SectionHeader title={t.cycle.formTitle} subtitle={t.cycle.formSubtitle} />
          <div className="space-y-4">
            <FormField label={t.cycle.lastPeriodDate} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <FormField label={t.cycle.cycleLength} type="number" min={15} max={60} value={length} onChange={(event) => setLength(Number(event.target.value))} />
            {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}
            <Button className="w-full" disabled={!date} onClick={() => void submit()}>
              {t.cycle.saveCycle}
            </Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CalendarDays className="mb-4 h-9 w-9 text-primary" />
            {prediction ? (
              <>
                {[
                  [t.cycle.nextPeriod, prediction.next_period_prediction],
                  [t.cycle.ovulation, prediction.ovulation_prediction],
                  [t.cycle.fertilityWindow, `${prediction.fertility_window_start} - ${prediction.fertility_window_end}`],
                  [t.cycle.cycleLengthResult, `${prediction.cycle_length} ${t.common.days}`],
                ].map(([label, value]) => (
                  <StatTile key={label} label={label} value={value} className="mb-3" />
                ))}
              </>
            ) : (
              <IconNote icon={CalendarDays} title={t.cycle.noPrediction} text={t.cycle.noPredictionDesc} />
            )}
          </Card>
          {prediction ? (
            <Card>
              <SectionHeader title={t.cycle.calendarTitle} subtitle={t.cycle.calendarSubtitle} />
              <CalendarGrid activeFrom={1} activeTo={prediction.cycle_length} monthDays={prediction.cycle_length} />
            </Card>
          ) : null}
        </div>
      </div>
    </Page>
  );
}

export function EmergencyPage() {
  const { t } = useLanguage();
  return (
    <Page title={t.emergency.title} subtitle={t.emergency.subtitle}>
      <Card className="overflow-hidden bg-gradient-to-br from-rose-600 via-primary to-accent p-8 text-white">
        <AlertTriangle className="mb-4 h-12 w-12" />
        <h2 className="text-3xl font-black md:text-5xl">{t.emergency.mainHeading}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 md:text-base">
          {t.emergency.mainText}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => window.open("tel:112")}>
            {t.emergency.callBtn}
          </Button>
          <Button variant="secondary">
            <Sparkles className="h-4 w-4 text-primary" />
            {t.emergency.shareLocationBtn}
          </Button>
        </div>
      </Card>
    </Page>
  );
}
