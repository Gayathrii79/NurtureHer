import { Activity, CalendarHeart, Droplets, HeartPulse, LifeBuoy, ShieldCheck, Sparkles, Stethoscope, Utensils, Waves, Zap } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-health-coach.png";
import { ActivityChart, DoughnutChart, HeartRateChart, MoodTrendChart, NutritionChart, SleepChart, WaterChart } from "@/components/charts/Charts";
import { CalendarGrid } from "@/components/common/CalendarGrid";
import { MetricCard, ProgressRow, SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { appointments, dashboardTasks } from "@/data/mock";

const summary = [
  { label: "Health Score", value: "92", suffix: "/100", icon: ShieldCheck, progress: 92, note: "+8% from last week", tone: "from-emerald-400 to-mint" },
  { label: "PCOS Risk", value: "18", suffix: "%", icon: HeartPulse, progress: 18, note: "Low risk trend", tone: "from-primary to-secondary" },
  { label: "PPD Status", value: "Low", icon: Stethoscope, progress: 28, note: "EPDS score 7", tone: "from-sky to-accent" },
  { label: "Cycle Day", value: "14", icon: CalendarHeart, progress: 52, note: "Ovulation window", tone: "from-accent to-primary" },
  { label: "Water Intake", value: "6", suffix: "/8", icon: Droplets, progress: 75, note: "2 cups remaining", tone: "from-sky to-mint" },
  { label: "Heart Rate", value: "75", suffix: "bpm", icon: Activity, progress: 64, note: "Resting trend stable", tone: "from-rose-400 to-primary" },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="soft-grid noise surface-shine relative overflow-hidden rounded-[34px] border border-white/80 bg-white/78 p-6 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08] md:p-8"
        >
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Badge>Good Morning</Badge>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-ink dark:text-white md:text-6xl">
                A calmer way to understand your health today.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted dark:text-white/65">
                Small rituals become strong care plans. Track mood, cycle, nutrition, and risk signals while NurtureHer keeps the full picture organized.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button>
                  <Sparkles className="h-4 w-4" />
                  Ask AI Coach
                </Button>
                <Button variant="secondary">
                  <Activity className="h-4 w-4 text-primary" />
                  View Insights
                </Button>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["No critical alerts", "6 cycles analyzed", "Care team synced"].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-br from-secondary/40 via-white/30 to-accent/25" />
              <img src={heroImage} alt="NurtureHer health coach illustration" className="relative aspect-[4/3] w-full rounded-[28px] object-cover shadow-card" />
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -left-5 top-8 rounded-2xl bg-white/85 p-3 shadow-card backdrop-blur-xl dark:bg-white/10">
                <Waves className="h-5 w-5 text-primary" />
              </motion.div>
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-4 right-4 rounded-2xl bg-white/85 p-3 shadow-card backdrop-blur-xl dark:bg-white/10">
                <HeartPulse className="h-5 w-5 text-primary" />
              </motion.div>
            </div>
          </div>
        </motion.div>
        <RightPanel />
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
        {summary.map((item) => <MetricCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionHeader title="Mood Trend" subtitle="Calm and energy rhythm across the week" />
          <MoodTrendChart />
        </Card>
        <Card>
          <SectionHeader title="Health Analytics" subtitle="How care activity is distributed" />
          <DoughnutChart />
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <SectionHeader title="Cycle Calendar" subtitle="Fertility window highlighted" />
          <CalendarGrid days={28} monthDays={28} activeFrom={12} activeTo={17} compact />
        </Card>
        <Card>
          <SectionHeader title="Water Intake" subtitle="Daily hydration progress" />
          <WaterChart />
        </Card>
        <Card>
          <SectionHeader title="Heart Rate" subtitle="Resting weekly trend" />
          <HeartRateChart />
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card><SectionHeader title="Sleep Analytics" subtitle="Rest and deep sleep quality" /><SleepChart /></Card>
        <Card><SectionHeader title="Activity Analytics" subtitle="Gentle movement and steps" /><ActivityChart /></Card>
        <Card><SectionHeader title="Nutrition Analytics" subtitle="Key nutrient coverage" /><NutritionChart /></Card>
      </section>
    </div>
  );
}

function RightPanel() {
  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader title="Today's Tasks" subtitle="2 of 4 complete" />
        <div className="space-y-3">
          {dashboardTasks.map((task) => (
            <div key={task.title} className="flex items-center gap-3 rounded-[18px] bg-pink-50/80 p-3 dark:bg-white/10">
              <div className={`h-3 w-3 rounded-full ${task.done ? "bg-primary shadow-glow" : "bg-white ring-2 ring-pink-200 dark:bg-transparent"}`} />
              <div>
                <p className="text-sm font-black text-ink dark:text-white">{task.title}</p>
                <p className="text-xs text-muted dark:text-white/55">{task.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="overflow-hidden bg-gradient-to-br from-primary to-accent text-white">
        <div className="mb-5">
          <p className="text-lg font-black tracking-tight text-white">Upcoming Appointments</p>
          <p className="mt-1 text-sm leading-6 text-white/75">Care team touchpoints</p>
        </div>
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div key={appointment.title} className="rounded-[18px] bg-white/14 p-4 backdrop-blur-xl">
              <h3 className="text-base font-black">{appointment.title}</h3>
              <p className="mt-1 text-sm text-white/80">{appointment.time} with {appointment.doctor}</p>
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-5">Prepare visit notes</Button>
      </Card>
      <Card className="border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-500/15 dark:via-white/10 dark:to-primary/10">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-rose-600 text-white shadow-card">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-black text-rose-600">Emergency Support</p>
            <p className="mt-1 text-sm leading-6 text-muted dark:text-white/60">Quick access to ASHA worker, emergency contacts, and location sharing.</p>
          </div>
        </div>
        <Button variant="danger" className="mt-5 w-full">Open emergency help</Button>
      </Card>
      <Card>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 gap-3">
          {[["Journal", Zap], ["Hydrate", Droplets], ["Symptoms", Activity], ["Meals", Utensils]].map(([label, Icon]) => {
            const TypedIcon = Icon as typeof Zap;
            return (
              <Button key={label as string} variant="secondary" className="justify-start">
                <TypedIcon className="h-4 w-4 text-primary" />
                {label as string}
              </Button>
            );
          })}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Care Progress" subtitle="Daily plan completion" />
        <div className="space-y-3">
          <ProgressRow label="Mindful check-ins" value={80} detail="4 of 5 completed" />
          <ProgressRow label="Nutrition goal" value={68} detail="Iron and protein in progress" />
          <ProgressRow label="Sleep routine" value={74} detail="Bedtime consistency improving" />
        </div>
      </Card>
      <Toast title="Care team synced" description="Latest mood, hydration, and cycle signals are ready for review." />
    </div>
  );
}
