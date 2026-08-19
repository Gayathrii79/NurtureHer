import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CalendarDays, CheckCircle2, HeartPulse, ShieldAlert, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarGrid } from "@/components/common/CalendarGrid";
import { FormField } from "@/components/common/FormField";
import { IconNote, StatTile } from "@/components/common/InfoBlocks";
import { Page } from "@/components/common/Page";
import { DataTable, Gauge, MetricCard, ProgressRow, SectionHeader, Timeline } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cycleStats, cycleTimeline, pcosHistory, ppdHistory, recommendations } from "@/data/mock";

const pcosSchema = z.object({
  age: z.coerce.number().min(12).max(60),
  bmi: z.coerce.number().min(10).max(60),
  cycleLength: z.coerce.number().min(15).max(90),
  follicleCount: z.coerce.number().min(0).max(80),
  cycleIrregularity: z.boolean().default(false),
  excessHair: z.boolean().default(false),
  skinDarkening: z.boolean().default(false),
  weightGain: z.boolean().default(false),
});

type PCOSForm = z.infer<typeof pcosSchema>;

export function PCOSPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<PCOSForm>({
    resolver: zodResolver(pcosSchema),
    defaultValues: { age: 28, bmi: 23, cycleLength: 29, follicleCount: 8 },
  });

  return (
    <Page title="PCOS Prediction" subtitle="A polished screening workflow with probability, risk level, recommendations, and history.">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <form onSubmit={handleSubmit(() => undefined)}>
            <SectionHeader title="Prediction Form" subtitle="Structured symptoms and clinical indicators" />
            <div className="space-y-4">
            {[
              ["Age", "age"],
              ["BMI", "bmi"],
              ["Cycle length", "cycleLength"],
              ["Follicle count", "follicleCount"],
            ].map(([label, name]) => (
              <FormField
                key={name}
                label={label}
                placeholder={label}
                type="number"
                error={errors[name as keyof PCOSForm] ? "Please enter a valid value." : undefined}
                {...register(name as keyof PCOSForm)}
              />
            ))}
            {[
              ["Cycle irregularity", "cycleIrregularity"],
              ["Excess hair growth", "excessHair"],
              ["Skin darkening", "skinDarkening"],
              ["Recent weight gain", "weightGain"],
            ].map(([label, name]) => (
              <label key={label} className="flex items-center justify-between gap-4 rounded-[20px] border border-white/70 bg-pink-50/80 p-4 text-sm font-black text-ink transition hover:bg-white hover:shadow-soft dark:border-white/10 dark:bg-white/10 dark:text-white">
                {label}
                <input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" {...register(name as keyof PCOSForm)} />
              </label>
            ))}
              <Button className="w-full">Run Prediction</Button>
            </div>
          </form>
        </Card>
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="grid gap-6 md:grid-cols-[250px_1fr]">
              <div className="rounded-[28px] bg-gradient-to-br from-pink-50 to-purple-50 p-5 dark:from-white/10 dark:to-white/5">
                <HeartPulse className="mx-auto mb-3 h-10 w-10 text-primary" />
                <Gauge value={18} label="Low Risk" />
              </div>
              <div>
                <Badge className="bg-emerald-50 text-emerald-700">Stable</Badge>
                <h3 className="mt-3 text-2xl font-black text-ink dark:text-white">Recommendation Summary</h3>
                <p className="mt-3 text-sm leading-6 text-muted dark:text-white/60">
                  Current indicators show low predicted risk. Continue tracking symptoms, lifestyle signals, and cycle regularity.
                </p>
                <Progress value={18} className="mt-5" />
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ProgressRow label="Hormonal pattern" value={24} />
                  <ProgressRow label="Cycle variability" value={18} />
                  <ProgressRow label="Lifestyle signal" value={32} />
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  {recommendations.map((item) => (
                    <IconNote key={item} icon={CheckCircle2} title="Care guidance" text={item} />
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <DataTable rows={pcosHistory} columns={["date", "risk", "probability"]} />
        </div>
      </div>
    </Page>
  );
}

export function PPDPage() {
  return (
    <Page title="PPD Detection" subtitle="EPDS questionnaire, progress, result screen, and history analytics.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <SectionHeader title="EPDS Questionnaire" subtitle="Question 6 of 10" />
            <Badge>60%</Badge>
          </div>
          <Progress value={60} />
          <div className="mt-6 space-y-4">
            {["I have felt able to laugh and see the funny side of things.", "I have looked forward with enjoyment to things.", "I have felt sad or miserable."].map(
              (question, index) => (
                <div key={question} className="rounded-[22px] bg-pink-50/80 p-4 dark:bg-white/10">
                  <p className="font-black text-ink dark:text-white">{index + 1}. {question}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {["0", "1", "2", "3"].map((value) => (
                      <Button key={value} variant="secondary">{value}</Button>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <MetricCard label="Current Result" value="Low" icon={ShieldAlert} progress={35} note="EPDS score 7. Continue supportive tracking." tone="from-sky to-accent" />
          <Card>
            <SectionHeader title="Recommendations" subtitle="Gentle actions for the next 24 hours" />
            <div className="space-y-3">
              {["Share feelings with a trusted support person.", "Take a 10 minute rest break after lunch.", "Contact care team if low mood intensifies."].map((item) => (
                <IconNote key={item} icon={CheckCircle2} title="Recommended" text={item} />
              ))}
            </div>
          </Card>
          <DataTable rows={ppdHistory} columns={["date", "score", "risk"]} />
        </div>
      </div>
    </Page>
  );
}

export function CyclePage() {
  return (
    <Page title="Cycle Tracker" subtitle="Modern calendar, ovulation prediction, fertility window, and cycle timeline.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <SectionHeader title="July Cycle Calendar" subtitle="Fertility window and ovulation highlighted" />
          <CalendarGrid activeFrom={15} activeTo={20} />
        </Card>
        <div className="space-y-6">
          <Card>
            <CalendarDays className="mb-4 h-9 w-9 text-primary" />
            {[
              ["Next period", "July 22"],
              ["Ovulation", "July 8"],
              ["Fertility window", "July 4 - July 9"],
              ["Cycle length", "28 days"],
            ].map(([label, value]) => (
              <StatTile key={label} label={label} value={value} className="mb-3" />
            ))}
          </Card>
          <Card>
            <SectionHeader title="Statistics" subtitle="Cycle patterns from recent logs" />
            <div className="grid grid-cols-2 gap-3">
              {cycleStats.map((stat) => (
                <StatTile key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
          </Card>
          <Card>
            <SectionHeader title="Timeline" subtitle="Predicted cycle milestones" />
            <Timeline items={cycleTimeline} />
          </Card>
        </div>
      </div>
    </Page>
  );
}

export function EmergencyPage() {
  return (
    <Page title="Emergency Help" subtitle="High-visibility support for urgent symptoms and care escalation.">
      <Card className="overflow-hidden bg-gradient-to-br from-rose-600 via-primary to-accent p-8 text-white">
        <AlertTriangle className="mb-4 h-12 w-12" />
        <h2 className="text-3xl font-black md:text-5xl">Get urgent medical care</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 md:text-base">
          Heavy bleeding, severe pain, fainting, breathing difficulty, seizures, chest pain, or self-harm thoughts need immediate professional help.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button variant="secondary">Call ASHA Worker</Button>
          <Button variant="secondary">Emergency Contacts</Button>
          <Button variant="secondary">
            <Sparkles className="h-4 w-4 text-primary" />
            Share Location
          </Button>
        </div>
      </Card>
    </Page>
  );
}
